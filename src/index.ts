import express from "express";
import { migrate, pool } from "./db";
import { runSimpleGraph } from "./orchestrator";
import { z } from "zod";

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.post("/runs", async (req, res) => {
  try {
    const body = z.object({ url: z.string().url() }).safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });

    const { runId } = await runSimpleGraph({ url: body.data.url });
    res.json({ run_id: runId });
  } catch (error) {
    console.error("Error in /runs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/runs/:id", async (req, res) => {
  try {
    const [runs] = await pool.query(`SELECT * FROM runs WHERE id=?`, [req.params.id]);
    const [nodes] = await pool.query(`SELECT * FROM run_nodes WHERE run_id=? ORDER BY id ASC`, [req.params.id]);
    const [results] = await pool.query(`SELECT * FROM stats_results WHERE run_id=?`, [req.params.id]);
    // @ts-ignore
    res.json({ run: runs[0] || null, nodes, results });
  } catch (error) {
    console.error("Error in /runs/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = Number(process.env.PORT || 8080);

// Start the app even if database migration fails
app.listen(port, () => {
  console.log(`API listening on :${port}`);
  
  // Try to migrate database in background
  migrate().then(() => {
    console.log("Database migration completed");
  }).catch((error) => {
    console.error("Database migration failed:", error);
    console.log("App is running but database features may not work");
  });
});
