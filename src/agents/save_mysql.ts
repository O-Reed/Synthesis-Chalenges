import { pool } from "../db";

export type SaveMySQLInput = {
  runId: number;
  url: string;
  stats: { line_count: number; word_count: number; char_count: number; };
};
export type SaveMySQLOutput = { saved: true; id: number; };

export async function save_mysql(input: SaveMySQLInput): Promise<SaveMySQLOutput> {
  const { runId, url, stats } = input;
  const [res] = await pool.query(
    `INSERT INTO stats_results (run_id, url, line_count, word_count, char_count) VALUES (?,?,?,?,?)`,
    [runId, url, stats.line_count, stats.word_count, stats.char_count]
  );
  // @ts-ignore
  return { saved: true, id: Number(res.insertId) };
}
