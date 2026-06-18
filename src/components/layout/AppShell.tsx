/** 应用整体布局：左侧导航 + 主内容区 */
import { NavLink, Outlet } from "react-router-dom";
import { CalendarClock, LayoutDashboard, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/schedules", label: "Schedules", icon: CalendarClock },
  { to: "/logs", label: "Logs", icon: ScrollText },
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
          {sidebarOpen ? "coding-agent-preheat" : "cap"}
        </h1>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )
            }
          >
            <item.icon size={16} />
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
