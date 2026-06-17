pub mod ai;
pub mod fs;
pub mod shell;
pub mod system;
pub mod warmup;

/// 保留示例 command，演示最小 IPC 流程
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
