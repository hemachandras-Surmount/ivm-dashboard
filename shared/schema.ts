import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teamEnum = pgEnum("team", [
  "application",
  "infrastructure", 
  "offensive",
  "cti",
  "bas"
]);

export const severityEnum = pgEnum("severity", [
  "critical",
  "high",
  "medium",
  "low",
  "info"
]);

export const trendEnum = pgEnum("trend", ["up", "down", "stable"]);

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "ad",
  "cloud",
  "external_network",
  "internal_network",
  "file_sharing",
  "osint",
  "wifi",
  "c2c",
  "phishing"
]);

export const simulationTypeEnum = pgEnum("simulation_type", [
  "network_infiltration",
  "endpoint_security",
  "waf_f5",
  "waf_threatx",
  "email_gateway",
  "ad_assessment",
  "cve_critical"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const kpiMetrics = pgTable("kpi_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  team: teamEnum("team").notNull(),
  name: text("name").notNull(),
  value: real("value").notNull(),
  previousValue: real("previous_value"),
  unit: text("unit").default("%"),
  trend: trendEnum("trend").default("stable"),
  target: real("target"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vulnerabilities = pgTable("vulnerabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  team: teamEnum("team").notNull(),
  severity: severityEnum("severity").notNull(),
  count: integer("count").notNull().default(0),
  resolvedCount: integer("resolved_count").notNull().default(0),
  month: text("month").notNull(),
  year: integer("year").notNull(),
});

export const teamStats = pgTable("team_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  team: teamEnum("team").notNull(),
  totalAssets: integer("total_assets").notNull().default(0),
  assessedAssets: integer("assessed_assets").notNull().default(0),
  openFindings: integer("open_findings").notNull().default(0),
  closedFindings: integer("closed_findings").notNull().default(0),
  mttr: real("mttr").default(0),
  riskScore: real("risk_score").default(0),
  coverage: real("coverage").default(0),
  complianceScore: real("compliance_score").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trendData = pgTable("trend_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  team: teamEnum("team").notNull(),
  metricName: text("metric_name").notNull(),
  value: real("value").notNull(),
  date: text("date").notNull(),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentType: assessmentTypeEnum("assessment_type").notNull(),
  currentCompleted: integer("current_completed").notNull().default(0),
  previousCompleted: integer("previous_completed").notNull().default(0),
  currentVulnsDetected: integer("current_vulns_detected").notNull().default(0),
  previousVulnsDetected: integer("previous_vulns_detected").notNull().default(0),
  currentCritical: integer("current_critical").notNull().default(0),
  previousCritical: integer("previous_critical").notNull().default(0),
  currentHigh: integer("current_high").notNull().default(0),
  previousHigh: integer("previous_high").notNull().default(0),
  currentMedium: integer("current_medium").notNull().default(0),
  previousMedium: integer("previous_medium").notNull().default(0),
  currentLow: integer("current_low").notNull().default(0),
  previousLow: integer("previous_low").notNull().default(0),
  cycleLabel: text("cycle_label").notNull(),
  previousCycleLabel: text("previous_cycle_label").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const basSimulations = pgTable("bas_simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  simulationType: simulationTypeEnum("simulation_type").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  totalSimulations: integer("total_simulations").notNull().default(0),
  attacksBlocked: integer("attacks_blocked").notNull().default(0),
  attacksDetected: integer("attacks_detected").notNull().default(0),
  attacksMissed: integer("attacks_missed").notNull().default(0),
  preventionRate: real("prevention_rate").notNull().default(0),
  detectionRate: real("detection_rate").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quarterEnum = pgEnum("quarter", ["Q1", "Q2", "Q3", "Q4"]);

export const quarterlyAssessments = pgTable("quarterly_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentType: assessmentTypeEnum("assessment_type").notNull(),
  quarter: quarterEnum("quarter").notNull(),
  year: integer("year").notNull(),
  assessmentsCompleted: integer("assessments_completed").notNull().default(0),
  testCasesExecuted: integer("test_cases_executed").notNull().default(0),
  critical: integer("critical").notNull().default(0),
  high: integer("high").notNull().default(0),
  medium: integer("medium").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dashboardSettings = pgTable("dashboard_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  team: teamEnum("team").notNull(),
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertKpiMetricSchema = createInsertSchema(kpiMetrics).omit({
  id: true,
  updatedAt: true,
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).omit({
  id: true,
});

export const insertTeamStatsSchema = createInsertSchema(teamStats).omit({
  id: true,
  updatedAt: true,
});

export const insertTrendDataSchema = createInsertSchema(trendData).omit({
  id: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  updatedAt: true,
});

export const insertBasSimulationSchema = createInsertSchema(basSimulations).omit({
  id: true,
  updatedAt: true,
});

export const insertQuarterlyAssessmentSchema = createInsertSchema(quarterlyAssessments).omit({
  id: true,
  updatedAt: true,
});

export const insertDashboardSettingSchema = createInsertSchema(dashboardSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertKpiMetric = z.infer<typeof insertKpiMetricSchema>;
export type KpiMetric = typeof kpiMetrics.$inferSelect;
export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type InsertTeamStats = z.infer<typeof insertTeamStatsSchema>;
export type TeamStats = typeof teamStats.$inferSelect;
export type InsertTrendData = z.infer<typeof insertTrendDataSchema>;
export type TrendData = typeof trendData.$inferSelect;

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertBasSimulation = z.infer<typeof insertBasSimulationSchema>;
export type BasSimulation = typeof basSimulations.$inferSelect;
export type InsertQuarterlyAssessment = z.infer<typeof insertQuarterlyAssessmentSchema>;
export type QuarterlyAssessment = typeof quarterlyAssessments.$inferSelect;
export type InsertDashboardSetting = z.infer<typeof insertDashboardSettingSchema>;
export type DashboardSetting = typeof dashboardSettings.$inferSelect;

export type Team = "application" | "infrastructure" | "offensive" | "cti" | "bas";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Trend = "up" | "down" | "stable";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type AssessmentType = "ad" | "cloud" | "external_network" | "internal_network" | "file_sharing" | "osint" | "wifi" | "c2c" | "phishing";
export type SimulationType = "network_infiltration" | "endpoint_security" | "waf_f5" | "waf_threatx" | "email_gateway" | "ad_assessment" | "cve_critical";
