/** Shell 命令调用封装 */

import { invoke } from "@tauri-apps/api/core";

export interface CommandOutput {
  code: number;
  stdout: string;
  stderr: string;
}

export const shellCommands = {
  run: (program: string, args: string[] = []): Promise<CommandOutput> =>
    invoke<CommandOutput>("shell_run", { program, args }),
};
