import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Minus, Calendar, Pencil, Check, X } from "lucide-react";
import type { Team, Vulnerability, TrendData } from "@shared/schema";

interface MonthlyComparisonProps {
  team: Team;
  vulnerabilities: Vulnerability[];
  trends: TrendData[];
  isAdmin?: boolean;
  onSaveVulnerabilities?: (batch: Array<{ id: string; updates: { count: number; resolvedCount: number } }>) => Promise<void> | void;
  onSaveTrends?: (batch: Array<{ id: string; updates: { value: number } }>) => Promise<void> | void;
  isSaving?: boolean;
}

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getLastThreeMonthsFromData(vulnerabilities: Vulnerability[]): string[] {
  const monthSet = new Set<string>();
  vulnerabilities.forEach(v => monthSet.add(v.month));
  
  const sortedMonths = Array.from(monthSet).sort((a, b) => {
    const aIdx = MONTH_ORDER.indexOf(a);
    const bIdx = MONTH_ORDER.indexOf(b);
    return aIdx - bIdx;
  });
  
  return sortedMonths.slice(-3);
}

export function MonthlyComparison({ team, vulnerabilities, trends, isAdmin = false, onSaveVulnerabilities, onSaveTrends, isSaving = false }: MonthlyComparisonProps) {
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [vulnEdits, setVulnEdits] = useState<Record<string, { count: string; resolvedCount: string }>>({});
  const [trendEdits, setTrendEdits] = useState<Record<string, string>>({});

  const lastThreeMonths = getLastThreeMonthsFromData(vulnerabilities);
  
  if (lastThreeMonths.length < 3) {
    return null;
  }
  
  const monthlyVulnData = lastThreeMonths.map(month => {
    const monthVulns = vulnerabilities.filter(v => v.month === month);
    const total = monthVulns.reduce((sum, v) => sum + v.count, 0);
    const resolved = monthVulns.reduce((sum, v) => sum + v.resolvedCount, 0);
    const critical = monthVulns.filter(v => v.severity === "critical").reduce((sum, v) => sum + v.count, 0);
    const high = monthVulns.filter(v => v.severity === "high").reduce((sum, v) => sum + v.count, 0);
    return { month, total, resolved, open: total - resolved, critical, high, vulns: monthVulns };
  });

  const monthlyTrendData = lastThreeMonths.map(month => {
    const monthTrends = trends.filter(t => t.date === month);
    const riskScore = monthTrends.find(t => t.metricName === "Risk Score");
    const coverage = monthTrends.find(t => t.metricName === "Coverage");
    const mttr = monthTrends.find(t => t.metricName === "MTTR");
    const compliance = monthTrends.find(t => t.metricName === "Compliance");
    return { 
      month, 
      riskScore: riskScore?.value || 0,
      coverage: coverage?.value || 0,
      mttr: mttr?.value || 0,
      compliance: compliance?.value || 0,
      riskScoreId: riskScore?.id,
      coverageId: coverage?.id,
      mttrId: mttr?.id,
      complianceId: compliance?.id,
    };
  });

  const current = monthlyVulnData[2];
  const previous = monthlyVulnData[1];
  const twoMonthsAgo = monthlyVulnData[0];

  const currentTrend = monthlyTrendData[2];
  const previousTrend = monthlyTrendData[1];

  const handleStartEditMonth = (month: string) => {
    const monthVulns = vulnerabilities.filter(v => v.month === month);
    const edits: Record<string, { count: string; resolvedCount: string }> = {};
    monthVulns.forEach(v => {
      edits[v.id] = { count: String(v.count), resolvedCount: String(v.resolvedCount) };
    });
    setVulnEdits(edits);
    setEditingMonth(month);
  };

  const handleSaveMonth = async () => {
    if (onSaveVulnerabilities) {
      const batch = Object.entries(vulnEdits).map(([id, updates]) => ({
        id,
        updates: {
          count: parseInt(updates.count) || 0,
          resolvedCount: parseInt(updates.resolvedCount) || 0,
        },
      }));
      await onSaveVulnerabilities(batch);
    }
    setEditingMonth(null);
  };

  const handleStartEditMetrics = () => {
    const edits: Record<string, string> = {};
    lastThreeMonths.forEach(month => {
      const td = monthlyTrendData.find(t => t.month === month);
      if (td) {
        if (td.riskScoreId) edits[td.riskScoreId] = String(td.riskScore);
        if (td.coverageId) edits[td.coverageId] = String(td.coverage);
        if (td.mttrId) edits[td.mttrId] = String(td.mttr);
        if (td.complianceId) edits[td.complianceId] = String(td.compliance);
      }
    });
    setTrendEdits(edits);
    setEditingMetrics(true);
  };

  const handleSaveMetrics = async () => {
    if (onSaveTrends) {
      const batch = Object.entries(trendEdits).map(([id, value]) => ({
        id,
        updates: { value: parseFloat(value) || 0 },
      }));
      await onSaveTrends(batch);
    }
    setEditingMetrics(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">3-Month Comparison</CardTitle>
            <CardDescription>
              {twoMonthsAgo.month} vs {previous.month} vs {current.month} (Current)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {monthlyVulnData.map((data, idx) => (
            <MonthCard 
              key={data.month} 
              data={data} 
              trendData={monthlyTrendData[idx]}
              isCurrent={idx === 2}
              previousData={idx > 0 ? monthlyVulnData[idx - 1] : undefined}
              isAdmin={isAdmin}
              isEditing={editingMonth === data.month}
              vulnEdits={vulnEdits}
              onStartEdit={() => handleStartEditMonth(data.month)}
              onSave={handleSaveMonth}
              onCancel={() => setEditingMonth(null)}
              onEditChange={(id, field, value) => {
                setVulnEdits(prev => ({
                  ...prev,
                  [id]: { ...prev[id], [field]: value }
                }));
              }}
              isSaving={isSaving}
            />
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-medium">Key Metric Trends</h4>
            {isAdmin && !editingMetrics && (
              <Button size="icon" variant="ghost" onClick={handleStartEditMetrics} data-testid="button-edit-metrics">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {editingMetrics && (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={handleSaveMetrics} disabled={isSaving} data-testid="button-save-metrics">
                  <Check className="h-4 w-4 text-chart-2" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingMetrics(false)} data-testid="button-cancel-metrics">
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          {editingMetrics ? (
            <div className="space-y-4">
              {lastThreeMonths.map(month => {
                const td = monthlyTrendData.find(t => t.month === month);
                if (!td) return null;
                return (
                  <div key={month} className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-sm font-medium mb-2">{month}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {td.riskScoreId && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Risk Score</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={trendEdits[td.riskScoreId] || ""}
                            onChange={(e) => setTrendEdits(prev => ({ ...prev, [td.riskScoreId!]: e.target.value }))}
                            className="h-8 text-sm"
                            data-testid={`input-risk-score-${month.toLowerCase()}`}
                          />
                        </div>
                      )}
                      {td.coverageId && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Coverage %</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={trendEdits[td.coverageId] || ""}
                            onChange={(e) => setTrendEdits(prev => ({ ...prev, [td.coverageId!]: e.target.value }))}
                            className="h-8 text-sm"
                            data-testid={`input-coverage-${month.toLowerCase()}`}
                          />
                        </div>
                      )}
                      {td.mttrId && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">MTTR (days)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={trendEdits[td.mttrId] || ""}
                            onChange={(e) => setTrendEdits(prev => ({ ...prev, [td.mttrId!]: e.target.value }))}
                            className="h-8 text-sm"
                            data-testid={`input-mttr-${month.toLowerCase()}`}
                          />
                        </div>
                      )}
                      {td.complianceId && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Compliance %</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={trendEdits[td.complianceId] || ""}
                            onChange={(e) => setTrendEdits(prev => ({ ...prev, [td.complianceId!]: e.target.value }))}
                            className="h-8 text-sm"
                            data-testid={`input-compliance-${month.toLowerCase()}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricTrendBox
                label="Risk Score"
                current={currentTrend.riskScore}
                previous={previousTrend.riskScore}
                unit="/10"
                invertTrend
              />
              <MetricTrendBox
                label="Coverage"
                current={currentTrend.coverage}
                previous={previousTrend.coverage}
                unit="%"
              />
              <MetricTrendBox
                label="MTTR"
                current={currentTrend.mttr}
                previous={previousTrend.mttr}
                unit=" days"
                invertTrend
              />
              <MetricTrendBox
                label="Compliance"
                current={currentTrend.compliance}
                previous={previousTrend.compliance}
                unit="%"
              />
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Vulnerability Summary</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-monthly-comparison">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Metric</th>
                  <th className="text-center py-2 px-3 font-medium">{twoMonthsAgo.month}</th>
                  <th className="text-center py-2 px-3 font-medium">{previous.month}</th>
                  <th className="text-center py-2 px-3 font-medium">{current.month}</th>
                  <th className="text-center py-2 px-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow 
                  label="Total Findings" 
                  values={[twoMonthsAgo.total, previous.total, current.total]} 
                  invertTrend
                />
                <ComparisonRow 
                  label="Resolved" 
                  values={[twoMonthsAgo.resolved, previous.resolved, current.resolved]} 
                />
                <ComparisonRow 
                  label="Open" 
                  values={[twoMonthsAgo.open, previous.open, current.open]} 
                  invertTrend
                />
                <ComparisonRow 
                  label="Critical" 
                  values={[twoMonthsAgo.critical, previous.critical, current.critical]} 
                  invertTrend
                  highlight
                />
                <ComparisonRow 
                  label="High" 
                  values={[twoMonthsAgo.high, previous.high, current.high]} 
                  invertTrend
                />
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type MonthlyVulnData = { month: string; total: number; resolved: number; open: number; critical: number; high: number; vulns: Vulnerability[] };

interface MonthCardProps {
  data: MonthlyVulnData;
  trendData: { riskScore: number; coverage: number; mttr: number; compliance: number };
  isCurrent: boolean;
  previousData?: MonthlyVulnData;
  isAdmin?: boolean;
  isEditing?: boolean;
  vulnEdits: Record<string, { count: string; resolvedCount: string }>;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditChange: (id: string, field: "count" | "resolvedCount", value: string) => void;
  isSaving?: boolean;
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

function MonthCard({ data, trendData, isCurrent, previousData, isAdmin, isEditing, vulnEdits, onStartEdit, onSave, onCancel, onEditChange, isSaving }: MonthCardProps) {
  const resolutionRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
  
  if (isEditing) {
    return (
      <div className={`p-4 rounded-lg border ${isCurrent ? "border-primary bg-primary/5" : "bg-muted/30"}`} data-testid={`card-month-edit-${data.month.toLowerCase()}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">{data.month}</span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={onSave} disabled={isSaving} data-testid={`button-save-month-${data.month.toLowerCase()}`}>
              <Check className="h-4 w-4 text-chart-2" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onCancel} data-testid={`button-cancel-month-${data.month.toLowerCase()}`}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {data.vulns.map(v => (
            <div key={v.id} className="space-y-1">
              <label className="text-xs text-muted-foreground">{SEVERITY_LABELS[v.severity] || v.severity}</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground">Found</span>
                  <Input
                    type="number"
                    value={vulnEdits[v.id]?.count || "0"}
                    onChange={(e) => onEditChange(v.id, "count", e.target.value)}
                    className="h-7 text-xs"
                    data-testid={`input-vuln-count-${v.severity}-${data.month.toLowerCase()}`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Resolved</span>
                  <Input
                    type="number"
                    value={vulnEdits[v.id]?.resolvedCount || "0"}
                    onChange={(e) => onEditChange(v.id, "resolvedCount", e.target.value)}
                    className="h-7 text-xs"
                    data-testid={`input-vuln-resolved-${v.severity}-${data.month.toLowerCase()}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${isCurrent ? "border-primary bg-primary/5" : "bg-muted/30"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold">{data.month}</span>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button size="icon" variant="ghost" onClick={onStartEdit} data-testid={`button-edit-month-${data.month.toLowerCase()}`}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {isCurrent && <Badge>Current</Badge>}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Total Findings</span>
          <span className="font-medium">{data.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Resolved</span>
          <span className="font-medium text-chart-2">{data.resolved}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Open</span>
          <span className="font-medium text-destructive">{data.open}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Resolution Rate</span>
          <Badge variant={resolutionRate >= 70 ? "default" : "secondary"}>{resolutionRate}%</Badge>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-xs text-muted-foreground">Critical/High</span>
          <div className="flex gap-1">
            <Badge variant="destructive" className="text-xs">{data.critical}</Badge>
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">{data.high}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTrendBox({ 
  label, 
  current, 
  previous, 
  unit,
  invertTrend = false 
}: { 
  label: string; 
  current: number; 
  previous: number;
  unit: string;
  invertTrend?: boolean;
}) {
  const diff = current - previous;
  const isPositive = diff > 0;
  const isGood = invertTrend ? !isPositive : isPositive;

  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold">{current.toFixed(1)}{unit}</p>
      <div className="flex items-center gap-1 mt-1">
        {diff === 0 ? (
          <Minus className="h-3 w-3 text-muted-foreground" />
        ) : isPositive ? (
          <TrendingUp className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
        ) : (
          <TrendingDown className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
        )}
        <span className={`text-xs ${isGood ? "text-chart-2" : diff === 0 ? "text-muted-foreground" : "text-destructive"}`}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function ComparisonRow({ 
  label, 
  values, 
  invertTrend = false,
  highlight = false
}: { 
  label: string; 
  values: [number, number, number];
  invertTrend?: boolean;
  highlight?: boolean;
}) {
  const [first, second, third] = values;
  const overallDiff = third - first;
  const isPositive = overallDiff > 0;
  const isGood = invertTrend ? !isPositive : isPositive;

  return (
    <tr className="border-b">
      <td className={`py-2 px-3 ${highlight ? "font-medium" : ""}`}>{label}</td>
      <td className="text-center py-2 px-3 text-muted-foreground">{first}</td>
      <td className="text-center py-2 px-3 text-muted-foreground">{second}</td>
      <td className={`text-center py-2 px-3 font-medium ${highlight ? "text-destructive" : ""}`}>{third}</td>
      <td className="text-center py-2 px-3">
        <div className="flex items-center justify-center gap-1">
          {overallDiff === 0 ? (
            <Minus className="h-3 w-3 text-muted-foreground" />
          ) : isPositive ? (
            <TrendingUp className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
          ) : (
            <TrendingDown className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
          )}
          <span className={`text-xs ${isGood ? "text-chart-2" : overallDiff === 0 ? "text-muted-foreground" : "text-destructive"}`}>
            {overallDiff > 0 ? "+" : ""}{overallDiff}
          </span>
        </div>
      </td>
    </tr>
  );
}

export function MonthlyComparisonSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-muted/30">
              <div className="h-4 w-16 bg-muted animate-pulse rounded mb-3" />
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
