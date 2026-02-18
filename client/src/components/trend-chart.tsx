import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TrendData } from "@shared/schema";

interface TrendChartProps {
  data: TrendData[];
  title?: string;
  metrics?: string[];
}

const METRIC_COLORS = [
  "hsl(217 91% 45%)",
  "hsl(142 76% 36%)",
  "hsl(24 95% 45%)",
  "hsl(280 65% 42%)",
  "hsl(340 82% 48%)",
];

const MONTH_ORDER: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

export function TrendChart({ 
  data, 
  title = "Trend Over Time",
  metrics = []
}: TrendChartProps) {
  const groupedByDate = data.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = { date: item.date };
    }
    acc[item.date][item.metricName] = item.value;
    return acc;
  }, {} as Record<string, Record<string, string | number>>);

  const chartData = Object.values(groupedByDate).sort((a, b) => {
    const monthA = MONTH_ORDER[a.date as string] || 0;
    const monthB = MONTH_ORDER[b.date as string] || 0;
    return monthA - monthB;
  });

  const uniqueMetrics = metrics.length > 0 
    ? metrics 
    : Array.from(new Set(data.map((d) => d.metricName)));

  return (
    <Card data-testid="card-trend-chart">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--popover-border))",
                  borderRadius: "6px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                itemStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
              {uniqueMetrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={METRIC_COLORS[index % METRIC_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: METRIC_COLORS[index % METRIC_COLORS.length] }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end gap-2">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="flex-1 bg-muted animate-pulse rounded-t"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
