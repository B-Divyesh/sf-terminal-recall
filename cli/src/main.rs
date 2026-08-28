use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::{bail, Context, Result};
use base64::{engine::general_purpose::STANDARD, Engine};
use clap::{Parser, Subcommand};
use rand::RngCore;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{self, Read, Write},
    path::{Path, PathBuf},
    process::Command,
};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};
use uuid::Uuid;

const MAX_RETENTION_DAYS: i64 = i64::MAX / 86_400;

fn parse_retention_days(value: &str) -> std::result::Result<i64, String> {
    let days = value
        .parse::<i64>()
        .map_err(|_| "days must be a whole number of zero or greater".to_string())?;
    if days < 0 {
        return Err("days must be zero or greater".to_string());
    }
    if days > MAX_RETENTION_DAYS {
        return Err(format!("days must not exceed {MAX_RETENTION_DAYS}"));
    }
    Ok(days)
}

#[derive(Parser)]
#[command(
    name = "terminal-recall",
    version,
    about = "Keep selected terminal output searchable, encrypted, and exportable."
)]
struct Cli {
    /// Store records here instead of the default local data directory
    #[arg(long, global = true, env = "TERMINAL_RECALL_HOME")]
    home: Option<PathBuf>,
    /// Print machine-readable command results where supported
    #[arg(long, global = true)]
    json: bool,
    #[command(subcommand)]
    command: Commands,
}
#[derive(Subcommand)]
enum Commands {
    /// Run one chosen command and save its output locally
    Run {
        #[arg(long)]
        label: Option<String>,
        #[arg(last = true, required = true)]
        command: Vec<String>,
    },
    /// Save stdin as a named record
    Capture {
        #[arg(long)]
        label: Option<String>,
    },
    /// Find text across saved records
    Search {
        query: String,
        #[arg(long, default_value_t = 3)]
        context: usize,
    },
    /// Write a redacted text excerpt; nothing is uploaded
    Export {
        id: String,
        #[arg(long)]
        output: PathBuf,
        /// Number of surrounding lines to include from the start (0 writes the full record)
        #[arg(long, default_value_t = 2)]
        context: usize,
    },
    /// Remove records older than this many days
    Expire {
        #[arg(long, default_value_t = 30, value_parser = parse_retention_days)]
        days: i64,
    },
    /// Delete one record by id
    Delete { id: String },
    /// Add or inspect local regular-expression redaction rules
    Rules {
        #[command(subcommand)]
        command: RuleCommands,
    },
    /// List saved records without decrypting their content
    List,
    /// Show the local storage location and encryption-key fingerprint
    Status,
    /// Run a sample capture, search, and redacted export in a temporary directory
    Demo,
}
#[derive(Subcommand)]
enum RuleCommands {
    /// Add a regular expression that is replaced with [REDACTED] during export
    Add { pattern: String },
    /// Print the configured regular-expression rules
    List,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Record {
    id: String,
    created_at: String,
    label: String,
    command: Option<Vec<String>>,
    output: String,
}
#[derive(Serialize, Deserialize)]
struct Envelope {
    nonce: String,
    ciphertext: String,
}
#[derive(Serialize, Deserialize, Default)]
struct RuleFile {
    patterns: Vec<String>,
}

fn default_home() -> PathBuf {
    if cfg!(windows) {
        std::env::var_os("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(std::env::temp_dir)
            .join("TerminalRecall")
    } else {
        std::env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|| {
                std::env::var_os("HOME")
                    .map(|h| PathBuf::from(h).join(".local/share"))
                    .unwrap_or_else(std::env::temp_dir)
            })
            .join("terminal-recall")
    }
}
fn key_path(home: &Path) -> PathBuf {
    home.join("key.bin")
}
fn records_path(home: &Path) -> PathBuf {
    home.join("records")
}
fn rules_path(home: &Path) -> PathBuf {
    home.join("redaction-rules.json")
}
fn valid_record_id(id: &str) -> bool {
    id.len() == 12 && id.bytes().all(|byte| byte.is_ascii_hexdigit())
}
fn record_path(home: &Path, id: &str) -> Result<PathBuf> {
    if !valid_record_id(id) {
        bail!("record id must be the 12-character hexadecimal id shown by list")
    }
    Ok(records_path(home).join(format!("{id}.tr")))
}
fn prepare(home: &Path) -> Result<Vec<u8>> {
    fs::create_dir_all(records_path(home)).context("cannot create local record folder")?;
    let kp = key_path(home);
    if kp.exists() {
        let k = fs::read(&kp)?;
        if k.len() != 32 {
            bail!("local key is invalid; do not delete it until records are recovered")
        }
        return Ok(k);
    }
    let mut key = vec![0; 32];
    rand::rngs::OsRng.fill_bytes(&mut key);
    fs::write(&kp, &key)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&kp, fs::Permissions::from_mode(0o600))?;
    }
    Ok(key)
}
fn crypt(key: &[u8], plain: &[u8]) -> Result<Envelope> {
    let mut n = [0; 12];
    rand::rngs::OsRng.fill_bytes(&mut n);
    let c = Aes256Gcm::new_from_slice(key)?
        .encrypt(Nonce::from_slice(&n), plain)
        .map_err(|_| anyhow::anyhow!("encryption failed"))?;
    Ok(Envelope {
        nonce: STANDARD.encode(n),
        ciphertext: STANDARD.encode(c),
    })
}
fn decrypt(key: &[u8], e: &Envelope) -> Result<Vec<u8>> {
    let n = STANDARD.decode(&e.nonce)?;
    let c = STANDARD.decode(&e.ciphertext)?;
    Aes256Gcm::new_from_slice(key)?
        .decrypt(Nonce::from_slice(&n), c.as_ref())
        .map_err(|_| anyhow::anyhow!("cannot decrypt record; check the local key"))
}
fn save(home: &Path, key: &[u8], r: &Record) -> Result<()> {
    let e = crypt(key, &serde_json::to_vec(r)?)?;
    fs::write(record_path(home, &r.id)?, serde_json::to_vec(&e)?)?;
    Ok(())
}
fn load(home: &Path, key: &[u8], id: &str) -> Result<Record> {
    let b =
        fs::read(record_path(home, id)?).with_context(|| format!("record {id} was not found"))?;
    let e: Envelope = serde_json::from_slice(&b)?;
    Ok(serde_json::from_slice(&decrypt(key, &e)?)?)
}
fn all(home: &Path, key: &[u8]) -> Result<Vec<Record>> {
    let mut out: Vec<Record> = Vec::new();
    for e in fs::read_dir(records_path(home))? {
        let p = e?.path();
        if p.extension().and_then(|x| x.to_str()) == Some("tr") {
            let b = fs::read(&p)?;
            let env: Envelope = serde_json::from_slice(&b)?;
            out.push(serde_json::from_slice(&decrypt(key, &env)?)?);
        }
    }
    out.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(out)
}
fn built_in_rule_patterns() -> &'static [&'static str] {
    &[
        r"(?i)(api[_-]?key|token|password|secret)\s*[=:]\s*[^\s]+",
        r"\b(?:sk|ghp)_[A-Za-z0-9_-]{12,}\b",
        r"\bAKIA[0-9A-Z]{16}\b",
        r"(?i)bearer\s+[A-Za-z0-9._-]{12,}",
    ]
}
fn redaction_rules(home: &Path) -> Result<Vec<Regex>> {
    let mut patterns = built_in_rule_patterns()
        .iter()
        .map(|pattern| pattern.to_string())
        .collect::<Vec<_>>();
    let path = rules_path(home);
    if path.exists() {
        let rules: RuleFile = serde_json::from_slice(&fs::read(&path)?)
            .with_context(|| format!("cannot read {}", path.display()))?;
        patterns.extend(rules.patterns);
    }
    patterns
        .into_iter()
        .map(|pattern| {
            Regex::new(&pattern).with_context(|| format!("invalid redaction rule: {pattern}"))
        })
        .collect()
}
fn redact(s: &str, patterns: &[Regex]) -> String {
    let mut x = s.to_string();
    for p in patterns {
        x = p.replace_all(&x, "[REDACTED]").to_string();
    }
    x
}
fn excerpt(s: &str, context: usize) -> String {
    if context == 0 {
        return s.to_string();
    };
    s.lines()
        .take(context.saturating_mul(2).saturating_add(1))
        .collect::<Vec<_>>()
        .join("\n")
}
fn write_export(home: &Path, key: &[u8], id: &str, output: &Path, context: usize) -> Result<()> {
    let record = load(home, key, id)?;
    let rules = redaction_rules(home)?;
    fs::write(
        output,
        format!(
            "# Terminal Recall excerpt\n# Record: {}\n# Captured: {}\n\n{}\n",
            record.id,
            record.created_at,
            redact(&excerpt(&record.output, context), &rules)
        ),
    )?;
    Ok(())
}
fn delete_record(home: &Path, id: &str) -> Result<()> {
    let path = record_path(home, id)?;
    if !path.exists() {
        bail!("record {id} was not found")
    }
    fs::remove_file(path)?;
    Ok(())
}
fn now() -> String {
    OffsetDateTime::now_utc().format(&Rfc3339).unwrap()
}
fn print_json<T: Serialize>(v: &T) -> Result<()> {
    println!("{}", serde_json::to_string(v)?);
    Ok(())
}
fn cmd_run(
    home: &Path,
    key: &[u8],
    label: Option<String>,
    args: Vec<String>,
    json: bool,
) -> Result<i32> {
    let mut c = Command::new(&args[0]);
    c.args(&args[1..]);
    let output = c
        .output()
        .with_context(|| format!("could not start {}", args[0]))?;
    let mut raw = output.stdout;
    raw.extend_from_slice(&output.stderr);
    let output_text = String::from_utf8_lossy(&raw).to_string();
    print!("{output_text}");
    let r = Record {
        id: Uuid::new_v4().simple().to_string()[..12].to_string(),
        created_at: now(),
        label: label.unwrap_or_else(|| args.join(" ")),
        command: Some(args),
        output: output_text,
    };
    save(home, key, &r)?;
    if json {
        print_json(&serde_json::json!({"id":r.id,"saved":true,"exit_code":output.status.code()}))?
    } else {
        eprintln!("\nSaved encrypted record {}.", r.id);
    }
    Ok(output.status.code().unwrap_or(1))
}
fn main_result() -> Result<i32> {
    let cli = Cli::parse();
    let home = cli.home.unwrap_or_else(default_home);
    let key = prepare(&home)?;
    match cli.command {
        Commands::Run { label, command } => cmd_run(&home, &key, label, command, cli.json),
        Commands::Capture { label } => {
            let mut s = String::new();
            io::stdin().read_to_string(&mut s)?;
            let r = Record {
                id: Uuid::new_v4().simple().to_string()[..12].to_string(),
                created_at: now(),
                label: label.unwrap_or_else(|| "stdin capture".into()),
                command: None,
                output: s,
            };
            save(&home, &key, &r)?;
            if cli.json {
                print_json(&serde_json::json!({"id":r.id,"saved":true}))?
            } else {
                println!("Saved encrypted record {}.", r.id)
            };
            Ok(0)
        }
        Commands::Search { query, context } => {
            let q = query.to_lowercase();
            let mut matches: Vec<(String, String, usize, String)> = Vec::new();
            for r in all(&home, &key)? {
                let lines: Vec<_> = r.output.lines().collect();
                for (i, line) in lines.iter().enumerate() {
                    if line.to_lowercase().contains(&q) {
                        let a = i.saturating_sub(context);
                        let b = (i + context + 1).min(lines.len());
                        matches.push((
                            r.id.clone(),
                            r.label.clone(),
                            i + 1,
                            lines[a..b].join("\n"),
                        ));
                    }
                }
            }
            if cli.json {
                print_json(
                    &matches
                        .iter()
                        .map(|m| serde_json::json!({"id":m.0,"label":m.1,"line":m.2,"excerpt":m.3}))
                        .collect::<Vec<_>>(),
                )?
            } else if matches.is_empty() {
                println!("No matches. Capture a command first, then search its output.")
            } else {
                for (id, label, line, excerpt) in matches {
                    println!("\n{id} · {label} · line {line}\n{excerpt}");
                }
            }
            Ok(0)
        }
        Commands::Export {
            id,
            output,
            context,
        } => {
            write_export(&home, &key, &id, &output, context)?;
            if cli.json {
                print_json(&serde_json::json!({"output":output,"redacted":true,"context":context}))?
            } else {
                println!("Wrote redacted excerpt to {}.", output.display())
            }
            Ok(0)
        }
        Commands::Expire { days } => {
            let cutoff = OffsetDateTime::now_utc() - time::Duration::days(days);
            let mut n = 0;
            for r in all(&home, &key)? {
                let t = OffsetDateTime::parse(&r.created_at, &Rfc3339)?;
                if t < cutoff {
                    fs::remove_file(record_path(&home, &r.id)?)?;
                    n += 1;
                }
            }
            println!("Deleted {n} record(s) older than {days} days.");
            Ok(0)
        }
        Commands::Delete { id } => {
            delete_record(&home, &id)?;
            println!("Deleted record {id}.");
            Ok(0)
        }
        Commands::Rules { command } => match command {
            RuleCommands::Add { pattern } => {
                Regex::new(&pattern)
                    .with_context(|| format!("invalid redaction rule: {pattern}"))?;
                let path = rules_path(&home);
                let mut rules = if path.exists() {
                    serde_json::from_slice::<RuleFile>(&fs::read(&path)?)
                        .with_context(|| format!("cannot read {}", path.display()))?
                } else {
                    RuleFile::default()
                };
                if !rules.patterns.contains(&pattern) {
                    rules.patterns.push(pattern);
                    fs::write(&path, serde_json::to_vec_pretty(&rules)?)?;
                }
                println!("Saved local redaction rule in {}.", path.display());
                Ok(0)
            }
            RuleCommands::List => {
                let path = rules_path(&home);
                let rules = if path.exists() {
                    serde_json::from_slice::<RuleFile>(&fs::read(&path)?)?
                } else {
                    RuleFile::default()
                };
                if cli.json {
                    print_json(&rules.patterns)?;
                } else if rules.patterns.is_empty() {
                    println!("No custom rules. Built-in API-key, token, password, secret, and bearer rules still apply.");
                } else {
                    for pattern in rules.patterns {
                        println!("{pattern}");
                    }
                }
                Ok(0)
            }
        },
        Commands::List => {
            let xs = all(&home, &key)?;
            if cli.json {
                print_json(&xs.iter().map(|r|serde_json::json!({"id":r.id,"created_at":r.created_at,"label":r.label,"bytes":r.output.len()})).collect::<Vec<_>>())?
            } else if xs.is_empty() {
                println!("No saved records. Run: terminal-recall run -- your-command")
            } else {
                for r in xs {
                    println!("{}  {}  {}", r.id, r.created_at, r.label)
                }
            }
            Ok(0)
        }
        Commands::Status => {
            let mut h = Sha256::new();
            h.update(&key);
            let fp = format!("{:x}", h.finalize());
            println!(
                "Records: {}\nKey fingerprint: {}\nEncryption: AES-256-GCM",
                home.display(),
                &fp[..16]
            );
            Ok(0)
        }
        Commands::Demo => {
            let d = std::env::temp_dir().join(format!("terminal-recall-demo-{}", Uuid::new_v4()));
            let sample = include_str!("../examples/deploy-check.txt");
            let executable = std::env::current_exe()?;
            let mut capture = Command::new(&executable)
                .args([
                    "--home",
                    d.to_str().context("demo path is not UTF-8")?,
                    "--json",
                    "capture",
                    "--label",
                    "deploy smoke test",
                ])
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .spawn()?;
            capture
                .stdin
                .as_mut()
                .context("demo capture stdin is unavailable")?
                .write_all(sample.as_bytes())?;
            let captured = capture.wait_with_output()?;
            if !captured.status.success() {
                bail!("demo capture failed")
            }
            let captured_json: serde_json::Value = serde_json::from_slice(&captured.stdout)?;
            let id = captured_json["id"]
                .as_str()
                .context("demo capture did not return an id")?;
            let o = d.join("redacted-excerpt.txt");
            let searched = Command::new(&executable)
                .args([
                    "--home",
                    d.to_str().unwrap(),
                    "search",
                    "health check",
                    "--context",
                    "0",
                ])
                .output()?;
            if !searched.status.success() {
                bail!("demo search failed")
            }
            let exported = Command::new(&executable)
                .args([
                    "--home",
                    d.to_str().unwrap(),
                    "export",
                    id,
                    "--output",
                    o.to_str().context("demo export path is not UTF-8")?,
                    "--context",
                    "0",
                ])
                .output()?;
            if !exported.status.success() {
                bail!("demo export failed")
            }
            println!("$ terminal-recall capture --label \"deploy smoke test\" < cli/examples/deploy-check.txt");
            println!("Saved encrypted record {id}.");
            println!("$ terminal-recall search \"health check\"");
            print!("{}", String::from_utf8_lossy(&searched.stdout));
            println!("$ terminal-recall export {id} --output redacted-excerpt.txt --context 0");
            println!("Wrote redacted excerpt with built-in secret removal.");
            println!("Demo files: {}", d.display());
            println!("Redacted export: {}", o.display());
            Ok(0)
        }
    }
}
fn main() {
    match main_result() {
        Ok(code) => std::process::exit(code),
        Err(e) => {
            eprintln!("Error: {e:#}\nTry `terminal-recall --help`.");
            std::process::exit(2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_key_patterns() {
        let rules = redaction_rules(tempfile::tempdir().unwrap().path()).unwrap();
        assert_eq!(
            redact("API_KEY=sk_abcdefghijklmnopqrstu", &rules),
            "[REDACTED]"
        );
        assert_eq!(redact("Bearer abcdefghijklmnop", &rules), "[REDACTED]");
    }

    #[test]
    fn encrypted_round_trip() {
        let key = vec![7; 32];
        let encrypted = crypt(&key, b"keep this").unwrap();
        assert_ne!(encrypted.ciphertext, "keep this");
        assert_eq!(decrypt(&key, &encrypted).unwrap(), b"keep this");
    }

    #[test]
    fn encrypted_local_records_are_not_plaintext() {
        let directory = tempfile::tempdir().unwrap();
        let key = prepare(directory.path()).unwrap();
        let record = Record {
            id: "c1a1c1a1c1a1".into(),
            created_at: now(),
            label: "claim".into(),
            command: None,
            output: "API_KEY=not-plain-on-disk".into(),
        };
        save(directory.path(), &key, &record).unwrap();
        let bytes = fs::read(records_path(directory.path()).join("c1a1c1a1c1a1.tr")).unwrap();
        assert!(!String::from_utf8_lossy(&bytes).contains("not-plain-on-disk"));
        assert_eq!(
            load(directory.path(), &key, "c1a1c1a1c1a1").unwrap().output,
            record.output
        );
    }

    #[test]
    fn export_context_bounds_the_excerpt() {
        assert_eq!(
            excerpt("one\ntwo\nthree\nfour\nfive\nsix", 2),
            "one\ntwo\nthree\nfour\nfive"
        );
        assert_eq!(excerpt("one\ntwo", 0), "one\ntwo");
    }

    #[test]
    fn custom_redaction_rules_protect_database_urls_before_export() {
        let directory = tempfile::tempdir().unwrap();
        let key = prepare(directory.path()).unwrap();
        let record = Record {
            id: "daba5e000001".into(),
            created_at: now(),
            label: "database check".into(),
            command: None,
            output: "DATABASE_URL=postgres://alice:private-password@db.internal/prod".into(),
        };
        save(directory.path(), &key, &record).unwrap();
        fs::write(
            rules_path(directory.path()),
            r#"{"patterns":["(?i)DATABASE_URL=\\S+"]}"#,
        )
        .unwrap();
        let export = directory.path().join("excerpt.txt");
        write_export(directory.path(), &key, &record.id, &export, 0).unwrap();
        let text = fs::read_to_string(export).unwrap();
        assert!(text.contains("[REDACTED]"));
        assert!(!text.contains("private-password"));
    }

    #[test]
    fn delete_rejects_record_path_traversal() {
        let directory = tempfile::tempdir().unwrap();
        prepare(directory.path()).unwrap();
        let victim = directory
            .path()
            .parent()
            .unwrap()
            .join("terminal-recall-victim.tr");
        fs::write(&victim, "controlled file").unwrap();
        assert!(delete_record(directory.path(), "../../../terminal-recall-victim").is_err());
        assert!(victim.exists());
        fs::remove_file(victim).unwrap();
    }

    #[test]
    fn search_encrypted_local_records_returns_saved_match() {
        let directory = tempfile::tempdir().unwrap();
        let key = prepare(directory.path()).unwrap();
        let record = Record {
            id: "5ea4c4ed0001".into(),
            created_at: now(),
            label: "migration".into(),
            command: None,
            output: "checking schema\nmigration checkpoint reached\ndone".into(),
        };
        save(directory.path(), &key, &record).unwrap();
        let found = all(directory.path(), &key)
            .unwrap()
            .into_iter()
            .flat_map(|saved| saved.output.lines().map(str::to_string).collect::<Vec<_>>())
            .any(|line| line.to_lowercase().contains("checkpoint"));
        assert!(found);
    }
}
