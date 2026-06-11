//! 文件系统服务（业务逻辑层）
//!
//! command 层只做参数校验 + 调用此处。

use crate::error::{AppError, AppResult};
use std::path::{Path, PathBuf};

const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10 MB

pub fn read_text_file(path: &str) -> AppResult<String> {
    let pb = validate_path(path)?;
    let metadata = std::fs::metadata(&pb)?;
    if metadata.len() > MAX_FILE_SIZE {
        return Err(AppError::Command(format!(
            "File too large: {} bytes (max {} bytes)",
            metadata.len(),
            MAX_FILE_SIZE
        )));
    }
    Ok(std::fs::read_to_string(&pb)?)
}

pub fn write_text_file(path: &str, contents: &str) -> AppResult<()> {
    let pb = validate_path(path)?;
    if let Some(parent) = pb.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&pb, contents)?;
    Ok(())
}

pub fn exists(path: &str) -> AppResult<bool> {
    let pb = validate_path(path)?;
    Ok(Path::new(&pb).exists())
}

fn validate_path(path: &str) -> AppResult<PathBuf> {
    if path.is_empty() {
        return Err(AppError::PathNotAllowed(path.into()));
    }
    Ok(PathBuf::from(path))
}
