//! 应用配置加载（占位）
//!
//! 后续可在此处接入 dotenvy / config crate，
//! 区分 dev / prod 配置。

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, Default)]
pub struct AppConfig {
    /// 是否启用 AI 客户端相关 command
    #[allow(dead_code)]
    pub ai_enabled: bool,
}

impl AppConfig {
    pub fn load() -> Self {
        Self::default()
    }
}
