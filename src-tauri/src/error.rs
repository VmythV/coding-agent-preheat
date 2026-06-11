//! 统一错误类型。所有 command 都应返回 `Result<T, AppError>`，
//! 通过 `serde` 序列化后前端可读取 `code` 与 `message` 字段。

use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Path not allowed: {0}")]
    PathNotAllowed(String),

    #[error("Command failed: {0}")]
    Command(String),
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        use serde::ser::SerializeStruct;
        let (code, message) = match self {
            AppError::Io(e) => ("io", e.to_string()),
            AppError::Json(e) => ("json", e.to_string()),
            AppError::PathNotAllowed(p) => ("path_not_allowed", p.clone()),
            AppError::Command(m) => ("command", m.clone()),
        };
        let mut s = serializer.serialize_struct("AppError", 2)?;
        s.serialize_field("code", code)?;
        s.serialize_field("message", &message)?;
        s.end()
    }
}

pub type AppResult<T> = std::result::Result<T, AppError>;
