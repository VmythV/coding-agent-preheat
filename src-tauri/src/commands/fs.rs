//! 文件系统相关 command（薄壳：参数 + 调用 service + 包装错误）

use crate::error::AppResult;
use crate::services::fs_service;

#[tauri::command]
pub fn fs_read_text_file(path: String) -> AppResult<String> {
    fs_service::read_text_file(&path)
}

#[tauri::command]
pub fn fs_write_text_file(path: String, contents: String) -> AppResult<()> {
    fs_service::write_text_file(&path, &contents)
}

#[tauri::command]
pub fn fs_exists(path: String) -> AppResult<bool> {
    fs_service::exists(&path)
}
