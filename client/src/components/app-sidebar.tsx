import { useLocation, Link } from "wouter";
import { 
  Shield, 
  Server, 
  Swords, 
  Eye, 
  Target, 
  LayoutDashboard,
  TrendingUp,
  Settings,
  FileText
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const teamItems = [
  {
    title: "Overview",
    url: "/",
    icon: LayoutDashboard,
    description: "Executive summary",
  },
  {
    title: "Application Security",
    url: "/application",
    icon: Shield,
    description: "AppSec metrics",
    badge: "App",
  },
  {
    title: "Infrastructure",
    url: "/infrastructure",
    icon: Server,
    description: "Infra vulnerabilities",
    badge: "Infra",
  },
  {
    title: "Offensive Security",
    url: "/offensive",
    icon: Swords,
    description: "Pentest & Red Team",
    badge: "Offensive",
  },
  {
    title: "Threat Intelligence",
    url: "/cti",
    icon: Eye,
    description: "CTI feeds & analysis",
    badge: "CTI",
  },
  {
    title: "BAS Simulations",
    url: "/bas",
    icon: Target,
    description: "Attack simulations",
    badge: "BAS",
  },
];

const managementItems = [
  {
    title: "Monthly Report",
    url: "/report",
    icon: FileText,
    description: "Generate client reports",
  },
  {
    title: "Admin Settings",
    url: "/admin",
    icon: Settings,
    description: "Manage KPIs & data",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-3 hover-elevate rounded-md p-2 -m-2 cursor-pointer" data-testid="link-home">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold">IVM Dashboard</span>
              <span className="text-xs text-muted-foreground">Vulnerability Management</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
            Teams
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teamItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.description}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.url.replace("/", "") || "overview"}`}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.description}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.url.replace("/", "") || "overview"}`}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          Last sync: {new Date().toLocaleDateString()}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
