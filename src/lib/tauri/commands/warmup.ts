import { invoke } from "@tauri-apps/api/core";

export type AgentKind = "claude" | "codex" | "custom";
export type ScheduleKind = "daily" | "weekly";
export type TriggerType = "manual" | "warmup_5h" | "weekly";
export type RunStatus =
  | "running"
  | "success"
  | "failed"
  | "timeout"
  | "skipped";
export type LogClearScope = "all" | "older_than_30_days" | "older_than_7_days";

export interface EnvVar {
  key: string;
  value: string;
}

export interface Schedule {
  id: string;
  enabled: boolean;
  kind: ScheduleKind;
  triggerType: TriggerType;
  time: string;
  daysOfWeek: number[];
  lastTriggeredAt?: string | null;
}

export interface AgentConfig {
  id: string;
  name: string;
  kind: AgentKind;
  enabled: boolean;
  command: string;
  args: string[];
  cwd?: string | null;
  env: EnvVar[];
  timeoutSeconds: number;
  schedules: Schedule[];
  createdAt: string;
  updatedAt: string;
}

export interface TimePreset {
  id: string;
  label: string;
  kind: ScheduleKind;
  time: string;
  daysOfWeek: number[];
  lastUsedAt: string;
}

export interface RunLog {
  id: string;
  agentId: string;
  agentName: string;
  triggerType: TriggerType;
  startedAt: string;
  finishedAt?: string | null;
  command: string;
  args: string[];
  cwd?: string | null;
  exitCode?: number | null;
  status: RunStatus;
  stdout: string;
  stderr: string;
  errorMessage?: string | null;
  durationMs?: number | null;
}

export const warmupCommands = {
  listAgents: () => invoke<AgentConfig[]>("warmup_list_agents"),
  saveAgent: (agent: AgentConfig) =>
    invoke<AgentConfig>("warmup_save_agent", { agent }),
  deleteAgent: (id: string) => invoke<void>("warmup_delete_agent", { id }),
  triggerAgent: (agentId: string, triggerType: TriggerType) =>
    invoke<RunLog>("warmup_trigger_agent", { agentId, triggerType }),
  listLogs: () => invoke<RunLog[]>("warmup_list_logs"),
  clearLogs: (scope: LogClearScope) =>
    invoke<number>("warmup_clear_logs", { scope }),
  listPresets: () => invoke<TimePreset[]>("warmup_list_presets"),
  savePreset: (preset: TimePreset) =>
    invoke<TimePreset>("warmup_save_preset", { preset }),
  deletePreset: (id: string) => invoke<void>("warmup_delete_preset", { id }),
};
