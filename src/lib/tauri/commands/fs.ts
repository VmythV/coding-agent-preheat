/**
 * 文件系统相关命令封装
 *
 * 实际权限范围在 src-tauri/capabilities/*.json 中声明。
 * 这里只负责调用，不负责鉴权。
 */

import { invoke } from "@tauri-apps/api/core";

export interface ReadTextFileOptions {
  path: string;
}

export const fsCommands = {
  readTextFile: (path: string): Promise<string> =>
    invoke<string>("fs_read_text_file", { path }),

  writeTextFile: (path: string, contents: string): Promise<void> =>
    invoke<void>("fs_write_text_file", { path, contents }),

  exists: (path: string): Promise<boolean> =>
    invoke<boolean>("fs_exists", { path }),
};
