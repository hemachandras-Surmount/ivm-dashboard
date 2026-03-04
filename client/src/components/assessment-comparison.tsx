import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Mail
} from "lucide-react";
import type { Assessment, AssessmentType } from "@shared/schema";

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

export function AssessmentComparison() {
  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  if (isLoading) {
    return <AssessmentComparisonSkeleton />;
  }

  if (!assessments || assessments.length === 0) {
    return null;
  }

  const totalCurrentCompleted = assessments.reduce((sum, a) => sum + a.currentCompleted, 0);
  const totalPreviousCompleted = assessments.reduce((sum, a) => sum + a.previousCompleted, 0);
  const totalCurrentVulns = assessments.reduce((sum, a) => sum + a.currentVulnsDetected, 0);
  const totalPreviousVulns = assessments.reduce((sum, a) => sum + a.previousVulnsDetected, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Cycle Summary</CardTitle>
          <CardDescription>
            Comparing {assessments[0]?.previousCycleLabel} vs {assessments[0]?.cycleLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryBox 
              label="Total Assessments"
              current={totalCurrentCompleted}
              previous={totalPreviousCompleted}
            />
            <SummaryBox 
              label="Vulnerabilities Found"
              current={totalCurrentVulns}
              previous={totalPreviousVulns}
              invertTrend
            />
            <SummaryBox 
              label="Critical Findings"
              current={assessments.reduce((sum, a) => sum + a.currentCritical, 0)}
              previous={assessments.reduce((sum, a) => sum + a.previousCritical, 0)}
              invertTrend
            />
            <SummaryBox 
              label="High Findings"
              current={assessments.reduce((sum, a) => sum + a.currentHigh, 0)}
              previous={assessments.reduce((sum, a) => sum + a.previousHigh, 0)}
              invertTrend
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Breakdown by Type</CardTitle>
          <CardDescription>
            Detailed comparison of each assessment type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-assessments">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Assessment Type</th>
                  <th className="text-center py-3 px-2 font-medium" colSpan={2}>Completed</th>
                  <th className="text-center py-3 px-2 font-medium" colSpan={2}>Vulnerabilities</th>
                  <th className="text-center py-3 px-2 font-medium">Severity Breakdown</th>
                </tr>
                <tr className="border-b text-xs text-muted-foreground">
                  <th></th>
                  <th className="text-center py-1 px-2">Prev</th>
                  <th className="text-center py-1 px-2">Curr</th>
                  <th className="text-center py-1 px-2">Prev</th>
                  <th className="text-center py-1 px-2">Curr</th>
                  <th className="text-center py-1 px-2">C / H / M / L</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <AssessmentRow key={assessment.id} assessment={assessment} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold bg-muted/30">
                  <td className="py-3 px-2">Total</td>
                  <td className="text-center py-3 px-2">{totalPreviousCompleted}</td>
                  <td className="text-center py-3 px-2">{totalCurrentCompleted}</td>
                  <td className="text-center py-3 px-2">{totalPreviousVulns}</td>
                  <td className="text-center py-3 px-2">{totalCurrentVulns}</td>
                  <td className="text-center py-3 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <Badge variant="destructive" className="text-xs">
                        {assessments.reduce((sum, a) => sum + a.currentCritical, 0)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        {assessments.reduce((sum, a) => sum + a.currentHigh, 0)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                        {assessments.reduce((sum, a) => sum + a.currentMedium, 0)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {assessments.reduce((sum, a) => sum + a.currentLow, 0)}
                      </Badge>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentRow({ assessment }: { assessment: Assessment }) {
  const config = ASSESSMENT_CONFIG[assessment.assessmentType as AssessmentType];
  const Icon = config.icon;
  
  const completedDiff = assessment.currentCompleted - assessment.previousCompleted;
  const vulnsDiff = assessment.currentVulnsDetected - assessment.previousVulnsDetected;

  return (
    <tr className="border-b hover-elevate" data-testid={`row-assessment-${assessment.assessmentType}`}>
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{config.name}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </td>
      <td className="text-center py-3 px-2 text-muted-foreground">
        {assessment.previousCompleted}
      </td>
      <td className="text-center py-3 px-2">
        <div className="flex items-center justify-center gap-1">
          {assessment.currentCompleted}
          <TrendIndicator current={assessment.currentCompleted} previous={assessment.previousCompleted} />
        </div>
      </td>
      <td className="text-center py-3 px-2 text-muted-foreground">
        {assessment.previousVulnsDetected}
      </td>
      <td className="text-center py-3 px-2">
        <div className="flex items-center justify-center gap-1">
          {assessment.currentVulnsDetected}
          <TrendIndicator 
            current={assessment.currentVulnsDetected} 
            previous={assessment.previousVulnsDetected} 
            invertColors 
          />
        </div>
      </td>
      <td className="text-center py-3 px-2">
        <div className="flex items-center justify-center gap-1">
          <Badge variant="destructive" className="text-xs">
            {assessment.currentCritical}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
            {assessment.currentHigh}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            {assessment.currentMedium}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {assessment.currentLow}
          </Badge>
        </div>
      </td>
    </tr>
  );
}

function TrendIndicator({ 
  current, 
  previous, 
  invertColors = false 
}: { 
  current: number; 
  previous: number; 
  invertColors?: boolean;
}) {
  const diff = current - previous;
  
  if (diff === 0) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  
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
  invertTrend = false 
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
        vs {previous.toLocaleString()} previous
      </p>
    </div>
  );
}

export function AssessmentComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border bg-muted/30">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}
