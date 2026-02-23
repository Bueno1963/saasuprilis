import { Link, useLocation } from "react-router-dom";
import { navItems } from "@/lib/navigation";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const AppSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const phases = [
    { label: "Pré-Analítica", items: navItems.filter(n => n.phase === "pre") },
    { label: "Analítica", items: navItems.filter(n => n.phase === "analytical") },
    { label: "Pós-Analítica", items: navItems.filter(n => n.phase === "post") },
  ];

  const otherItems = navItems.filter(n => !n.phase && n.href !== "/");
  const dashboardItem = navItems.find(n => n.href === "/")!;

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-wide">LabFlow</h1>
            <p className="text-[10px] text-sidebar-muted uppercase tracking-widest">LIS System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <SidebarLink item={dashboardItem} active={location.pathname === "/"} collapsed={collapsed} />

        <div className="pt-2" />

        {phases.map(phase => (
          <div key={phase.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted px-3 pt-4 pb-1">
                {phase.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-sidebar-border mx-2 my-2" />}
            {phase.items.map(item => (
              <SidebarLink
                key={item.href}
                item={item}
                active={location.pathname === item.href}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}

        {otherItems.length > 0 && (
          <>
            {!collapsed && <div className="h-px bg-sidebar-border mx-2 my-3" />}
            {collapsed && <div className="h-px bg-sidebar-border mx-2 my-2" />}
            {otherItems.map(item => (
              <SidebarLink
                key={item.href}
                item={item}
                active={location.pathname === item.href}
                collapsed={collapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-10 flex items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

const SidebarLink = ({
  item,
  active,
  collapsed,
}: {
  item: (typeof navItems)[0];
  active: boolean;
  collapsed: boolean;
}) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-primary font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.title : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );
};

export default AppSidebar;
