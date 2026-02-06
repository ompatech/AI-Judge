import { useEffect, useMemo, useState } from "react";
import { fetchResults, type ResultRow } from "../api/results";
import { listQueues, type QueueRow } from "../api/queues";
import { listJudges, type JudgeRow } from "../api/judges";
import { supabase } from "../lib/supabase";

export function ResultsPage() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [judges, setJudges] = useState<JudgeRow[]>([]);
  const [templates, setTemplates] = useState<{ template_id: string; question_text: string }[]>([]);

  // filters
  const [queueId, setQueueId] = useState("");
  const [judgeId, setJudgeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [verdict, setVerdict] = useState("");

  // Load filter dropdown data
  useEffect(() => {
    (async () => {
      try {
        const [q, j] = await Promise.all([listQueues(), listJudges()]);
        setQueues(q);
        setJudges(j);

        // templates for dropdown (all templates)
        const { data, error } = await supabase
          .from("question_templates")
          .select("template_id, question_text")
          .order("template_id", { ascending: true });

        if (error) throw new Error(error.message);
        setTemplates((data ?? []) as any);
      } catch (e: any) {
        setStatus(`Error ❌ ${e?.message ?? String(e)}`);
      }
    })();
  }, []);

  async function load() {
    setLoading(true);
    setStatus("");
    try {
      const data = await fetchResults({
        queueId: queueId || undefined,
        judgeId: judgeId || undefined,
        templateId: templateId || undefined,
        verdict: verdict || undefined,
      });
      setRows(data);
    } catch (e: any) {
      setStatus(`Error ❌ ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueId, judgeId, templateId, verdict]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pass = rows.filter((r) => r.verdict === "pass").length;
    const fail = rows.filter((r) => r.verdict === "fail").length;
    const inc = rows.filter((r) => r.verdict === "inconclusive").length;
    const passRate = total ? Math.round((pass / total) * 100) : 0;
    return { total, pass, fail, inc, passRate };
  }, [rows]);

  return (
    <div>
      <h1>Results</h1>
      <p>Filter and review evaluation outcomes.</p>

      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          <label>
            Queue
            <select value={queueId} onChange={(e) => setQueueId(e.target.value)} style={{ width: "100%" }}>
              <option value="">All</option>
              {queues.map((q) => (
                <option key={q.queue_id} value={q.queue_id}>
                  {q.queue_id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Judge
            <select value={judgeId} onChange={(e) => setJudgeId(e.target.value)} style={{ width: "100%" }}>
              <option value="">All</option>
              {judges.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Template
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ width: "100%" }}>
              <option value="">All</option>
              {templates.map((t) => (
                <option key={t.template_id} value={t.template_id}>
                  {t.template_id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Verdict
            <select value={verdict} onChange={(e) => setVerdict(e.target.value)} style={{ width: "100%" }}>
              <option value="">All</option>
              <option value="pass">pass</option>
              <option value="fail">fail</option>
              <option value="inconclusive">inconclusive</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14 }}>
          <div><b>Total:</b> {stats.total}</div>
          <div><b>Pass:</b> {stats.pass}</div>
          <div><b>Fail:</b> {stats.fail}</div>
          <div><b>Inconclusive:</b> {stats.inc}</div>
          <div><b>Pass rate:</b> {stats.passRate}%</div>
        </div>

        {status && <div style={{ marginTop: 8 }}>{status}</div>}
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div>No results found (run judges first).</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Time</th>
                <th style={th}>Queue</th>
                <th style={th}>Submission</th>
                <th style={th}>Template</th>
                <th style={th}>Judge</th>
                <th style={th}>Verdict</th>
                <th style={th}>Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={td}>{r.submissions?.queue_id ?? ""}</td>
                  <td style={td}>{r.submission_id}</td>
                  <td style={td} title={r.question_templates?.question_text ?? ""}>
                    {r.template_id}
                  </td>
                  <td style={td}>
                    {r.judges?.name ?? r.judge_id}
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{r.judges?.model ?? ""}</div>
                  </td>
                  <td style={td}>
                    <span style={{ fontWeight: 700 }}>{r.verdict}</span>
                  </td>
                  <td style={td}>{r.judge_reasoning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
  fontSize: 13,
};
