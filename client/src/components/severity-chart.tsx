import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip
} from "recharts";
import type { Vulnerability } from "@shared/schema";

interface SeverityChartProps {
  data: Vulnerability[];
  title?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "hsl(0 84% 42%)",
  high: "hsl(24 95% 45%)",
  medium: "hsl(48 96% 53%)",
  low: "hsl(142 76% 36%)",
  info: "hsl(217 91% 45%)",
};

const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"];

export function SeverityChart({ data, title = "Vulnerability Distribution" }: SeverityChartProps) {
  const aggregatedData = SEVERITY_ORDER.map((severity) => {
    const items = data.filter((d) => d.severity === severity);
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);
    const resolvedCount = items.reduce((sum, item) => sum + item.resolvedCount, 0);
    return {
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: totalCount,
      resolved: resolvedCount,
      open: totalCount - resolvedCount,
      color: SEVERITY_COLORS[severity],
    };
  }).filter((d) => d.value > 0);

  const totalVulns = aggregatedData.reduce((sum, d) => sum + d.value, 0);
  const totalOpen = aggregatedData.reduce((sum, d) => sum + d.open, 0);

  return (
    <Card data-testid="card-severity-chart">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={aggregatedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {aggregatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-popover-border rounded-md p-3 shadow-lg">
                        <p className="font-medium text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Total: {data.value.toLocaleString()}
                        </p>
                        <p className="text-xs text-destructive">
                          Open: {data.open.toLocaleString()}
                        </p>
                        <p className="text-xs text-chart-2">
                          Resolved: {data.resolved.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t pt-4">
          <div>
            <p className="text-2xl font-bold" data-testid="text-total-vulnerabilities">{totalVulns.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Vulnerabilities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive" data-testid="text-open-issues">{totalOpen.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Open Issues</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SeverityChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          <div className="h-40 w-40 rounded-full bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
