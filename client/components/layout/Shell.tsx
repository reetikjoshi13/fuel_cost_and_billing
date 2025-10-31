import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity,
  CheckSquare,
  Fuel,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { useMemo } from "react";

export default function Shell() {
  const { pathname } = useLocation();
  const title = useMemo(() => {
    if (pathname.startsWith("/approvals")) return "Approvals";
    return "Dashboard";
  }, [pathname]);

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Fuel className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">Team 3</span>
              <span className="text-xs text-muted-foreground">
                Fuel, Costs & Billing
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/"}>
                    <NavLink to="/">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/approvals")}
                  >
                    <NavLink to="/approvals">
                      <CheckSquare />
                      <span>Approvals</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Health</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2">
                <div className="flex items-center gap-2 rounded-md bg-accent p-2 text-accent-foreground">
                  <Activity className="h-4 w-4 text-brand-amber" />
                  <div className="text-xs">
                    <div className="font-medium">Alerts</div>
                    <div className="text-muted-foreground">
                      Mileage drops auto-detected
                    </div>
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="px-2 text-xs text-muted-foreground">
            “Every rupee justified, every drop accountable.”
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-6" />
            <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-64"
                  placeholder="Search buses, drivers, vendors"
                />
              </div>
              <Badge
                variant="secondary"
                className={cn("hidden sm:inline-flex")}
              >
                Beta
              </Badge>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex"
              >
                <Link to="/approvals">Open Approvals</Link>
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
