import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { 
  users, 
  kpiMetrics, 
  vulnerabilities, 
  teamStats, 
  trendData,
  assessments,
  basSimulations,
  quarterlyAssessments,
  dashboardSettings,
  type User, 
  type InsertUser,
  type KpiMetric,
  type InsertKpiMetric,
  type Vulnerability,
  type InsertVulnerability,
  type TeamStats,
  type InsertTeamStats,
  type TrendData,
  type InsertTrendData,
  type Team,
  type Assessment,
  type InsertAssessment,
  type BasSimulation,
  type InsertBasSimulation,
  type QuarterlyAssessment,
  type InsertQuarterlyAssessment,
  type DashboardSetting,
  type InsertDashboardSetting,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllKpis(): Promise<KpiMetric[]>;
  getKpisByTeam(team: Team): Promise<KpiMetric[]>;
  getKpiById(id: string): Promise<KpiMetric | undefined>;
  createKpi(kpi: InsertKpiMetric): Promise<KpiMetric>;
  updateKpi(id: string, kpi: Partial<InsertKpiMetric>): Promise<KpiMetric | undefined>;
  deleteKpi(id: string): Promise<boolean>;
  
  getAllVulnerabilities(): Promise<Vulnerability[]>;
  getVulnerabilitiesByTeam(team: Team): Promise<Vulnerability[]>;
  getVulnerabilityById(id: string): Promise<Vulnerability | undefined>;
  createVulnerability(vuln: InsertVulnerability): Promise<Vulnerability>;
  updateVulnerability(id: string, vuln: Partial<InsertVulnerability>): Promise<Vulnerability | undefined>;
  deleteVulnerability(id: string): Promise<boolean>;
  
  getAllTeamStats(): Promise<TeamStats[]>;
  getTeamStats(team: Team): Promise<TeamStats | undefined>;
  getTeamStatsById(id: string): Promise<TeamStats | undefined>;
  createTeamStats(stats: InsertTeamStats): Promise<TeamStats>;
  updateTeamStats(id: string, stats: Partial<InsertTeamStats>): Promise<TeamStats | undefined>;
  
  getAllTrendData(): Promise<TrendData[]>;
  getTrendDataByTeam(team: Team): Promise<TrendData[]>;
  getTrendDataById(id: string): Promise<TrendData | undefined>;
  createTrendData(trend: InsertTrendData): Promise<TrendData>;
  updateTrendData(id: string, trend: Partial<InsertTrendData>): Promise<TrendData | undefined>;
  deleteTrendData(id: string): Promise<boolean>;
  
  getAllAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAllAssessments(): Promise<boolean>;
  
  getAllBasSimulations(): Promise<BasSimulation[]>;
  createBasSimulation(simulation: InsertBasSimulation): Promise<BasSimulation>;
  updateBasSimulation(id: string, simulation: Partial<InsertBasSimulation>): Promise<BasSimulation | undefined>;
  deleteAllBasSimulations(): Promise<boolean>;
  
  getAllQuarterlyAssessments(): Promise<QuarterlyAssessment[]>;
  getQuarterlyAssessmentsByYear(year: number): Promise<QuarterlyAssessment[]>;
  createQuarterlyAssessment(qa: InsertQuarterlyAssessment): Promise<QuarterlyAssessment>;
  updateQuarterlyAssessment(id: string, qa: Partial<InsertQuarterlyAssessment>): Promise<QuarterlyAssessment | undefined>;
  deleteAllQuarterlyAssessments(): Promise<boolean>;
  hasQuarterlyAssessments(): Promise<boolean>;
  
  getDashboardSettings(team: Team): Promise<DashboardSetting[]>;
  upsertDashboardSetting(team: Team, settingKey: string, settingValue: string): Promise<DashboardSetting>;
  
  hasData(): Promise<boolean>;
  hasBasSimulations(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllKpis(): Promise<KpiMetric[]> {
    return db.select().from(kpiMetrics);
  }

  async getKpisByTeam(team: Team): Promise<KpiMetric[]> {
    return db.select().from(kpiMetrics).where(eq(kpiMetrics.team, team));
  }

  async getKpiById(id: string): Promise<KpiMetric | undefined> {
    const [kpi] = await db.select().from(kpiMetrics).where(eq(kpiMetrics.id, id));
    return kpi;
  }

  async createKpi(kpi: InsertKpiMetric): Promise<KpiMetric> {
    const [result] = await db.insert(kpiMetrics).values(kpi).returning();
    return result;
  }

  async updateKpi(id: string, kpi: Partial<InsertKpiMetric>): Promise<KpiMetric | undefined> {
    const [result] = await db.update(kpiMetrics).set(kpi).where(eq(kpiMetrics.id, id)).returning();
    return result;
  }

  async deleteKpi(id: string): Promise<boolean> {
    const result = await db.delete(kpiMetrics).where(eq(kpiMetrics.id, id)).returning();
    return result.length > 0;
  }

  async getAllVulnerabilities(): Promise<Vulnerability[]> {
    return db.select().from(vulnerabilities);
  }

  async getVulnerabilitiesByTeam(team: Team): Promise<Vulnerability[]> {
    return db.select().from(vulnerabilities).where(eq(vulnerabilities.team, team));
  }

  async getVulnerabilityById(id: string): Promise<Vulnerability | undefined> {
    const [vuln] = await db.select().from(vulnerabilities).where(eq(vulnerabilities.id, id));
    return vuln;
  }

  async createVulnerability(vuln: InsertVulnerability): Promise<Vulnerability> {
    const [result] = await db.insert(vulnerabilities).values(vuln).returning();
    return result;
  }

  async updateVulnerability(id: string, vuln: Partial<InsertVulnerability>): Promise<Vulnerability | undefined> {
    const [result] = await db.update(vulnerabilities).set(vuln).where(eq(vulnerabilities.id, id)).returning();
    return result;
  }

  async deleteVulnerability(id: string): Promise<boolean> {
    const result = await db.delete(vulnerabilities).where(eq(vulnerabilities.id, id)).returning();
    return result.length > 0;
  }

  async getAllTeamStats(): Promise<TeamStats[]> {
    return db.select().from(teamStats);
  }

  async getTeamStats(team: Team): Promise<TeamStats | undefined> {
    const [stats] = await db.select().from(teamStats).where(eq(teamStats.team, team));
    return stats;
  }

  async getTeamStatsById(id: string): Promise<TeamStats | undefined> {
    const [stats] = await db.select().from(teamStats).where(eq(teamStats.id, id));
    return stats;
  }

  async createTeamStats(stats: InsertTeamStats): Promise<TeamStats> {
    const [result] = await db.insert(teamStats).values(stats).returning();
    return result;
  }

  async updateTeamStats(id: string, stats: Partial<InsertTeamStats>): Promise<TeamStats | undefined> {
    const [result] = await db.update(teamStats).set(stats).where(eq(teamStats.id, id)).returning();
    return result;
  }

  async getAllTrendData(): Promise<TrendData[]> {
    return db.select().from(trendData);
  }

  async getTrendDataByTeam(team: Team): Promise<TrendData[]> {
    return db.select().from(trendData).where(eq(trendData.team, team));
  }

  async getTrendDataById(id: string): Promise<TrendData | undefined> {
    const [result] = await db.select().from(trendData).where(eq(trendData.id, id));
    return result;
  }

  async createTrendData(trend: InsertTrendData): Promise<TrendData> {
    const [result] = await db.insert(trendData).values(trend).returning();
    return result;
  }

  async updateTrendData(id: string, trend: Partial<InsertTrendData>): Promise<TrendData | undefined> {
    const [result] = await db.update(trendData).set(trend).where(eq(trendData.id, id)).returning();
    return result;
  }

  async deleteTrendData(id: string): Promise<boolean> {
    const result = await db.delete(trendData).where(eq(trendData.id, id)).returning();
    return result.length > 0;
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return db.select().from(assessments);
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [result] = await db.insert(assessments).values(assessment).returning();
    return result;
  }

  async updateAssessment(id: string, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [result] = await db.update(assessments).set(assessment).where(eq(assessments.id, id)).returning();
    return result;
  }

  async deleteAllAssessments(): Promise<boolean> {
    await db.delete(assessments);
    return true;
  }

  async getAllBasSimulations(): Promise<BasSimulation[]> {
    return db.select().from(basSimulations);
  }

  async createBasSimulation(simulation: InsertBasSimulation): Promise<BasSimulation> {
    const [result] = await db.insert(basSimulations).values(simulation).returning();
    return result;
  }

  async updateBasSimulation(id: string, simulation: Partial<InsertBasSimulation>): Promise<BasSimulation | undefined> {
    const [result] = await db.update(basSimulations).set(simulation).where(eq(basSimulations.id, id)).returning();
    return result;
  }

  async deleteAllBasSimulations(): Promise<boolean> {
    await db.delete(basSimulations);
    return true;
  }

  async getAllQuarterlyAssessments(): Promise<QuarterlyAssessment[]> {
    return db.select().from(quarterlyAssessments);
  }

  async getQuarterlyAssessmentsByYear(year: number): Promise<QuarterlyAssessment[]> {
    return db.select().from(quarterlyAssessments).where(eq(quarterlyAssessments.year, year));
  }

  async createQuarterlyAssessment(qa: InsertQuarterlyAssessment): Promise<QuarterlyAssessment> {
    const [result] = await db.insert(quarterlyAssessments).values(qa).returning();
    return result;
  }

  async updateQuarterlyAssessment(id: string, qa: Partial<InsertQuarterlyAssessment>): Promise<QuarterlyAssessment | undefined> {
    const [result] = await db.update(quarterlyAssessments).set(qa).where(eq(quarterlyAssessments.id, id)).returning();
    return result;
  }

  async deleteAllQuarterlyAssessments(): Promise<boolean> {
    await db.delete(quarterlyAssessments);
    return true;
  }

  async hasQuarterlyAssessments(): Promise<boolean> {
    const rows = await db.select().from(quarterlyAssessments).limit(1);
    return rows.length > 0;
  }

  async getDashboardSettings(team: Team): Promise<DashboardSetting[]> {
    return db.select().from(dashboardSettings).where(eq(dashboardSettings.team, team));
  }

  async upsertDashboardSetting(team: Team, settingKey: string, settingValue: string): Promise<DashboardSetting> {
    const [existing] = await db.select().from(dashboardSettings)
      .where(and(eq(dashboardSettings.team, team), eq(dashboardSettings.settingKey, settingKey)));
    
    if (existing) {
      const [result] = await db.update(dashboardSettings)
        .set({ settingValue, updatedAt: new Date() })
        .where(eq(dashboardSettings.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(dashboardSettings)
        .values({ team, settingKey, settingValue })
        .returning();
      return result;
    }
  }

  async hasData(): Promise<boolean> {
    const stats = await db.select().from(teamStats).limit(1);
    return stats.length > 0;
  }

  async hasBasSimulations(): Promise<boolean> {
    const sims = await db.select().from(basSimulations).limit(1);
    return sims.length > 0;
  }
}

export const storage = new DatabaseStorage();
