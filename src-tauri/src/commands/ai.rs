//! AI 客户端 command（占位）

use crate::error::AppResult;
use crate::models::ChatRequest;
use crate::services::ai_service;

#[tauri::command]
pub async fn ai_chat(req: ChatRequest) -> AppResult<String> {
    ai_service::chat(req).await
}

#[tauri::command]
pub fn ai_cancel_chat(_id: String) -> AppResult<()> {
    // TODO: 实现流式对话的取消逻辑
    Ok(())
}
