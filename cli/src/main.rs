use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, Nonce};
use anyhow::{bail, Context, Result};
use base64::{engine::general_purpose::STANDARD, Engine};
use clap::{Parser, Subcommand};
use rand::RngCore;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, io::{self, Read}, path::{Path, PathBuf}, process::Command};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};
use uuid::Uuid;

#[derive(Parser)]
#[command(name="terminal-recall", version, about="Keep selected terminal output searchable, encrypted, and exportable.")]
struct Cli {
    /// Store records here instead of the default local data directory
    #[arg(long, global=true, env="TERMINAL_RECALL_HOME")]
    home: Option<PathBuf>,
    /// Print machine-readable command results where supported
    #[arg(long, global=true)] json: bool,
    #[command(subcommand)] command: Commands,
}
#[derive(Subcommand)]
enum Commands {
    /// Run one chosen command and save its output locally
    Run { #[arg(long)] label: Option<String>, #[arg(last=true, required=true)] command: Vec<String> },
    /// Save stdin as a named record
    Capture { #[arg(long)] label: Option<String> },
    /// Find text across saved records
    Search { query: String, #[arg(long, default_value_t=3)] context: usize },
    /// Write a redacted text excerpt; nothing is uploaded
    Export { id: String, #[arg(long)] output: PathBuf, #[arg(long, default_value_t=2)] context: usize },
    /// Remove records older than this many days
    Expire { #[arg(long, default_value_t=30)] days: i64 },
    /// Delete one record by id
    Delete { id: String },
    /// List saved records without decrypting their content
    List,
    /// Show the local storage location and encryption-key fingerprint
    Status,
    /// Run a sample capture, search, and redacted export in a temporary directory
    Demo,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Record { id:String, created_at:String, label:String, command:Option<Vec<String>>, output:String }
#[derive(Serialize, Deserialize)]
struct Envelope { nonce:String, ciphertext:String }

fn default_home() -> PathBuf {
    if cfg!(windows) { std::env::var_os("LOCALAPPDATA").map(PathBuf::from).unwrap_or_else(std::env::temp_dir).join("TerminalRecall") }
    else { std::env::var_os("XDG_DATA_HOME").map(PathBuf::from).unwrap_or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".local/share")).unwrap_or_else(std::env::temp_dir)).join("terminal-recall") }
}
fn key_path(home:&Path)->PathBuf { home.join("key.bin") }
fn records_path(home:&Path)->PathBuf { home.join("records") }
fn prepare(home:&Path)->Result<Vec<u8>> {
    fs::create_dir_all(records_path(home)).context("cannot create local record folder")?;
    let kp=key_path(home);
    if kp.exists() { let k=fs::read(&kp)?; if k.len()!=32 { bail!("local key is invalid; do not delete it until records are recovered") } return Ok(k) }
    let mut key=vec![0;32]; rand::rngs::OsRng.fill_bytes(&mut key); fs::write(&kp,&key)?;
    #[cfg(unix)] { use std::os::unix::fs::PermissionsExt; fs::set_permissions(&kp, fs::Permissions::from_mode(0o600))?; }
    Ok(key)
}
fn crypt(key:&[u8], plain:&[u8])->Result<Envelope> { let mut n=[0;12]; rand::rngs::OsRng.fill_bytes(&mut n); let c=Aes256Gcm::new_from_slice(key)?.encrypt(Nonce::from_slice(&n),plain).map_err(|_|anyhow::anyhow!("encryption failed"))?; Ok(Envelope{nonce:STANDARD.encode(n),ciphertext:STANDARD.encode(c)}) }
fn decrypt(key:&[u8], e:&Envelope)->Result<Vec<u8>> { let n=STANDARD.decode(&e.nonce)?; let c=STANDARD.decode(&e.ciphertext)?; Aes256Gcm::new_from_slice(key)?.decrypt(Nonce::from_slice(&n),c.as_ref()).map_err(|_|anyhow::anyhow!("cannot decrypt record; check the local key")) }
fn save(home:&Path, key:&[u8], r:&Record)->Result<()> { let e=crypt(key,&serde_json::to_vec(r)?)?; fs::write(records_path(home).join(format!("{}.tr",r.id)),serde_json::to_vec(&e)?)?; Ok(()) }
fn load(home:&Path,key:&[u8],id:&str)->Result<Record> { let b=fs::read(records_path(home).join(format!("{id}.tr"))).with_context(|| format!("record {id} was not found"))?; let e:Envelope=serde_json::from_slice(&b)?; Ok(serde_json::from_slice(&decrypt(key,&e)?)?) }
fn all(home:&Path,key:&[u8])->Result<Vec<Record>> { let mut out:Vec<Record>=Vec::new(); for e in fs::read_dir(records_path(home))? { let p=e?.path(); if p.extension().and_then(|x|x.to_str())==Some("tr") { let b=fs::read(&p)?; let env:Envelope=serde_json::from_slice(&b)?; out.push(serde_json::from_slice(&decrypt(key,&env)?)?); } } out.sort_by(|a,b|b.created_at.cmp(&a.created_at)); Ok(out) }
fn redact(s:&str)->String { let patterns=[r"(?i)(api[_-]?key|token|password|secret)\s*[=:]\s*[^\s]+",r"\b(?:sk|ghp)_[A-Za-z0-9_-]{12,}\b",r"\bAKIA[0-9A-Z]{16}\b",r"(?i)bearer\s+[A-Za-z0-9._-]{12,}"]; let mut x=s.to_string(); for p in patterns { x=Regex::new(p).unwrap().replace_all(&x,"[REDACTED]").to_string(); } x }
fn now()->String { OffsetDateTime::now_utc().format(&Rfc3339).unwrap() }
fn print_json<T:Serialize>(v:&T)->Result<()> { println!("{}",serde_json::to_string(v)?); Ok(()) }
fn cmd_run(home:&Path,key:&[u8], label:Option<String>, args:Vec<String>, json:bool)->Result<i32> { let mut c=Command::new(&args[0]); c.args(&args[1..]); let output=c.output().with_context(||format!("could not start {}",args[0]))?; let mut raw=output.stdout; raw.extend_from_slice(&output.stderr); let output_text=String::from_utf8_lossy(&raw).to_string(); print!("{output_text}"); let r=Record{id:Uuid::new_v4().simple().to_string()[..12].to_string(),created_at:now(),label:label.unwrap_or_else(||args.join(" ")),command:Some(args),output:output_text}; save(home,key,&r)?; if json { print_json(&serde_json::json!({"id":r.id,"saved":true,"exit_code":output.status.code()}))? } else { eprintln!("\nSaved encrypted record {}.",r.id); } Ok(output.status.code().unwrap_or(1)) }
fn main_result()->Result<i32> { let cli=Cli::parse(); let home=cli.home.unwrap_or_else(default_home); let key=prepare(&home)?; match cli.command {
  Commands::Run{label,command}=>cmd_run(&home,&key,label,command,cli.json),
  Commands::Capture{label}=>{let mut s=String::new();io::stdin().read_to_string(&mut s)?;let r=Record{id:Uuid::new_v4().simple().to_string()[..12].to_string(),created_at:now(),label:label.unwrap_or_else(||"stdin capture".into()),command:None,output:s};save(&home,&key,&r)?;if cli.json{print_json(&serde_json::json!({"id":r.id,"saved":true}))?}else{println!("Saved encrypted record {}.",r.id)};Ok(0)},
  Commands::Search{query,context}=>{let q=query.to_lowercase();let mut matches:Vec<(String,String,usize,String)>=Vec::new();for r in all(&home,&key)?{let lines:Vec<_>=r.output.lines().collect();for(i,line)in lines.iter().enumerate(){if line.to_lowercase().contains(&q){let a=i.saturating_sub(context);let b=(i+context+1).min(lines.len());matches.push((r.id.clone(),r.label.clone(),i+1,lines[a..b].join("\n")));}}}if cli.json{print_json(&matches.iter().map(|m|serde_json::json!({"id":m.0,"label":m.1,"line":m.2,"excerpt":m.3})).collect::<Vec<_>>())?}else if matches.is_empty(){println!("No matches. Capture a command first, then search its output.")}else{for (id,label,line,excerpt) in matches{println!("\n{id} · {label} · line {line}\n{excerpt}");}}Ok(0)},
  Commands::Export{id,output,..}=>{let r=load(&home,&key,&id)?;fs::write(&output,format!("# Terminal Recall excerpt\n# Record: {}\n# Captured: {}\n\n{}\n",r.id,r.created_at,redact(&r.output)))?;if cli.json{print_json(&serde_json::json!({"output":output,"redacted":true}))?}else{println!("Wrote redacted excerpt to {}.",output.display())}Ok(0)},
  Commands::Expire{days}=>{let cutoff=OffsetDateTime::now_utc()-time::Duration::days(days);let mut n=0;for r in all(&home,&key)?{let t=OffsetDateTime::parse(&r.created_at,&Rfc3339)?;if t<cutoff{fs::remove_file(records_path(&home).join(format!("{}.tr",r.id)))?;n+=1;}}println!("Deleted {n} record(s) older than {days} days.");Ok(0)},
  Commands::Delete{id}=>{let p=records_path(&home).join(format!("{id}.tr"));if !p.exists(){bail!("record {id} was not found")};fs::remove_file(p)?;println!("Deleted record {id}.");Ok(0)},
  Commands::List=>{let xs=all(&home,&key)?;if cli.json{print_json(&xs.iter().map(|r|serde_json::json!({"id":r.id,"created_at":r.created_at,"label":r.label,"bytes":r.output.len()})).collect::<Vec<_>>())?}else if xs.is_empty(){println!("No saved records. Run: terminal-recall run -- your-command")}else{for r in xs{println!("{}  {}  {}",r.id,r.created_at,r.label)}}Ok(0)},
  Commands::Status=>{let mut h=Sha256::new();h.update(&key);let fp=format!("{:x}",h.finalize());println!("Records: {}\nKey fingerprint: {}\nEncryption: AES-256-GCM",home.display(),&fp[..16]);Ok(0)},
  Commands::Demo=>{let d=std::env::temp_dir().join(format!("terminal-recall-demo-{}",Uuid::new_v4()));let k=prepare(&d)?;let r=Record{id:"demo0001".into(),created_at:now(),label:"deploy smoke test".into(),command:Some(vec!["./deploy-check".into()]),output:"checking api… ok\nAPI_KEY=sk_demo_0123456789abcdefghijklmnop\ndeploy finished\n".into()};save(&d,&k,&r)?;let o=d.join("redacted-excerpt.txt");fs::write(&o,redact(&r.output))?;println!("Demo record saved in {}\nSearch: terminal-recall --home {} search deploy\nRedacted export: {}",d.display(),d.display(),o.display());Ok(0)}
 }
}
fn main(){match main_result(){Ok(code)=>std::process::exit(code),Err(e)=>{eprintln!("Error: {e:#}\nTry `terminal-recall --help`.");std::process::exit(2)}}}

#[cfg(test)]
mod tests { use super::*; #[test] fn redacts_key_patterns(){assert_eq!(redact("API_KEY=sk_abcdefghijklmnopqrstu"),"[REDACTED]");assert_eq!(redact("Bearer abcdefghijklmnop"),"[REDACTED]");} #[test] fn encrypted_round_trip(){let k=vec![7;32];let e=crypt(&k,b"keep this").unwrap();assert_ne!(e.ciphertext,"keep this");assert_eq!(decrypt(&k,&e).unwrap(),b"keep this");} }
