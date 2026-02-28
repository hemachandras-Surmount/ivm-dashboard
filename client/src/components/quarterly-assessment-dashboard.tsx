import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Cloud,
  Globe,
  Network,
  FolderOpen,
  Search,
  Wifi,
  Crosshair,
  Mail,
  Pencil,
  Check,
  X,
  Save,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuarterlyAssessment, AssessmentType, DashboardSetting } from "@shared/schema";

const ASSESSMENT_CONFIG: Record<AssessmentType, {
  name: string;
  icon: typeof Shield;
  description: string;
}> = {
  ad: { name: "Active Directory", icon: Shield, description: "AD security assessment" },
  cloud: { name: "Cloud Assessment", icon: Cloud, description: "Cloud infrastructure security" },
  external_network: { name: "External Network", icon: Globe, description: "External perimeter testing" },
  internal_network: { name: "Internal Network", icon: Network, description: "Internal network assessment" },
  file_sharing: { name: "File Sharing", icon: FolderOpen, description: "File share permissions" },
  osint: { name: "OSINT", icon: Search, description: "Open source intelligence" },
  wifi: { name: "WiFi Assessment", icon: Wifi, description: "Wireless security testing" },
  c2c: { name: "C2C Assessment", icon: Crosshair, description: "Command & control testing" },
  phishing: { name: "Phishing Simulation", icon: Mail, description: "Social engineering tests" },
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

const DEFAULT_TITLES: Record<string, string> = {
  "summary": "Quarterly Assessment Summary",
  "assessments_completed": "Assessments Completed by Quarter",
  "assessment_types": "Assessment Types & Test Cases",
  "comparison": "Year-over-Year Comparison",
  "severity": "Quarterly Severity Findings",
};

interface QuarterlyAssessmentDashboardProps {
  isAdmin: boolean;
}

export function QuarterlyAssessmentDashboard({ isAdmin }: QuarterlyAssessmentDashboardProps) {
  const { toast } = useToast();
  const currentYear = 2025;
  const previousYear = 2024;

  const { data: allAssessments, isLoading } = useQuery<QuarterlyAssessment[]>({
    queryKey: ["/api/quarterly-assessments"],
  });

  const { data: settings } = useQuery<DashboardSetting[]>({
    queryKey: ["/api/dashboard-settings", "offensive"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard-settings?team=offensive");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async ({ settingKey, settingValue }: { settingKey: string; settingValue: string }) => {
      await apiRequest("PUT", "/api/dashboard-settings", {
        team: "offensive",
        settingKey,
        settingValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-settings", "offensive"] });
      toast({ title: "Title updated", description: "Dashboard title saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving title", description: err.message, variant: "destructive" });
    },
  });

  const assessmentMutation = useMutation({
    mutationFn: async (batch: Array<{ id: string; updates: Partial<QuarterlyAssessment> }>) => {
      await Promise.all(batch.map(({ id, updates }) =>
        apiRequest("PATCH", `/api/quarterly-assessments/${id}`, updates)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quarterly-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", "offensive"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/report"] });
      toast({ title: "Assessment data updated", description: "Changes saved and charts refreshed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving data", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <QuarterlyDashboardSkeleton />;
  }

  if (!allAssessments || allAssessments.length === 0) {
    return null;
  }

  const currentYearData = allAssessments.filter(a => a.year === currentYear);
  const previousYearData = allAssessments.filter(a => a.year === previousYear);

  const getTitle = (key: string) => {
    const setting = settings?.find(s => s.settingKey === key);
    return setting?.settingValue || DEFAULT_TITLES[key] || key;
  };

  const quarterlyTotals = QUARTERS.map(q => {
    const qData = currentYearData.filter(a => a.quarter === q);
    return {
      quarter: q,
      completed: qData.reduce((s, a) => s + a.assessmentsCompleted, 0),
      testCases: qData.reduce((s, a) => s + a.testCasesExecuted, 0),
      critical: qData.reduce((s, a) => s + a.critical, 0),
      high: qData.reduce((s, a) => s + a.high, 0),
      medium: qData.reduce((s, a) => s + a.medium, 0),
    };
  });

  const prevQuarterlyTotals = QUARTERS.map(q => {
    const qData = previousYearData.filter(a => a.quarter === q);
    return {
      quarter: q,
      completed: qData.reduce((s, a) => s + a.assessmentsCompleted, 0),
      testCases: qData.reduce((s, a) => s + a.testCasesExecuted, 0),
      critical: qData.reduce((s, a) => s + a.critical, 0),
      high: qData.reduce((s, a) => s + a.high, 0),
      medium: qData.reduce((s, a) => s + a.medium, 0),
    };
  });

  const totalCurrentCompleted = quarterlyTotals.reduce((s, q) => s + q.completed, 0);
  const totalPrevCompleted = prevQuarterlyTotals.reduce((s, q) => s + q.completed, 0);
  const totalCurrentTestCases = quarterlyTotals.reduce((s, q) => s + q.testCases, 0);
  const totalCurrentCritical = quarterlyTotals.reduce((s, q) => s + q.critical, 0);
  const totalCurrentHigh = quarterlyTotals.reduce((s, q) => s + q.high, 0);

  const severityChartData = QUARTERS.map(q => {
    const curr = quarterlyTotals.find(qt => qt.quarter === q)!;
    return {
      name: q,
      Critical: curr.critical,
      High: curr.high,
      Medium: curr.medium,
    };
  });

  const comparisonChartData = QUARTERS.map(q => {
    const curr = quarterlyTotals.find(qt => qt.quarter === q)!;
    const prev = prevQuarterlyTotals.find(pt => pt.quarter === q)!;
    return {
      name: q,
      [`${previousYear}`]: prev.completed,
      [`${currentYear}`]: curr.completed,
    };
  });

  return (
    <div className="space-y-6">
      <SectionCard
        titleKey="summary"
        getTitle={getTitle}
        isAdmin={isAdmin}
        onSaveTitle={(value) => settingsMutation.mutate({ settingKey: "summary", settingValue: value })}
        description={`${previousYear} vs ${currentYear} performance overview`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryBox
            label="Total Assessments"
            current={totalCurrentCompleted}
            previous={totalPrevCompleted}
          />
          <SummaryBox
            label="Test Cases Executed"
            current={totalCurrentTestCases}
            previous={prevQuarterlyTotals.reduce((s, q) => s + q.testCases, 0)}
          />
          <SummaryBox
            label="Critical Findings"
            current={totalCurrentCritical}
            previous={prevQuarterlyTotals.reduce((s, q) => s + q.critical, 0)}
            invertTrend
          />
          <SummaryBox
            label="High Findings"
            current={totalCurrentHigh}
            previous={prevQuarterlyTotals.reduce((s, q) => s + q.high, 0)}
            invertTrend
          />
        </div>
      </SectionCard>

      <SectionCard
        titleKey="assessments_completed"
        getTitle={getTitle}
        isAdmin={isAdmin}
        onSaveTitle={(value) => settingsMutation.mutate({ settingKey: "assessments_completed", settingValue: value })}
        description={`Assessments completed across Q1–Q4 ${currentYear}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-quarterly-completed">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Quarter</th>
                <th className="text-center py-3 px-2 font-medium">Assessments Completed</th>
                <th className="text-center py-3 px-2 font-medium">Test Cases Executed</th>
                <th className="text-center py-3 px-2 font-medium">vs {previousYear}</th>
              </tr>
            </thead>
            <tbody>
              {QUARTERS.map(q => {
                const curr = quarterlyTotals.find(qt => qt.quarter === q)!;
                const prev = prevQuarterlyTotals.find(pt => pt.quarter === q)!;
                const diff = curr.completed - prev.completed;
                return (
                  <tr key={q} className="border-b hover-elevate" data-testid={`row-quarterly-${q}`}>
                    <td className="py-3 px-2 font-medium">{q}</td>
                    <td className="text-center py-3 px-2">{curr.completed}</td>
                    <td className="text-center py-3 px-2">{curr.testCases.toLocaleString()}</td>
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIndicator current={curr.completed} previous={prev.completed} />
                        <span className={`text-xs ${diff > 0 ? "text-chart-2" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {diff > 0 ? "+" : ""}{diff}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold bg-muted/30">
                <td className="py-3 px-2">Total</td>
                <td className="text-center py-3 px-2">{totalCurrentCompleted}</td>
                <td className="text-center py-3 px-2">{totalCurrentTestCases.toLocaleString()}</td>
                <td className="text-center py-3 px-2">
                  <div className="flex items-center justify-center gap-1">
                    <TrendIndicator current={totalCurrentCompleted} previous={totalPrevCompleted} />
                    <span className={`text-xs ${totalCurrentCompleted - totalPrevCompleted > 0 ? "text-chart-2" : totalCurrentCompleted - totalPrevCompleted < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {totalCurrentCompleted - totalPrevCompleted > 0 ? "+" : ""}{totalCurrentCompleted - totalPrevCompleted}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        titleKey="assessment_types"
        getTitle={getTitle}
        isAdmin={isAdmin}
        onSaveTitle={(value) => settingsMutation.mutate({ settingKey: "assessment_types", settingValue: value })}
        description="Assessment type breakdown with test case counts per quarter"
      >
        <AssessmentTypeTable
          currentYearData={currentYearData}
          previousYearData={previousYearData}
          isAdmin={isAdmin}
          onSave={(batch) => assessmentMutation.mutateAsync(batch)}
          isSaving={assessmentMutation.isPending}
        />
      </SectionCard>

      <SectionCard
        titleKey="comparison"
        getTitle={getTitle}
        isAdmin={isAdmin}
        onSaveTitle={(value) => settingsMutation.mutate({ settingKey: "comparison", settingValue: value })}
        description={`${previousYear} vs ${currentYear} assessments completed per quarter`}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend />
              <Bar dataKey={`${previousYear}`} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey={`${currentYear}`} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        titleKey="severity"
        getTitle={getTitle}
        isAdmin={isAdmin}
        onSaveTitle={(value) => settingsMutation.mutate({ settingKey: "severity", settingValue: value })}
        description={`Critical, High, and Medium findings per quarter (${currentYear})`}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="Critical" fill="hsl(0 84% 42%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="High" fill="hsl(25 95% 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Medium" fill="hsl(48 96% 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-quarterly-severity">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Quarter</th>
                  <th className="text-center py-3 px-2 font-medium">Critical</th>
                  <th className="text-center py-3 px-2 font-medium">High</th>
                  <th className="text-center py-3 px-2 font-medium">Medium</th>
                  <th className="text-center py-3 px-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {QUARTERS.map(q => {
                  const curr = quarterlyTotals.find(qt => qt.quarter === q)!;
                  const total = curr.critical + curr.high + curr.medium;
                  return (
                    <tr key={q} className="border-b hover-elevate" data-testid={`row-severity-${q}`}>
                      <td className="py-3 px-2 font-medium">{q}</td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="destructive" className="text-xs">{curr.critical}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          {curr.high}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                          {curr.medium}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2 font-medium">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold bg-muted/30">
                  <td className="py-3 px-2">Total</td>
                  <td className="text-center py-3 px-2">
                    <Badge variant="destructive" className="text-xs">{totalCurrentCritical}</Badge>
                  </td>
                  <td className="text-center py-3 px-2">
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                      {totalCurrentHigh}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-2">
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      {quarterlyTotals.reduce((s, q) => s + q.medium, 0)}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-2 font-medium">
                    {totalCurrentCritical + totalCurrentHigh + quarterlyTotals.reduce((s, q) => s + q.medium, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({
  titleKey,
  getTitle,
  isAdmin,
  onSaveTitle,
  description,
  children,
}: {
  titleKey: string;
  getTitle: (key: string) => string;
  isAdmin: boolean;
  onSaveTitle: (value: string) => void;
  description: string;
  children: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const title = getTitle(titleKey);

  const startEditing = () => {
    setEditValue(title);
    setIsEditing(true);
  };

  const saveTitle = () => {
    if (editValue.trim() && editValue !== title) {
      onSaveTitle(editValue.trim());
    }
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-lg font-semibold h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") cancelEditing();
              }}
              autoFocus
              data-testid={`input-title-${titleKey}`}
            />
            <Button size="icon" variant="ghost" onClick={saveTitle} data-testid={`button-save-title-${titleKey}`}>
              <Check className="h-4 w-4 text-chart-2" />
            </Button>
            <Button size="icon" variant="ghost" onClick={cancelEditing} data-testid={`button-cancel-title-${titleKey}`}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg" data-testid={`text-title-${titleKey}`}>{title}</CardTitle>
            {isAdmin && (
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={startEditing} data-testid={`button-edit-title-${titleKey}`}>
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function AssessmentTypeTable({
  currentYearData,
  previousYearData,
  isAdmin,
  onSave,
  isSaving,
}: {
  currentYearData: QuarterlyAssessment[];
  previousYearData: QuarterlyAssessment[];
  isAdmin: boolean;
  onSave: (batch: Array<{ id: string; updates: Partial<QuarterlyAssessment> }>) => Promise<void>;
  isSaving: boolean;
}) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, Record<string, number>>>({});

  const assessmentTypes = Object.keys(ASSESSMENT_CONFIG) as AssessmentType[];

  const startEditing = (type: AssessmentType) => {
    const typeData = currentYearData.filter(a => a.assessmentType === type);
    const vals: Record<string, number> = {};
    for (const qa of typeData) {
      vals[`${qa.quarter}_completed`] = qa.assessmentsCompleted;
      vals[`${qa.quarter}_testCases`] = qa.testCasesExecuted;
    }
    setEditValues({ [type]: vals });
    setEditingRow(type);
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditValues({});
  };

  const saveEditing = async (type: AssessmentType) => {
    const vals = editValues[type];
    if (!vals) return;

    const batch: Array<{ id: string; updates: Partial<QuarterlyAssessment> }> = [];
    const typeData = currentYearData.filter(a => a.assessmentType === type);
    
    for (const qa of typeData) {
      const completedKey = `${qa.quarter}_completed`;
      const testCasesKey = `${qa.quarter}_testCases`;
      const newCompleted = vals[completedKey];
      const newTestCases = vals[testCasesKey];
      
      if (newCompleted !== qa.assessmentsCompleted || newTestCases !== qa.testCasesExecuted) {
        batch.push({
          id: qa.id,
          updates: {
            assessmentsCompleted: newCompleted,
            testCasesExecuted: newTestCases,
          },
        });
      }
    }

    if (batch.length > 0) {
      await onSave(batch);
    }
    setEditingRow(null);
    setEditValues({});
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-assessment-types">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium">Assessment Type</th>
            {QUARTERS.map(q => (
              <th key={q} className="text-center py-3 px-2 font-medium" colSpan={2}>{q}</th>
            ))}
            <th className="text-center py-3 px-2 font-medium">Total</th>
            {isAdmin && <th className="text-center py-3 px-1 font-medium w-16"></th>}
          </tr>
          <tr className="border-b text-xs text-muted-foreground">
            <th></th>
            {QUARTERS.map(q => (
              <th key={q} className="text-center py-1 px-1" colSpan={2}>
                <span className="inline-flex gap-2">
                  <span>Done</span>
                  <span>Tests</span>
                </span>
              </th>
            ))}
            <th className="text-center py-1 px-1">
              <span className="inline-flex gap-2">
                <span>Done</span>
                <span>Tests</span>
              </span>
            </th>
            {isAdmin && <th></th>}
          </tr>
        </thead>
        <tbody>
          {assessmentTypes.map(type => {
            const config = ASSESSMENT_CONFIG[type];
            const Icon = config.icon;
            const typeCurrentData = currentYearData.filter(a => a.assessmentType === type);
            const typePrevData = previousYearData.filter(a => a.assessmentType === type);
            const isEditingThis = editingRow === type;
            const vals = editValues[type] || {};

            const totalCompleted = typeCurrentData.reduce((s, a) => s + a.assessmentsCompleted, 0);
            const totalTestCases = typeCurrentData.reduce((s, a) => s + a.testCasesExecuted, 0);

            return (
              <tr key={type} className="border-b hover-elevate" data-testid={`row-type-${type}`}>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-xs md:text-sm">{config.name}</p>
                    </div>
                  </div>
                </td>
                {QUARTERS.map(q => {
                  const qData = typeCurrentData.find(a => a.quarter === q);
                  const completed = qData?.assessmentsCompleted || 0;
                  const testCases = qData?.testCasesExecuted || 0;

                  if (isEditingThis) {
                    return (
                      <td key={q} className="text-center py-2 px-1" colSpan={2}>
                        <div className="flex gap-1 justify-center">
                          <Input
                            type="number"
                            value={vals[`${q}_completed`] ?? completed}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              [type]: { ...prev[type], [`${q}_completed`]: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-14 h-7 text-xs text-center p-1"
                            data-testid={`input-${type}-${q}-completed`}
                          />
                          <Input
                            type="number"
                            value={vals[`${q}_testCases`] ?? testCases}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              [type]: { ...prev[type], [`${q}_testCases`]: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-16 h-7 text-xs text-center p-1"
                            data-testid={`input-${type}-${q}-testcases`}
                          />
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={q} className="text-center py-3 px-1" colSpan={2}>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="font-medium">{completed}</span>
                        <span className="text-muted-foreground">{testCases}</span>
                      </div>
                    </td>
                  );
                })}
                <td className="text-center py-3 px-1">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="font-semibold">{totalCompleted}</span>
                    <span className="text-muted-foreground">{totalTestCases}</span>
                  </div>
                </td>
                {isAdmin && (
                  <td className="text-center py-3 px-1">
                    {isEditingThis ? (
                      <div className="flex gap-1 justify-center">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => saveEditing(type)} disabled={isSaving} data-testid={`button-save-${type}`}>
                          <Save className="h-3 w-3 text-chart-2" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditing} data-testid={`button-cancel-${type}`}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditing(type)} data-testid={`button-edit-${type}`}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t font-semibold bg-muted/30">
            <td className="py-3 px-2">Total</td>
            {QUARTERS.map(q => {
              const qData = currentYearData.filter(a => a.quarter === q);
              const completed = qData.reduce((s, a) => s + a.assessmentsCompleted, 0);
              const testCases = qData.reduce((s, a) => s + a.testCasesExecuted, 0);
              return (
                <td key={q} className="text-center py-3 px-1" colSpan={2}>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span>{completed}</span>
                    <span className="text-muted-foreground">{testCases}</span>
                  </div>
                </td>
              );
            })}
            <td className="text-center py-3 px-1">
              <div className="flex items-center justify-center gap-2 text-xs">
                <span>{currentYearData.reduce((s, a) => s + a.assessmentsCompleted, 0)}</span>
                <span className="text-muted-foreground">{currentYearData.reduce((s, a) => s + a.testCasesExecuted, 0)}</span>
              </div>
            </td>
            {isAdmin && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TrendIndicator({ current, previous, invertColors = false }: {
  current: number;
  previous: number;
  invertColors?: boolean;
}) {
  const diff = current - previous;
  if (diff === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;

  const isPositive = diff > 0;
  const isGood = invertColors ? !isPositive : isPositive;

  return isPositive ? (
    <TrendingUp className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
  ) : (
    <TrendingDown className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
  );
}

function SummaryBox({
  label,
  current,
  previous,
  invertTrend = false,
}: {
  label: string;
  current: number;
  previous: number;
  invertTrend?: boolean;
}) {
  const diff = current - previous;
  const pctChange = previous > 0 ? Math.round((diff / previous) * 100) : 0;
  const isPositive = diff > 0;
  const isGood = invertTrend ? !isPositive : isPositive;

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{current.toLocaleString()}</p>
      <div className="flex items-center gap-1 mt-1">
        {diff === 0 ? (
          <Minus className="h-3 w-3 text-muted-foreground" />
        ) : isPositive ? (
          <TrendingUp className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
        ) : (
          <TrendingDown className={`h-3 w-3 ${isGood ? "text-chart-2" : "text-destructive"}`} />
        )}
        <span className={`text-xs ${isGood ? "text-chart-2" : diff === 0 ? "text-muted-foreground" : "text-destructive"}`}>
          {diff > 0 ? "+" : ""}{diff} ({pctChange > 0 ? "+" : ""}{pctChange}%)
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        vs {previous.toLocaleString()} previous year
      </p>
    </div>
  );
}

export function QuarterlyDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </CardHeader>
          <CardContent>
            {i === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="p-4 rounded-lg border bg-muted/30">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 bg-muted animate-pulse rounded" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
