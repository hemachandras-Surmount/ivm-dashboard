import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiCardSkeleton } from "@/components/kpi-card";
import { StatsOverview, StatsOverviewSkeleton } from "@/components/stats-overview";
import { SeverityChart, SeverityChartSkeleton } from "@/components/severity-chart";
import { TrendChart, TrendChartSkeleton } from "@/components/trend-chart";
import { BarChartCard, BarChartSkeleton } from "@/components/bar-chart";
import { TeamHeader, getTeamConfig } from "@/components/team-header";
import { AssessmentComparison } from "@/components/assessment-comparison";
import { MonthlyComparison, MonthlyComparisonSkeleton } from "@/components/monthly-comparison";
import { SimulationComparison } from "@/components/simulation-comparison";
import { AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, TeamStats, Vulnerability, TrendData, KpiMetric } from "@shared/schema";

interface TeamData {
  stats: TeamStats;
  vulnerabilities: Vulnerability[];
  trends: TrendData[];
  kpis: KpiMetric[];
}

interface TeamDashboardProps {
  team: Team;
}

export default function TeamDashboard({ team }: TeamDashboardProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const { data, isLoading, error, refetch, isFetching } = useQuery<TeamData>({
    queryKey: ["/api/teams", team],
  });
  const { toast } = useToast();

  const config = getTeamConfig(team);

  const kpiMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { value: number; target: number | null; trend: string } }) => {
      await apiRequest("PATCH", `/api/kpis/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
      toast({ title: "KPI updated", description: "The KPI has been saved and charts refreshed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving KPI", description: err.message, variant: "destructive" });
    },
  });

  const statsMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TeamStats> }) => {
      await apiRequest("PATCH", `/api/team-stats/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-stats"] });
      toast({ title: "Stats updated", description: "Team statistics saved and charts refreshed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving stats", description: err.message, variant: "destructive" });
    },
  });

  const vulnMutation = useMutation({
    mutationFn: async (batch: Array<{ id: string; updates: { count: number; resolvedCount: number } }>) => {
      await Promise.all(batch.map(({ id, updates }) => apiRequest("PATCH", `/api/vulnerabilities/${id}`, updates)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vulnerabilities"] });
      toast({ title: "Vulnerabilities updated", description: "Monthly data saved and charts refreshed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving vulnerabilities", description: err.message, variant: "destructive" });
    },
  });

  const trendMutation = useMutation({
    mutationFn: async (batch: Array<{ id: string; updates: { value: number } }>) => {
      await Promise.all(batch.map(({ id, updates }) => apiRequest("PATCH", `/api/trends/${id}`, updates)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trends"] });
      toast({ title: "Metrics updated", description: "Trend data saved and charts refreshed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving trends", description: err.message, variant: "destructive" });
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="text-sm text-muted-foreground">
              Unable to fetch {config.name} data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyData = data?.vulnerabilities.reduce((acc, v) => {
    const key = v.month;
    if (!acc[key]) {
      acc[key] = { name: key, found: 0, resolved: 0 };
    }
    acc[key].found += v.count;
    acc[key].resolved += v.resolvedCount;
    return acc;
  }, {} as Record<string, { name: string; found: number; resolved: number }>) || {};

  const barChartData = Object.values(monthlyData).slice(-6);

  const renderKpiCards = (kpis: KpiMetric[]) => (
    kpis.map((kpi) => (
      <KpiCard
        key={kpi.id}
        id={kpi.id}
        title={kpi.name}
        value={kpi.value}
        previousValue={kpi.previousValue || undefined}
        unit={kpi.unit || ""}
        trend={kpi.trend || "stable"}
        target={kpi.target || undefined}
        description={kpi.description || undefined}
        isAdmin={isAdmin}
        onSave={(updates) => kpiMutation.mutate({ id: kpi.id, updates })}
        isSaving={kpiMutation.isPending}
      />
    ))
  );

  return (
    <div className="space-y-6">
      <TeamHeader 
        team={team} 
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          renderKpiCards(data?.kpis.slice(0, 4) || [])
        )}
      </div>

      {isLoading ? (
        <StatsOverviewSkeleton />
      ) : data?.stats ? (
        <StatsOverview 
          stats={data.stats} 
          teamName={config.name}
          teamColor={config.bgColor}
          isAdmin={isAdmin}
          onSave={(updates) => statsMutation.mutate({ id: data.stats.id, updates })}
          isSaving={statsMutation.isPending}
        />
      ) : null}

      {team === "offensive" && (
        <AssessmentComparison />
      )}

      {(team === "application" || team === "infrastructure" || team === "cti") && (
        isLoading ? (
          <MonthlyComparisonSkeleton />
        ) : data?.vulnerabilities && data?.trends ? (
          <MonthlyComparison 
            team={team}
            vulnerabilities={data.vulnerabilities}
            trends={data.trends}
            isAdmin={isAdmin}
            onSaveVulnerabilities={(batch) => vulnMutation.mutateAsync(batch)}
            onSaveTrends={(batch) => trendMutation.mutateAsync(batch)}
            isSaving={vulnMutation.isPending || trendMutation.isPending}
          />
        ) : null
      )}

      {team === "bas" && (
        <SimulationComparison />
      )}

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
              title={`${config.name} Severity Distribution`}
            />
            <BarChartCard
              title="Monthly Findings Trend"
              data={barChartData}
              bars={[
                { dataKey: "found", color: "hsl(0 84% 42%)", name: "Found" },
                { dataKey: "resolved", color: "hsl(142 76% 36%)", name: "Resolved" },
              ]}
            />
          </>
        )}
      </div>

      {isLoading ? (
        <TrendChartSkeleton />
      ) : data?.trends && data.trends.length > 0 ? (
        <TrendChart 
          data={data.trends}
          title={`${config.name} Metrics Over Time`}
        />
      ) : null}

      {data?.kpis && data.kpis.length > 4 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderKpiCards(data.kpis.slice(4))}
        </div>
      )}
    </div>
  );
}
