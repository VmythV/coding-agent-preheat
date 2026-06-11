/** 应用整体布局：左侧导航 + 主内容区 */
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app";

const navItems = [
  { to: "/", label: "首页" },
  { to: "/tools", label: "本地工具" },
  { to: "/ai", label: "AI 客户端" },
];

export function AppShell(): React.JSX.Element {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside
        className={cn(
          "flex flex-col gap-1 border-r bg-muted/30 p-4 transition-all",
          sidebarOpen ? "w-56" : "w-16",
        )}
      >
        <h1 className="mb-4 text-lg font-semibold">
          {sidebarOpen ? "Tauri 模板" : "T"}
        </h1>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "rounded px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )
            }
          >
            {sidebarOpen ? item.label : item.label.slice(0, 1)}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
