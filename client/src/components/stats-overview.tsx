import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Eye, EyeOff } from "lucide-react";
import type { Team, TeamStats } from "@shared/schema";

interface ProgressBarVisibility {
  asset_coverage: boolean;
  compliance_score: boolean;
  findings_resolution: boolean;
}

interface StatsOverviewProps {
  stats: TeamStats;
  team: Team;
  teamName: string;
  teamColor: string;
  isAdmin?: boolean;
  onSave?: (updates: Partial<TeamStats>) => void;
  isSaving?: boolean;
  progressBarVisibility?: ProgressBarVisibility;
  onToggleProgressBar?: (key: string, visible: boolean) => void;
}

type EditableStatsFields = {
  totalAssets: string;
  assessedAssets: string;
  openFindings: string;
  closedFindings: string;
  mttr: string;
  riskScore: string;
  coverage: string;
  complianceScore: string;
};

const TEAM_LABELS: Record<string, { totalAssets: string; assessedAssets: string }> = {
  application: { totalAssets: "Total Applications", assessedAssets: "assessed" },
  infrastructure: { totalAssets: "Total Assets", assessedAssets: "assessed" },
  offensive: { totalAssets: "Total Assets", assessedAssets: "assessed" },
  cti: { totalAssets: "Total Assets", assessedAssets: "assessed" },
  bas: { totalAssets: "Total Assets", assessedAssets: "assessed" },
};

const HIDDEN_STATS: Record<string, string[]> = {
  application: ["mttr", "riskScore"],
};

export function StatsOverview({ stats, team, teamName, teamColor, isAdmin = false, onSave, isSaving = false, progressBarVisibility, onToggleProgressBar }: StatsOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<EditableStatsFields>({
    totalAssets: String(stats.totalAssets),
    assessedAssets: String(stats.assessedAssets),
    openFindings: String(stats.openFindings),
    closedFindings: String(stats.closedFindings),
    mttr: String(stats.mttr || 0),
    riskScore: String(stats.riskScore || 0),
    coverage: String(stats.coverage || 0),
    complianceScore: String(stats.complianceScore || 0),
  });

  const labels = TEAM_LABELS[team] || TEAM_LABELS.infrastructure;
  const hiddenStats = HIDDEN_STATS[team] || [];

  const coveragePercent = stats.coverage || 0;
  const compliancePercent = stats.complianceScore || 0;
  const findingsResolutionRate = stats.openFindings + stats.closedFindings > 0 
    ? (stats.closedFindings / (stats.openFindings + stats.closedFindings)) * 100 
    : 0;

  const pbVis = progressBarVisibility || { asset_coverage: true, compliance_score: true, findings_resolution: true };

  const handleStartEdit = () => {
    setEditFields({
      totalAssets: String(stats.totalAssets),
      assessedAssets: String(stats.assessedAssets),
      openFindings: String(stats.openFindings),
      closedFindings: String(stats.closedFindings),
      mttr: String(stats.mttr || 0),
      riskScore: String(stats.riskScore || 0),
      coverage: String(stats.coverage || 0),
      complianceScore: String(stats.complianceScore || 0),
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        totalAssets: parseInt(editFields.totalAssets) || 0,
        assessedAssets: parseInt(editFields.assessedAssets) || 0,
        openFindings: parseInt(editFields.openFindings) || 0,
        closedFindings: parseInt(editFields.closedFindings) || 0,
        mttr: parseFloat(editFields.mttr) || 0,
        riskScore: parseFloat(editFields.riskScore) || 0,
        coverage: parseFloat(editFields.coverage) || 0,
        complianceScore: parseFloat(editFields.complianceScore) || 0,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const updateField = (field: keyof EditableStatsFields, value: string) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  if (isAdmin && isEditing) {
    return (
      <Card className="col-span-full" data-testid="card-stats-edit">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${teamColor}`} />
              {teamName} Overview
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving} data-testid="button-save-stats">
                <Check className="h-4 w-4 text-chart-2" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancel} data-testid="button-cancel-stats">
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EditableField label={labels.totalAssets} value={editFields.totalAssets} onChange={(v) => updateField("totalAssets", v)} testId="input-total-assets" />
            <EditableField label="Assessed Assets" value={editFields.assessedAssets} onChange={(v) => updateField("assessedAssets", v)} testId="input-assessed-assets" />
            <EditableField label="Open Findings" value={editFields.openFindings} onChange={(v) => updateField("openFindings", v)} testId="input-open-findings" />
            <EditableField label="Closed Findings" value={editFields.closedFindings} onChange={(v) => updateField("closedFindings", v)} testId="input-closed-findings" />
            {!hiddenStats.includes("mttr") && (
              <EditableField label="MTTR (days)" value={editFields.mttr} onChange={(v) => updateField("mttr", v)} step="0.1" testId="input-mttr" />
            )}
            {!hiddenStats.includes("riskScore") && (
              <EditableField label="Risk Score (/10)" value={editFields.riskScore} onChange={(v) => updateField("riskScore", v)} step="0.1" testId="input-risk-score" />
            )}
            <EditableField label="Coverage (%)" value={editFields.coverage} onChange={(v) => updateField("coverage", v)} step="0.1" testId="input-coverage" />
            <EditableField label="Compliance (%)" value={editFields.complianceScore} onChange={(v) => updateField("complianceScore", v)} step="0.1" testId="input-compliance" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    { key: "totalAssets", label: labels.totalAssets, value: stats.totalAssets, subtext: `${stats.assessedAssets} assessed` },
    { key: "openFindings", label: "Open Findings", value: stats.openFindings, subtext: `${stats.closedFindings} closed`, highlight: stats.openFindings > 100 },
    ...(!hiddenStats.includes("mttr") ? [{ key: "mttr", label: "MTTR", value: `${stats.mttr?.toFixed(1) || 0}`, unit: "days", subtext: "Mean time to remediate" }] : []),
    ...(!hiddenStats.includes("riskScore") ? [{ key: "riskScore", label: "Risk Score", value: stats.riskScore?.toFixed(1) || "0", subtext: "out of 10", highlight: (stats.riskScore || 0) > 7 }] : []),
  ];

  const progressBars = [
    { key: "asset_coverage", label: "Asset Coverage", value: coveragePercent, target: 95 },
    { key: "compliance_score", label: "Compliance Score", value: compliancePercent, target: 90 },
    { key: "findings_resolution", label: "Findings Resolution", value: findingsResolutionRate, target: 80 },
  ];

  const visibleProgressBars = progressBars.filter(pb => pbVis[pb.key as keyof ProgressBarVisibility] !== false);

  return (
    <Card className="col-span-full" data-testid={`card-stats-${teamName.toLowerCase()}`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${teamColor}`} />
            {teamName} Overview
          </CardTitle>
          {isAdmin && (
            <Button size="icon" variant="ghost" onClick={handleStartEdit} data-testid="button-edit-stats">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-2 ${statItems.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-6`}>
          {statItems.map((item) => (
            <StatItem
              key={item.key}
              label={item.label}
              value={item.value as string | number}
              unit={(item as any).unit}
              subtext={item.subtext}
              highlight={item.highlight}
            />
          ))}
        </div>

        {(visibleProgressBars.length > 0 || isAdmin) && (
          <div className="mt-6 space-y-4">
            {progressBars.map((pb) => {
              const isBarVisible = pbVis[pb.key as keyof ProgressBarVisibility] !== false;

              if (!isBarVisible && !isAdmin) return null;

              return (
                <div key={pb.key} className={!isBarVisible ? "opacity-40 border border-dashed border-muted-foreground/30 rounded-lg p-2" : ""}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar label={pb.label} value={pb.value} target={pb.target} />
                    </div>
                    {isAdmin && onToggleProgressBar && (
                      <Button
                        size="sm"
                        variant={isBarVisible ? "outline" : "secondary"}
                        className="shrink-0 h-7 text-xs gap-1"
                        onClick={() => onToggleProgressBar(pb.key, !isBarVisible)}
                        data-testid={`toggle-${pb.key}`}
                      >
                        {isBarVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {isBarVisible ? "Hide" : "Show"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EditableField({ label, value, onChange, step = "1", testId }: { label: string; value: string; onChange: (v: string) => void; step?: string; testId: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
        step={step}
        data-testid={testId}
      />
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  highlight?: boolean;
}

function StatItem({ label, value, unit, subtext, highlight }: StatItemProps) {
  const testId = `stat-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <span 
          className={`text-2xl font-bold ${highlight ? "text-destructive" : ""}`}
          data-testid={testId}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  target: number;
}

function ProgressBar({ label, value, target }: ProgressBarProps) {
  const isOnTarget = value >= target;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex gap-2">
          <span className={isOnTarget ? "text-chart-2 font-medium" : "font-medium"}>
            {value.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">/ {target}% target</span>
        </div>
      </div>
      <div className="relative">
        <Progress value={value} className="h-2" />
        <div 
          className="absolute top-0 h-2 w-0.5 bg-foreground/50"
          style={{ left: `${target}%` }}
        />
      </div>
    </div>
  );
}

export function StatsOverviewSkeleton() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
