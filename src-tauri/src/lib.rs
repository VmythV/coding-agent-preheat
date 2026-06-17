// Tauri 2.x 应用入口
// 业务代码统一在 lib.rs 中，main.rs 仅保留桌面端启动调用。

mod commands;
mod config;
mod error;
mod models;
mod services;

use commands::{ai, fs, shell, system, warmup};
use services::warmup_service::{spawn_scheduler, WarmupState};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, Wry};
use tauri_plugin_autostart::MacosLauncher;

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
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .setup(|app| {
            let state = WarmupState::new(app.handle())?;
            spawn_scheduler(state.clone());
            app.manage(state);
            setup_tray(app)?;
            Ok(())
        })
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
            // warmup
            warmup::warmup_list_agents,
            warmup::warmup_save_agent,
            warmup::warmup_delete_agent,
            warmup::warmup_trigger_agent,
            warmup::warmup_list_logs,
            warmup::warmup_list_presets,
            warmup::warmup_save_preset,
            warmup::warmup_delete_preset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &mut tauri::App<Wry>) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;
    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

fn show_main_window(app: &tauri::AppHandle<Wry>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
