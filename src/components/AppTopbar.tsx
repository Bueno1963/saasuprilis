import { Link, useLocation } from "react-router-dom";
import { navItems, NavItem } from "@/lib/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const AppTopbar = () => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isRouteAllowed } = useRolePermissions();
  const { branding } = useTenantBranding();

  const filteredItems = useMemo(
    () => navItems.filter(n => isRouteAllowed(n.href)),
    [isRouteAllowed]
  );

  const isActive = (item: NavItem) =>
    location.pathname === item.href || item.children?.some(c => location.pathname === c.href);

  return (
    <header className="h-12 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center px-4 shrink-0 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-6 shrink-0">
        {branding?.logo_url && (
          <img src={branding.logo_url} alt={branding.name} className="h-7 w-7 object-contain" />
        )}
        <span className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground truncate max-w-[120px]">
          {branding?.name || "LIS"}
        </span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        {filteredItems.map(item => (
          item.children && item.children.length > 0 ? (
            <TopbarDropdown key={item.href} item={item} active={isActive(item)} pathname={location.pathname} />
          ) : (
            <TopbarLink key={item.href} item={item} active={location.pathname === item.href} />
          )
        ))}
      </nav>

      {/* User */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        {profile && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-sidebar-accent-foreground" />
            </div>
            <div className="hidden lg:block">
              <p className="text-[11px] font-medium text-sidebar-accent-foreground leading-tight truncate max-w-[100px]">
                {profile.full_name || "Usuário"}
              </p>
              <p className="text-[9px] text-sidebar-muted leading-tight">{profile.role_display}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors p-1.5 rounded-md hover:bg-sidebar-accent"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

const TopbarLink = ({ item, active }: { item: NavItem; active: boolean }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
        active
          ? "bg-sidebar-primary/20 text-sidebar-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{item.title}</span>
    </Link>
  );
};

const TopbarDropdown = ({ item, active, pathname }: { item: NavItem; active: boolean; pathname: string }) => {
  const Icon = item.icon;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
          active
            ? "bg-sidebar-primary/20 text-sidebar-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{item.title}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-sidebar border border-sidebar-border rounded-lg shadow-lg py-1 z-50">
          <Link
            to={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs transition-colors",
              pathname === item.href
                ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {item.title}
          </Link>
          <div className="h-px bg-sidebar-border mx-2 my-1" />
          {item.children?.map(child => {
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                to={child.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs transition-colors",
                  pathname === child.href
                    ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <ChildIcon className="w-3.5 h-3.5" />
                {child.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppTopbar;
