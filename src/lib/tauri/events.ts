/**
 * Tauri 事件订阅封装
 *
 * 用法：
 *   const unlisten = listen<AppEvent>("event-name", (e) => { ... });
 *   ...
 *   unlisten();
 */

import { listen, emit, type UnlistenFn } from "@tauri-apps/api/event";

export { listen, emit };
export type { UnlistenFn };
