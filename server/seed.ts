import { storage } from "./storage";
import type { Team, Severity, Trend, InsertKpiMetric, InsertVulnerability, InsertTeamStats, InsertTrendData, AssessmentType, InsertAssessment, SimulationType, InsertBasSimulation, Quarter, InsertQuarterlyAssessment } from "@shared/schema";

const TEAMS: Team[] = ["application", "infrastructure", "offensive", "cti", "bas"];
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
const ASSESSMENT_TYPES: AssessmentType[] = ["ad", "cloud", "external_network", "internal_network", "file_sharing", "osint", "wifi", "c2c", "phishing"];
const SIMULATION_TYPES: SimulationType[] = ["network_infiltration", "endpoint_security", "waf_f5", "waf_threatx", "email_gateway", "ad_assessment", "cve_critical"];

const TEAM_KPIS: Record<Team, { name: string; value: number; previousValue: number; unit: string; target: number; trend: Trend; description: string }[]> = {
  application: [
    { name: "Apps Tested (Internal)", value: 24, previousValue: 21, unit: "apps", target: 30, trend: "up", description: "Internal applications tested this month" },
    { name: "Apps Tested (External)", value: 18, previousValue: 15, unit: "apps", target: 25, trend: "up", description: "External-facing applications tested this month" },
    { name: "Open Vulnerabilities", value: 156, previousValue: 189, unit: "findings", target: 100, trend: "down", description: "Vulnerabilities pending remediation" },
    { name: "Remediation Rate", value: 78.4, previousValue: 72.1, unit: "%", target: 90, trend: "up", description: "Vulnerabilities remediated within SLA" },
    { name: "Avg Remediation Time", value: 18.5, previousValue: 22.3, unit: "days", target: 14, trend: "down", description: "Average time to fix vulnerabilities" },
    { name: "Retest Pass Rate", value: 92.3, previousValue: 88.7, unit: "%", target: 95, trend: "up", description: "Vulnerabilities verified as fixed on retest" },
  ],
  infrastructure: [
    { name: "Patch Compliance", value: 91.3, previousValue: 88.7, unit: "%", target: 95, trend: "up", description: "Systems with latest security patches" },
    { name: "Scan Coverage", value: 96.8, previousValue: 94.2, unit: "%", target: 100, trend: "up", description: "Network assets under vulnerability scanning" },
    { name: "Cloud Misconfigs", value: 47, previousValue: 62, unit: "issues", target: 25, trend: "down", description: "Cloud infrastructure misconfigurations" },
    { name: "Endpoint Coverage", value: 98.5, previousValue: 97.1, unit: "%", target: 100, trend: "up", description: "Endpoints with security agents" },
    { name: "Network Segments", value: 24, previousValue: 22, unit: "segments", target: 30, trend: "up", description: "Network segments assessed" },
    { name: "Firewall Rules", value: 1247, previousValue: 1312, unit: "rules", target: 1000, trend: "down", description: "Active firewall rules reviewed" },
  ],
  offensive: [
    { name: "Tests Completed", value: 28, previousValue: 24, unit: "tests", target: 36, trend: "up", description: "Penetration tests completed this quarter" },
    { name: "Critical Findings", value: 7, previousValue: 12, unit: "findings", target: 5, trend: "down", description: "Critical vulnerabilities from pentests" },
    { name: "Retests Passed", value: 89.3, previousValue: 84.6, unit: "%", target: 95, trend: "up", description: "Remediation verification success rate" },
    { name: "Coverage Rate", value: 76.4, previousValue: 71.2, unit: "%", target: 85, trend: "up", description: "Applications tested this year" },
    { name: "Red Team Ops", value: 4, previousValue: 3, unit: "exercises", target: 6, trend: "up", description: "Red team exercises completed" },
    { name: "Avg Dwell Time", value: 2.3, previousValue: 3.1, unit: "days", target: 1, trend: "down", description: "Average undetected access duration" },
  ],
  cti: [
    { name: "Active Threats", value: 23, previousValue: 31, unit: "threats", target: 15, trend: "down", description: "Active threat actors being monitored" },
    { name: "IOCs Processed", value: 45892, previousValue: 41234, unit: "IOCs", target: 50000, trend: "up", description: "Indicators of compromise processed" },
    { name: "Intel Reports", value: 47, previousValue: 42, unit: "reports", target: 50, trend: "up", description: "Threat intelligence reports published" },
    { name: "Detection Rate", value: 94.7, previousValue: 92.3, unit: "%", target: 98, trend: "up", description: "Threats detected by CTI feeds" },
    { name: "Feed Sources", value: 18, previousValue: 16, unit: "sources", target: 20, trend: "up", description: "Active threat intelligence feeds" },
    { name: "Alert Triage", value: 89.2, previousValue: 86.8, unit: "%", target: 95, trend: "up", description: "Alerts triaged within SLA" },
  ],
  bas: [
    { name: "Simulations Run", value: 1247, previousValue: 1089, unit: "tests", target: 1500, trend: "up", description: "Attack simulations executed" },
    { name: "Detection Rate", value: 78.4, previousValue: 73.2, unit: "%", target: 90, trend: "up", description: "Attacks detected by security controls" },
    { name: "Prevention Rate", value: 67.8, previousValue: 62.4, unit: "%", target: 85, trend: "up", description: "Attacks blocked by security controls" },
    { name: "Attack Coverage", value: 72.3, previousValue: 68.9, unit: "%", target: 80, trend: "up", description: "MITRE ATT&CK framework coverage" },
    { name: "Control Gaps", value: 34, previousValue: 41, unit: "gaps", target: 20, trend: "down", description: "Security control gaps identified" },
    { name: "Avg Response", value: 4.7, previousValue: 5.8, unit: "mins", target: 3, trend: "down", description: "Average detection response time" },
  ],
};

const TEAM_STATS: Record<Team, InsertTeamStats> = {
  application: {
    team: "application",
    totalAssets: 1247,
    assessedAssets: 1089,
    openFindings: 456,
    closedFindings: 1823,
    mttr: 12.4,
    riskScore: 6.2,
    coverage: 87.3,
    complianceScore: 89.5,
  },
  infrastructure: {
    team: "infrastructure",
    totalAssets: 8934,
    assessedAssets: 8645,
    openFindings: 723,
    closedFindings: 4521,
    mttr: 8.7,
    riskScore: 5.4,
    coverage: 96.8,
    complianceScore: 92.1,
  },
  offensive: {
    team: "offensive",
    totalAssets: 156,
    assessedAssets: 119,
    openFindings: 89,
    closedFindings: 234,
    mttr: 21.3,
    riskScore: 7.8,
    coverage: 76.3,
    complianceScore: 78.4,
  },
  cti: {
    team: "cti",
    totalAssets: 45,
    assessedAssets: 45,
    openFindings: 23,
    closedFindings: 156,
    mttr: 2.1,
    riskScore: 4.2,
    coverage: 100,
    complianceScore: 94.7,
  },
  bas: {
    team: "bas",
    totalAssets: 89,
    assessedAssets: 76,
    openFindings: 34,
    closedFindings: 187,
    mttr: 5.6,
    riskScore: 5.8,
    coverage: 85.4,
    complianceScore: 81.2,
  },
};

function generateVulnerabilities(team: Team): InsertVulnerability[] {
  const vulns: InsertVulnerability[] = [];
  
  const baseCounts: Record<Severity, { min: number; max: number }> = {
    critical: { min: 5, max: 25 },
    high: { min: 20, max: 80 },
    medium: { min: 50, max: 150 },
    low: { min: 30, max: 100 },
  };

  for (const month of MONTHS) {
    const year = month === "Jan" ? 2026 : 2025;
    for (const severity of SEVERITIES) {
      const base = baseCounts[severity];
      const count = Math.floor(Math.random() * (base.max - base.min + 1)) + base.min;
      const resolvedRate = severity === "critical" ? 0.85 : 
                          severity === "high" ? 0.75 :
                          severity === "medium" ? 0.65 :
                          severity === "low" ? 0.55 : 0.45;
      const resolvedCount = Math.floor(count * resolvedRate);
      
      vulns.push({
        team,
        severity,
        count,
        resolvedCount,
        month,
        year,
      });
    }
  }
  
  return vulns;
}

function generateAssessments(): InsertAssessment[] {
  const assessmentData: InsertAssessment[] = [];
  
  const assessmentConfig: Record<AssessmentType, { name: string; avgCompleted: number; avgVulns: number }> = {
    ad: { name: "Active Directory", avgCompleted: 4, avgVulns: 28 },
    cloud: { name: "Cloud Assessment", avgCompleted: 6, avgVulns: 35 },
    external_network: { name: "External Network", avgCompleted: 8, avgVulns: 42 },
    internal_network: { name: "Internal Network", avgCompleted: 5, avgVulns: 38 },
    file_sharing: { name: "File Sharing", avgCompleted: 3, avgVulns: 18 },
    osint: { name: "OSINT", avgCompleted: 12, avgVulns: 22 },
    wifi: { name: "WiFi Assessment", avgCompleted: 4, avgVulns: 15 },
    c2c: { name: "C2C Assessment", avgCompleted: 2, avgVulns: 8 },
    phishing: { name: "Phishing Simulation", avgCompleted: 6, avgVulns: 45 },
  };

  for (const type of ASSESSMENT_TYPES) {
    const config = assessmentConfig[type];
    const prevCompleted = Math.floor(config.avgCompleted * (0.7 + Math.random() * 0.4));
    const currCompleted = Math.floor(config.avgCompleted * (0.8 + Math.random() * 0.5));
    const prevVulns = Math.floor(config.avgVulns * (0.7 + Math.random() * 0.5));
    const currVulns = Math.floor(config.avgVulns * (0.75 + Math.random() * 0.5));
    
    const critPct = 0.08;
    const highPct = 0.22;
    const medPct = 0.35;
    const lowPct = 0.35;
    
    assessmentData.push({
      assessmentType: type,
      currentCompleted: currCompleted,
      previousCompleted: prevCompleted,
      currentVulnsDetected: currVulns,
      previousVulnsDetected: prevVulns,
      currentCritical: Math.floor(currVulns * critPct),
      previousCritical: Math.floor(prevVulns * critPct),
      currentHigh: Math.floor(currVulns * highPct),
      previousHigh: Math.floor(prevVulns * highPct),
      currentMedium: Math.floor(currVulns * medPct),
      previousMedium: Math.floor(prevVulns * medPct),
      currentLow: Math.floor(currVulns * lowPct),
      previousLow: Math.floor(prevVulns * lowPct),
      cycleLabel: "Dec 2025",
      previousCycleLabel: "Nov 2025",
    });
  }
  
  return assessmentData;
}

function generateBasSimulations(): InsertBasSimulation[] {
  const simulations: InsertBasSimulation[] = [];
  
  const simulationConfig: Record<SimulationType, { name: string; baseBlocked: number; baseDetected: number; baseMissed: number }> = {
    network_infiltration: { name: "Network Infiltration", baseBlocked: 85, baseDetected: 92, baseMissed: 8 },
    endpoint_security: { name: "Endpoint Security", baseBlocked: 78, baseDetected: 88, baseMissed: 12 },
    waf_f5: { name: "WAF F5", baseBlocked: 92, baseDetected: 96, baseMissed: 4 },
    waf_threatx: { name: "WAF ThreatX", baseBlocked: 88, baseDetected: 94, baseMissed: 6 },
    email_gateway: { name: "Email Gateway", baseBlocked: 72, baseDetected: 85, baseMissed: 15 },
    ad_assessment: { name: "AD Assessment", baseBlocked: 65, baseDetected: 82, baseMissed: 18 },
    cve_critical: { name: "CVE Critical", baseBlocked: 95, baseDetected: 98, baseMissed: 2 },
  };

  for (let i = 0; i < MONTHS.length; i++) {
    const month = MONTHS[i];
    const year = 2025;
    const improvementFactor = 1 + (i * 0.02);
    
    for (const simType of SIMULATION_TYPES) {
      const config = simulationConfig[simType];
      const totalSims = Math.floor(80 + Math.random() * 40);
      
      const blockedPct = Math.min(99, config.baseBlocked * improvementFactor + (Math.random() * 5 - 2.5));
      const detectedPct = Math.min(99, config.baseDetected * improvementFactor + (Math.random() * 3 - 1.5));
      const missedPct = Math.max(1, config.baseMissed / improvementFactor + (Math.random() * 3 - 1.5));
      
      const attacksBlocked = Math.floor(totalSims * (blockedPct / 100));
      const attacksDetected = Math.floor(totalSims * (detectedPct / 100));
      const attacksMissed = Math.floor(totalSims * (missedPct / 100));
      
      simulations.push({
        simulationType: simType,
        month,
        year,
        totalSimulations: totalSims,
        attacksBlocked,
        attacksDetected,
        attacksMissed,
        preventionRate: parseFloat(blockedPct.toFixed(1)),
        detectionRate: parseFloat(detectedPct.toFixed(1)),
      });
    }
  }
  
  return simulations;
}

function generateQuarterlyAssessments(): InsertQuarterlyAssessment[] {
  const data: InsertQuarterlyAssessment[] = [];
  const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
  const years = [2024, 2025];
  
  const assessmentConfig: Record<AssessmentType, { avgCompleted: number; avgTestCases: number; avgVulns: number }> = {
    ad: { avgCompleted: 3, avgTestCases: 85, avgVulns: 28 },
    cloud: { avgCompleted: 4, avgTestCases: 120, avgVulns: 35 },
    external_network: { avgCompleted: 5, avgTestCases: 150, avgVulns: 42 },
    internal_network: { avgCompleted: 4, avgTestCases: 110, avgVulns: 38 },
    file_sharing: { avgCompleted: 2, avgTestCases: 45, avgVulns: 18 },
    osint: { avgCompleted: 6, avgTestCases: 75, avgVulns: 22 },
    wifi: { avgCompleted: 3, avgTestCases: 60, avgVulns: 15 },
    c2c: { avgCompleted: 2, avgTestCases: 40, avgVulns: 8 },
    phishing: { avgCompleted: 4, avgTestCases: 200, avgVulns: 45 },
  };

  for (const year of years) {
    for (const quarter of quarters) {
      for (const type of ASSESSMENT_TYPES) {
        const config = assessmentConfig[type];
        const yearFactor = year === 2025 ? 1.15 : 1;
        const quarterFactor = quarter === "Q1" ? 0.85 : quarter === "Q2" ? 1.0 : quarter === "Q3" ? 1.1 : 1.2;
        
        const completed = Math.floor(config.avgCompleted * yearFactor * quarterFactor * (0.8 + Math.random() * 0.4));
        const testCases = Math.floor(config.avgTestCases * yearFactor * quarterFactor * (0.8 + Math.random() * 0.4));
        const totalVulns = Math.floor(config.avgVulns * yearFactor * quarterFactor * (0.7 + Math.random() * 0.5));
        
        const critical = Math.floor(totalVulns * 0.08);
        const high = Math.floor(totalVulns * 0.22);
        const medium = Math.floor(totalVulns * 0.35);
        
        data.push({
          assessmentType: type,
          quarter,
          year,
          assessmentsCompleted: Math.max(1, completed),
          testCasesExecuted: Math.max(10, testCases),
          critical: Math.max(0, critical),
          high: Math.max(0, high),
          medium: Math.max(0, medium),
        });
      }
    }
  }
  
  return data;
}

function generateTrendData(team: Team): InsertTrendData[] {
  const trends: InsertTrendData[] = [];
  const metrics = ["Risk Score", "Coverage", "MTTR", "Compliance"];
  
  for (const month of MONTHS) {
    for (const metric of metrics) {
      let baseValue: number;
      let variance: number;
      
      switch (metric) {
        case "Risk Score":
          baseValue = 6;
          variance = 2;
          break;
        case "Coverage":
          baseValue = 85;
          variance = 10;
          break;
        case "MTTR":
          baseValue = 12;
          variance = 5;
          break;
        case "Compliance":
          baseValue = 88;
          variance = 8;
          break;
        default:
          baseValue = 50;
          variance = 20;
      }
      
      const value = baseValue + (Math.random() * variance * 2 - variance);
      
      trends.push({
        team,
        metricName: metric,
        value: parseFloat(value.toFixed(1)),
        date: month,
      });
    }
  }
  
  return trends;
}

export async function seedDatabase() {
  const hasData = await storage.hasData();
  
  if (!hasData) {
    console.log("Seeding database with sample data...");
    
    for (const team of TEAMS) {
      await storage.createTeamStats(TEAM_STATS[team]);
      
      for (const kpi of TEAM_KPIS[team]) {
        await storage.createKpi({
          team,
          name: kpi.name,
          value: kpi.value,
          previousValue: kpi.previousValue,
          unit: kpi.unit,
          target: kpi.target,
          trend: kpi.trend,
          description: kpi.description,
        });
      }
      
      const vulns = generateVulnerabilities(team);
      for (const vuln of vulns) {
        await storage.createVulnerability(vuln);
      }
      
      const trends = generateTrendData(team);
      for (const trend of trends) {
        await storage.createTrendData(trend);
      }
    }
    
    const assessments = generateAssessments();
    for (const assessment of assessments) {
      await storage.createAssessment(assessment);
    }
    
    console.log("Core database seeded successfully!");
  } else {
    console.log("Core data already exists, checking for BAS simulations...");
  }
  
  const hasBasSims = await storage.hasBasSimulations();
  if (!hasBasSims) {
    console.log("Seeding BAS simulation data...");
    const basSimulationsData = generateBasSimulations();
    for (const sim of basSimulationsData) {
      await storage.createBasSimulation(sim);
    }
    console.log("BAS simulation data seeded successfully!");
  }

  const hasQuarterly = await storage.hasQuarterlyAssessments();
  if (!hasQuarterly) {
    console.log("Seeding quarterly assessment data...");
    const quarterlyData = generateQuarterlyAssessments();
    for (const qa of quarterlyData) {
      await storage.createQuarterlyAssessment(qa);
    }
    console.log("Quarterly assessment data seeded successfully!");
  }
}
