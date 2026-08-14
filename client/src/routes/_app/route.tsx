import { AppSidebar } from "#/components/app-sidebar";
import { SiteHeader } from "#/components/site-header";
import {
  SidebarInset, SidebarProvider
} from "#/components/ui/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ApiError, apiClient, getDefaultToken, setAuthToken } from "#/lib/common/api";
import { authQueryKey, authQueryStaleTime } from "#/lib/auth-context";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") {
      return;
    }

    if (!getDefaultToken()) {
      throw redirect({ to: "/login" });
    }

    try {
      const isAuthenticated = await context.queryClient.fetchQuery({
        queryKey: authQueryKey,
        queryFn: () => apiClient.get<boolean>("/users/is-authenticated"),
        staleTime: authQueryStaleTime,
      });

      if (!isAuthenticated) {
        setAuthToken(null);
        throw redirect({ to: "/login" });
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setAuthToken(null);
        throw redirect({ to: "/login" });
      }

      throw error;
    }
  },
  component: RouteComponent,
});
function RouteComponent() {

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
