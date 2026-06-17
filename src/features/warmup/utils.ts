import type {
  AgentConfig,
  RunLog,
  RunStatus,
  Schedule,
  ScheduleKind,
  TimePreset,
  TriggerType,
} from "@/lib/tauri/commands";

export const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatCommand(agent: Pick<AgentConfig, "command" | "args">): string {
  return [agent.command, ...agent.args].filter(Boolean).join(" ");
}

export function formatDays(days: number[]): string {
  if (days.length === 0 || days.length === 7) return "Every day";
  if (days.join(",") === "1,2,3,4,5") return "Weekdays";
  return days.map((day) => weekdayLabels[day - 1]).join(", ");
}

export function formatSchedule(schedule: Schedule): string {
  const type = schedule.triggerType === "weekly" ? "Weekly" : "5h";
  return `${type} · ${formatDays(schedule.daysOfWeek)} · ${schedule.time}`;
}

export function statusLabel(status: RunStatus): string {
  const labels: Record<RunStatus, string> = {
    running: "Running",
    success: "Success",
    failed: "Failed",
    timeout: "Timeout",
    skipped: "Skipped",
  };
  return labels[status];
}

export function triggerLabel(triggerType: TriggerType): string {
  const labels: Record<TriggerType, string> = {
    manual: "Manual",
    warmup_5h: "5h warmup",
    weekly: "Weekly",
  };
  return labels[triggerType];
}

export function scheduleKindLabel(kind: ScheduleKind): string {
  return kind === "weekly" ? "Weekly" : "Daily";
}

export function newestLogForAgent(logs: RunLog[], agentId: string): RunLog | undefined {
  return logs.find((log) => log.agentId === agentId);
}

export function nextScheduleSummary(agent: AgentConfig): string {
  const enabled = agent.schedules.filter((schedule) => schedule.enabled);
  if (!agent.enabled) return "Disabled";
  if (enabled.length === 0) return "No schedule";
  return enabled.map(formatSchedule).join(" / ");
}

export function newPresetFromSchedule(schedule: Schedule): TimePreset {
  return {
    id: "",
    label:
      schedule.kind === "weekly"
        ? `${formatDays(schedule.daysOfWeek)} ${schedule.time}`
        : `${schedule.time}`,
    kind: schedule.kind,
    time: schedule.time,
    daysOfWeek: schedule.daysOfWeek,
    lastUsedAt: "",
  };
}
