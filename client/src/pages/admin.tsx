import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Settings, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KpiMetric, TeamStats, Team, Trend } from "@shared/schema";

const TEAMS: { value: Team; label: string }[] = [
  { value: "application", label: "Application Security" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "offensive", label: "Offensive Security" },
  { value: "cti", label: "Threat Intelligence" },
  { value: "bas", label: "BAS Simulations" },
];

const TRENDS: { value: Trend; label: string }[] = [
  { value: "up", label: "Up (Improving)" },
  { value: "down", label: "Down" },
  { value: "stable", label: "Stable" },
];

export default function Admin() {
  const [selectedTeam, setSelectedTeam] = useState<Team | "all">("all");
  const { toast } = useToast();

  const { data: kpis, isLoading: kpisLoading } = useQuery<KpiMetric[]>({
    queryKey: ["/api/kpis"],
  });

  const { data: teamStats, isLoading: statsLoading } = useQuery<TeamStats[]>({
    queryKey: ["/api/team-stats"],
  });

  const filteredKpis = kpis?.filter(k => selectedTeam === "all" || k.team === selectedTeam) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage KPIs, metrics, and team configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v as Team | "all")}>
            <SelectTrigger className="w-[200px]" data-testid="select-team-filter">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {TEAMS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="kpis">
        <TabsList>
          <TabsTrigger value="kpis" data-testid="tab-kpis">KPI Metrics</TabsTrigger>
          <TabsTrigger value="team-stats" data-testid="tab-team-stats">Team Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              KPI Metrics ({filteredKpis.length})
            </h2>
            <KpiFormDialog mode="create" />
          </div>

          {kpisLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredKpis.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No KPIs found for this team.</p>
                <KpiFormDialog mode="create" />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredKpis.map(kpi => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team-stats" className="space-y-4 mt-4">
          <h2 className="text-lg font-semibold">Team Statistics</h2>
          
          {statsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-24 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {teamStats?.filter(s => selectedTeam === "all" || s.team === selectedTeam).map(stats => (
                <TeamStatsCard key={stats.id} stats={stats} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: KpiMetric }) {
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/kpis/${kpi.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
      toast({ title: "KPI deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete KPI", variant: "destructive" });
    },
  });

  const teamLabel = TEAMS.find(t => t.value === kpi.team)?.label || kpi.team;

  return (
    <Card data-testid={`card-admin-kpi-${kpi.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{kpi.name}</CardTitle>
            <CardDescription className="text-xs">{teamLabel}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            {kpi.trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : kpi.trend === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{kpi.value}</span>
          <span className="text-sm text-muted-foreground">{kpi.unit}</span>
        </div>
        
        {kpi.target && (
          <div className="text-xs text-muted-foreground">
            Target: {kpi.target} {kpi.unit}
          </div>
        )}
        
        {kpi.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{kpi.description}</p>
        )}

        <div className="flex gap-2 pt-2">
          <KpiFormDialog mode="edit" kpi={kpi} />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-kpi-${kpi.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface KpiFormDialogProps {
  mode: "create" | "edit";
  kpi?: KpiMetric;
}

function KpiFormDialog({ mode, kpi }: KpiFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: kpi?.name || "",
    team: kpi?.team || "application" as Team,
    value: kpi?.value?.toString() || "",
    previousValue: kpi?.previousValue?.toString() || "",
    unit: kpi?.unit || "%",
    target: kpi?.target?.toString() || "",
    trend: kpi?.trend || "stable" as Trend,
    description: kpi?.description || "",
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        team: data.team,
        value: parseFloat(data.value),
        previousValue: data.previousValue ? parseFloat(data.previousValue) : null,
        unit: data.unit,
        target: data.target ? parseFloat(data.target) : null,
        trend: data.trend,
        description: data.description || null,
      };
      
      if (mode === "edit" && kpi) {
        return apiRequest("PATCH", `/api/kpis/${kpi.id}`, payload);
      }
      return apiRequest("POST", "/api/kpis", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
      toast({ title: mode === "create" ? "KPI created successfully" : "KPI updated successfully" });
      setOpen(false);
      if (mode === "create") {
        setFormData({
          name: "", team: "application", value: "", previousValue: "",
          unit: "%", target: "", trend: "stable", description: "",
        });
      }
    },
    onError: () => {
      toast({ title: "Failed to save KPI", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) {
      toast({ title: "Name and value are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button data-testid="button-add-kpi">
            <Plus className="h-4 w-4 mr-2" />
            Add KPI
          </Button>
        ) : (
          <Button variant="outline" size="sm" data-testid={`button-edit-kpi-${kpi?.id}`}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New KPI" : "Edit KPI"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., SAST Coverage"
                data-testid="input-kpi-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Select value={formData.team} onValueChange={(v) => setFormData(prev => ({ ...prev, team: v as Team }))}>
                <SelectTrigger data-testid="select-kpi-team">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="87.5"
                data-testid="input-kpi-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previousValue">Previous Value</Label>
              <Input
                id="previousValue"
                type="number"
                step="0.01"
                value={formData.previousValue}
                onChange={(e) => setFormData(prev => ({ ...prev, previousValue: e.target.value }))}
                placeholder="82.3"
                data-testid="input-kpi-previous-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="%"
                data-testid="input-kpi-unit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                value={formData.target}
                onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                placeholder="95"
                data-testid="input-kpi-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trend">Trend</Label>
              <Select value={formData.trend} onValueChange={(v) => setFormData(prev => ({ ...prev, trend: v as Trend }))}>
                <SelectTrigger data-testid="select-kpi-trend">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRENDS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this KPI..."
              rows={2}
              data-testid="input-kpi-description"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-kpi">
              {createMutation.isPending ? "Saving..." : mode === "create" ? "Create KPI" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamStatsCard({ stats }: { stats: TeamStats }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    totalAssets: stats.totalAssets.toString(),
    assessedAssets: stats.assessedAssets.toString(),
    openFindings: stats.openFindings.toString(),
    closedFindings: stats.closedFindings.toString(),
    mttr: stats.mttr?.toString() || "0",
    riskScore: stats.riskScore?.toString() || "0",
    coverage: stats.coverage?.toString() || "0",
    complianceScore: stats.complianceScore?.toString() || "0",
  });
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PATCH", `/api/team-stats/${stats.id}`, {
        totalAssets: parseInt(data.totalAssets),
        assessedAssets: parseInt(data.assessedAssets),
        openFindings: parseInt(data.openFindings),
        closedFindings: parseInt(data.closedFindings),
        mttr: parseFloat(data.mttr),
        riskScore: parseFloat(data.riskScore),
        coverage: parseFloat(data.coverage),
        complianceScore: parseFloat(data.complianceScore),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
      toast({ title: "Team stats updated successfully" });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update team stats", variant: "destructive" });
    },
  });

  const teamLabel = TEAMS.find(t => t.value === stats.team)?.label || stats.team;

  return (
    <Card data-testid={`card-team-stats-${stats.team}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{teamLabel}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
            data-testid={`button-edit-stats-${stats.team}`}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Total Assets</Label>
                <Input
                  type="number"
                  value={formData.totalAssets}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAssets: e.target.value }))}
                  data-testid="input-total-assets"
                />
              </div>
              <div className="space-y-2">
                <Label>Assessed Assets</Label>
                <Input
                  type="number"
                  value={formData.assessedAssets}
                  onChange={(e) => setFormData(prev => ({ ...prev, assessedAssets: e.target.value }))}
                  data-testid="input-assessed-assets"
                />
              </div>
              <div className="space-y-2">
                <Label>Open Findings</Label>
                <Input
                  type="number"
                  value={formData.openFindings}
                  onChange={(e) => setFormData(prev => ({ ...prev, openFindings: e.target.value }))}
                  data-testid="input-open-findings"
                />
              </div>
              <div className="space-y-2">
                <Label>Closed Findings</Label>
                <Input
                  type="number"
                  value={formData.closedFindings}
                  onChange={(e) => setFormData(prev => ({ ...prev, closedFindings: e.target.value }))}
                  data-testid="input-closed-findings"
                />
              </div>
              <div className="space-y-2">
                <Label>MTTR (days)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.mttr}
                  onChange={(e) => setFormData(prev => ({ ...prev, mttr: e.target.value }))}
                  data-testid="input-mttr"
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Score</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.riskScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, riskScore: e.target.value }))}
                  data-testid="input-risk-score"
                />
              </div>
              <div className="space-y-2">
                <Label>Coverage (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.coverage}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverage: e.target.value }))}
                  data-testid="input-coverage"
                />
              </div>
              <div className="space-y-2">
                <Label>Compliance (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.complianceScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, complianceScore: e.target.value }))}
                  data-testid="input-compliance"
                />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-stats">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatDisplay label="Total Assets" value={stats.totalAssets} />
            <StatDisplay label="Assessed" value={stats.assessedAssets} />
            <StatDisplay label="Open Findings" value={stats.openFindings} highlight={stats.openFindings > 100} />
            <StatDisplay label="Closed" value={stats.closedFindings} />
            <StatDisplay label="MTTR" value={`${stats.mttr?.toFixed(1)} days`} />
            <StatDisplay label="Risk Score" value={stats.riskScore?.toFixed(1) || "0"} highlight={(stats.riskScore || 0) > 7} />
            <StatDisplay label="Coverage" value={`${stats.coverage?.toFixed(1)}%`} />
            <StatDisplay label="Compliance" value={`${stats.complianceScore?.toFixed(1)}%`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatDisplay({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? "text-destructive" : ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
