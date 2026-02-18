import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Printer,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Target,
  Activity,
  Calendar,
  FileDown
} from "lucide-react";
import type { Team, Assessment, BasSimulation } from "@shared/schema";
import { jsPDF } from "jspdf";

const TEAMS: { value: Team; label: string }[] = [
  { value: "application", label: "Application Security" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "offensive", label: "Offensive Security" },
  { value: "cti", label: "Threat Intelligence" },
  { value: "bas", label: "BAS Simulations" },
];

interface MonthlyComparisonData {
  month: string;
  year: number;
  totalVulnerabilities: number;
  resolved: number;
  open: number;
  resolutionRate: number;
  isCurrent: boolean;
}

interface MonthlyFinding {
  month: string;
  found: number;
  resolved: number;
}

interface TrendMetric {
  date: string;
  metricName: string;
  value: number;
}

interface ReportData {
  generatedAt: string;
  reportMonth: string;
  team: Team;
  stats: {
    totalAssets: number;
    assessedAssets: number;
    openFindings: number;
    closedFindings: number;
    mttr: number;
    riskScore: number;
    coverage: number;
    complianceScore: number;
  };
  kpis: Array<{
    name: string;
    value: number;
    target: number | null;
    unit: string;
    trend: string;
    previousValue: number | null;
    description: string | null;
    progressToTarget: number | null;
  }>;
  vulnerabilitySummary: Record<string, { total: number; resolved: number; open: number }>;
  totalOpenFindings: number;
  totalClosedFindings: number;
  remediationRate: number;
  mttr: number;
  riskScore: number;
  coverage: number;
  complianceScore: number;
  monthlyFindings: MonthlyFinding[];
  trendMetrics: TrendMetric[];
  assessments: Assessment[] | null;
  basSimulations: BasSimulation[] | null;
  monthlyComparison: MonthlyComparisonData[] | null;
}

export default function Report() {
  const [selectedTeam, setSelectedTeam] = useState<Team>("application");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: report, isLoading, error } = useQuery<ReportData>({
    queryKey: [`/api/report/${selectedTeam}`],
  });

  const handlePrint = () => {
    window.print();
  };

  type RGB = [number, number, number];
  
  const hex = (h: string): RGB => {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  };
  
  const COLORS = {
    bg: hex('#0f172a'),
    cardBg: hex('#1e293b'),
    border: hex('#334155'),
    white: [255, 255, 255] as RGB,
    blue: hex('#3b82f6'),
    muted: hex('#94a3b8'),
    green: hex('#4ade80'),
    red: hex('#f87171'),
    redSolid: hex('#ef4444'),
    yellow: hex('#fef08a'),
    footer: hex('#64748b'),
    severityText: {
      critical: hex('#fecaca'), high: hex('#fed7aa'), medium: hex('#fef08a'), low: hex('#bbf7d0'), info: hex('#93c5fd')
    } as Record<string, RGB>,
  };

  const renderTeamReport = (
    doc: jsPDF,
    rpt: ReportData,
    label: string,
    yStart: number,
    isFirstPage: boolean
  ): number => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = yStart;
    const { bg, cardBg, border, white, blue, muted, green, red, redSolid, yellow, severityText } = COLORS;

    const fillPage = () => {
      doc.setFillColor(...bg);
      doc.rect(0, 0, pageW, pageH, 'F');
    };

    const checkPage = (needed: number) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        fillPage();
        y = margin;
      }
    };

    const drawRoundedRect = (x: number, ry: number, w: number, h: number, r: number, fillCol: RGB, borderCol?: RGB) => {
      doc.setFillColor(...fillCol);
      doc.roundedRect(x, ry, w, h, r, r, 'F');
      if (borderCol) {
        doc.setDrawColor(...borderCol);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, ry, w, h, r, r, 'S');
      }
    };

    const drawTableHeader = (cols: { label: string; w: number; align: 'left' | 'right' }[]) => {
      checkPage(8);
      let hx = margin;
      doc.setFillColor(...cardBg);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      cols.forEach(col => {
        const tx = col.align === 'right' ? hx + col.w - 2 : hx + 2;
        doc.text(col.label, tx, y + 5, { align: col.align });
        hx += col.w;
      });
      y += 8;
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 1, pageW - margin, y - 1);
    };

    const drawTableRow = (cells: { text: string; color?: RGB }[], cols: { w: number; align: 'left' | 'right' }[]) => {
      checkPage(7);
      let rx = margin;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      cells.forEach((cell, i) => {
        doc.setTextColor(...(cell.color || white));
        const tx = cols[i].align === 'right' ? rx + cols[i].w - 2 : rx + 2;
        doc.text(cell.text, tx, y + 4, { align: cols[i].align });
        rx += cols[i].w;
      });
      y += 7;
      doc.setDrawColor(...border);
      doc.setLineWidth(0.1);
      doc.line(margin, y - 1, pageW - margin, y - 1);
    };

    if (!isFirstPage) {
      doc.addPage();
      fillPage();
      y = margin;
    } else {
      fillPage();
    }

    doc.setFontSize(22);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text('Security Status Report', pageW / 2, y + 8, { align: 'center' });
    y += 14;

    doc.setFontSize(14);
    doc.setTextColor(...blue);
    doc.text(label, pageW / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(rpt.reportMonth, pageW / 2, y, { align: 'center' });
    y += 4;

    doc.setDrawColor(...blue);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    doc.setFontSize(13);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, y);
    y += 8;

    const cardW = (contentW - 9) / 4;
    const cardH = 28;
    const summaryCards = [
      { label: 'Open Findings', value: rpt.totalOpenFindings.toLocaleString(), highlight: rpt.totalOpenFindings > 100 },
      { label: 'Closed Findings', value: rpt.totalClosedFindings.toLocaleString(), highlight: false },
      { label: 'Avg. MTTR', value: `${rpt.mttr.toFixed(1)} days`, highlight: false },
      { label: 'Remediation Rate', value: `${rpt.remediationRate}%`, highlight: rpt.remediationRate < 70 },
    ];

    checkPage(cardH + 5);
    summaryCards.forEach((card, i) => {
      const cx = margin + i * (cardW + 3);
      drawRoundedRect(cx, y, cardW, cardH, 2, cardBg, card.highlight ? redSolid : border);
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, cx + cardW / 2, y + 10, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(...(card.highlight ? redSolid : white));
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, cx + cardW / 2, y + 21, { align: 'center' });
    });
    y += cardH + 10;

    checkPage(20);
    doc.setFontSize(13);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Indicators', margin, y);
    y += 6;

    const kpiCols = [
      { label: 'KPI Name', w: contentW * 0.28, align: 'left' as const },
      { label: 'Current', w: contentW * 0.15, align: 'right' as const },
      { label: 'Previous', w: contentW * 0.15, align: 'right' as const },
      { label: 'Change', w: contentW * 0.12, align: 'right' as const },
      { label: 'Target', w: contentW * 0.15, align: 'right' as const },
      { label: 'Progress', w: contentW * 0.15, align: 'right' as const },
    ];

    drawTableHeader(kpiCols);
    rpt.kpis.forEach(kpi => {
      const prog = kpi.progressToTarget ? kpi.progressToTarget : 0;
      const progColor: RGB = prog >= 80 ? green : prog >= 60 ? yellow : red;
      const prev = kpi.previousValue;
      const change = prev != null ? kpi.value - prev : null;
      const changeStr = change != null ? (change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)) : '-';
      const changeColor: RGB = change != null ? (change >= 0 ? green : red) : muted;
      drawTableRow([
        { text: kpi.name },
        { text: `${kpi.value} ${kpi.unit}` },
        { text: prev != null ? `${prev} ${kpi.unit}` : '-', color: muted },
        { text: changeStr, color: changeColor },
        { text: kpi.target ? `${kpi.target} ${kpi.unit}` : '-' },
        { text: kpi.progressToTarget ? `${kpi.progressToTarget}%` : '-', color: progColor },
      ], kpiCols);
    });
    y += 4;

    const kpisWithTargets = rpt.kpis.filter(k => k.target && k.progressToTarget);
    if (kpisWithTargets.length > 0) {
      const barH = 6;
      const chartH = kpisWithTargets.length * (barH + 4) + 10;
      checkPage(chartH + 5);
      doc.setFontSize(10);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      doc.text('KPI Progress', margin, y + 4);
      y += 8;
      const labelW = contentW * 0.32;
      const barAreaW = contentW * 0.55;
      const barX = margin + labelW;
      kpisWithTargets.forEach(kpi => {
        const prog = Math.min(kpi.progressToTarget!, 150);
        const pct = Math.min(prog / 100, 1);
        const barColor: RGB = prog >= 80 ? green : prog >= 60 ? yellow : red;
        doc.setFontSize(7);
        doc.setTextColor(...white);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.name, margin, y + barH / 2 + 1.5);
        doc.setFillColor(...cardBg);
        doc.roundedRect(barX, y, barAreaW, barH, 1, 1, 'F');
        doc.setFillColor(...barColor);
        const fillW = Math.max(barAreaW * pct, 2);
        doc.roundedRect(barX, y, fillW, barH, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setTextColor(...white);
        doc.setFont('helvetica', 'bold');
        doc.text(`${prog}%`, barX + barAreaW + 3, y + barH / 2 + 1.5);
        y += barH + 4;
      });
      y += 4;
    }

    checkPage(20);
    doc.setFontSize(13);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text('Vulnerability Summary by Severity', margin, y);
    y += 6;

    const vulnCols = [
      { label: 'Severity', w: contentW * 0.2, align: 'left' as const },
      { label: 'Total Found', w: contentW * 0.2, align: 'right' as const },
      { label: 'Resolved', w: contentW * 0.2, align: 'right' as const },
      { label: 'Open', w: contentW * 0.2, align: 'right' as const },
      { label: 'Resolution Rate', w: contentW * 0.2, align: 'right' as const },
    ];

    drawTableHeader(vulnCols);
    ['critical', 'high', 'medium', 'low', 'info'].forEach(sev => {
      const data = rpt.vulnerabilitySummary[sev];
      if (!data) return;
      const rate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
      const rateColor: RGB = rate >= 80 ? green : rate >= 60 ? yellow : red;
      drawTableRow([
        { text: sev.charAt(0).toUpperCase() + sev.slice(1), color: severityText[sev] },
        { text: data.total.toLocaleString() },
        { text: data.resolved.toLocaleString(), color: green },
        { text: data.open.toLocaleString(), color: red },
        { text: `${rate}%`, color: rateColor },
      ], vulnCols);
    });
    y += 4;

    const sevBarColors: Record<string, RGB> = {
      critical: hex('#dc2626'), high: hex('#ea580c'), medium: hex('#ca8a04'), low: hex('#16a34a'), info: hex('#2563eb')
    };
    const sevEntries = ['critical', 'high', 'medium', 'low', 'info']
      .map(sev => ({ sev, data: rpt.vulnerabilitySummary[sev] }))
      .filter(e => e.data && e.data.total > 0);

    if (sevEntries.length > 0) {
      const chartBarH = 55;
      checkPage(chartBarH + 15);
      doc.setFontSize(10);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      doc.text('Severity Distribution (Resolved vs Open)', margin, y + 4);
      y += 10;

      const chartX = margin + 5;
      const chartW = contentW - 10;
      const chartH = 42;
      const maxVal = Math.max(...sevEntries.map(e => e.data!.total));
      const barW = Math.min((chartW / sevEntries.length) - 6, 22);
      const gap = (chartW - barW * sevEntries.length) / (sevEntries.length + 1);

      drawRoundedRect(margin, y - 2, contentW, chartH + 18, 3, cardBg, border);

      doc.setDrawColor(...border);
      doc.setLineWidth(0.1);
      for (let i = 0; i <= 4; i++) {
        const lineY = y + 2 + (chartH * (4 - i) / 4);
        doc.line(chartX, lineY, chartX + chartW, lineY);
        doc.setFontSize(6);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.text(String(Math.round(maxVal * i / 4)), chartX - 2, lineY + 1.5, { align: 'right' });
      }

      sevEntries.forEach((entry, i) => {
        const bx = chartX + gap + i * (barW + gap);
        const total = entry.data!.total;
        const resolved = entry.data!.resolved;
        const open = total - resolved;
        const totalH = maxVal > 0 ? (total / maxVal) * chartH : 0;
        const resolvedH = maxVal > 0 ? (resolved / maxVal) * chartH : 0;

        const barBaseY = y + 2 + chartH;
        doc.setFillColor(...hex('#374151'));
        doc.rect(bx, barBaseY - totalH, barW, totalH, 'F');
        doc.setFillColor(...sevBarColors[entry.sev] || blue);
        doc.rect(bx, barBaseY - resolvedH, barW, resolvedH, 'F');

        doc.setFontSize(6);
        doc.setTextColor(...white);
        doc.setFont('helvetica', 'bold');
        doc.text(String(total), bx + barW / 2, barBaseY - totalH - 1.5, { align: 'center' });

        doc.setFontSize(7);
        doc.setTextColor(...severityText[entry.sev]);
        doc.text(entry.sev.charAt(0).toUpperCase() + entry.sev.slice(1), bx + barW / 2, barBaseY + 5, { align: 'center' });
      });

      const legendY = y + chartH + 10;
      doc.setFillColor(...hex('#374151'));
      doc.rect(chartX + chartW - 55, legendY, 4, 4, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...muted);
      doc.text('Open', chartX + chartW - 49, legendY + 3.5);
      doc.setFillColor(...blue);
      doc.rect(chartX + chartW - 32, legendY, 4, 4, 'F');
      doc.text('Resolved', chartX + chartW - 26, legendY + 3.5);

      y += chartH + 22;
    }

    checkPage(cardH + 15);
    doc.setFontSize(13);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text('Asset Coverage & Compliance', margin, y);
    y += 8;

    const cardW5 = (contentW - 12) / 5;
    const assetCards = [
      { label: 'Total Assets', value: rpt.stats.totalAssets.toLocaleString(), highlight: false },
      { label: 'Assessed Assets', value: rpt.stats.assessedAssets.toLocaleString(), highlight: false },
      { label: 'Coverage', value: `${rpt.coverage.toFixed(1)}%`, highlight: false },
      { label: 'Risk Score', value: `${rpt.riskScore.toFixed(1)}/10`, highlight: rpt.riskScore > 7 },
      { label: 'Compliance', value: `${(rpt.complianceScore ?? rpt.stats.complianceScore ?? 0).toFixed(1)}%`, highlight: false },
    ];

    assetCards.forEach((card, i) => {
      const cx = margin + i * (cardW5 + 3);
      drawRoundedRect(cx, y, cardW5, cardH, 2, cardBg, card.highlight ? redSolid : border);
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, cx + cardW5 / 2, y + 10, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(...(card.highlight ? redSolid : white));
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, cx + cardW5 / 2, y + 21, { align: 'center' });
    });
    y += cardH + 10;

    if (rpt.monthlyFindings && rpt.monthlyFindings.length > 0) {
      const mfChartH = 55;
      checkPage(mfChartH + 15);
      doc.setFontSize(13);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Findings Trend (Found vs Resolved)', margin, y);
      y += 6;

      const mfCols = [
        { label: 'Month', w: contentW * 0.4, align: 'left' as const },
        { label: 'Found', w: contentW * 0.3, align: 'right' as const },
        { label: 'Resolved', w: contentW * 0.3, align: 'right' as const },
      ];
      drawTableHeader(mfCols);
      rpt.monthlyFindings.forEach(mf => {
        drawTableRow([
          { text: mf.month },
          { text: mf.found.toLocaleString(), color: red },
          { text: mf.resolved.toLocaleString(), color: green },
        ], mfCols);
      });
      y += 4;

      const mfBarChartH = 42;
      checkPage(mfBarChartH + 20);
      doc.setFontSize(10);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Findings Chart', margin, y + 4);
      y += 10;

      const mfChartX = margin + 12;
      const mfChartW = contentW - 18;
      const mfMaxVal = Math.max(...rpt.monthlyFindings.map(mf => Math.max(mf.found, mf.resolved)));
      const mfGroupW = mfChartW / rpt.monthlyFindings.length;
      const mfBarW = Math.min(mfGroupW * 0.3, 12);

      drawRoundedRect(margin, y - 2, contentW, mfBarChartH + 18, 3, cardBg, border);

      doc.setDrawColor(...border);
      doc.setLineWidth(0.1);
      for (let i = 0; i <= 4; i++) {
        const lineY = y + 2 + (mfBarChartH * (4 - i) / 4);
        doc.line(mfChartX, lineY, mfChartX + mfChartW, lineY);
        doc.setFontSize(6);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.text(String(Math.round(mfMaxVal * i / 4)), mfChartX - 2, lineY + 1.5, { align: 'right' });
      }

      const mfBarBase = y + 2 + mfBarChartH;
      rpt.monthlyFindings.forEach((mf, i) => {
        const cx = mfChartX + (i + 0.5) * mfGroupW;
        const foundH = mfMaxVal > 0 ? (mf.found / mfMaxVal) * mfBarChartH : 0;
        const resolvedH = mfMaxVal > 0 ? (mf.resolved / mfMaxVal) * mfBarChartH : 0;
        doc.setFillColor(...red);
        doc.rect(cx - mfBarW - 0.5, mfBarBase - foundH, mfBarW, foundH, 'F');
        doc.setFillColor(...green);
        doc.rect(cx + 0.5, mfBarBase - resolvedH, mfBarW, resolvedH, 'F');

        doc.setFontSize(6);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.text(mf.month, cx, mfBarBase + 5, { align: 'center' });
      });

      const mfLegY = y + mfBarChartH + 10;
      doc.setFillColor(...red);
      doc.rect(mfChartX + mfChartW - 45, mfLegY, 4, 4, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...muted);
      doc.text('Found', mfChartX + mfChartW - 39, mfLegY + 3.5);
      doc.setFillColor(...green);
      doc.rect(mfChartX + mfChartW - 22, mfLegY, 4, 4, 'F');
      doc.text('Resolved', mfChartX + mfChartW - 16, mfLegY + 3.5);

      y += mfBarChartH + 22;
    }

    if (rpt.trendMetrics && rpt.trendMetrics.length > 0) {
      checkPage(20);
      doc.setFontSize(13);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('Metrics Over Time', margin, y);
      y += 6;

      const metricNames = Array.from(new Set(rpt.trendMetrics.map(t => t.metricName)));
      const metricColors: RGB[] = [blue, green, hex('#a855f6'), hex('#f59e0b'), red];

      const dates = Array.from(new Set(rpt.trendMetrics.map(t => t.date))).sort();
      const recentDates = dates.slice(-8);

      const tmCols = [
        { label: 'Date', w: contentW * 0.25, align: 'left' as const },
        ...metricNames.map((name, i) => ({
          label: name.length > 12 ? name.substring(0, 11) + '.' : name,
          w: (contentW * 0.75) / metricNames.length,
          align: 'right' as const,
        })),
      ];
      drawTableHeader(tmCols);
      recentDates.forEach(date => {
        const cells: { text: string; color?: RGB }[] = [{ text: date }];
        metricNames.forEach((name, i) => {
          const metric = rpt.trendMetrics.find(t => t.date === date && t.metricName === name);
          cells.push({ text: metric ? metric.value.toFixed(1) : '-', color: metricColors[i % metricColors.length] });
        });
        drawTableRow(cells, tmCols);
      });
      y += 4;

      const tmChartH = 45;
      checkPage(tmChartH + 15);
      doc.setFontSize(10);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      doc.text('Trend Lines', margin, y + 4);
      y += 10;

      const tmChartX = margin + 12;
      const tmChartW = contentW - 18;
      const allVals = rpt.trendMetrics.filter(t => recentDates.includes(t.date)).map(t => t.value);
      const tmMax = Math.max(...allVals, 1);
      const tmMin = Math.min(...allVals, 0);
      const tmRange = tmMax - tmMin || 1;

      drawRoundedRect(margin, y - 2, contentW, tmChartH + 22, 3, cardBg, border);

      doc.setDrawColor(...border);
      doc.setLineWidth(0.1);
      for (let i = 0; i <= 4; i++) {
        const lineY = y + 2 + (tmChartH * (4 - i) / 4);
        doc.line(tmChartX, lineY, tmChartX + tmChartW, lineY);
        doc.setFontSize(6);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.text(String(Math.round(tmMin + tmRange * i / 4)), tmChartX - 2, lineY + 1.5, { align: 'right' });
      }

      metricNames.forEach((name, mi) => {
        const pts = recentDates
          .map((date, di) => {
            const metric = rpt.trendMetrics.find(t => t.date === date && t.metricName === name);
            if (!metric) return null;
            const px = tmChartX + (di / Math.max(recentDates.length - 1, 1)) * tmChartW;
            const py = y + 2 + tmChartH - ((metric.value - tmMin) / tmRange) * tmChartH;
            return { x: px, y: py };
          })
          .filter(Boolean) as { x: number; y: number }[];

        const col = metricColors[mi % metricColors.length];
        doc.setDrawColor(...col);
        doc.setLineWidth(0.8);
        for (let i = 1; i < pts.length; i++) {
          doc.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        }
        pts.forEach(pt => {
          doc.setFillColor(...col);
          doc.circle(pt.x, pt.y, 1, 'F');
        });
      });

      recentDates.forEach((date, i) => {
        const px = tmChartX + (i / Math.max(recentDates.length - 1, 1)) * tmChartW;
        doc.setFontSize(5);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.text(date, px, y + 2 + tmChartH + 5, { align: 'center' });
      });

      const tmLegY = y + tmChartH + 10;
      const tmLegSpacing = Math.min(35, tmChartW / metricNames.length);
      metricNames.forEach((name, i) => {
        const lx = tmChartX + i * tmLegSpacing;
        doc.setFillColor(...metricColors[i % metricColors.length]);
        doc.rect(lx, tmLegY, 4, 4, 'F');
        doc.setFontSize(5);
        doc.setTextColor(...muted);
        const shortN = name.length > 10 ? name.substring(0, 9) + '.' : name;
        doc.text(shortN, lx + 5.5, tmLegY + 3.5);
      });

      y += tmChartH + 26;
    }

    if (rpt.monthlyComparison && rpt.monthlyComparison.some(m => m.totalVulnerabilities > 0)) {
      checkPage(20);
      doc.setFontSize(13);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('3-Month Vulnerability Trend', margin, y);
      y += 6;

      const trendCols = [
        { label: 'Month', w: contentW * 0.25, align: 'left' as const },
        { label: 'Total', w: contentW * 0.2, align: 'right' as const },
        { label: 'Resolved', w: contentW * 0.2, align: 'right' as const },
        { label: 'Open', w: contentW * 0.15, align: 'right' as const },
        { label: 'Resolution Rate', w: contentW * 0.2, align: 'right' as const },
      ];
      drawTableHeader(trendCols);
      rpt.monthlyComparison.forEach(m => {
        const rateColor: RGB = m.resolutionRate >= 80 ? green : m.resolutionRate >= 60 ? yellow : red;
        drawTableRow([
          { text: `${m.month} ${m.year}${m.isCurrent ? ' (Current)' : ''}`, color: m.isCurrent ? blue : white },
          { text: m.totalVulnerabilities.toLocaleString() },
          { text: m.resolved.toLocaleString(), color: green },
          { text: m.open.toLocaleString(), color: red },
          { text: `${m.resolutionRate}%`, color: rateColor },
        ], trendCols);
      });
      y += 4;

      const monthsWithData = rpt.monthlyComparison.filter(m => m.totalVulnerabilities > 0);
      if (monthsWithData.length > 0) {
        const trendChartH = 50;
        checkPage(trendChartH + 15);
        doc.setFontSize(10);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Trend Chart', margin, y + 4);
        y += 10;

        const tChartX = margin + 12;
        const tChartW = contentW - 18;
        const tChartH = 38;
        const tMaxVal = Math.max(...monthsWithData.map(m => m.totalVulnerabilities));
        const groupW = tChartW / monthsWithData.length;
        const singleBarW = Math.min(groupW * 0.25, 12);

        drawRoundedRect(margin, y - 2, contentW, tChartH + 18, 3, cardBg, border);

        doc.setDrawColor(...border);
        doc.setLineWidth(0.1);
        for (let i = 0; i <= 4; i++) {
          const lineY = y + 2 + (tChartH * (4 - i) / 4);
          doc.line(tChartX, lineY, tChartX + tChartW, lineY);
          doc.setFontSize(6);
          doc.setTextColor(...muted);
          doc.setFont('helvetica', 'normal');
          doc.text(String(Math.round(tMaxVal * i / 4)), tChartX - 2, lineY + 1.5, { align: 'right' });
        }

        const tBarBaseY = y + 2 + tChartH;
        monthsWithData.forEach((m, i) => {
          const groupCenterX = tChartX + (i + 0.5) * groupW;
          const totalBarH = tMaxVal > 0 ? (m.totalVulnerabilities / tMaxVal) * tChartH : 0;
          const resolvedBarH = tMaxVal > 0 ? (m.resolved / tMaxVal) * tChartH : 0;
          const openBarH = tMaxVal > 0 ? (m.open / tMaxVal) * tChartH : 0;

          doc.setFillColor(...blue);
          doc.rect(groupCenterX - singleBarW * 1.5 - 1, tBarBaseY - totalBarH, singleBarW, totalBarH, 'F');
          doc.setFillColor(...green);
          doc.rect(groupCenterX - singleBarW * 0.5, tBarBaseY - resolvedBarH, singleBarW, resolvedBarH, 'F');
          doc.setFillColor(...red);
          doc.rect(groupCenterX + singleBarW * 0.5 + 1, tBarBaseY - openBarH, singleBarW, openBarH, 'F');

          doc.setFontSize(6);
          doc.setTextColor(...(m.isCurrent ? blue : muted));
          doc.setFont('helvetica', 'bold');
          doc.text(`${m.month.substring(0, 3)}`, groupCenterX, tBarBaseY + 5, { align: 'center' });
        });

        const tLegendY = y + tChartH + 10;
        [[blue, 'Total'], [green, 'Resolved'], [red, 'Open']].forEach(([col, lbl], i) => {
          const lx = tChartX + tChartW - 70 + i * 25;
          doc.setFillColor(...(col as RGB));
          doc.rect(lx, tLegendY, 4, 4, 'F');
          doc.setFontSize(6);
          doc.setTextColor(...muted);
          doc.text(lbl as string, lx + 5.5, tLegendY + 3.5);
        });

        y += tChartH + 22;
      }
    }

    if (rpt.assessments && rpt.assessments.length > 0) {
      checkPage(20);
      doc.setFontSize(13);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('Assessment Comparison (Current vs Previous Cycle)', margin, y);
      y += 6;

      const assessCols = [
        { label: 'Type', w: contentW * 0.25, align: 'left' as const },
        { label: 'Prev Done', w: contentW * 0.15, align: 'right' as const },
        { label: 'Curr Done', w: contentW * 0.15, align: 'right' as const },
        { label: 'Prev Vulns', w: contentW * 0.15, align: 'right' as const },
        { label: 'Curr Vulns', w: contentW * 0.15, align: 'right' as const },
        { label: 'Change', w: contentW * 0.15, align: 'right' as const },
      ];
      drawTableHeader(assessCols);
      const assessData: { label: string; prev: number; curr: number }[] = [];
      rpt.assessments.forEach(a => {
        const prevV = a.previousCritical + a.previousHigh + a.previousMedium + a.previousLow;
        const currV = a.currentCritical + a.currentHigh + a.currentMedium + a.currentLow;
        const change = currV - prevV;
        assessData.push({ label: ASSESSMENT_LABELS[a.assessmentType] || a.assessmentType, prev: prevV, curr: currV });
        drawTableRow([
          { text: ASSESSMENT_LABELS[a.assessmentType] || a.assessmentType },
          { text: String(a.previousCompleted) },
          { text: String(a.currentCompleted) },
          { text: String(prevV) },
          { text: String(currV) },
          { text: change > 0 ? `+${change}` : String(change), color: change <= 0 ? green : red },
        ], assessCols);
      });
      y += 4;

      if (assessData.length > 0) {
        const aChartH = 55;
        checkPage(aChartH + 15);
        doc.setFontSize(10);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessment Vulnerabilities: Previous vs Current Cycle', margin, y + 4);
        y += 10;

        const aChartX = margin + 12;
        const aChartW = contentW - 18;
        const aBarChartH = 38;
        const aMaxVal = Math.max(...assessData.map(d => Math.max(d.prev, d.curr)));
        const aGroupW = aChartW / assessData.length;
        const aBarW = Math.min(aGroupW * 0.3, 10);

        drawRoundedRect(margin, y - 2, contentW, aBarChartH + 22, 3, cardBg, border);

        doc.setDrawColor(...border);
        doc.setLineWidth(0.1);
        for (let i = 0; i <= 4; i++) {
          const lineY = y + 2 + (aBarChartH * (4 - i) / 4);
          doc.line(aChartX, lineY, aChartX + aChartW, lineY);
          doc.setFontSize(6);
          doc.setTextColor(...muted);
          doc.setFont('helvetica', 'normal');
          doc.text(String(Math.round(aMaxVal * i / 4)), aChartX - 2, lineY + 1.5, { align: 'right' });
        }

        const aBarBase = y + 2 + aBarChartH;
        assessData.forEach((d, i) => {
          const cx = aChartX + (i + 0.5) * aGroupW;
          const prevH = aMaxVal > 0 ? (d.prev / aMaxVal) * aBarChartH : 0;
          const currH = aMaxVal > 0 ? (d.curr / aMaxVal) * aBarChartH : 0;
          doc.setFillColor(...muted);
          doc.rect(cx - aBarW - 0.5, aBarBase - prevH, aBarW, prevH, 'F');
          doc.setFillColor(...blue);
          doc.rect(cx + 0.5, aBarBase - currH, aBarW, currH, 'F');
          doc.setFontSize(5);
          doc.setTextColor(...muted);
          doc.setFont('helvetica', 'normal');
          const shortLabel = d.label.length > 8 ? d.label.substring(0, 7) + '.' : d.label;
          doc.text(shortLabel, cx, aBarBase + 5, { align: 'center' });
        });

        const aLegY = y + aBarChartH + 13;
        doc.setFillColor(...muted);
        doc.rect(aChartX + aChartW - 50, aLegY, 4, 4, 'F');
        doc.setFontSize(6);
        doc.setTextColor(...muted);
        doc.text('Previous', aChartX + aChartW - 44, aLegY + 3.5);
        doc.setFillColor(...blue);
        doc.rect(aChartX + aChartW - 24, aLegY, 4, 4, 'F');
        doc.text('Current', aChartX + aChartW - 18, aLegY + 3.5);

        y += aBarChartH + 26;
      }
    }

    if (rpt.basSimulations && rpt.basSimulations.length > 0) {
      checkPage(20);
      doc.setFontSize(13);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('BAS Simulation Performance', margin, y);
      y += 6;

      const basCols = [
        { label: 'Simulation Type', w: contentW * 0.35, align: 'left' as const },
        { label: 'Prevention Rate', w: contentW * 0.2, align: 'right' as const },
        { label: 'Detection Rate', w: contentW * 0.2, align: 'right' as const },
        { label: 'Total Sims', w: contentW * 0.25, align: 'right' as const },
      ];

      const simTypes = Array.from(new Set(rpt.basSimulations.map(s => s.simulationType)));
      const monthSet = new Set(rpt.basSimulations.map(s => `${s.year}-${String(parseInt(s.month)).padStart(2, '0')}`));
      const latestMonth = Array.from(monthSet).sort().pop();

      const basChartData: { label: string; prevention: number; detection: number }[] = [];
      drawTableHeader(basCols);
      simTypes.forEach(type => {
        const curr = rpt.basSimulations!.find(s => s.simulationType === type && `${s.year}-${String(parseInt(s.month)).padStart(2, '0')}` === latestMonth);
        const prevRate = curr?.preventionRate || 0;
        const detRate = curr?.detectionRate || 0;
        const prevColor: RGB = prevRate >= 80 ? green : prevRate >= 60 ? yellow : red;
        const detColor: RGB = detRate >= 80 ? green : detRate >= 60 ? yellow : red;
        basChartData.push({ label: SIMULATION_LABELS[type] || type, prevention: prevRate, detection: detRate });
        drawTableRow([
          { text: SIMULATION_LABELS[type] || type },
          { text: `${prevRate.toFixed(1)}%`, color: prevColor },
          { text: `${detRate.toFixed(1)}%`, color: detColor },
          { text: String(curr?.totalSimulations || 0) },
        ], basCols);
      });
      y += 4;

      if (basChartData.length > 0) {
        const basBarH = 6;
        const basVisH = basChartData.length * (basBarH + 8) + 12;
        checkPage(basVisH + 10);
        doc.setFontSize(10);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'bold');
        doc.text('Prevention & Detection Rates', margin, y + 4);
        y += 10;

        const basBarX = margin + contentW * 0.32;
        const basBarAreaW = contentW * 0.55;
        basChartData.forEach(d => {
          doc.setFontSize(7);
          doc.setTextColor(...white);
          doc.setFont('helvetica', 'normal');
          doc.text(d.label, margin, y + 2);

          doc.setFillColor(...cardBg);
          doc.roundedRect(basBarX, y - 1, basBarAreaW, basBarH, 1, 1, 'F');
          const pFill = Math.max((d.prevention / 100) * basBarAreaW, 2);
          const pColor: RGB = d.prevention >= 80 ? green : d.prevention >= 60 ? yellow : red;
          doc.setFillColor(...pColor);
          doc.roundedRect(basBarX, y - 1, pFill, basBarH, 1, 1, 'F');
          doc.setFontSize(6);
          doc.setTextColor(...white);
          doc.setFont('helvetica', 'bold');
          doc.text(`${d.prevention.toFixed(0)}%`, basBarX + basBarAreaW + 3, y + 2);
          doc.setFontSize(5);
          doc.setTextColor(...muted);
          doc.text('Prev', basBarX + basBarAreaW + 13, y + 2);
          y += basBarH + 1;

          doc.setFillColor(...cardBg);
          doc.roundedRect(basBarX, y - 1, basBarAreaW, basBarH, 1, 1, 'F');
          const dFill = Math.max((d.detection / 100) * basBarAreaW, 2);
          const dColor: RGB = d.detection >= 80 ? green : d.detection >= 60 ? yellow : red;
          doc.setFillColor(...dColor);
          doc.roundedRect(basBarX, y - 1, dFill, basBarH, 1, 1, 'F');
          doc.setFontSize(6);
          doc.setTextColor(...white);
          doc.setFont('helvetica', 'bold');
          doc.text(`${d.detection.toFixed(0)}%`, basBarX + basBarAreaW + 3, y + 2);
          doc.setFontSize(5);
          doc.setTextColor(...muted);
          doc.text('Det', basBarX + basBarAreaW + 13, y + 2);
          y += basBarH + 3;
        });
        y += 4;
      }
    }

    return y;
  };

  const addPdfFooter = (doc: jsPDF) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.footer);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString()} | IVM Security Dashboard | Page ${i} of ${totalPages}`, pageW / 2, pageH - 8, { align: 'center' });
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      renderTeamReport(doc, report, teamLabel, 15, true);
      addPdfFooter(doc);
      doc.save(`${teamLabel.replace(/\s+/g, '_')}_Security_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportConsolidatedPdf = async () => {
    setIsExportingConsolidated(true);
    try {
      const allReports: { report: ReportData; label: string }[] = [];
      for (const team of TEAMS) {
        const res = await fetch(`/api/report/${team.value}`);
        if (!res.ok) throw new Error(`Failed to fetch ${team.label} report`);
        const data: ReportData = await res.json();
        allReports.push({ report: data, label: team.label });
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      const { bg, cardBg, border, white, blue, muted, green, red, redSolid, yellow, severityText } = COLORS;

      doc.setFillColor(...bg);
      doc.rect(0, 0, pageW, pageH, 'F');

      let y = 40;
      doc.setFontSize(28);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('IVM Consolidated', pageW / 2, y, { align: 'center' });
      y += 12;
      doc.text('Security Report', pageW / 2, y, { align: 'center' });
      y += 15;

      doc.setDrawColor(...blue);
      doc.setLineWidth(1);
      doc.line(pageW / 2 - 40, y, pageW / 2 + 40, y);
      y += 12;

      doc.setFontSize(12);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.text(allReports[0]?.report.reportMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), pageW / 2, y, { align: 'center' });
      y += 20;

      doc.setFontSize(10);
      doc.setTextColor(...blue);
      doc.text('Teams Included:', pageW / 2, y, { align: 'center' });
      y += 8;
      TEAMS.forEach(t => {
        doc.setFontSize(10);
        doc.setTextColor(...white);
        doc.text(t.label, pageW / 2, y, { align: 'center' });
        y += 6;
      });

      y += 15;

      const totalOpen = allReports.reduce((s, r) => s + r.report.totalOpenFindings, 0);
      const totalClosed = allReports.reduce((s, r) => s + r.report.totalClosedFindings, 0);
      const avgMttr = allReports.reduce((s, r) => s + r.report.mttr, 0) / allReports.length;
      const avgRemediation = allReports.reduce((s, r) => s + r.report.remediationRate, 0) / allReports.length;
      const avgRisk = allReports.reduce((s, r) => s + r.report.riskScore, 0) / allReports.length;

      doc.setFontSize(13);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('Organization Overview', margin, y);
      y += 8;

      const ow = (contentW - 12) / 5;
      const overviewCards = [
        { label: 'Total Open', value: totalOpen.toLocaleString(), hl: totalOpen > 500 },
        { label: 'Total Closed', value: totalClosed.toLocaleString(), hl: false },
        { label: 'Avg MTTR', value: `${avgMttr.toFixed(1)}d`, hl: false },
        { label: 'Avg Remediation', value: `${avgRemediation.toFixed(0)}%`, hl: avgRemediation < 70 },
        { label: 'Avg Risk', value: `${avgRisk.toFixed(1)}/10`, hl: avgRisk > 7 },
      ];

      overviewCards.forEach((card, i) => {
        const cx = margin + i * (ow + 3);
        doc.setFillColor(...cardBg);
        doc.roundedRect(cx, y, ow, 28, 2, 2, 'F');
        doc.setDrawColor(...(card.hl ? redSolid : border));
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, y, ow, 28, 2, 2, 'S');
        doc.setFontSize(7);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.text(card.label, cx + ow / 2, y + 10, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(...(card.hl ? redSolid : white));
        doc.setFont('helvetica', 'bold');
        doc.text(card.value, cx + ow / 2, y + 21, { align: 'center' });
      });
      y += 40;

      doc.setFontSize(13);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('Team Comparison', margin, y);
      y += 6;

      const compCols = [
        { label: 'Team', w: contentW * 0.25, align: 'left' as const },
        { label: 'Open', w: contentW * 0.12, align: 'right' as const },
        { label: 'Closed', w: contentW * 0.12, align: 'right' as const },
        { label: 'MTTR', w: contentW * 0.12, align: 'right' as const },
        { label: 'Remediation', w: contentW * 0.13, align: 'right' as const },
        { label: 'Coverage', w: contentW * 0.13, align: 'right' as const },
        { label: 'Risk', w: contentW * 0.13, align: 'right' as const },
      ];

      let hx = margin;
      doc.setFillColor(...cardBg);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      compCols.forEach(col => {
        const tx = col.align === 'right' ? hx + col.w - 2 : hx + 2;
        doc.text(col.label, tx, y + 5, { align: col.align });
        hx += col.w;
      });
      y += 8;
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 1, pageW - margin, y - 1);

      allReports.forEach(({ report: r, label }) => {
        let rx = margin;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const cells: { text: string; color?: RGB }[] = [
          { text: label, color: blue },
          { text: r.totalOpenFindings.toLocaleString(), color: r.totalOpenFindings > 100 ? red : white },
          { text: r.totalClosedFindings.toLocaleString(), color: green },
          { text: `${r.mttr.toFixed(1)}d` },
          { text: `${r.remediationRate}%`, color: r.remediationRate >= 80 ? green : r.remediationRate >= 60 ? yellow : red },
          { text: `${r.coverage.toFixed(1)}%` },
          { text: `${r.riskScore.toFixed(1)}`, color: r.riskScore > 7 ? red : r.riskScore > 5 ? yellow : green },
        ];
        cells.forEach((cell, i) => {
          doc.setTextColor(...(cell.color || white));
          const tx = compCols[i].align === 'right' ? rx + compCols[i].w - 2 : rx + 2;
          doc.text(cell.text, tx, y + 4, { align: compCols[i].align });
          rx += compCols[i].w;
        });
        y += 7;
        doc.setDrawColor(...border);
        doc.setLineWidth(0.1);
        doc.line(margin, y - 1, pageW - margin, y - 1);
      });

      y += 6;
      const tcChartH = 55;
      const checkConsolidatedPage = (needed: number) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          doc.setFillColor(...bg);
          doc.rect(0, 0, pageW, pageH, 'F');
          y = margin;
        }
      };
      checkConsolidatedPage(tcChartH + 15);
      doc.setFontSize(12);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text('Team Risk & Remediation Comparison', margin, y);
      y += 8;

      const tcBarChartH = 40;
      const tcChartX = margin + 12;
      const tcChartW = contentW - 18;
      const tcGroupW = tcChartW / allReports.length;
      const tcBarW = Math.min(tcGroupW * 0.3, 14);

      doc.setFillColor(...cardBg);
      doc.roundedRect(margin, y - 2, contentW, tcBarChartH + 22, 3, 3, 'F');
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y - 2, contentW, tcBarChartH + 22, 3, 3, 'S');

      doc.setDrawColor(...border);
      doc.setLineWidth(0.1);
      for (let i = 0; i <= 4; i++) {
        const lineY = y + 2 + (tcBarChartH * (4 - i) / 4);
        doc.line(tcChartX, lineY, tcChartX + tcChartW, lineY);
        doc.setFontSize(6);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.text(`${i * 25}%`, tcChartX - 2, lineY + 1.5, { align: 'right' });
      }

      const tcBarBase = y + 2 + tcBarChartH;
      allReports.forEach(({ report: r, label }, i) => {
        const cx = tcChartX + (i + 0.5) * tcGroupW;
        const remH = (r.remediationRate / 100) * tcBarChartH;
        const riskH = ((r.riskScore / 10) * 100 / 100) * tcBarChartH;

        doc.setFillColor(...green);
        doc.rect(cx - tcBarW - 0.5, tcBarBase - remH, tcBarW, remH, 'F');
        doc.setFillColor(...(r.riskScore > 7 ? red : r.riskScore > 5 ? yellow : green));
        doc.rect(cx + 0.5, tcBarBase - riskH, tcBarW, riskH, 'F');

        doc.setFontSize(6);
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        const shortName = label.length > 12 ? label.substring(0, 11) + '.' : label;
        doc.text(shortName, cx, tcBarBase + 5, { align: 'center' });
      });

      const tcLegY = y + tcBarChartH + 13;
      doc.setFillColor(...green);
      doc.rect(tcChartX + tcChartW - 58, tcLegY, 4, 4, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...muted);
      doc.text('Remediation %', tcChartX + tcChartW - 52, tcLegY + 3.5);
      doc.setFillColor(...yellow);
      doc.rect(tcChartX + tcChartW - 25, tcLegY, 4, 4, 'F');
      doc.text('Risk (x10%)', tcChartX + tcChartW - 19, tcLegY + 3.5);

      y += tcBarChartH + 28;

      for (let i = 0; i < allReports.length; i++) {
        renderTeamReport(doc, allReports[i].report, allReports[i].label, 15, false);
      }

      addPdfFooter(doc);
      doc.save(`IVM_Consolidated_Security_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Consolidated PDF export failed:', error);
    } finally {
      setIsExportingConsolidated(false);
    }
  };

  const teamLabel = TEAMS.find(t => t.value === selectedTeam)?.label || selectedTeam;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-report-title">Monthly Status Report</h1>
          <p className="text-sm text-muted-foreground">
            Generate comprehensive security reports for client delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v as Team)}>
            <SelectTrigger className="w-[200px]" data-testid="select-report-team">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {TEAMS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-report">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            onClick={handleExportPdf} 
            disabled={isExporting || !report}
            data-testid="button-export-pdf"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportConsolidatedPdf} 
            disabled={isExportingConsolidated}
            data-testid="button-export-consolidated-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportingConsolidated ? "Generating..." : "Consolidated Report"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-muted-foreground">Failed to generate report. Please try again.</p>
          </CardContent>
        </Card>
      ) : report ? (
        <div ref={reportRef} className="space-y-6 print:space-y-4">
          <Card className="print:shadow-none print:border-2">
            <CardHeader className="text-center border-b">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Security Status Report</CardTitle>
              </div>
              <div className="text-lg font-medium">{teamLabel}</div>
              <div className="text-sm text-muted-foreground">{report.reportMonth}</div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Executive Summary
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SummaryCard
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label="Open Findings"
                    value={report.totalOpenFindings}
                    highlight={report.totalOpenFindings > 100}
                  />
                  <SummaryCard
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label="Closed Findings"
                    value={report.totalClosedFindings}
                  />
                  <SummaryCard
                    icon={<Clock className="h-5 w-5" />}
                    label="Avg. MTTR"
                    value={`${report.mttr.toFixed(1)} days`}
                  />
                  <SummaryCard
                    icon={<Shield className="h-5 w-5" />}
                    label="Remediation Rate"
                    value={`${report.remediationRate}%`}
                    highlight={report.remediationRate < 70}
                  />
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-lg font-semibold mb-4">Key Performance Indicators</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">KPI Name</th>
                        <th className="text-right py-2 px-3 font-medium">Current</th>
                        <th className="text-right py-2 px-3 font-medium">Previous</th>
                        <th className="text-right py-2 px-3 font-medium">Change</th>
                        <th className="text-right py-2 px-3 font-medium">Target</th>
                        <th className="text-right py-2 px-3 font-medium">Progress</th>
                        <th className="text-right py-2 px-3 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.kpis.map((kpi, index) => {
                        const change = kpi.previousValue != null ? kpi.value - kpi.previousValue : null;
                        const progress = kpi.progressToTarget || 0;
                        return (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-3">
                              <div>
                                <span className="font-medium">{kpi.name}</span>
                                {kpi.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-2 px-3 font-semibold">{kpi.value} {kpi.unit}</td>
                            <td className="text-right py-2 px-3 text-muted-foreground">
                              {kpi.previousValue != null ? `${kpi.previousValue} ${kpi.unit}` : '-'}
                            </td>
                            <td className="text-right py-2 px-3">
                              {change != null ? (
                                <Badge variant={change >= 0 ? "default" : "destructive"}>
                                  {change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)}
                                </Badge>
                              ) : '-'}
                            </td>
                            <td className="text-right py-2 px-3">
                              {kpi.target ? `${kpi.target} ${kpi.unit}` : '-'}
                            </td>
                            <td className="text-right py-2 px-3">
                              {kpi.progressToTarget ? (
                                <Badge variant={progress >= 100 ? "default" : progress >= 80 ? "secondary" : "destructive"}>
                                  {progress}%
                                </Badge>
                              ) : '-'}
                            </td>
                            <td className="text-right py-2 px-3">
                              {kpi.trend === 'up' ? <TrendingUp className="h-4 w-4 text-chart-2 inline" /> :
                               kpi.trend === 'down' ? <TrendingDown className="h-4 w-4 text-destructive inline" /> :
                               <Minus className="h-4 w-4 text-muted-foreground inline" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-lg font-semibold mb-4">Vulnerability Summary by Severity</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Severity</th>
                        <th className="text-right py-2 px-3 font-medium">Total Found</th>
                        <th className="text-right py-2 px-3 font-medium">Resolved</th>
                        <th className="text-right py-2 px-3 font-medium">Open</th>
                        <th className="text-right py-2 px-3 font-medium">Resolution Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["critical", "high", "medium", "low", "info"].map(severity => {
                        const data = report.vulnerabilitySummary[severity];
                        if (!data) return null;
                        const rate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
                        return (
                          <tr key={severity} className="border-b">
                            <td className="py-2 px-3">
                              <Badge variant={severity === "critical" || severity === "high" ? "destructive" : "secondary"}>
                                {severity.charAt(0).toUpperCase() + severity.slice(1)}
                              </Badge>
                            </td>
                            <td className="text-right py-2 px-3">{data.total.toLocaleString()}</td>
                            <td className="text-right py-2 px-3 text-chart-2">{data.resolved.toLocaleString()}</td>
                            <td className="text-right py-2 px-3 text-destructive">{data.open.toLocaleString()}</td>
                            <td className="text-right py-2 px-3">
                              <Badge variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"}>
                                {rate}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-lg font-semibold mb-4">Asset Coverage & Compliance</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatBox label="Total Assets" value={report.stats.totalAssets} />
                  <StatBox label="Assessed Assets" value={report.stats.assessedAssets} />
                  <StatBox label="Coverage" value={`${report.coverage.toFixed(1)}%`} />
                  <StatBox label="Risk Score" value={`${report.riskScore.toFixed(1)}/10`} highlight={report.riskScore > 7} />
                  <StatBox label="Compliance Score" value={`${(report.complianceScore ?? report.stats.complianceScore ?? 0).toFixed(1)}%`} />
                </div>
              </section>

              {report.monthlyFindings && report.monthlyFindings.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Monthly Findings Trend (Found vs Resolved)
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Month</th>
                            <th className="text-right py-2 px-3 font-medium">Found</th>
                            <th className="text-right py-2 px-3 font-medium">Resolved</th>
                            <th className="text-right py-2 px-3 font-medium">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.monthlyFindings.map((mf, idx) => {
                            const diff = mf.found - mf.resolved;
                            return (
                              <tr key={idx} className="border-b">
                                <td className="py-2 px-3 font-medium">
                                  {mf.month}
                                </td>
                                <td className="text-right py-2 px-3 text-destructive">{mf.found.toLocaleString()}</td>
                                <td className="text-right py-2 px-3 text-chart-2">{mf.resolved.toLocaleString()}</td>
                                <td className="text-right py-2 px-3">
                                  <Badge variant={diff <= 0 ? "default" : "destructive"}>
                                    {diff > 0 ? `+${diff}` : diff}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {report.trendMetrics && report.trendMetrics.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Metrics Over Time
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Date</th>
                            {Array.from(new Set(report.trendMetrics.map(t => t.metricName))).map(name => (
                              <th key={name} className="text-right py-2 px-3 font-medium">{name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const metricNames = Array.from(new Set(report.trendMetrics.map(t => t.metricName)));
                            const dates = Array.from(new Set(report.trendMetrics.map(t => t.date))).sort().slice(-8);
                            return dates.map(date => (
                              <tr key={date} className="border-b">
                                <td className="py-2 px-3 font-medium">
                                  {date}
                                </td>
                                {metricNames.map(name => {
                                  const metric = report.trendMetrics.find(t => t.date === date && t.metricName === name);
                                  return (
                                    <td key={name} className="text-right py-2 px-3">
                                      {metric ? metric.value.toFixed(1) : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {/* Team-specific sections */}
              {report.monthlyComparison && report.monthlyComparison.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      3-Month Vulnerability Trend
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Month</th>
                            <th className="text-right py-2 px-3 font-medium">Total</th>
                            <th className="text-right py-2 px-3 font-medium">Resolved</th>
                            <th className="text-right py-2 px-3 font-medium">Open</th>
                            <th className="text-right py-2 px-3 font-medium">Resolution Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.monthlyComparison.map((m, idx) => (
                            <tr key={idx} className={`border-b ${m.isCurrent ? "bg-primary/5" : ""}`}>
                              <td className="py-2 px-3 font-medium">
                                {m.month} {m.year}
                                {m.isCurrent && <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>}
                              </td>
                              <td className="text-right py-2 px-3">{m.totalVulnerabilities.toLocaleString()}</td>
                              <td className="text-right py-2 px-3 text-chart-2">{m.resolved.toLocaleString()}</td>
                              <td className="text-right py-2 px-3 text-destructive">{m.open.toLocaleString()}</td>
                              <td className="text-right py-2 px-3">
                                <Badge variant={m.resolutionRate >= 80 ? "default" : m.resolutionRate >= 60 ? "secondary" : "destructive"}>
                                  {m.resolutionRate}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {report.assessments && report.assessments.length > 0 && (
                <>
                  <Separator />
                  <AssessmentReportSection assessments={report.assessments} />
                </>
              )}

              {report.basSimulations && report.basSimulations.length > 0 && (
                <>
                  <Separator />
                  <BasSimulationReportSection simulations={report.basSimulations} />
                </>
              )}

              <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                Report generated on {new Date(report.generatedAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

    </div>
  );
}

function SummaryCard({ 
  icon, 
  label, 
  value, 
  highlight 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? "border-destructive bg-destructive/5" : "bg-muted/50"}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-destructive" : ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}


function StatBox({ 
  label, 
  value,
  highlight 
}: { 
  label: string; 
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center p-4 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-destructive" : ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

const ASSESSMENT_LABELS: Record<string, string> = {
  ad: "Active Directory",
  cloud: "Cloud Infrastructure",
  external_network: "External Network",
  internal_network: "Internal Network",
  file_sharing: "File Sharing",
  osint: "OSINT",
  wifi: "WiFi",
  c2c: "C2C",
  phishing: "Phishing"
};

const SIMULATION_LABELS: Record<string, string> = {
  network_infiltration: "Network Infiltration",
  endpoint_security: "Endpoint Security",
  waf_f5: "WAF F5",
  waf_threatx: "WAF ThreatX",
  email_gateway: "Email Gateway",
  ad_assessment: "AD Assessment",
  cve_critical: "CVE Critical"
};

function AssessmentReportSection({ assessments }: { assessments: Assessment[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5" />
        Assessment Comparison (Current vs Previous Cycle)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">Assessment Type</th>
              <th className="text-right py-2 px-3 font-medium">Prev Completed</th>
              <th className="text-right py-2 px-3 font-medium">Curr Completed</th>
              <th className="text-right py-2 px-3 font-medium">Prev Vulns</th>
              <th className="text-right py-2 px-3 font-medium">Curr Vulns</th>
              <th className="text-right py-2 px-3 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(a => {
              const prevVulns = a.previousCritical + a.previousHigh + a.previousMedium + a.previousLow;
              const currVulns = a.currentCritical + a.currentHigh + a.currentMedium + a.currentLow;
              const change = currVulns - prevVulns;
              
              return (
                <tr key={a.id} className="border-b">
                  <td className="py-2 px-3 font-medium">{ASSESSMENT_LABELS[a.assessmentType] || a.assessmentType}</td>
                  <td className="text-right py-2 px-3">{a.previousCompleted}</td>
                  <td className="text-right py-2 px-3">{a.currentCompleted}</td>
                  <td className="text-right py-2 px-3">{prevVulns}</td>
                  <td className="text-right py-2 px-3">{currVulns}</td>
                  <td className="text-right py-2 px-3">
                    <Badge variant={change <= 0 ? "default" : "destructive"}>
                      {change > 0 ? `+${change}` : change}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BasSimulationReportSection({ simulations }: { simulations: BasSimulation[] }) {
  const simulationTypes = Array.from(new Set(simulations.map(s => s.simulationType)));
  
  const monthSet = new Set(simulations.map(s => `${s.year}-${String(parseInt(s.month)).padStart(2, '0')}`));
  const sortedMonths = Array.from(monthSet).sort().slice(-2);
  const [prevMonth, currMonth] = sortedMonths;
  
  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        BAS Simulation Performance {prevMonth && currMonth && `(${getMonthLabel(prevMonth)} vs ${getMonthLabel(currMonth)})`}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">Simulation Type</th>
              <th className="text-right py-2 px-3 font-medium">Prevention Rate</th>
              <th className="text-right py-2 px-3 font-medium">Detection Rate</th>
              <th className="text-right py-2 px-3 font-medium">Total Simulations</th>
              <th className="text-right py-2 px-3 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {simulationTypes.map(type => {
              const currData = simulations.find(s => s.simulationType === type && `${s.year}-${String(parseInt(s.month)).padStart(2, '0')}` === currMonth);
              const prevData = simulations.find(s => s.simulationType === type && `${s.year}-${String(parseInt(s.month)).padStart(2, '0')}` === prevMonth);
              
              const currPrev = currData?.preventionRate || 0;
              const prevPrev = prevData?.preventionRate || 0;
              const improvement = currPrev - prevPrev;
              
              return (
                <tr key={type} className="border-b">
                  <td className="py-2 px-3 font-medium">{SIMULATION_LABELS[type] || type}</td>
                  <td className="text-right py-2 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <Progress value={currPrev} className="w-16 h-2" />
                      <span>{currPrev.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <Progress value={currData?.detectionRate || 0} className="w-16 h-2" />
                      <span>{(currData?.detectionRate || 0).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-3">{currData?.totalSimulations || 0}</td>
                  <td className="text-right py-2 px-3">
                    <Badge variant={improvement >= 0 ? "default" : "destructive"}>
                      {improvement >= 0 ? (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {improvement > 0 ? `+${improvement.toFixed(1)}%` : "Stable"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {improvement.toFixed(1)}%
                        </span>
                      )}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
