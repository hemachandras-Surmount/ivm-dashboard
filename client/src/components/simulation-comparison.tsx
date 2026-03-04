import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { BasSimulation, SimulationType } from "@shared/schema";

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SIMULATION_LABELS: Record<SimulationType, string> = {
  network_infiltration: "Network Infiltration",
  endpoint_security: "Endpoint Security",
  waf_f5: "WAF F5",
  waf_threatx: "WAF ThreatX",
  email_gateway: "Email Gateway",
  ad_assessment: "AD Assessment",
  cve_critical: "CVE Critical",
};

function getTrendIcon(current: number, previous: number, inverse = false) {
  const diff = current - previous;
  const improved = inverse ? diff < 0 : diff > 0;
  const declined = inverse ? diff > 0 : diff < 0;
  
  if (Math.abs(diff) < 0.5) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  if (improved) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  if (declined) {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function getImprovementBadge(current: number, previous: number) {
  const diff = current - previous;
  if (diff > 2) {
    return <Badge variant="default" className="bg-green-500 text-white">Improved</Badge>;
  }
  if (diff < -2) {
    return <Badge variant="destructive">Declined</Badge>;
  }
  return <Badge variant="secondary">Stable</Badge>;
}

export function SimulationComparison() {
  const { data: simulations, isLoading } = useQuery<BasSimulation[]>({
    queryKey: ["/api/bas-simulations"],
  });

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Monthly Simulation Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Loading simulation data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!simulations || simulations.length === 0) {
    return null;
  }

  const monthSet = new Set<string>();
  simulations.forEach(s => monthSet.add(s.month));
  const sortedMonths = Array.from(monthSet).sort((a, b) => {
    const aIdx = MONTH_ORDER.indexOf(a);
    const bIdx = MONTH_ORDER.indexOf(b);
    return aIdx - bIdx;
  });

  const lastThreeMonths = sortedMonths.slice(-3);
  if (lastThreeMonths.length < 2) return null;

  const currentMonth = lastThreeMonths[lastThreeMonths.length - 1];
  const previousMonth = lastThreeMonths[lastThreeMonths.length - 2];

  const simTypes = Object.keys(SIMULATION_LABELS) as SimulationType[];

  const getSimData = (simType: SimulationType, month: string) => {
    return simulations.find(s => s.simulationType === simType && s.month === month);
  };

  return (
    <Card className="col-span-full" data-testid="card-simulation-comparison">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Monthly Simulation Improvement
        </CardTitle>
        <CardDescription>
          Comparing {previousMonth} vs {currentMonth} - Prevention and Detection Rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {simTypes.map((simType) => {
              const current = getSimData(simType, currentMonth);
              const previous = getSimData(simType, previousMonth);
              
              if (!current) return null;

              const prevPrevention = previous?.preventionRate || 0;
              const prevDetection = previous?.detectionRate || 0;
              const preventionChange = current.preventionRate - prevPrevention;
              const detectionChange = current.detectionRate - prevDetection;

              return (
                <Card key={simType} className="relative" data-testid={`card-simulation-${simType}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-medium">
                        {SIMULATION_LABELS[simType]}
                      </CardTitle>
                      {getImprovementBadge(current.preventionRate, prevPrevention)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Prevention
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{current.preventionRate.toFixed(1)}%</span>
                          {getTrendIcon(current.preventionRate, prevPrevention)}
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${current.preventionRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Prev: {prevPrevention.toFixed(1)}%</span>
                        <span className={preventionChange >= 0 ? "text-green-500" : "text-red-500"}>
                          {preventionChange >= 0 ? "+" : ""}{preventionChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-blue-500" />
                          Detection
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{current.detectionRate.toFixed(1)}%</span>
                          {getTrendIcon(current.detectionRate, prevDetection)}
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${current.detectionRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Prev: {prevDetection.toFixed(1)}%</span>
                        <span className={detectionChange >= 0 ? "text-green-500" : "text-red-500"}>
                          {detectionChange >= 0 ? "+" : ""}{detectionChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-muted-foreground">Simulations</div>
                        <div className="font-medium">{current.totalSimulations}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground flex items-center justify-center gap-1">
                          <XCircle className="h-3 w-3 text-red-400" />
                          Missed
                        </div>
                        <div className="font-medium text-red-500">{current.attacksMissed}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Trend Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Simulation Type</th>
                      {lastThreeMonths.map(month => (
                        <th key={month} className="text-center py-2 font-medium px-2">
                          {month}
                          {month === currentMonth && (
                            <Badge variant="outline" className="ml-1 text-xs">Current</Badge>
                          )}
                        </th>
                      ))}
                      <th className="text-center py-2 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simTypes.map((simType) => {
                      const monthData = lastThreeMonths.map(m => getSimData(simType, m));
                      const first = monthData[0]?.preventionRate || 0;
                      const last = monthData[monthData.length - 1]?.preventionRate || 0;
                      const overallChange = last - first;
                      
                      return (
                        <tr key={simType} className="border-b last:border-0">
                          <td className="py-2 font-medium">{SIMULATION_LABELS[simType]}</td>
                          {monthData.map((data, idx) => (
                            <td key={idx} className="text-center py-2 px-2">
                              {data ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-medium">{data.preventionRate.toFixed(1)}%</span>
                                  <span className="text-xs text-muted-foreground">
                                    {data.detectionRate.toFixed(1)}% det
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                          <td className="text-center py-2">
                            <div className="flex items-center justify-center gap-1">
                              {getTrendIcon(last, first)}
                              <span className={overallChange >= 0 ? "text-green-500" : "text-red-500"}>
                                {overallChange >= 0 ? "+" : ""}{overallChange.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
