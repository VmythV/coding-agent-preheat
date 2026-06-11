/**
 * 与 Rust 端共享的 DTO 类型
 * 复杂项目可改用 ts-rs 在 Rust 端自动生成。
 */

export interface AppInfo {
  name: string;
  version: string;
  identifier: string;
}

export interface CommandError {
  code: string;
  message: string;
  details?: unknown;
}
