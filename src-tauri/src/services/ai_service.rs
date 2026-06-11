//! AI 客户端服务（占位）
//!
//! 后续可在此处接入 reqwest + eventsource-client 实现流式响应。

use crate::error::AppResult;
use crate::models::ChatRequest;

pub async fn chat(req: ChatRequest) -> AppResult<String> {
    // 占位实现：回显第一条 user 消息，便于前端调试
    let user_msg = req
        .messages
        .iter()
        .find(|m| m.role == "user")
        .map(|m| m.content.as_str())
        .unwrap_or("");

    log::warn!(
        "[ai] placeholder called: provider='{}' model='{}' user='{}'",
        req.provider,
        req.model,
        user_msg
    );

    Ok(format!(
        "[占位 AI 回复] provider={}, model={}, 你说：{}",
        req.provider, req.model, user_msg
    ))
}
