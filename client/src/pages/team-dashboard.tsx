import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiCardSkeleton } from "@/components/kpi-card";
import { StatsOverview, StatsOverviewSkeleton } from "@/components/stats-overview";
import { SeverityChart, SeverityChartSkeleton } from "@/components/severity-chart";
import { TrendChart, TrendChartSkeleton } from "@/components/trend-chart";
import { BarChartCard, BarChartSkeleton } from "@/components/bar-chart";
import { TeamHeader, getTeamConfig } from "@/components/team-header";
import { MonthlyComparison, MonthlyComparisonSkeleton } from "@/components/monthly-comparison";
import { SimulationComparison } from "@/components/simulation-comparison";
import { QuarterlyAssessmentDashboard } from "@/components/quarterly-assessment-dashboard";
import { AdminSectionWrapper } from "@/components/admin-section-wrapper";
import { useSectionSettings } from "@/hooks/use-section-settings";
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
  const sectionSettings = useSectionSettings(team);

  const config = getTeamConfig(team);

  const kpiMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { value: number; target: number | null; trend: string } }) => {
      await apiRequest("PATCH", `/api/kpis/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
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

  const MONTH_ORDER: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  const barChartData = Object.values(monthlyData)
    .sort((a, b) => (MONTH_ORDER[a.name] || 0) - (MONTH_ORDER[b.name] || 0))
    .slice(-3);

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

  const defaultTitles: Record<string, string> = {
    key_metrics: "Key Metrics",
    security_overview: `${config.name} Overview`,
    quarterly_assessments: "Quarterly Assessments",
    monthly_comparison: "Monthly Comparison",
    simulations: "BAS Simulations",
    severity_distribution: `${config.name} Severity Distribution`,
    monthly_findings: "Monthly Findings Trend",
    metrics_over_time: `${config.name} Metrics Over Time`,
    additional_metrics: "Additional Metrics",
  };

  return (
    <div className="space-y-6">
      <TeamHeader 
        team={team} 
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
      />

      <AdminSectionWrapper
        sectionKey="key_metrics"
        defaultTitle={defaultTitles.key_metrics}
        customTitle={sectionSettings.titles.key_metrics}
        visible={sectionSettings.isVisible("key_metrics")}
        isAdmin={isAdmin}
        onToggleVisibility={sectionSettings.toggleVisibility}
        onUpdateTitle={sectionSettings.updateTitle}
        showTitle
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)
          ) : (
            renderKpiCards(data?.kpis.slice(0, 4) || [])
          )}
        </div>
      </AdminSectionWrapper>

      <AdminSectionWrapper
        sectionKey="security_overview"
        defaultTitle={defaultTitles.security_overview}
        customTitle={sectionSettings.titles.security_overview}
        visible={sectionSettings.isVisible("security_overview")}
        isAdmin={isAdmin}
        onToggleVisibility={sectionSettings.toggleVisibility}
        onUpdateTitle={sectionSettings.updateTitle}
        showTitle
      >
        {isLoading ? (
          <StatsOverviewSkeleton />
        ) : data?.stats ? (
          <StatsOverview 
            stats={data.stats} 
            team={team}
            teamName={config.name}
            teamColor={config.bgColor}
            isAdmin={isAdmin}
            onSave={(updates) => statsMutation.mutate({ id: data.stats.id, updates })}
            isSaving={statsMutation.isPending}
          />
        ) : null}
      </AdminSectionWrapper>

      {team === "offensive" && (
        <AdminSectionWrapper
          sectionKey="quarterly_assessments"
          defaultTitle={defaultTitles.quarterly_assessments}
          customTitle={sectionSettings.titles.quarterly_assessments}
          visible={sectionSettings.isVisible("quarterly_assessments")}
          isAdmin={isAdmin}
          onToggleVisibility={sectionSettings.toggleVisibility}
          onUpdateTitle={sectionSettings.updateTitle}
          showTitle
        >
          <QuarterlyAssessmentDashboard isAdmin={isAdmin} />
        </AdminSectionWrapper>
      )}

      {(team === "application" || team === "infrastructure" || team === "cti") && (
        <AdminSectionWrapper
          sectionKey="monthly_comparison"
          defaultTitle={defaultTitles.monthly_comparison}
          customTitle={sectionSettings.titles.monthly_comparison}
          visible={sectionSettings.isVisible("monthly_comparison")}
          isAdmin={isAdmin}
          onToggleVisibility={sectionSettings.toggleVisibility}
          onUpdateTitle={sectionSettings.updateTitle}
          showTitle
        >
          {isLoading ? (
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
          ) : null}
        </AdminSectionWrapper>
      )}

      {team === "bas" && (
        <AdminSectionWrapper
          sectionKey="simulations"
          defaultTitle={defaultTitles.simulations}
          customTitle={sectionSettings.titles.simulations}
          visible={sectionSettings.isVisible("simulations")}
          isAdmin={isAdmin}
          onToggleVisibility={sectionSettings.toggleVisibility}
          onUpdateTitle={sectionSettings.updateTitle}
          showTitle
        >
          <SimulationComparison />
        </AdminSectionWrapper>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <AdminSectionWrapper
          sectionKey="severity_distribution"
          defaultTitle={defaultTitles.severity_distribution}
          customTitle={sectionSettings.titles.severity_distribution}
          visible={sectionSettings.isVisible("severity_distribution")}
          isAdmin={isAdmin}
          onToggleVisibility={sectionSettings.toggleVisibility}
          onUpdateTitle={sectionSettings.updateTitle}
          showTitle
        >
          {isLoading ? (
            <SeverityChartSkeleton />
          ) : (
            <SeverityChart 
              data={data?.vulnerabilities || []} 
              title={sectionSettings.getTitle("severity_distribution", `${config.name} Severity Distribution`)}
            />
          )}
        </AdminSectionWrapper>

        <AdminSectionWrapper
          sectionKey="monthly_findings"
          defaultTitle={defaultTitles.monthly_findings}
          customTitle={sectionSettings.titles.monthly_findings}
          visible={sectionSettings.isVisible("monthly_findings")}
          isAdmin={isAdmin}
          onToggleVisibility={sectionSettings.toggleVisibility}
          onUpdateTitle={sectionSettings.updateTitle}
          showTitle
        >
          {isLoading ? (
            <BarChartSkeleton />
          ) : (
            <BarChartCard
              title={sectionSettings.getTitle("monthly_findings", "Monthly Findings Trend")}
              data={barChartData}
              bars={[
                { dataKey: "found", color: "hsl(0 84% 42%)", name: "Found" },
                { dataKey: "resolved", color: "hsl(142 76% 36%)", name: "Resolved" },
              ]}
            />
          )}
        </AdminSectionWrapper>
      </div>

      {(team === "application" || team === "infrastructure") && (
        <AdminSectionWrapper
          sectionKey="metrics_over_time"
          defaultTitle={defaultTitles.metrics_over_time}
          customTitle={sectionSettings.titles.metrics_over_time}
          visible={sectionSettings.isVisible("metrics_over_time")}
          isAdmin={isAdmin}
          onToggleVisibility={sectionSettings.toggleVisibility}
          onUpdateTitle={sectionSettings.updateTitle}
          showTitle
        >
          {isLoading ? (
            <TrendChartSkeleton />
          ) : data?.trends && data.trends.length > 0 ? (
            <TrendChart 
              data={data.trends}
              title={sectionSettings.getTitle("metrics_over_time", `${config.name} Metrics Over Time`)}
            />
          ) : null}
        </AdminSectionWrapper>
      )}

      {data?.kpis && data.kpis.length > 4 && (
        <AdminSectionWrapper
          sectionKey="additional_metrics"
          defaultTitle={defaultTitles.additional_metrics}
          customTitle={sectionSettings.titles.additional_metrics}
          visible={sectionSettings.isVisible("additional_metrics")}
          isAdmin={isAdmin}
          onToggleVisibility={sectionSettings.toggleVisibility}
          onUpdateTitle={sectionSettings.updateTitle}
          showTitle
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderKpiCards(data.kpis.slice(4))}
          </div>
        </AdminSectionWrapper>
      )}
    </div>
  );
}
