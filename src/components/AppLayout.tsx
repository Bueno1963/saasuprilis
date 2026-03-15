import { Outlet } from "react-router-dom";
import AppTopbar from "./AppTopbar";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const AppLayout = () => {
  useTenantBranding();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
