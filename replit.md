# IVM Dashboard - Integrated Vulnerability Management

## Overview

This is an Integrated Vulnerability Management (IVM) Dashboard application designed to monitor security KPIs across multiple teams: Application Security, Infrastructure, Offensive Security, Cyber Threat Intelligence (CTI), and Breach and Attack Simulation (BAS). The dashboard provides real-time vulnerability metrics, trend analysis, and security performance indicators for enterprise security operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: Recharts library for data visualization (bar charts, pie charts, line charts)
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON API with `/api` prefix
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)

### Project Structure
```
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/    # UI components (charts, cards, sidebar)
│   │   ├── pages/         # Route pages (overview, team dashboards)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities (query client, theme provider)
├── server/          # Express backend
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Database access layer
│   ├── seed.ts      # Database seeding logic
│   └── db.ts        # Database connection
├── shared/          # Shared code between client/server
│   └── schema.ts    # Drizzle schema definitions and types
└── migrations/      # Database migrations
```

### Data Model
The application uses these core entities:
- **Users**: Basic user authentication model
- **KPI Metrics**: Team-specific performance indicators with values, targets, and trends
- **Vulnerabilities**: Severity-categorized findings by team and time period
- **Team Stats**: Aggregate statistics per security team (assets, findings, MTTR, risk scores)
- **Trend Data**: Historical metric data for time-series visualization
- **Assessments**: Offensive Security assessment tracking with current/previous cycle comparison
  - Types: AD, Cloud, External Network, Internal Network, File Sharing, OSINT, WiFi, C2C, Phishing
  - Tracks: Assessments completed, vulnerabilities detected, severity breakdown per cycle

### API Endpoints

#### Dashboard & Teams
- `GET /api/dashboard` - Returns all team stats, vulnerabilities, and KPIs for the overview page
- `GET /api/teams/:team` - Returns detailed data for a specific team (stats, vulnerabilities, trends, KPIs)

#### KPI Management (CRUD)
- `GET /api/kpis` - List all KPIs (optional `?team=` filter)
- `GET /api/kpis/:id` - Get a specific KPI by ID
- `POST /api/kpis` - Create a new KPI (validated with Zod schema)
- `PATCH /api/kpis/:id` - Update a KPI (validated with Zod schema)
- `DELETE /api/kpis/:id` - Delete a KPI

#### Vulnerability Management
- `GET /api/vulnerabilities` - List all vulnerabilities (optional `?team=` filter)
- `POST /api/vulnerabilities` - Create a new vulnerability record
- `PATCH /api/vulnerabilities/:id` - Update a vulnerability record
- `DELETE /api/vulnerabilities/:id` - Delete a vulnerability record

#### Team Stats
- `GET /api/team-stats` - List all team statistics
- `PATCH /api/team-stats/:id` - Update team statistics

#### Trends & Reports
- `GET /api/trends` - List all trend data (optional `?team=` filter)
- `GET /api/report/:team` - Generate a comprehensive monthly report for a team

#### Assessments (Offensive Security)
- `GET /api/assessments` - Get all assessment data with current/previous cycle comparison (legacy)
- `GET /api/quarterly-assessments` - Get quarterly assessment data (optional `?year=` filter)
- `PATCH /api/quarterly-assessments/:id` - Update a quarterly assessment record

#### Dashboard Settings
- `GET /api/dashboard-settings?team=` - Get dashboard title settings for a team
- `PUT /api/dashboard-settings` - Create or update a dashboard setting (team, settingKey, settingValue)

### Frontend Pages
- `/` - Overview dashboard with all teams summary
- `/:team` - Individual team dashboard (application, infrastructure, offensive, cti, bas)
- `/admin` - Admin interface for managing KPIs and team statistics
- `/report` - Monthly report generation with print-ready layout and team-specific sections (3-month trends, assessment comparisons, BAS simulations)

### Team-Specific Features
- **Offensive Security**: Quarterly assessment tracking (Q1-Q4) with 9 assessment types (AD, Cloud, External/Internal Network, File Sharing, OSINT, WiFi, C2C, Phishing). Features include:
  - Quarterly summary with year-over-year comparison (assessments completed, test cases executed, severity findings)
  - Assessment type breakdown table with per-quarter completed counts and test case execution
  - Year-over-year comparison chart (previous year vs current year per quarter)
  - Quarterly severity findings chart and table (Critical, High, Medium per Q1-Q4)
  - Editable dashboard section titles in Admin Mode
  - Inline editing of assessment data (completed counts, test cases) per assessment type in Admin Mode
- **Application Security, Infrastructure, CTI**: 3-month comparison showing current month + previous 2 months with vulnerability counts, resolution rates, and metric trends
- **BAS Simulations**: Monthly simulation improvement tracking for 7 simulation types (Network Infiltration, Endpoint Security, WAF F5, WAF ThreatX, Email Gateway, AD Assessment, CVE Critical) with prevention/detection rates and improvement badges
- **All Teams**: Security Overview includes Asset Coverage, Compliance Score, and Findings Resolution progress bars with targets. Severity Distribution shows latest month only. Monthly Findings Trend shows last 3 months. Metrics Over Time is only shown for Application Security and Infrastructure teams.

### Admin Mode Section Management
In Admin Mode, every dashboard section is wrapped with an `AdminSectionWrapper` that provides:
- **Visibility toggle**: Eye icon to show/hide any section (hidden sections appear dimmed with dashed border in Admin Mode, completely hidden otherwise)
- **Editable titles**: Pencil icon to rename any section title
- Settings are persisted per team via the `dashboard_settings` table using key-value pairs (`section_<name>_visible`, `section_<name>_title`)
- Managed sections: `key_metrics`, `security_overview`, `quarterly_assessments`, `monthly_comparison`, `simulations`, `severity_distribution`, `monthly_findings`, `metrics_over_time`, `additional_metrics`
- Custom hook `useSectionSettings` (in `client/src/hooks/use-section-settings.ts`) handles fetch/save with React Query cache invalidation

### Development Workflow
- `npm run dev` - Start development server with hot reload (Vite + Express)
- `npm run build` - Build for production (Vite frontend + esbuild backend)
- `npm run db:push` - Push schema changes to database using Drizzle Kit

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe SQL query builder and schema management
- **connect-pg-simple**: PostgreSQL session storage for Express sessions

### UI Framework
- **Radix UI**: Accessible, unstyled component primitives (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui**: Pre-built component library using Radix primitives with Tailwind styling
- **Recharts**: React charting library for data visualization
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool and development server
- **esbuild**: Backend bundling for production builds
- **TypeScript**: Static typing across the entire codebase

### Fonts
- **Inter**: Primary font loaded from Google Fonts