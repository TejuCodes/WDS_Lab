/**
 * ============================================================
 * FILE: src/server.js
 * LAYER: Entry point
 *
 * The ONLY file that opens a port. Run it with:  npm run dev
 *
 * ORDER MATTERS:
 *   1. connect to MongoDB   (if the DB is down, do not accept traffic)
 *   2. start listening
 *   3. install the "last words" handlers for process-level problems
 * ============================================================
 */

const app = require("./app");
const { connectDB } = require("./config/db");

/**
 * The async main function.
 *
 * Why not just write the code at the top level? Because connecting to
 * a database can fail. If it fails we want a clear message and a
 * non-zero exit code, not a half-started server. `main()` collects
 * that logic in one place.
 */
async function main() {
  try {
    // 1) Database first.
    await connectDB(process.env.MONGO_URI);

    // 2) Start the HTTP server.
    // `PORT` comes from .env. `app.listen` is asynchronous: the
    // callback runs once the OS confirms the port is open.
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`[server] API ready at http://localhost:${PORT}`);
      console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
    });

    /* -------- graceful shutdown: "last words" handlers -------- */
    // Pressing Ctrl+C should close the server AND the database
    // connection so nothing is left half-open.
    const shutdown = (signal) => async () => {
      console.log(`\n[server] ${signal} received, shutting down...`);
      server.close(async () => {
        const mongoose = require("mongoose");
        await mongoose.connection.close();
        console.log("[server] Closed. Bye!");
        process.exit(0);
      });
    };
    process.on("SIGINT", shutdown("SIGINT")); // Ctrl+C on Windows/Linux
    process.on("SIGTERM", shutdown("SIGTERM")); // `kill` on Linux

    // An unhandled error would otherwise crash Node with a confusing
    // message. Log it, keep serving.
    process.on("unhandledRejection", (reason) => {
      console.error("[server] Unhandled promise rejection:", reason);
    });
  } catch (err) {
    // Startup failure -> tell the student exactly what to do and exit.
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  }
}

main();
