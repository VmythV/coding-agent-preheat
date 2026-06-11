//! Shell 命令执行服务

use crate::error::AppResult;
use crate::models::CommandOutput;
use std::process::Command;

pub fn run(program: &str, args: &[String]) -> AppResult<CommandOutput> {
    let output = Command::new(program).args(args).output()?;

    Ok(CommandOutput {
        code: output.status.code().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
    })
}
