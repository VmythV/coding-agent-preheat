/**
 * AI 客户端命令封装（预留）
 *
 * 计划在 Rust 端做 token 加密存储与流式代理，
 * 前端只需调用统一的 chat / chatStream 入口。
 */

import { invoke } from "@tauri-apps/api/core";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  provider: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}

export const aiCommands = {
  /** 非流式对话（占位实现，后续替换） */
  chat: (req: ChatRequest): Promise<string> =>
    invoke<string>("ai_chat", { req }),

  /** 流式对话事件订阅（占位） */
  cancelChat: (id: string): Promise<void> =>
    invoke<void>("ai_cancel_chat", { id }),
};
