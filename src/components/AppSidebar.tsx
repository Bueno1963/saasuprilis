import { Link, useLocation } from "react-router-dom";
import { navItems, NavItem } from "@/lib/navigation";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const AppSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const { profile, signOut } = useAuth();
  const { role } = useUserRole();

  const filteredItems = useMemo(
    () => navItems.filter(n => !n.allowedRoles || n.allowedRoles.includes(role)),
    [role]
  );

  const toggleMenu = (href: string) => {
    setOpenMenus(prev => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      return next;
    });
  };

  const phases = [
    { label: "Pré-Analítica", items: filteredItems.filter(n => n.phase === "pre") },
    { label: "Analítica", items: filteredItems.filter(n => n.phase === "analytical") },
    { label: "Pós-Analítica", items: filteredItems.filter(n => n.phase === "post") },
  ];

  const otherItems = filteredItems.filter(n => !n.phase && n.href !== "/");
  const dashboardItem = filteredItems.find(n => n.href === "/");

  const isActive = (item: NavItem) =>
    location.pathname === item.href || item.children?.some(c => location.pathname === c.href);

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
        {dashboardItem && <SidebarLink item={dashboardItem} active={location.pathname === "/"} collapsed={collapsed} />}

        <div className="pt-2" />

        {phases.map(phase => (
          <div key={phase.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted px-3 pt-4 pb-1">
                {phase.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-sidebar-border mx-2 my-2" />}
            {phase.items.map(item =>
              item.children && item.children.length > 0 ? (
                <SidebarGroup
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  open={openMenus.has(item.href) || !!item.children.some(c => location.pathname === c.href)}
                  onToggle={() => toggleMenu(item.href)}
                  pathname={location.pathname}
                />
              ) : (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={location.pathname === item.href}
                  collapsed={collapsed}
                />
              )
            )}
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

      {/* User info + collapse */}
      <div className="border-t border-sidebar-border">
        {profile && !collapsed && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{profile.full_name || "Usuário"}</p>
              <p className="text-[10px] text-sidebar-muted">{profile.role_display}</p>
            </div>
            <button onClick={signOut} className="text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-3">
            <button onClick={signOut} className="text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-10 w-full flex items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

const SidebarGroup = ({
  item,
  collapsed,
  open,
  onToggle,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  pathname: string;
}) => {
  const Icon = item.icon;
  const isParentActive = pathname === item.href;

  return (
    <div>
      <div className="flex items-center">
        <Link
          to={item.href}
          className={cn(
            "flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            isParentActive
              ? "bg-sidebar-accent text-sidebar-primary font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? item.title : undefined}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="flex-1">{item.title}</span>}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      {!collapsed && open && item.children && (
        <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5 mt-0.5">
          {item.children.map(child => (
            <SidebarLink key={child.href} item={child} active={pathname === child.href} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  );
};

const SidebarLink = ({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
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
