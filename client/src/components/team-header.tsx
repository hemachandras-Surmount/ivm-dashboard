import type { ElementType } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Server, 
  Swords, 
  Eye, 
  Target,
  RefreshCw,
  Lock,
  LockOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Team } from "@shared/schema";

interface TeamHeaderProps {
  team: Team;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

const TEAM_CONFIG: Record<Team, {
  name: string;
  description: string;
  icon: ElementType;
  color: string;
  bgColor: string;
}> = {
  application: {
    name: "Application Security",
    description: "SAST, DAST, SCA, and secure code review metrics",
    icon: Shield,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  infrastructure: {
    name: "Infrastructure Security",
    description: "Network, cloud, and endpoint vulnerability metrics",
    icon: Server,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  offensive: {
    name: "Offensive Security",
    description: "Penetration testing and red team engagement metrics",
    icon: Swords,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  cti: {
    name: "Cyber Threat Intelligence",
    description: "Threat feeds, IOCs, and intelligence analysis metrics",
    icon: Eye,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  bas: {
    name: "BAS Simulations",
    description: "Breach and attack simulation coverage and detection metrics",
    icon: Target,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
};

export function TeamHeader({ team, onRefresh, isRefreshing, isAdmin, onToggleAdmin }: TeamHeaderProps) {
  const config = TEAM_CONFIG[team];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${config.bgColor}`}>
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid={`text-team-title-${team}`}>
            {config.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {isAdmin && (
          <Badge variant="destructive" className="text-xs">
            Admin Mode
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          Last updated: {new Date().toLocaleDateString()}
        </Badge>
        {onToggleAdmin && (
          <Button
            variant={isAdmin ? "default" : "outline"}
            size="sm"
            onClick={onToggleAdmin}
            data-testid="button-toggle-admin"
          >
            {isAdmin ? <LockOpen className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            {isAdmin ? "Exit Admin" : "Admin Mode"}
          </Button>
        )}
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}

export function getTeamColor(team: Team): string {
  return TEAM_CONFIG[team].bgColor;
}

export function getTeamConfig(team: Team) {
  return TEAM_CONFIG[team];
}
