import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const AppLayout = () => {
  // Load and apply tenant branding (CSS variables)
  useTenantBranding();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
