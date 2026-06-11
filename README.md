# Desktop Tauri Template

> Tauri 2.x + React 19 + TypeScript 桌面端初始模板，覆盖**通用业务 / 本地工具 / AI 客户端**三类场景。

## 技术栈

| 层级 | 选型 |
|---|---|
| 桌面运行时 | Tauri 2.x |
| 前端 | React 19 + TypeScript 5+ + Vite 7 |
| 路由 | React Router 7 |
| 状态管理 | Zustand + TanStack Query |
| 样式 | Tailwind CSS 3 + shadcn/ui（占位 CSS 变量） |
| 后端 | Rust（模块化：commands / services / models） |

## 快速开始

```bash
pnpm install
pnpm tauri:dev      # 启动开发模式
pnpm tauri:build    # 打包发布版本
```

## 目录结构

```
src/                      # React 前端
  ├── pages/              # 页面（home / tools / ai）
  ├── components/         # 通用组件（layout / ui）
  ├── features/           # 业务功能模块
  ├── lib/                # 基础设施
  │   ├── tauri/          # ★ Tauri invoke 封装层
  │   ├── http.ts         # HTTP 客户端
  │   └── env.ts          # 平台判断
  ├── stores/             # Zustand 全局状态
  └── router.tsx

src-tauri/                # Rust 后端
  ├── src/
  │   ├── lib.rs          # 应用入口 + plugin/command 注册
  │   ├── commands/       # Tauri command 薄壳
  │   ├── services/       # 业务服务层
  │   ├── models/         # DTO
  │   ├── error.rs        # 统一错误类型
  │   └── config.rs       # 配置加载
  ├── capabilities/       # 权限声明
  │   ├── default.json    # 基础权限
  │   ├── tools.json      # 本地工具场景
  │   └── ai.json         # AI 客户端场景
  └── tauri.conf.json
```

## 已注册插件

- `tauri-plugin-fs` 文件系统
- `tauri-plugin-dialog` 对话框
- `tauri-plugin-shell` Shell 命令
- `tauri-plugin-http` HTTP（支持自定义 header，绕过 CORS）
- `tauri-plugin-store` 键值存储
- `tauri-plugin-log` 日志
- `tauri-plugin-os` 系统信息
- `tauri-plugin-opener` 打开 URL/文件

## 已注册 Command

| 名称 | 模块 | 说明 |
|---|---|---|
| `greet` | demo | 示例 command |
| `fs_read_text_file` / `fs_write_text_file` / `fs_exists` | commands/fs | 文件操作 |
| `shell_run` | commands/shell | 执行外部命令 |
| `system_info` | commands/system | 系统信息 |
| `ai_chat` / `ai_cancel_chat` | commands/ai | AI 对话（占位） |

## 下一步

- 启用 shadcn/ui：`pnpm dlx shadcn@latest init`
- 接入 LLM：在 `services/ai_service.rs` 中实现 `chat()`
- 添加自动更新：`tauri-plugin-updater`
- CI：参考 `.github/workflows/release.yml` 模板
