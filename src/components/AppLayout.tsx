import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const AppLayout = () => {
  useTenantBranding();

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
