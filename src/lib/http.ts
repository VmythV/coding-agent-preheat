/**
 * HTTP 客户端封装
 *
 * 桌面端优先使用 tauri-plugin-http（绕过 CORS、允许自定义 header），
 * 浏览器/SSR 回落到原生 fetch。
 */

import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "./env";

export interface HttpOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export async function http<T = unknown>(
  url: string,
  options: HttpOptions = {},
): Promise<T> {
  const { method = "GET", headers, body, timeoutMs = 30_000 } = options;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  init.signal = controller.signal;

  try {
    const fetcher = isTauri() ? tauriFetch : fetch;
    const res = await fetcher(url, init);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
