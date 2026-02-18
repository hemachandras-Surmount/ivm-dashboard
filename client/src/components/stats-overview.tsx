import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import type { TeamStats } from "@shared/schema";

interface StatsOverviewProps {
  stats: TeamStats;
  teamName: string;
  teamColor: string;
  isAdmin?: boolean;
  onSave?: (updates: Partial<TeamStats>) => void;
  isSaving?: boolean;
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

export function StatsOverview({ stats, teamName, teamColor, isAdmin = false, onSave, isSaving = false }: StatsOverviewProps) {
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

  const coveragePercent = stats.coverage || 0;
  const compliancePercent = stats.complianceScore || 0;
  const findingsResolutionRate = stats.openFindings + stats.closedFindings > 0 
    ? (stats.closedFindings / (stats.openFindings + stats.closedFindings)) * 100 
    : 0;

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
            <EditableField label="Total Assets" value={editFields.totalAssets} onChange={(v) => updateField("totalAssets", v)} testId="input-total-assets" />
            <EditableField label="Assessed Assets" value={editFields.assessedAssets} onChange={(v) => updateField("assessedAssets", v)} testId="input-assessed-assets" />
            <EditableField label="Open Findings" value={editFields.openFindings} onChange={(v) => updateField("openFindings", v)} testId="input-open-findings" />
            <EditableField label="Closed Findings" value={editFields.closedFindings} onChange={(v) => updateField("closedFindings", v)} testId="input-closed-findings" />
            <EditableField label="MTTR (days)" value={editFields.mttr} onChange={(v) => updateField("mttr", v)} step="0.1" testId="input-mttr" />
            <EditableField label="Risk Score (/10)" value={editFields.riskScore} onChange={(v) => updateField("riskScore", v)} step="0.1" testId="input-risk-score" />
            <EditableField label="Coverage (%)" value={editFields.coverage} onChange={(v) => updateField("coverage", v)} step="0.1" testId="input-coverage" />
            <EditableField label="Compliance (%)" value={editFields.complianceScore} onChange={(v) => updateField("complianceScore", v)} step="0.1" testId="input-compliance" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem 
            label="Total Assets" 
            value={stats.totalAssets} 
            subtext={`${stats.assessedAssets} assessed`}
          />
          <StatItem 
            label="Open Findings" 
            value={stats.openFindings} 
            subtext={`${stats.closedFindings} closed`}
            highlight={stats.openFindings > 100}
          />
          <StatItem 
            label="MTTR" 
            value={`${stats.mttr?.toFixed(1) || 0}`} 
            unit="days"
            subtext="Mean time to remediate"
          />
          <StatItem 
            label="Risk Score" 
            value={stats.riskScore?.toFixed(1) || "0"} 
            subtext="out of 10"
            highlight={(stats.riskScore || 0) > 7}
          />
        </div>

        <div className="mt-6 space-y-4">
          <ProgressBar 
            label="Asset Coverage" 
            value={coveragePercent} 
            target={95}
          />
          <ProgressBar 
            label="Compliance Score" 
            value={compliancePercent} 
            target={90}
          />
          <ProgressBar 
            label="Findings Resolution" 
            value={findingsResolutionRate} 
            target={80}
          />
        </div>
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
