import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard, KpiCardSkeleton } from "@/components/kpi-card";
import { SeverityChart, SeverityChartSkeleton } from "@/components/severity-chart";
import { BarChartCard, BarChartSkeleton } from "@/components/bar-chart";
import { 
  Shield, 
  Server, 
  Swords, 
  Eye, 
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown
} from "lucide-react";
import { Link } from "wouter";
import type { TeamStats, Vulnerability, KpiMetric } from "@shared/schema";

interface DashboardData {
  stats: TeamStats[];
  vulnerabilities: Vulnerability[];
  kpis: KpiMetric[];
}

export default function Overview() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Unable to fetch dashboard data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalOpenFindings = data?.stats.reduce((sum, s) => sum + s.openFindings, 0) || 0;
  const totalClosedFindings = data?.stats.reduce((sum, s) => sum + s.closedFindings, 0) || 0;
  const avgMttr = data?.stats.length 
    ? data.stats.reduce((sum, s) => sum + (s.mttr || 0), 0) / data.stats.length 
    : 0;
  const avgRiskScore = data?.stats.length
    ? data.stats.reduce((sum, s) => sum + (s.riskScore || 0), 0) / data.stats.length
    : 0;

  const teamSummaryData = data?.stats.map((s) => ({
    name: s.team.charAt(0).toUpperCase() + s.team.slice(1),
    open: s.openFindings,
    closed: s.closedFindings,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Vulnerability Management Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Executive overview of security posture across all teams
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Open Findings"
              value={totalOpenFindings}
              trend={totalOpenFindings > 500 ? "up" : "down"}
              icon={<AlertTriangle className="h-4 w-4" />}
              description="Active vulnerabilities requiring remediation"
            />
            <KpiCard
              title="Closed This Month"
              value={totalClosedFindings}
              trend="up"
              icon={<CheckCircle2 className="h-4 w-4" />}
              description="Successfully remediated vulnerabilities"
            />
            <KpiCard
              title="Avg. MTTR"
              value={avgMttr.toFixed(1)}
              unit="days"
              trend={avgMttr < 15 ? "down" : "up"}
              target={10}
              icon={<Clock className="h-4 w-4" />}
              description="Mean time to remediate across all teams"
            />
            <KpiCard
              title="Risk Score"
              value={avgRiskScore.toFixed(1)}
              unit="/ 10"
              trend={avgRiskScore < 5 ? "down" : "stable"}
              icon={<TrendingDown className="h-4 w-4" />}
              description="Organization-wide security risk level"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <>
            <SeverityChartSkeleton />
            <BarChartSkeleton />
          </>
        ) : (
          <>
            <SeverityChart 
              data={data?.vulnerabilities || []} 
              title="Overall Vulnerability Distribution"
            />
            <BarChartCard
              title="Findings by Team"
              data={teamSummaryData}
              bars={[
                { dataKey: "open", color: "hsl(0 84% 42%)", name: "Open" },
                { dataKey: "closed", color: "hsl(142 76% 36%)", name: "Closed" },
              ]}
            />
          </>
        )}
      </div>

      <Card data-testid="card-team-summary">
        <CardHeader>
          <CardTitle>Team Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {data?.stats.map((team) => (
                <TeamSummaryRow key={team.id} stats={team} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TeamSummaryRowProps {
  stats: TeamStats;
}

const TEAM_ICONS: Record<string, React.ElementType> = {
  application: Shield,
  infrastructure: Server,
  offensive: Swords,
  cti: Eye,
  bas: Target,
};

const TEAM_ROUTES: Record<string, string> = {
  application: "/application",
  infrastructure: "/infrastructure",
  offensive: "/offensive",
  cti: "/cti",
  bas: "/bas",
};

const TEAM_NAMES: Record<string, string> = {
  application: "Application Security",
  infrastructure: "Infrastructure",
  offensive: "Offensive Security",
  cti: "Threat Intelligence",
  bas: "BAS Simulations",
};

function TeamSummaryRow({ stats }: TeamSummaryRowProps) {
  const Icon = TEAM_ICONS[stats.team] || Shield;
  const route = TEAM_ROUTES[stats.team] || "/";
  const name = TEAM_NAMES[stats.team] || stats.team;
  const resolutionRate = (stats.openFindings + stats.closedFindings) > 0
    ? (stats.closedFindings / (stats.openFindings + stats.closedFindings)) * 100
    : 0;

  return (
    <Link href={route}>
      <div 
        className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
        data-testid={`row-team-${stats.team}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {stats.totalAssets} assets | {stats.assessedAssets} assessed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-medium">{stats.openFindings} open</p>
            <p className="text-xs text-muted-foreground">{stats.closedFindings} closed</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{stats.mttr?.toFixed(1) || 0}d MTTR</p>
            <p className="text-xs text-muted-foreground">{stats.coverage?.toFixed(0) || 0}% coverage</p>
          </div>
          <Badge 
            variant={resolutionRate >= 70 ? "default" : resolutionRate >= 50 ? "secondary" : "destructive"}
          >
            {resolutionRate.toFixed(0)}% resolved
          </Badge>
        </div>
      </div>
    </Link>
  );
}
