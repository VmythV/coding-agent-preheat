// Tauri 2.x 应用入口
// 业务代码统一在 lib.rs 中，main.rs 仅保留桌面端启动调用。

mod commands;
mod config;
mod error;
mod models;
mod services;

use commands::{ai, fs, shell, system};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _cfg = config::AppConfig::load();

    tauri::Builder::default()
        // ===== 官方插件注册 =====
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        // ===== Command 注册 =====
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            // fs
            fs::fs_read_text_file,
            fs::fs_write_text_file,
            fs::fs_exists,
            // shell
            shell::shell_run,
            // system
            system::system_info,
            // ai
            ai::ai_chat,
            ai::ai_cancel_chat,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
