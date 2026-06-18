import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, RotateCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  type LogClearScope,
  type RunLog,
  warmupCommands,
} from "@/lib/tauri/commands";
import { statusLabel, triggerLabel } from "@/features/warmup/utils";
import { cn } from "@/lib/utils";

const clearScopeLabels: Record<LogClearScope, string> = {
  all: "all logs",
  older_than_30_days: "logs older than 30 days",
  older_than_7_days: "logs older than 7 days",
};

export default function LogsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clearScope, setClearScope] = useState<LogClearScope>("older_than_30_days");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const logsQuery = useQuery({
    queryKey: ["warmup", "logs"],
    queryFn: warmupCommands.listLogs,
    refetchInterval: 10_000,
  });
  const clearLogs = useMutation({
    mutationFn: warmupCommands.clearLogs,
    onSuccess: async () => {
      setExpandedId(null);
      await queryClient.invalidateQueries({ queryKey: ["warmup", "logs"] });
    },
  });

  const logs = logsQuery.data ?? [];
  const agents = useMemo(
    () => Array.from(new Set(logs.map((log) => log.agentName))).sort(),
    [logs],
  );
  const filtered = logs.filter((log) => {
    const agentMatches = agentFilter === "all" || log.agentName === agentFilter;
    const statusMatches = statusFilter === "all" || log.status === statusFilter;
    return agentMatches && statusMatches;
  });
  const clearLabel = clearScopeLabels[clearScope];

  function handleClearLogs(): void {
    if (!window.confirm(`Clear ${clearLabel}? This cannot be undone.`)) {
      return;
    }
    clearLogs.mutate(clearScope);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Logs</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Local execution history including command, result, stdout, and stderr.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logsQuery.refetch()}
            disabled={logsQuery.isFetching}
          >
            <RotateCw className="mr-2" size={15} />
            Refresh
          </Button>
        </div>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
        <div className="flex flex-wrap gap-3">
        <select
          value={agentFilter}
          onChange={(event) => setAgentFilter(event.currentTarget.value)}
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="all">All agents</option>
          {agents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.currentTarget.value)}
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="timeout">Timeout</option>
          <option value="skipped">Skipped</option>
        </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={clearScope}
            onChange={(event) =>
              setClearScope(event.currentTarget.value as LogClearScope)
            }
            className="h-9 rounded-md border px-3 text-sm"
          >
            <option value="older_than_30_days">Older than 30 days</option>
            <option value="older_than_7_days">Older than 7 days</option>
            <option value="all">All logs</option>
          </select>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearLogs}
            disabled={clearLogs.isPending || logs.length === 0}
          >
            <Trash2 className="mr-2" size={15} />
            Clear
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border">
        <div className="grid grid-cols-[40px_1fr_130px_120px_120px] border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span />
          <span>Run</span>
          <span>Trigger</span>
          <span>Status</span>
          <span>Duration</span>
        </div>
        <div className="divide-y">
          {filtered.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              expanded={expandedId === log.id}
              onToggle={() =>
                setExpandedId((current) => (current === log.id ? null : log.id))
              }
            />
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-sm text-muted-foreground">No logs.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: RunLog;
  expanded: boolean;
  onToggle: () => void;
}): React.JSX.Element {
  return (
    <article>
      <button
        type="button"
        className="grid w-full grid-cols-[40px_1fr_130px_120px_120px] items-center px-3 py-3 text-left text-sm hover:bg-muted/60"
        onClick={onToggle}
      >
        <span>{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <span className="min-w-0">
          <span className="block font-medium">{log.agentName}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {new Date(log.startedAt).toLocaleString()}
          </span>
        </span>
        <span className="text-muted-foreground">{triggerLabel(log.triggerType)}</span>
        <span
          className={cn(
            "w-fit rounded px-2 py-0.5 text-xs",
            log.status === "success" && "bg-emerald-50 text-emerald-700",
            log.status === "failed" && "bg-red-50 text-red-700",
            log.status === "timeout" && "bg-amber-50 text-amber-700",
            log.status === "skipped" && "bg-zinc-100 text-zinc-700",
          )}
        >
          {statusLabel(log.status)}
        </span>
        <span className="text-muted-foreground">
          {log.durationMs == null ? "-" : `${log.durationMs} ms`}
        </span>
      </button>
      {expanded && (
        <div className="space-y-3 bg-muted/20 px-4 pb-4 pt-1 text-sm">
          <CodeBlock title="Command" value={[log.command, ...log.args].join(" ")} />
          {log.errorMessage && <CodeBlock title="Error" value={log.errorMessage} />}
          <CodeBlock title="stdout" value={log.stdout || "(empty)"} />
          <CodeBlock title="stderr" value={log.stderr || "(empty)"} />
        </div>
      )}
    </article>
  );
}

function CodeBlock({
  title,
  value,
}: {
  title: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <pre className="max-h-72 overflow-auto rounded-md border bg-background p-3 font-mono text-xs">
        {value}
      </pre>
    </div>
  );
}
