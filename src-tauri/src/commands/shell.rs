//! Shell 相关 command

use crate::error::AppResult;
use crate::models::CommandOutput;
use crate::services::shell_service;

#[tauri::command]
pub fn shell_run(program: String, args: Vec<String>) -> AppResult<CommandOutput> {
    shell_service::run(&program, &args)
}
