import { pool } from "./db";
import { http_fetch } from "./agents/http_fetch";
import { text_stats } from "./agents/text_stats";
import { save_mysql } from "./agents/save_mysql";

type NodeStatus = "PENDING"|"RUNNING"|"SUCCEEDED"|"FAILED"|"TIMEOUT";
type RunStatus = "PENDING"|"RUNNING"|"SUCCEEDED"|"FAILED";

type GraphInput = { url: string };
type NodeRecord = { node_id: string; };

const NODES: NodeRecord[] = [
  { node_id: "http_fetch" },
  { node_id: "text_stats" },
  { node_id: "save_mysql" }
];

// basic helpers
async function createRun(url: string): Promise<number> {
  const [res] = await pool.query(`INSERT INTO runs (url, status) VALUES (?, 'PENDING')`, [url]);
  // @ts-ignore
  return Number(res.insertId);
}

async function setRunStatus(runId: number, status: RunStatus) {
  await pool.query(`UPDATE runs SET status=? WHERE id=?`, [status, runId]);
}

async function upsertNode(runId: number, nodeId: string, status: NodeStatus, fields: Partial<{output_json: any, error_msg: string, attempt: number}>) {
  try {
    console.log(`[upsertNode] ${nodeId}: ${status}, runId: ${runId}`);
    console.log(`[upsertNode] fields:`, JSON.stringify(fields));
    
    const [rows] = await pool.query(`SELECT id FROM run_nodes WHERE run_id=? AND node_id=?`, [runId, nodeId]);
    // @ts-ignore
    const existing = rows[0]?.id as number|undefined;
    const nowStart = status === "RUNNING" ? new Date() : null;
    const nowEnd   = (status === "SUCCEEDED" || status === "FAILED" || status === "TIMEOUT") ? new Date() : null;

    if (!existing) {
      console.log(`[upsertNode] Inserting new node record`);
      const outputJsonStr = fields.output_json ? JSON.stringify(fields.output_json) : null;
      await pool.query(
        `INSERT INTO run_nodes (run_id,node_id,status,output_json,error_msg,attempt,started_at,finished_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [runId, nodeId, status, outputJsonStr, fields.error_msg ?? null, fields.attempt ?? 0, nowStart, nowEnd]
      );
    } else {
      console.log(`[upsertNode] Updating existing node record`);
      const outputJsonStr = fields.output_json ? JSON.stringify(fields.output_json) : null;
      await pool.query(
        `UPDATE run_nodes SET status=?, output_json=?, error_msg=?, attempt=?,
                started_at=COALESCE(started_at, ?), finished_at=?
         WHERE run_id=? AND node_id=?`,
        [status, outputJsonStr, fields.error_msg ?? null, fields.attempt ?? 0, nowStart, nowEnd, runId, nodeId]
      );
    }
    console.log(`[upsertNode] Success: ${nodeId} updated to ${status}`);
  } catch (error) {
    console.error(`[upsertNode] Error for ${nodeId}:`, error);
    throw error;
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry<T>(fn: () => Promise<T>, attempts = 2, backoffMs = 500): Promise<T> {
  let lastErr: any;
  for (let i=0;i<=attempts;i++){
    try { return await fn(); }
    catch (e) { lastErr = e; if (i<attempts) await sleep(backoffMs * (i+1)); }
  }
  throw lastErr;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
  });
}

export async function runSimpleGraph(input: GraphInput): Promise<{runId:number}> {
  const runId = await createRun(input.url);
  await setRunStatus(runId, "RUNNING");

  try {
    // Node 1: http_fetch
    await upsertNode(runId, "http_fetch", "RUNNING", { attempt: 1 });
    let fetched: { body: string; url: string };
    try {
      fetched = await withRetry(
        () => withTimeout(http_fetch({ url: input.url, timeoutMs: 8000 }, new AbortController().signal), 9000),
        1, 600
      );
      await upsertNode(runId, "http_fetch", "SUCCEEDED", { output_json: fetched, attempt: 1 });
    } catch (e: any) {
      const isTimeout = e?.message === "timeout";
      await upsertNode(runId, "http_fetch", isTimeout ? "TIMEOUT" : "FAILED", { error_msg: String(e), attempt: 1 });
      await setRunStatus(runId, "FAILED");
      return { runId };
    }

    // Node 2: text_stats
    await upsertNode(runId, "text_stats", "RUNNING", { attempt: 1 });
    let stats = await text_stats({ text: fetched.body });
    await upsertNode(runId, "text_stats", "SUCCEEDED", { output_json: stats, attempt: 1 });

    // Node 3: save_mysql
    await upsertNode(runId, "save_mysql", "RUNNING", { attempt: 1 });
    const saved = await save_mysql({ runId, url: fetched.url, stats });
    await upsertNode(runId, "save_mysql", "SUCCEEDED", { output_json: saved, attempt: 1 });

    await setRunStatus(runId, "SUCCEEDED");
    return { runId };
  } catch (e) {
    await setRunStatus(runId, "FAILED");
    return { runId };
  }
}
