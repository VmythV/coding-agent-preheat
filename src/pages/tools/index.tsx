import { useState } from "react";
import { fsCommands } from "@/lib/tauri";
import { Button } from "@/components/ui/Button";

export default function ToolsPage(): React.JSX.Element {
  const [content, setContent] = useState<string | null>(null);
  const [path, setPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleRead(): Promise<void> {
    setError(null);
    try {
      const text = await fsCommands.readTextFile(path);
      setContent(text);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">本地工具</h1>
      <p className="text-sm text-muted-foreground">
        文件系统访问是 Tauri 的强项。此处演示读取一个文本文件。
      </p>

      <div className="rounded-md border p-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={path}
            onChange={(e) => setPath(e.currentTarget.value)}
            placeholder="输入文件绝对路径..."
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <Button onClick={() => void handleRead()}>读取</Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {content !== null && (
          <pre className="rounded bg-muted p-3 text-xs overflow-auto">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
