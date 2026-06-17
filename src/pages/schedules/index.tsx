import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Save, Star, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  type AgentConfig,
  type Schedule,
  type TimePreset,
  type TriggerType,
  warmupCommands,
} from "@/lib/tauri/commands";
import {
  formatDays,
  newPresetFromSchedule,
  scheduleKindLabel,
  weekdayLabels,
} from "@/features/warmup/utils";
import { cn } from "@/lib/utils";

type ScheduleView = "warmup_5h" | "weekly";

const emptyAgent: AgentConfig = {
  id: "",
  name: "Custom Agent",
  kind: "custom",
  enabled: false,
  command: "",
  args: [],
  cwd: null,
  env: [],
  timeoutSeconds: 120,
  schedules: [],
  createdAt: "",
  updatedAt: "",
};

export default function SchedulesPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const agentsQuery = useQuery({
    queryKey: ["warmup", "agents"],
    queryFn: warmupCommands.listAgents,
  });
  const presetsQuery = useQuery({
    queryKey: ["warmup", "presets"],
    queryFn: warmupCommands.listPresets,
  });
  const [selectedId, setSelectedId] = useState("");
  const [activeView, setActiveView] = useState<ScheduleView>("warmup_5h");
  const agents = agentsQuery.data ?? [];
  const presets = presetsQuery.data ?? [];
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedId) ?? agents[0],
    [agents, selectedId],
  );
  const [draft, setDraft] = useState<AgentConfig>(selectedAgent ?? emptyAgent);

  useEffect(() => {
    if (selectedAgent) {
      setSelectedId(selectedAgent.id);
      setDraft(selectedAgent);
    }
  }, [selectedAgent]);

  const saveAgent = useMutation({
    mutationFn: warmupCommands.saveAgent,
    onSuccess: async (agent) => {
      setSelectedId(agent.id);
      await queryClient.invalidateQueries({ queryKey: ["warmup", "agents"] });
    },
  });

  const savePreset = useMutation({
    mutationFn: warmupCommands.savePreset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["warmup", "presets"] });
    },
  });

  const deletePreset = useMutation({
    mutationFn: warmupCommands.deletePreset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["warmup", "presets"] });
    },
  });

  const activeSchedules = draft.schedules
    .map((schedule, index) => ({ schedule, index }))
    .filter(({ schedule }) => schedule.triggerType === activeView);
  const viewPresets = presets.filter((preset) =>
    activeView === "weekly" ? preset.kind === "weekly" : preset.kind === "daily",
  );
  const enabledCount = activeSchedules.filter(
    ({ schedule }) => schedule.enabled,
  ).length;

  function updateSchedule(index: number, patch: Partial<Schedule>): void {
    setDraft((current) => ({
      ...current,
      schedules: current.schedules.map((schedule, itemIndex) =>
        itemIndex === index ? { ...schedule, ...patch } : schedule,
      ),
    }));
  }

  function addSchedule(triggerType: ScheduleView): void {
    setDraft((current) => ({
      ...current,
      schedules: [...current.schedules, createSchedule(triggerType)],
    }));
  }

  function deleteSchedule(index: number): void {
    setDraft((current) => ({
      ...current,
      schedules: current.schedules.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function applyPreset(index: number, preset: TimePreset): void {
    updateSchedule(index, {
      time: preset.time,
      daysOfWeek: preset.daysOfWeek,
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-col gap-3 rounded-md border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Schedules</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={draft.id}
              onChange={(event) => setSelectedId(event.currentTarget.value)}
              className="h-9 min-w-52 rounded-md border bg-background px-3 text-sm"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <label className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) =>
                  setDraft({ ...draft, enabled: event.currentTarget.checked })
                }
              />
              Enabled
            </label>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => saveAgent.mutate(draft)}
          disabled={saveAgent.isPending}
        >
          <Save className="mr-2" size={15} />
          Save
        </Button>
      </header>

      <section className="rounded-md border bg-background">
        <div className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_120px]">
          <Field label="Command">
            <input
              value={draft.command}
              onChange={(event) =>
                setDraft({ ...draft, command: event.currentTarget.value })
              }
              className="input-base font-mono"
            />
          </Field>
          <Field label="Working directory">
            <input
              value={draft.cwd ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, cwd: event.currentTarget.value || null })
              }
              placeholder="Optional"
              className="input-base"
            />
          </Field>
          <Field label="Timeout">
            <input
              type="number"
              min={1}
              value={draft.timeoutSeconds}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  timeoutSeconds: Number(event.currentTarget.value),
                })
              }
              className="input-base"
            />
          </Field>
          <Field label="Arguments">
            <textarea
              value={draft.args.join("\n")}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  args: event.currentTarget.value
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              rows={3}
              className="input-base min-h-24 font-mono"
            />
          </Field>
          <Field label="Environment">
            <textarea
              value={draft.env.map((item) => `${item.key}=${item.value}`).join("\n")}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  env: event.currentTarget.value
                    .split("\n")
                    .map((line) => {
                      const [key, ...rest] = line.split("=");
                      return { key: key?.trim() ?? "", value: rest.join("=") };
                    })
                    .filter((item) => item.key),
                })
              }
              placeholder="KEY=value"
              rows={3}
              className="input-base min-h-24 font-mono"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-md border bg-background">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-grid w-full grid-cols-2 rounded-md border bg-muted/40 p-1 sm:w-auto">
            <ViewButton
              active={activeView === "warmup_5h"}
              label="5-hour limit"
              count={draft.schedules.filter((s) => s.triggerType === "warmup_5h").length}
              onClick={() => setActiveView("warmup_5h")}
            />
            <ViewButton
              active={activeView === "weekly"}
              label="Weekly limit"
              count={draft.schedules.filter((s) => s.triggerType === "weekly").length}
              onClick={() => setActiveView("weekly")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {enabledCount} enabled / {activeSchedules.length} total
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addSchedule(activeView)}
            >
              <CalendarPlus className="mr-2" size={15} />
              Add trigger
            </Button>
          </div>
        </div>

        <div className="border-b px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {viewPresets.map((preset) => (
              <span key={preset.id} className="inline-flex items-center rounded-md border">
                <span className="px-2 py-1 text-xs">{preset.label}</span>
                <button
                  type="button"
                  className="border-l px-1.5 py-1 text-muted-foreground hover:text-red-600"
                  onClick={() => deletePreset.mutate(preset.id)}
                  aria-label="Delete preset"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
            {viewPresets.length === 0 && (
              <span className="text-sm text-muted-foreground">No saved presets</span>
            )}
          </div>
        </div>

        <div className="divide-y">
          {activeSchedules.map(({ schedule, index }) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              presets={viewPresets}
              onChange={(patch) => updateSchedule(index, patch)}
              onApplyPreset={(preset) => applyPreset(index, preset)}
              onSavePreset={() => savePreset.mutate(newPresetFromSchedule(schedule))}
              onDelete={() => deleteSchedule(index)}
            />
          ))}
          {activeSchedules.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No trigger points.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="min-w-0 space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function ViewButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={cn(
        "min-w-32 rounded px-3 py-2 text-left text-xs transition-colors",
        active ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/70",
      )}
      onClick={onClick}
    >
      <span className="block truncate font-semibold">{label}</span>
      <span className="block text-muted-foreground">{count} triggers</span>
    </button>
  );
}

function ScheduleRow({
  schedule,
  presets,
  onChange,
  onApplyPreset,
  onSavePreset,
  onDelete,
}: {
  schedule: Schedule;
  presets: TimePreset[];
  onChange: (patch: Partial<Schedule>) => void;
  onApplyPreset: (preset: TimePreset) => void;
  onSavePreset: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  return (
    <article className="grid gap-3 px-4 py-3 xl:grid-cols-[120px_130px_minmax(280px,1fr)_auto] xl:items-center">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={schedule.enabled}
          onChange={(event) => onChange({ enabled: event.currentTarget.checked })}
        />
        Enabled
      </label>

      <Field label="Time">
        <input
          type="time"
          value={schedule.time}
          onChange={(event) => onChange({ time: event.currentTarget.value })}
          className="input-base h-9"
        />
      </Field>

      <div className="min-w-0 space-y-1.5">
        <span className="text-sm font-medium">Days</span>
        <div className="flex flex-wrap gap-1">
          {weekdayLabels.map((label, itemIndex) => {
            const day = itemIndex + 1;
            const active = schedule.daysOfWeek.includes(day);
            return (
              <button
                key={label}
                type="button"
                className={cn(
                  "h-8 min-w-9 rounded border px-2 text-xs transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted",
                )}
                onClick={() =>
                  onChange({
                    daysOfWeek: active
                      ? schedule.daysOfWeek.filter((item) => item !== day)
                      : [...schedule.daysOfWeek, day].sort(),
                  })
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="mr-1 text-xs text-muted-foreground">
            {schedule.triggerType === "weekly" ? "Weekly" : "5-hour"} ·{" "}
            {formatDays(schedule.daysOfWeek)}
          </span>
          {presets.slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="rounded border px-2 py-0.5 text-xs hover:bg-muted"
              onClick={() => onApplyPreset(preset)}
              title={`${scheduleKindLabel(preset.kind)} ${preset.time}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 xl:justify-end">
        <Button variant="outline" size="sm" onClick={onSavePreset}>
          <Star className="mr-2" size={15} />
          Preset
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2" size={15} />
          Delete
        </Button>
      </div>
    </article>
  );
}

function createSchedule(triggerType: TriggerType): Schedule {
  const weekly = triggerType === "weekly";
  return {
    id: crypto.randomUUID(),
    enabled: true,
    kind: weekly ? "weekly" : "daily",
    triggerType,
    time: "06:00",
    daysOfWeek: weekly ? [1] : [1, 2, 3, 4, 5],
    lastTriggeredAt: null,
  };
}
