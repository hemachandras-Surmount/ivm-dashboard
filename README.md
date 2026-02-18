# IVM Dashboard - Integrated Vulnerability Management

A comprehensive, data-driven vulnerability management dashboard designed for enterprise security operations. It monitors security KPIs across five specialized teams, provides real-time vulnerability metrics, trend analysis, and generates detailed PDF reports with visual charts.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation Details](#installation-details)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security Teams](#security-teams)
- [PDF Report Generation](#pdf-report-generation)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Features

- **Multi-Team Dashboard**: Overview and individual dashboards for 5 security teams
- **Real-Time KPIs**: Track key performance indicators with targets, trends, and progress bars
- **Vulnerability Tracking**: Severity-based vulnerability distribution (Critical, High, Medium, Low, Info)
- **Trend Analysis**: 3-month historical comparison with resolution rates
- **Assessment Comparison**: Offensive Security current vs. previous cycle comparisons across 9 assessment types
- **BAS Simulations**: Breach and Attack Simulation tracking with prevention/detection rates for 7 simulation types
- **Admin Interface**: Full CRUD management of KPIs and team statistics
- **Inline Editing**: Admin Mode enables direct editing on team dashboards for 3-month vulnerability counts, resolution rates, and key metric trends (Risk Score, Coverage, MTTR, Compliance) with batched save operations
- **PDF Reports**: Individual and consolidated team reports with embedded charts
  - KPI progress bar charts
  - Severity distribution bar charts
  - Monthly trend grouped bar charts
  - Assessment comparison charts
  - BAS simulation performance bars
  - Team risk and remediation comparison charts (consolidated)
- **Dark/Light Theme**: Full dark mode support with system preference detection
- **Responsive Design**: Works across desktop, tablet, and mobile devices

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 7.3 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui | Latest | Component library (Radix UI primitives) |
| Recharts | 2.15 | Interactive data visualization |
| TanStack React Query | 5.60 | Server state management & caching |
| Wouter | 3.3 | Lightweight client-side routing |
| jsPDF | 4.1 | Programmatic PDF generation |
| Lucide React | 0.453 | Icon library |
| Framer Motion | 11.13 | Animations |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x | Runtime environment |
| Express | 5.0 | Web framework |
| TypeScript | 5.6 | Type safety |
| Drizzle ORM | 0.39 | Type-safe database ORM |
| PostgreSQL | 16.x | Relational database |
| Zod | 3.24 | Schema validation |
| express-session | 1.18 | Session management |
| connect-pg-simple | 10.0 | PostgreSQL session storage |

### Development Tools
| Tool | Version | Purpose |
|---|---|---|
| tsx | 4.20 | TypeScript execution for Node.js |
| esbuild | 0.25 | Fast JavaScript bundler (production builds) |
| Drizzle Kit | 0.31 | Database schema management & migrations |
| PostCSS | 8.4 | CSS processing |
| Autoprefixer | 10.4 | CSS vendor prefixing |

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1. **Node.js** (v20.x or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (v10.x or higher, comes with Node.js)
   - Verify: `npm --version`

3. **PostgreSQL** (v14.x or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`
   - Alternatively, use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16`

4. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

---

## Quick Start

> **Before you begin:** Make sure [Node.js v20+](https://nodejs.org/), [PostgreSQL 14+](https://www.postgresql.org/download/), and [Git](https://git-scm.com/) are installed on your system.

### Step 1: Clone and install

All platforms (works on Windows, macOS, and Linux):
```bash
git clone https://github.com/hemachandras-Surmount/ivm-dashboard.git
cd ivm-dashboard
npm install
```

> All dependencies are pinned to exact versions for consistent installs across all environments. The `cross-env` package is included automatically for Windows compatibility.

### Step 2: Configure environment variables

Copy the example file and fill in your PostgreSQL credentials:

All platforms:
```bash
cp .env.example .env
```

> On Windows Command Prompt, use `copy .env.example .env` instead.

Open `.env` in any text editor and update it with your database details:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ivm_dashboard
SESSION_SECRET=any-random-string-here
```

> Replace `postgres`, `YOUR_PASSWORD`, and `ivm_dashboard` with your actual PostgreSQL username, password, and database name. The app auto-loads the `.env` file on startup -- no need to set environment variables manually.

### Step 3: Create the database

Connect to PostgreSQL and create the database:

**Linux / macOS / Git Bash:**
```bash
psql -U postgres -c "CREATE DATABASE ivm_dashboard;"
```

**Windows PowerShell:**
```powershell
psql -U postgres -c "CREATE DATABASE ivm_dashboard;"
```

**Windows Command Prompt:**
```cmd
psql -U postgres -c "CREATE DATABASE ivm_dashboard;"
```

> If `psql` is not recognized on Windows, add PostgreSQL's `bin` folder to your system PATH (e.g., `C:\Program Files\PostgreSQL\16\bin`), or use pgAdmin to create the database instead.

### Step 4: Set up tables and start

All platforms:
```bash
npm run db:push
npm run dev
```

The app will be available at **http://localhost:5000**

---

## Installation Details

### Pinned Dependencies

All dependencies use exact versions (no `^` or `~` ranges) to ensure everyone gets the same install regardless of when they set up the project. This prevents "works on my machine" issues.

### Cross-Platform Compatibility

- **`cross-env`** is included for Windows compatibility with `NODE_ENV`
- **`dotenv`** auto-loads `.env` files so you don't need platform-specific `export`/`set`/`$env:` commands
- All npm scripts work identically on Windows, macOS, and Linux

### Schema Details

Running `npm run db:push` reads the schema from `shared/schema.ts` and creates the following tables:
- `users` - User authentication
- `kpi_metrics` - Team-specific KPI indicators
- `vulnerabilities` - Severity-categorized findings
- `team_stats` - Aggregate team statistics
- `trend_data` - Historical metric data
- `assessments` - Offensive Security assessment tracking
- `bas_simulations` - BAS simulation performance data

### Automatic Data Seeding

The app automatically populates the database with sample data on first startup, including team statistics, KPI metrics, vulnerability data, trend data, assessment comparisons, and BAS simulation data.

---

## Running the Application

### Development Mode

All platforms:
```bash
npm run dev
```

This starts both the Express backend and Vite development server with hot module replacement (HMR). The application will be available at **http://localhost:5000**.

### Type Checking

All platforms:
```bash
npm run check
```

Runs the TypeScript compiler to check for type errors across the entire codebase.

---

## Building for Production

### 1. Build the Application

All platforms:
```bash
npm run build
```

This creates an optimized production build:
- Frontend: Vite bundles React app to `dist/public/`
- Backend: esbuild compiles server to `dist/index.cjs`

### 2. Start the Production Server

All platforms:
```bash
npm start
```

The production server runs at **http://localhost:5000**.

---

## Project Structure

```
ivm-dashboard/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── app-sidebar.tsx      # Navigation sidebar
│   │   │   ├── assessment-comparison.tsx  # Offensive Security assessments
│   │   │   ├── bar-chart.tsx        # Recharts bar chart wrapper
│   │   │   ├── kpi-card.tsx         # KPI metric display card
│   │   │   ├── monthly-comparison.tsx    # 3-month trend comparison
│   │   │   ├── severity-chart.tsx   # Vulnerability severity pie chart
│   │   │   ├── simulation-comparison.tsx # BAS simulation tracker
│   │   │   ├── stats-overview.tsx   # Team stats summary cards
│   │   │   ├── team-header.tsx      # Team page header
│   │   │   ├── theme-toggle.tsx     # Dark/light mode toggle
│   │   │   └── trend-chart.tsx      # Recharts line chart wrapper
│   │   ├── hooks/                   # Custom React hooks
│   │   │   └── use-toast.ts         # Toast notification hook
│   │   ├── lib/                     # Utilities
│   │   │   ├── queryClient.ts       # TanStack Query configuration
│   │   │   └── utils.ts            # Helper functions
│   │   ├── pages/                   # Route page components
│   │   │   ├── admin.tsx            # Admin CRUD interface
│   │   │   ├── not-found.tsx        # 404 page
│   │   │   ├── overview.tsx         # Main overview dashboard
│   │   │   ├── report.tsx           # Report generation with PDF export
│   │   │   └── team-dashboard.tsx   # Individual team dashboards
│   │   ├── App.tsx                  # Root component with routing
│   │   ├── index.css                # Global styles & CSS variables
│   │   └── main.tsx                 # Application entry point
│   └── index.html                   # HTML template
├── server/                          # Backend Express application
│   ├── db.ts                        # Database connection (PostgreSQL)
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # API route definitions
│   ├── seed.ts                      # Database seeding logic
│   ├── static.ts                    # Static file serving
│   ├── storage.ts                   # Database access layer (Drizzle ORM)
│   ├── github.ts                    # GitHub integration (Replit connector)
│   └── vite.ts                      # Vite dev server integration
├── shared/                          # Shared code (client & server)
│   └── schema.ts                    # Drizzle schema definitions & types
├── migrations/                      # Database migration files
├── .gitignore                       # Git ignore rules
├── drizzle.config.ts                # Drizzle Kit configuration
├── package.json                     # Dependencies & scripts
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
└── vite.config.ts                   # Vite build configuration
```

---

## API Reference

### Dashboard & Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | All team stats, vulnerabilities, and KPIs |
| GET | `/api/teams/:team` | Detailed data for a specific team |

### KPI Management (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kpis` | List all KPIs (optional `?team=` filter) |
| GET | `/api/kpis/:id` | Get a specific KPI |
| POST | `/api/kpis` | Create a new KPI |
| PATCH | `/api/kpis/:id` | Update a KPI |
| DELETE | `/api/kpis/:id` | Delete a KPI |

### Vulnerability Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vulnerabilities` | List all vulnerabilities (optional `?team=` filter) |
| POST | `/api/vulnerabilities` | Create a new vulnerability record |
| PATCH | `/api/vulnerabilities/:id` | Update a vulnerability record |
| DELETE | `/api/vulnerabilities/:id` | Delete a vulnerability record |

### Team Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/team-stats` | List all team statistics |
| PATCH | `/api/team-stats/:id` | Update team statistics |

### Trends & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trends` | List all trend data (optional `?team=` filter) |
| PATCH | `/api/trends/:id` | Update a trend data record |
| GET | `/api/report/:team` | Generate comprehensive monthly report |

### Assessments & Simulations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments` | Get all assessment data with cycle comparison |

---

## Security Teams

The dashboard monitors five specialized security teams:

| Team | Key | Focus Area |
|------|-----|------------|
| **Application Security** | `application` | Web/mobile app vulnerability testing, code reviews |
| **Infrastructure Security** | `infrastructure` | Network, server, and cloud infrastructure hardening |
| **Offensive Security** | `offensive` | Penetration testing, red team assessments |
| **Cyber Threat Intelligence** | `cti` | Threat landscape monitoring, IOC tracking |
| **Breach & Attack Simulation** | `bas` | Automated security control validation |

### Team-Specific Features

- **Application Security, Infrastructure, CTI**: 3-month comparison showing current month + previous 2 months with vulnerability counts, resolution rates, and metric trends; Admin Mode enables inline editing of all monthly data with batched save
- **Offensive Security**: Assessment comparison across 9 types (AD, Cloud, External Network, Internal Network, File Sharing, OSINT, WiFi, C2C, Phishing) with current vs previous cycle
- **BAS**: Monthly simulation tracking for 7 types (Network Infiltration, Endpoint Security, WAF F5, WAF ThreatX, Email Gateway, AD Assessment, CVE Critical) with prevention/detection rates

---

## PDF Report Generation

The application generates professional PDF reports using jsPDF with programmatic rendering:

### Individual Team Reports
- Executive summary with open/closed findings, MTTR, remediation rate
- KPI progress bar charts with color-coded thresholds
- Vulnerability severity distribution bar charts
- Monthly trend grouped bar charts
- Assessment comparison charts (Offensive Security)
- BAS simulation performance bars (BAS team)
- Asset coverage statistics

### Consolidated Report
- Cover page with organization-wide overview
- Team comparison table and bar chart
- Risk and remediation comparison across all teams
- Full individual reports for each team
- Automatic page breaks and page numbering

**Export formats:**
- Individual: `{TeamName}_Security_Report_{YYYY-MM-DD}.pdf`
- Consolidated: `IVM_Consolidated_Security_Report_{YYYY-MM-DD}.pdf`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret key for Express session encryption |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `PORT` | No | Server port (default: `5000`) |

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with HMR |
| `build` | `npm run build` | Build for production |
| `start` | `npm start` | Run production server |
| `check` | `npm run check` | TypeScript type checking |
| `db:push` | `npm run db:push` | Push schema changes to database |

---

## License

This project is licensed under **Surmount Software Solutions**. All rights reserved.
