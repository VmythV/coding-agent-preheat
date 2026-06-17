# Coding Agent Preheat

macOS 本地桌面工具，用固定时间执行 Claude、Codex 或自定义 Coding Agent 命令，帮助把本地 CLI 的使用窗口触发点放到更可控的时间，并保留每次触发日志。

## Features

- 多 Agent 配置，可独立启用或停用
- 内置 Claude Code 和 Codex 默认命令模板
- Daily 5 小时预热触发
- Weekly 触发配置
- 自定义时间保存为快捷 preset
- 手动触发命令
- 本地 JSON 持久化配置和执行日志
- macOS 系统托盘和开机自启插件

## Default Commands

Claude Code:

```bash
claude -p "hi" --model haiku --no-session-persistence
```

Codex:

```bash
codex exec --ephemeral --skip-git-repo-check "hi"
```

## Development

```bash
pnpm install
pnpm tauri:dev
```

TypeScript check:

```bash
pnpm typecheck
```

Rust check:

```bash
cd src-tauri
cargo check
```

This repository includes a project-level Cargo config at `.cargo/config.toml` that uses Aliyun's sparse crates.io mirror to speed up dependency downloads in China.
