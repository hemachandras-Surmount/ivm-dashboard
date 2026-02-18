import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Pencil, Check, X } from "lucide-react";
import type { Trend } from "@shared/schema";

interface KpiCardProps {
  id?: string;
  title: string;
  value: number | string;
  previousValue?: number;
  unit?: string;
  trend?: Trend;
  target?: number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  isAdmin?: boolean;
  onSave?: (updates: { value: number; target: number | null; trend: string }) => void;
  isSaving?: boolean;
}

export function KpiCard({
  id,
  title,
  value,
  previousValue,
  unit = "",
  trend = "stable",
  target,
  description,
  icon,
  className = "",
  isAdmin = false,
  onSave,
  isSaving = false,
}: KpiCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [editTarget, setEditTarget] = useState(target ? String(target) : "");
  const [editTrend, setEditTrend] = useState(trend);

  const numericValue = typeof value === "number" ? value : parseFloat(value);
  const change = previousValue !== undefined 
    ? ((numericValue - previousValue) / previousValue * 100).toFixed(1)
    : null;

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-chart-2";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const progressToTarget = target ? Math.min((numericValue / target) * 100, 100) : null;

  const handleStartEdit = () => {
    setEditValue(String(value));
    setEditTarget(target ? String(target) : "");
    setEditTrend(trend);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        value: parseFloat(editValue) || 0,
        target: editTarget ? parseFloat(editTarget) : null,
        trend: editTrend,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isAdmin && isEditing) {
    return (
      <Card className={className} data-testid={`card-kpi-edit-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving} data-testid="button-save-kpi">
              <Check className="h-4 w-4 text-chart-2" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel} data-testid="button-cancel-kpi">
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Value</label>
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 text-sm"
              data-testid="input-kpi-value"
              step="any"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Target</label>
            <Input
              type="number"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
              placeholder="No target"
              className="h-8 text-sm"
              data-testid="input-kpi-target"
              step="any"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Trend</label>
            <Select value={editTrend} onValueChange={(v) => setEditTrend(v as Trend)}>
              <SelectTrigger className="h-8 text-sm" data-testid="select-kpi-trend">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover-elevate ${className}`} data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button size="icon" variant="ghost" onClick={handleStartEdit} data-testid={`button-edit-kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {icon && !isAdmin && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        
        {change !== null && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change}% from last period</span>
          </div>
        )}

        {target && progressToTarget !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Target: {target}{unit}</span>
              <span className={progressToTarget >= 100 ? "text-chart-2" : "text-muted-foreground"}>
                {progressToTarget.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  progressToTarget >= 100 ? "bg-chart-2" : "bg-primary"
                }`}
                style={{ width: `${progressToTarget}%` }}
              />
            </div>
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
