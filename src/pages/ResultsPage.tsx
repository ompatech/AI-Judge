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
  const [templates, setTemplates] = useState<
    { template_id: string; question_text: string }[]
  >([]);

  // filters
  const [queueId, setQueueId] = useState("");
  const [judgeId, setJudgeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [verdict, setVerdict] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [q, j] = await Promise.all([listQueues(), listJudges()]);
        setQueues(q);
        setJudges(j);

        const { data, error } = await supabase
          .from("question_templates")
          .select("template_id, question_text")
          .order("template_id", { ascending: true });

        if (error) throw new Error(error.message);
        setTemplates((data ?? []) as any);
      } catch (e: any) {
        setStatus(`Error: ${e?.message ?? String(e)}`);
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
      setStatus(`Error: ${e?.message ?? String(e)}`);
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
    <div style={{ background: "#f9fafb", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 6 }}>Results</h1>
          <p style={{ color: "#555" }}>
            Filter and review evaluation outcomes across queues and judges.
          </p>
        </header>

        {/* Filters + Stats */}
        <section style={card}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <Filter label="Queue" value={queueId} onChange={setQueueId}>
              <option value="">All</option>
              {queues.map((q) => (
                <option key={q.queue_id} value={q.queue_id}>
                  {q.queue_id}
                </option>
              ))}
            </Filter>

            <Filter label="Judge" value={judgeId} onChange={setJudgeId}>
              <option value="">All</option>
              {judges.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </Filter>

            <Filter label="Template" value={templateId} onChange={setTemplateId}>
              <option value="">All</option>
              {templates.map((t) => (
                <option key={t.template_id} value={t.template_id}>
                  {t.template_id}
                </option>
              ))}
            </Filter>

            <Filter label="Verdict" value={verdict} onChange={setVerdict}>
              <option value="">All</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="inconclusive">Inconclusive</option>
            </Filter>
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12,
              fontSize: 13,
            }}
          >
            <Stat label="Total" value={stats.total} />
            <Stat label="Pass" value={stats.pass} />
            <Stat label="Fail" value={stats.fail} />
            <Stat label="Inconclusive" value={stats.inc} />
            <Stat label="Pass rate" value={`${stats.passRate}%`} />
          </div>

          {status && status.startsWith("Error") && (
            <div style={errorBox}>{status}</div>
          )}
        </section>

        {/* Results Table */}
        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <section style={emptyBox}>
            <div style={{ fontWeight: 600 }}>No results yet</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              Assign judges to a queue and click <i>Run AI Judges</i>.
            </div>
          </section>
        ) : (
          <section style={card}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
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
                      <td style={td}>
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td style={td}>{r.submissions?.queue_id ?? ""}</td>
                      <td style={td}>{r.submission_id}</td>
                      <td style={td} title={r.question_templates?.question_text}>
                        {r.template_id}
                      </td>
                      <td style={td}>
                        {r.judges?.name ?? r.judge_id}
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {r.judges?.model}
                        </div>
                      </td>
                      <td style={td}>
                        <VerdictBadge verdict={r.verdict} />
                      </td>
                      <td style={td}>
                        <div style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>
                          {r.judge_reasoning}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label style={{ fontSize: 13 }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={select}
      >
        {children}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={statBox}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pass: { bg: "#dcfce7", color: "#166534" },
    fail: { bg: "#fee2e2", color: "#991b1b" },
    inconclusive: { bg: "#f3f4f6", color: "#374151" },
  };

  const { bg, color } = map[verdict] ?? map.inconclusive;

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
        textTransform: "capitalize",
      }}
    >
      {verdict}
    </span>
  );
}

/* ---------- styles ---------- */

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
};

const emptyBox: React.CSSProperties = {
  padding: 20,
  border: "1px dashed #e5e7eb",
  borderRadius: 12,
  background: "#fafafa",
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 8,
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: 13,
};

const select: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
};

const statBox: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  background: "#fafafa",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
  fontSize: 13,
  color: "#111827",
};

const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
  fontSize: 13,
  color: "#111827",
};
