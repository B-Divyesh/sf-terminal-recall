use serde_json::Value;
use std::{
    io::Write,
    process::{Command, Stdio},
};

fn terminal_recall() -> Command {
    Command::new(env!("CARGO_BIN_EXE_terminal-recall"))
}

#[test]
fn negative_expiry_is_rejected_without_deleting_records() {
    let store = tempfile::tempdir().unwrap();

    let mut capture = terminal_recall();
    let mut child = capture
        .args([
            "--home",
            store.path().to_str().unwrap(),
            "--json",
            "capture",
            "--label",
            "current deploy",
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .as_mut()
        .unwrap()
        .write_all(b"current record must remain\n")
        .unwrap();
    let captured = child.wait_with_output().unwrap();
    assert!(captured.status.success());
    let captured_json: Value = serde_json::from_slice(&captured.stdout).unwrap();
    let record_id = captured_json["id"].as_str().unwrap();

    let rejected = terminal_recall()
        .args([
            "--home",
            store.path().to_str().unwrap(),
            "expire",
            "--days=-1",
        ])
        .output()
        .unwrap();
    assert!(!rejected.status.success());
    assert_eq!(rejected.status.code(), Some(2));
    assert!(
        String::from_utf8_lossy(&rejected.stderr).contains("days must be zero or greater"),
        "stderr was: {}",
        String::from_utf8_lossy(&rejected.stderr)
    );

    let listed = terminal_recall()
        .args(["--home", store.path().to_str().unwrap(), "--json", "list"])
        .output()
        .unwrap();
    assert!(listed.status.success());
    let records: Value = serde_json::from_slice(&listed.stdout).unwrap();
    let records = records.as_array().unwrap();
    assert_eq!(records.len(), 1);
    assert_eq!(records[0]["id"], record_id);
}
