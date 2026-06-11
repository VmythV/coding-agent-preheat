import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/Button";

export default function HomePage(): React.JSX.Element {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet(): Promise<void> {
    setGreetMsg(await invoke<string>("greet", { name }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">欢迎使用</h1>
      <p className="text-sm text-muted-foreground">
        这是一个 Tauri 2.x + React 19 + TypeScript 的桌面端模板。
      </p>

      <div className="rounded-md border p-4 space-y-3">
        <p className="text-sm font-medium">测试与 Rust 端通信</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void greet();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="输入你的名字"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <Button type="submit">问候</Button>
        </form>
        {greetMsg && <p className="text-sm">{greetMsg}</p>}
      </div>
    </div>
  );
}
