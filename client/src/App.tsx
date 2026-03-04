import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Overview from "@/pages/overview";
import TeamDashboard from "@/pages/team-dashboard";
import Admin from "@/pages/admin";
import Report from "@/pages/report";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/application">
        {() => <TeamDashboard team="application" />}
      </Route>
      <Route path="/infrastructure">
        {() => <TeamDashboard team="infrastructure" />}
      </Route>
      <Route path="/offensive">
        {() => <TeamDashboard team="offensive" />}
      </Route>
      <Route path="/cti">
        {() => <TeamDashboard team="cti" />}
      </Route>
      <Route path="/bas">
        {() => <TeamDashboard team="bas" />}
      </Route>
      <Route path="/admin" component={Admin} />
      <Route path="/report" component={Report} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
