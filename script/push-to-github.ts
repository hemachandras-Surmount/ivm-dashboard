import { getUncachableGitHubClient } from "../server/github";
import { readFileSync, statSync } from "fs";
import { resolve } from "path";

const REPO_NAME = "ivm-dashboard";
const REPO_DESCRIPTION = "Integrated Vulnerability Management Dashboard - Security KPIs, vulnerability tracking, trend analysis, and PDF report generation for enterprise security operations";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");

const REPLIT_FILES = new Set([
  "replit.md",
  ".replit",
  ".upm",
  ".cache",
  ".config",
  "server/github.ts",
  "script/push-to-github.ts",
]);

const FILES_TO_INCLUDE = [
  ".gitignore",
  ".env.example",
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "tailwind.config.ts",
  "postcss.config.js",
  "drizzle.config.ts",
  "components.json",
  "README.md",
  "client/index.html",
  "client/public/favicon.png",
  "client/src/App.tsx",
  "client/src/main.tsx",
  "client/src/index.css",
  "client/src/lib/queryClient.ts",
  "client/src/lib/theme-provider.tsx",
  "client/src/lib/utils.ts",
  "client/src/hooks/use-mobile.tsx",
  "client/src/hooks/use-toast.ts",
  "client/src/pages/admin.tsx",
  "client/src/pages/not-found.tsx",
  "client/src/pages/overview.tsx",
  "client/src/pages/report.tsx",
  "client/src/pages/team-dashboard.tsx",
  "client/src/components/app-sidebar.tsx",
  "client/src/components/assessment-comparison.tsx",
  "client/src/components/bar-chart.tsx",
  "client/src/components/kpi-card.tsx",
  "client/src/components/monthly-comparison.tsx",
  "client/src/components/severity-chart.tsx",
  "client/src/components/simulation-comparison.tsx",
  "client/src/components/stats-overview.tsx",
  "client/src/components/team-header.tsx",
  "client/src/components/theme-toggle.tsx",
  "client/src/components/trend-chart.tsx",
  "client/src/components/ui/accordion.tsx",
  "client/src/components/ui/alert-dialog.tsx",
  "client/src/components/ui/alert.tsx",
  "client/src/components/ui/aspect-ratio.tsx",
  "client/src/components/ui/avatar.tsx",
  "client/src/components/ui/badge.tsx",
  "client/src/components/ui/breadcrumb.tsx",
  "client/src/components/ui/button.tsx",
  "client/src/components/ui/calendar.tsx",
  "client/src/components/ui/card.tsx",
  "client/src/components/ui/carousel.tsx",
  "client/src/components/ui/chart.tsx",
  "client/src/components/ui/checkbox.tsx",
  "client/src/components/ui/collapsible.tsx",
  "client/src/components/ui/command.tsx",
  "client/src/components/ui/context-menu.tsx",
  "client/src/components/ui/dialog.tsx",
  "client/src/components/ui/drawer.tsx",
  "client/src/components/ui/dropdown-menu.tsx",
  "client/src/components/ui/form.tsx",
  "client/src/components/ui/hover-card.tsx",
  "client/src/components/ui/input-otp.tsx",
  "client/src/components/ui/input.tsx",
  "client/src/components/ui/label.tsx",
  "client/src/components/ui/menubar.tsx",
  "client/src/components/ui/navigation-menu.tsx",
  "client/src/components/ui/pagination.tsx",
  "client/src/components/ui/popover.tsx",
  "client/src/components/ui/progress.tsx",
  "client/src/components/ui/radio-group.tsx",
  "client/src/components/ui/resizable.tsx",
  "client/src/components/ui/scroll-area.tsx",
  "client/src/components/ui/select.tsx",
  "client/src/components/ui/separator.tsx",
  "client/src/components/ui/sheet.tsx",
  "client/src/components/ui/sidebar.tsx",
  "client/src/components/ui/skeleton.tsx",
  "client/src/components/ui/slider.tsx",
  "client/src/components/ui/switch.tsx",
  "client/src/components/ui/table.tsx",
  "client/src/components/ui/tabs.tsx",
  "client/src/components/ui/textarea.tsx",
  "client/src/components/ui/toast.tsx",
  "client/src/components/ui/toaster.tsx",
  "client/src/components/ui/toggle-group.tsx",
  "client/src/components/ui/toggle.tsx",
  "client/src/components/ui/tooltip.tsx",
  "server/db.ts",
  "server/index.ts",
  "server/routes.ts",
  "server/seed.ts",
  "server/static.ts",
  "server/storage.ts",
  "server/vite.ts",
  "shared/schema.ts",
  "script/build.ts",
  "script/db-push.cjs",
];

function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".pdf"];
  return binaryExtensions.some(ext => filePath.endsWith(ext));
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function ensureRepoInitialized(octokit: any, owner: string) {
  try {
    await octokit.repos.getContent({ owner, repo: REPO_NAME, path: "" });
    console.log("Repo already has content.");
    return;
  } catch (e: any) {
    if (e.status !== 404) throw e;
  }

  console.log("Repo is empty, initializing with a seed file...");
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: REPO_NAME,
    path: ".gitkeep",
    message: "Initialize repository",
    content: Buffer.from("").toString("base64"),
  });
  await sleep(2000);
  console.log("Repo initialized.");
}

async function main() {
  console.log("Getting GitHub client...");
  const octokit = await getUncachableGitHubClient();

  console.log("Getting authenticated user...");
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  console.log(`Authenticated as: ${owner}`);

  console.log(`Creating repository: ${REPO_NAME}...`);
  try {
    await octokit.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      description: REPO_DESCRIPTION,
      auto_init: false,
      private: false,
    });
    console.log("Repository created.");
  } catch (error: any) {
    if (error.status === 422) {
      console.log("Repository already exists, continuing...");
    } else {
      throw error;
    }
  }

  await ensureRepoInitialized(octokit, owner);

  console.log("Getting current commit SHA...");
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo: REPO_NAME,
    ref: "heads/main",
  });
  const latestCommitSha = ref.object.sha;

  const { data: latestCommit } = await octokit.git.getCommit({
    owner,
    repo: REPO_NAME,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = latestCommit.tree.sha;

  console.log("Creating blobs for all files...");
  const treeItems: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string;
  }> = [];

  for (const filePath of FILES_TO_INCLUDE) {
    const fullPath = resolve(PROJECT_ROOT, filePath);
    try {
      statSync(fullPath);
    } catch {
      console.log(`  Skipping (not found): ${filePath}`);
      continue;
    }

    const binary = isBinaryFile(filePath);
    let content: string;
    let encoding: "utf-8" | "base64";

    if (binary) {
      content = readFileSync(fullPath).toString("base64");
      encoding = "base64";
    } else {
      content = readFileSync(fullPath, "utf-8");
      encoding = "utf-8";
    }

    if (filePath === "package.json") {
      content = content
        .replace('"dev": "NODE_ENV=development', '"dev": "cross-env NODE_ENV=development')
        .replace('"start": "NODE_ENV=production', '"start": "cross-env NODE_ENV=production')
        .replace('"db:push": "drizzle-kit push"', '"db:push": "node script/db-push.cjs"');
      content = content.replace(/"\^(\d)/g, '"$1');
      console.log("  [patched] package.json: added cross-env, dotenv for db:push, pinned versions");
    }

    const { data: blob } = await octokit.git.createBlob({
      owner,
      repo: REPO_NAME,
      content,
      encoding,
    });

    treeItems.push({
      path: filePath,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });

    console.log(`  Uploaded: ${filePath}`);
  }

  console.log(`\nCreating tree with ${treeItems.length} files (full tree, no base)...`);
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo: REPO_NAME,
    tree: treeItems,
  });

  console.log("Creating commit...");
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo: REPO_NAME,
    message: `Update ${new Date().toISOString()} - cross-env fix, Windows setup improvements`,
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  console.log("Updating main branch...");
  await octokit.git.updateRef({
    owner,
    repo: REPO_NAME,
    ref: "heads/main",
    sha: commit.sha,
    force: true,
  });

  console.log(`\nDone! Repository: https://github.com/${owner}/${REPO_NAME}`);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
