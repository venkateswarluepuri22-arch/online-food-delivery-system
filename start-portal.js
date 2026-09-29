const { spawn, execSync } = require("child_process");
const http = require("http");
const https = require("https");
const os = require("os");
const path = require("path");
const fs = require("fs");

// Load .env
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
  require("dotenv").config({ path: path.join(__dirname, "React/Backend/.env") });
} catch (_) {}

// Default to 5001 to avoid macOS AirPlay conflict on 5000
const PORT = parseInt(process.env.PORT, 10) || 5001;
const ROOT_DIR = __dirname;
const REACT_DIR = path.join(ROOT_DIR, "React");
const BACKEND_DIR = path.join(REACT_DIR, "Backend");
const DIST_DIR = path.join(REACT_DIR, "dist");
const IS_WIN = process.platform === "win32";

console.clear ? console.clear() : console.log("\n".repeat(5));
console.log("================================================================================");
console.log("             COLLEGE CANTEEN PORTAL - INITIALIZING SINGLE LINK SERVER           ");
console.log("================================================================================");

// 1. Helper to find active local Wi-Fi / LAN IP addresses
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if ((iface.family === "IPv4" || iface.family === 4) && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// 2. Fetch public IP address
function getPublicIp() {
  return new Promise((resolve) => {
    const req = https.get("https://api.ipify.org", { timeout: 3000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data.trim()));
    });
    req.on("error", () => resolve("Check myip.is"));
    req.on("timeout", () => {
      req.destroy();
      resolve("Check myip.is");
    });
  });
}

// 3. Free Port cross-platform (Windows & macOS/Linux)
function freePort(port) {
  try {
    if (IS_WIN) {
      const stdout = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf8" });
      const lines = stdout.trim().split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0" && !isNaN(Number(pid))) {
          try {
            process.kill(Number(pid), "SIGKILL");
            console.log(`[OK] Released busy port ${port} (terminated previous process ${pid})`);
          } catch (_) {}
        }
      }
    } else {
      // macOS / Linux
      const stdout = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: "utf8" });
      const pids = stdout.trim().split("\n").filter(Boolean);
      for (const pid of pids) {
        const numPid = Number(pid);
        if (numPid && numPid !== process.pid) {
          try {
            process.kill(numPid, "SIGTERM");
            console.log(`[OK] Released busy port ${port} (terminated previous process ${pid})`);
          } catch (_) {}
        }
      }
    }
  } catch (_) {
    // Port was already free
  }
}

// 4. Ensure Frontend is built
function ensureFrontendBuilt() {
  const indexHtml = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexHtml)) {
    console.log("[BUILD] Compiling React frontend for production (single URL delivery)...");
    try {
      execSync("npm run build", { cwd: REACT_DIR, stdio: "inherit", shell: true });
      console.log("[OK] React build complete!");
    } catch (err) {
      console.error("[ERROR] Failed to build React frontend:", err.message);
      process.exit(1);
    }
  } else {
    console.log("[OK] React frontend build ready in React/dist.");
  }
}

// 5. Cloudflare Tunnel detector / runner
function findCloudflared() {
  if (IS_WIN) {
    const exePath = path.join(ROOT_DIR, "cloudflared.exe");
    if (fs.existsSync(exePath)) return exePath;
  }
  try {
    execSync("cloudflared --version", { stdio: "ignore" });
    return "cloudflared";
  } catch (_) {}
  return null;
}

async function start() {
  freePort(PORT);
  ensureFrontendBuilt();

  const localIps = getLocalIps();
  const primaryLocalIp = localIps.length > 0 ? localIps[0].address : "localhost";
  const publicIp = await getPublicIp();
  const cfBinary = findCloudflared();

  console.log(`[1/3] Starting Canteen Express Server on port ${PORT}...`);
  const serverProcess = spawn("node", ["server.js"], {
    cwd: BACKEND_DIR,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, PORT: String(PORT) }
  });

  serverProcess.stdout.on("data", (data) => {
    const text = data.toString();
    if (text.includes("MongoDB connected successfully")) {
      console.log("[OK] Connected to MongoDB database.");
    }
  });

  serverProcess.stderr.on("data", (data) => {
    const err = data.toString();
    if (!err.includes("ExperimentalWarning") && !err.includes("DeprecationWarning")) {
      console.error("[Backend Notice]", err.trim());
    }
  });

  // Wait 1.5s for server to start listening
  await new Promise((r) => setTimeout(r, 1500));

  console.log("[2/3] Setting up local and network access links...");

  let currentTunnelUrl = null;
  let tunnelProcess = null;
  let isShuttingDown = false;
  let restartCount = 0;
  let tunnelProvider = cfBinary ? "cloudflare" : "localtunnel";

  function displayDashboard(tunnelUrl) {
    console.clear ? console.clear() : console.log("\n".repeat(3));
    console.log("================================================================================");
    console.log("           🍲 ONLINE CAMPUS CANTEEN PORTAL - READY & RUNNING                    ");
    console.log("================================================================================");

    if (tunnelUrl) {
      if (tunnelProvider === "cloudflare") {
        console.log("\n  [1] 🌟 GLOBAL PUBLIC LINK (SHARE TO ANY PHONE OR LAPTOP):");
        console.log(`      \x1b[32m\x1b[1m${tunnelUrl}\x1b[0m`);
        console.log(`      * High-Reliability Cloudflare Edge Tunnel`);
        console.log(`      * \x1b[33mZero passwords needed - opens straight to the menu!\x1b[0m`);
      } else {
        console.log("\n  [1] 🌟 GLOBAL PUBLIC LINK (SHARE TO ANY PHONE OR LAPTOP):");
        console.log(`      \x1b[32m\x1b[1m${tunnelUrl}\x1b[0m`);
        console.log(`      * Note: If asked for Tunnel Password / Endpoint IP, enter: \x1b[33m${publicIp}\x1b[0m`);
      }
    } else {
      console.log("\n  [1] 🌐 GLOBAL PUBLIC TUNNEL (OPTIONAL):");
      console.log(`      Connecting in background (or run local link below)...`);
    }

    console.log("\n  [2] 📶 SAME WI-FI NETWORK LINK (FOR FRIENDS ON SAME WI-FI / HOTSPOT):");
    console.log(`      \x1b[36m\x1b[1mhttp://${primaryLocalIp}:${PORT}\x1b[0m`);
    console.log(`      * Direct LAN speed: zero lag, instant loading!`);

    console.log("\n  [3] 💻 THIS COMPUTER LOCAL LINK:");
    console.log(`      \x1b[32m\x1b[1mhttp://localhost:${PORT}\x1b[0m`);

    console.log("\n================================================================================");
    console.log("  DEMO TEST ACCOUNTS INCLUDED:");
    console.log("  ------------------------------------------------------------------");
    console.log("  • Student:  student@canteen.edu  |  Password: student123");
    console.log("  • Admin:    admin@canteen.edu    |  Password: admin123");
    console.log("================================================================================");
    console.log("  Press Ctrl + C at any time to stop the server.");
    console.log("================================================================================\n");
  }

  // Start Cloudflare Tunnel
  function launchCloudflareTunnel() {
    if (isShuttingDown || !cfBinary) return;
    tunnelProvider = "cloudflare";

    try {
      const proc = spawn(cfBinary, ["tunnel", "--url", `http://localhost:${PORT}`], {
        stdio: ["ignore", "pipe", "pipe"]
      });

      let found = false;
      const onData = (data) => {
        const text = data.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !found) {
          found = true;
          currentTunnelUrl = match[0];
          restartCount = 0;
          displayDashboard(currentTunnelUrl);
        }
      };

      proc.stdout.on("data", onData);
      proc.stderr.on("data", onData);

      proc.on("error", () => {
        fallbackToLocaltunnel();
      });

      proc.on("close", () => {
        if (!isShuttingDown) {
          setTimeout(() => {
            restartCount++;
            if (restartCount > 3) {
              fallbackToLocaltunnel();
            } else {
              launchCloudflareTunnel();
            }
          }, 2000);
        }
      });

      tunnelProcess = proc;
    } catch (_) {
      fallbackToLocaltunnel();
    }
  }

  // Fallback to localtunnel
  function fallbackToLocaltunnel() {
    if (isShuttingDown) return;
    tunnelProvider = "localtunnel";

    try {
      if (tunnelProcess) {
        try { tunnelProcess.kill(); } catch (_) {}
      }

      const cmd = IS_WIN ? "npx.cmd" : "npx";
      const proc = spawn(cmd, ["-y", "localtunnel", "--port", String(PORT)], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: IS_WIN
      });

      let found = false;
      const onData = (data) => {
        const text = data.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/);
        if (match && !found) {
          found = true;
          currentTunnelUrl = match[0];
          displayDashboard(currentTunnelUrl);
        }
      };

      proc.stdout.on("data", onData);
      proc.stderr.on("data", onData);

      proc.on("error", () => {});
      proc.on("close", () => {
        if (!isShuttingDown) {
          setTimeout(() => fallbackToLocaltunnel(), 4000);
        }
      });

      tunnelProcess = proc;
    } catch (_) {}
  }

  // Start tunnel
  if (cfBinary) {
    launchCloudflareTunnel();
  } else {
    fallbackToLocaltunnel();
  }

  // Display initial dashboard immediately
  displayDashboard(null);

  // Keep-Alive pinger
  const keepAlive = setInterval(() => {
    http.get(`http://localhost:${PORT}/api`, () => {}).on("error", () => {});
  }, 30000);

  // Graceful cleanup on exit
  function cleanup() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    clearInterval(keepAlive);
    console.log("\nStopping server and closing tunnel...");
    if (tunnelProcess) {
      try { tunnelProcess.kill(); } catch (_) {}
    }
    if (serverProcess) {
      try {
        if (IS_WIN && serverProcess.pid) {
          execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: "ignore" });
        } else {
          serverProcess.kill("SIGTERM");
        }
      } catch (_) {}
    }
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}

start();
