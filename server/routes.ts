import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import type { Team } from "@shared/schema";
import { insertKpiMetricSchema, insertVulnerabilitySchema, insertTeamStatsSchema, insertTrendDataSchema, insertQuarterlyAssessmentSchema } from "@shared/schema";
import { z } from "zod";

const VALID_TEAMS: Team[] = ["application", "infrastructure", "offensive", "cti", "bas"];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.get("/api/dashboard", async (req, res) => {
    try {
      const [stats, vulnerabilities, kpis] = await Promise.all([
        storage.getAllTeamStats(),
        storage.getAllVulnerabilities(),
        storage.getAllKpis(),
      ]);

      res.json({
        stats,
        vulnerabilities,
        kpis,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/teams/:team", async (req, res) => {
    try {
      const team = req.params.team as Team;
      
      if (!VALID_TEAMS.includes(team)) {
        return res.status(400).json({ error: "Invalid team" });
      }

      const [stats, vulnerabilities, trends, kpis] = await Promise.all([
        storage.getTeamStats(team),
        storage.getVulnerabilitiesByTeam(team),
        storage.getTrendDataByTeam(team),
        storage.getKpisByTeam(team),
      ]);

      if (!stats) {
        return res.status(404).json({ error: "Team not found" });
      }

      res.json({
        stats,
        vulnerabilities,
        trends,
        kpis,
      });
    } catch (error) {
      console.error("Error fetching team data:", error);
      res.status(500).json({ error: "Failed to fetch team data" });
    }
  });

  // KPI CRUD endpoints
  app.get("/api/kpis", async (req, res) => {
    try {
      const team = req.query.team as Team | undefined;
      
      if (team && !VALID_TEAMS.includes(team)) {
        return res.status(400).json({ error: "Invalid team" });
      }

      const kpis = team 
        ? await storage.getKpisByTeam(team)
        : await storage.getAllKpis();

      res.json(kpis);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/kpis/:id", async (req, res) => {
    try {
      const kpi = await storage.getKpiById(req.params.id);
      if (!kpi) {
        return res.status(404).json({ error: "KPI not found" });
      }
      res.json(kpi);
    } catch (error) {
      console.error("Error fetching KPI:", error);
      res.status(500).json({ error: "Failed to fetch KPI" });
    }
  });

  app.post("/api/kpis", async (req, res) => {
    try {
      const parsed = insertKpiMetricSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid KPI data", details: parsed.error.errors });
      }
      
      const kpi = await storage.createKpi(parsed.data);
      res.status(201).json(kpi);
    } catch (error) {
      console.error("Error creating KPI:", error);
      res.status(500).json({ error: "Failed to create KPI" });
    }
  });

  app.patch("/api/kpis/:id", async (req, res) => {
    try {
      const existing = await storage.getKpiById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "KPI not found" });
      }

      const partialSchema = insertKpiMetricSchema.partial();
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid KPI data", details: parsed.error.errors });
      }

      const kpi = await storage.updateKpi(req.params.id, parsed.data);
      res.json(kpi);
    } catch (error) {
      console.error("Error updating KPI:", error);
      res.status(500).json({ error: "Failed to update KPI" });
    }
  });

  app.delete("/api/kpis/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteKpi(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "KPI not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting KPI:", error);
      res.status(500).json({ error: "Failed to delete KPI" });
    }
  });

  // Vulnerability CRUD endpoints
  app.get("/api/vulnerabilities", async (req, res) => {
    try {
      const team = req.query.team as Team | undefined;
      
      if (team && !VALID_TEAMS.includes(team)) {
        return res.status(400).json({ error: "Invalid team" });
      }

      const vulnerabilities = team 
        ? await storage.getVulnerabilitiesByTeam(team)
        : await storage.getAllVulnerabilities();

      res.json(vulnerabilities);
    } catch (error) {
      console.error("Error fetching vulnerabilities:", error);
      res.status(500).json({ error: "Failed to fetch vulnerabilities" });
    }
  });

  app.post("/api/vulnerabilities", async (req, res) => {
    try {
      const parsed = insertVulnerabilitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vulnerability data", details: parsed.error.errors });
      }
      
      const vuln = await storage.createVulnerability(parsed.data);
      res.status(201).json(vuln);
    } catch (error) {
      console.error("Error creating vulnerability:", error);
      res.status(500).json({ error: "Failed to create vulnerability" });
    }
  });

  app.patch("/api/vulnerabilities/:id", async (req, res) => {
    try {
      const existing = await storage.getVulnerabilityById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Vulnerability not found" });
      }

      const partialSchema = insertVulnerabilitySchema.partial();
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vulnerability data", details: parsed.error.errors });
      }

      const vuln = await storage.updateVulnerability(req.params.id, parsed.data);
      res.json(vuln);
    } catch (error) {
      console.error("Error updating vulnerability:", error);
      res.status(500).json({ error: "Failed to update vulnerability" });
    }
  });

  app.delete("/api/vulnerabilities/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVulnerability(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Vulnerability not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vulnerability:", error);
      res.status(500).json({ error: "Failed to delete vulnerability" });
    }
  });

  // Team Stats endpoints
  app.get("/api/team-stats", async (req, res) => {
    try {
      const stats = await storage.getAllTeamStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      res.status(500).json({ error: "Failed to fetch team stats" });
    }
  });

  app.patch("/api/team-stats/:id", async (req, res) => {
    try {
      const existing = await storage.getTeamStatsById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Team stats not found" });
      }

      const partialSchema = insertTeamStatsSchema.partial();
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid team stats data", details: parsed.error.errors });
      }

      const stats = await storage.updateTeamStats(req.params.id, parsed.data);
      res.json(stats);
    } catch (error) {
      console.error("Error updating team stats:", error);
      res.status(500).json({ error: "Failed to update team stats" });
    }
  });

  // Trend data endpoints
  app.get("/api/trends", async (req, res) => {
    try {
      const team = req.query.team as Team | undefined;
      
      if (team && !VALID_TEAMS.includes(team)) {
        return res.status(400).json({ error: "Invalid team" });
      }

      const trends = team 
        ? await storage.getTrendDataByTeam(team)
        : await storage.getAllTrendData();

      res.json(trends);
    } catch (error) {
      console.error("Error fetching trends:", error);
      res.status(500).json({ error: "Failed to fetch trends" });
    }
  });

  app.patch("/api/trends/:id", async (req, res) => {
    try {
      const existing = await storage.getTrendDataById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Trend data not found" });
      }

      const partialSchema = insertTrendDataSchema.partial();
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid trend data", details: parsed.error.errors });
      }

      const trend = await storage.updateTrendData(req.params.id, parsed.data);
      res.json(trend);
    } catch (error) {
      console.error("Error updating trend data:", error);
      res.status(500).json({ error: "Failed to update trend data" });
    }
  });

  // Assessments endpoint (for Offensive Security)
  app.get("/api/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  // Quarterly Assessments endpoints (new Offensive Security dashboard)
  app.get("/api/quarterly-assessments", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = year 
        ? await storage.getQuarterlyAssessmentsByYear(year)
        : await storage.getAllQuarterlyAssessments();
      res.json(data);
    } catch (error) {
      console.error("Error fetching quarterly assessments:", error);
      res.status(500).json({ error: "Failed to fetch quarterly assessments" });
    }
  });

  app.patch("/api/quarterly-assessments/:id", async (req, res) => {
    try {
      const updateSchema = insertQuarterlyAssessmentSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      }
      const result = await storage.updateQuarterlyAssessment(req.params.id, parsed.data);
      if (!result) {
        return res.status(404).json({ error: "Quarterly assessment not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating quarterly assessment:", error);
      res.status(500).json({ error: "Failed to update quarterly assessment" });
    }
  });

  // Dashboard Settings endpoints
  app.get("/api/dashboard-settings", async (req, res) => {
    try {
      const team = req.query.team as Team;
      if (!team || !VALID_TEAMS.includes(team)) {
        return res.status(400).json({ error: "Valid team parameter required" });
      }
      const settings = await storage.getDashboardSettings(team);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching dashboard settings:", error);
      res.status(500).json({ error: "Failed to fetch dashboard settings" });
    }
  });

  app.put("/api/dashboard-settings", async (req, res) => {
    try {
      const schema = z.object({
        team: z.enum(["application", "infrastructure", "offensive", "cti", "bas"]),
        settingKey: z.string().min(1),
        settingValue: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      }
      const result = await storage.upsertDashboardSetting(parsed.data.team, parsed.data.settingKey, parsed.data.settingValue);
      res.json(result);
    } catch (error) {
      console.error("Error saving dashboard setting:", error);
      res.status(500).json({ error: "Failed to save dashboard setting" });
    }
  });

  // BAS Simulations endpoint
  app.get("/api/bas-simulations", async (req, res) => {
    try {
      const simulations = await storage.getAllBasSimulations();
      res.json(simulations);
    } catch (error) {
      console.error("Error fetching BAS simulations:", error);
      res.status(500).json({ error: "Failed to fetch BAS simulations" });
    }
  });

  // Report generation endpoint
  app.get("/api/report/:team", async (req, res) => {
    try {
      const team = req.params.team as Team;
      
      if (!VALID_TEAMS.includes(team)) {
        return res.status(400).json({ error: "Invalid team" });
      }

      const [stats, vulnerabilities, trends, kpis] = await Promise.all([
        storage.getTeamStats(team),
        storage.getVulnerabilitiesByTeam(team),
        storage.getTrendDataByTeam(team),
        storage.getKpisByTeam(team),
      ]);

      // Aggregate vulnerability counts by severity
      const vulnSummary = vulnerabilities.reduce((acc, v) => {
        if (!acc[v.severity]) {
          acc[v.severity] = { total: 0, resolved: 0, open: 0 };
        }
        acc[v.severity].total += v.count;
        acc[v.severity].resolved += v.resolvedCount;
        acc[v.severity].open += v.count - v.resolvedCount;
        return acc;
      }, {} as Record<string, { total: number; resolved: number; open: number }>);

      // Team-specific data
      let assessments = null;
      let basSimulations = null;
      let monthlyComparison = null;

      if (team === "offensive") {
        assessments = await storage.getAllAssessments();
      } else if (team === "bas") {
        basSimulations = await storage.getAllBasSimulations();
      } else if (["application", "infrastructure", "cti"].includes(team)) {
        // Build 3-month comparison from vulnerabilities
        const now = new Date();
        const months = [];
        for (let i = 0; i < 3; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            month: d.toLocaleDateString('en-US', { month: 'short' }),
            year: d.getFullYear(),
            monthNum: d.getMonth() + 1,
          });
        }
        
        monthlyComparison = months.map((m, idx) => {
          const monthVulns = vulnerabilities.filter(v => {
            const vDate = new Date(v.month);
            return vDate.getMonth() + 1 === m.monthNum && vDate.getFullYear() === m.year;
          });
          const total = monthVulns.reduce((sum, v) => sum + v.count, 0);
          const resolved = monthVulns.reduce((sum, v) => sum + v.resolvedCount, 0);
          return {
            month: m.month,
            year: m.year,
            totalVulnerabilities: total,
            resolved,
            open: total - resolved,
            resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
            isCurrent: idx === 0,
          };
        }).reverse();
      }

      const monthlyFindings = vulnerabilities.reduce((acc, v) => {
        const key = v.month;
        if (!acc[key]) {
          acc[key] = { month: key, found: 0, resolved: 0 };
        }
        acc[key].found += v.count;
        acc[key].resolved += v.resolvedCount;
        return acc;
      }, {} as Record<string, { month: string; found: number; resolved: number }>);
      const monthlyFindingsArray = Object.values(monthlyFindings)
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6);

      const trendMetrics = trends.map(t => ({
        date: t.date,
        metricName: t.metricName,
        value: t.value,
      }));

      const report = {
        generatedAt: new Date().toISOString(),
        reportMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        team,
        stats,
        kpis: kpis.map(k => ({
          name: k.name,
          value: k.value,
          target: k.target,
          unit: k.unit,
          trend: k.trend,
          previousValue: k.previousValue,
          description: k.description,
          progressToTarget: k.target ? Math.round((k.value / k.target) * 100) : null,
        })),
        vulnerabilitySummary: vulnSummary,
        totalOpenFindings: stats?.openFindings || 0,
        totalClosedFindings: stats?.closedFindings || 0,
        remediationRate: stats ? 
          Math.round((stats.closedFindings / (stats.openFindings + stats.closedFindings)) * 100) : 0,
        mttr: stats?.mttr || 0,
        riskScore: stats?.riskScore || 0,
        coverage: stats?.coverage || 0,
        complianceScore: stats?.complianceScore || 0,
        monthlyFindings: monthlyFindingsArray,
        trendMetrics,
        assessments,
        basSimulations,
        monthlyComparison,
      };

      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  return httpServer;
}
