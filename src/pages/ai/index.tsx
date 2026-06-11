import { useState } from "react";
import { aiCommands } from "@/lib/tauri";
import { Button } from "@/components/ui/Button";

export default function AIPage(): React.JSX.Element {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(): Promise<void> {
    setLoading(true);
    try {
      const reply = await aiCommands.chat({
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: input }],
        temperature: 0.7,
      });
      setOutput(reply);
    } catch (e) {
      setOutput(`[占位] ${input}\n\n错误：${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">AI 客户端（占位）</h1>
      <p className="text-sm text-muted-foreground">
        此页面预留了与 LLM 通信的 command 接口。Rust 端尚未实现，
        实际接入后可在此处完成多轮对话、流式响应。
      </p>

      <div className="rounded-md border p-4 space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="输入消息..."
          className="w-full rounded-md border px-3 py-2 text-sm min-h-24"
        />
        <Button onClick={() => void handleSend()} disabled={loading}>
          {loading ? "发送中..." : "发送"}
        </Button>
        {output && (
          <pre className="rounded bg-muted p-3 text-xs whitespace-pre-wrap">
            {output}
          </pre>
        )}
      </div>
    </div>
  );
}
