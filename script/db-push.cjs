require("dotenv/config");
const { execSync } = require("child_process");
execSync("npx drizzle-kit push", { stdio: "inherit" });
