import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Clock, Play, Power } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import {
  type AgentConfig,
  type RunLog,
  warmupCommands,
} from "@/lib/tauri/commands";
import {
  formatCommand,
  newestLogForAgent,
  nextScheduleSummary,
  statusLabel,
  triggerLabel,
} from "@/features/warmup/utils";
import { cn } from "@/lib/utils";

export default function HomePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const agentsQuery = useQuery({
    queryKey: ["warmup", "agents"],
    queryFn: warmupCommands.listAgents,
  });
  const logsQuery = useQuery({
    queryKey: ["warmup", "logs"],
    queryFn: warmupCommands.listLogs,
    refetchInterval: 10_000,
  });

  const saveAgent = useMutation({
    mutationFn: warmupCommands.saveAgent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["warmup", "agents"] });
    },
  });

  const triggerAgent = useMutation({
    mutationFn: (agentId: string) =>
      warmupCommands.triggerAgent(agentId, "manual"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["warmup", "logs"] });
    },
  });

  const agents = agentsQuery.data ?? [];
  const logs = logsQuery.data ?? [];
  const enabledCount = agents.filter((agent) => agent.enabled).length;
  const successCount = logs.filter((log) => log.status === "success").length;
  const failureCount = logs.filter((log) =>
    ["failed", "timeout"].includes(log.status),
  ).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Coding Agent Warmup</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Local macOS scheduler for Claude, Codex, and custom coding agents.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <Metric icon={<Power size={18} />} label="Enabled agents" value={`${enabledCount}/${agents.length}`} />
        <Metric icon={<Activity size={18} />} label="Successful runs" value={String(successCount)} />
        <Metric icon={<Clock size={18} />} label="Failures" value={String(failureCount)} />
      </section>

      <section className="overflow-hidden rounded-md border">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Agents</h2>
        </div>
        <div className="divide-y">
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              lastLog={newestLogForAgent(logs, agent.id)}
              onToggle={() =>
                saveAgent.mutate({ ...agent, enabled: !agent.enabled })
              }
              onRun={() => triggerAgent.mutate(agent.id)}
              busy={triggerAgent.isPending || saveAgent.isPending}
            />
          ))}
          {agents.length === 0 && (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              No agents configured.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-md border px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function AgentRow({
  agent,
  lastLog,
  onToggle,
  onRun,
  busy,
}: {
  agent: AgentConfig;
  lastLog?: RunLog;
  onToggle: () => void;
  onRun: () => void;
  busy: boolean;
}): React.JSX.Element {
  return (
    <div className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_1.4fr_1fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              agent.enabled ? "bg-emerald-500" : "bg-zinc-300",
            )}
          />
          <h3 className="truncate text-sm font-semibold">{agent.name}</h3>
        </div>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
          {formatCommand(agent)}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{nextScheduleSummary(agent)}</p>
      <div className="text-sm">
        {lastLog ? (
          <>
            <span
              className={cn(
                "mr-2 inline-flex rounded px-2 py-0.5 text-xs",
                lastLog.status === "success" && "bg-emerald-50 text-emerald-700",
                lastLog.status !== "success" && "bg-zinc-100 text-zinc-700",
              )}
            >
              {statusLabel(lastLog.status)}
            </span>
            <span className="text-muted-foreground">
              {triggerLabel(lastLog.triggerType)}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">No runs yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onToggle} disabled={busy}>
          <Power className="mr-2" size={15} />
          {agent.enabled ? "Disable" : "Enable"}
        </Button>
        <Button size="sm" onClick={onRun} disabled={busy}>
          <Play className="mr-2" size={15} />
          Run
        </Button>
      </div>
    </div>
  );
}
