// src/pages/QueueDetailPage.tsx

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listTemplatesForQueue, type TemplateRow } from "../api/templates";
import { listAssignments, replaceAssignments } from "../api/assignments";
import { listActiveJudges, type JudgeRow } from "../api/judges";
import { buildQueueEvalTasks, callEvaluateFunction } from "../api/run";

export function QueueDetailPage() {
  const { queueId } = useParams<{ queueId: string }>();
  const qid = queueId ?? "";

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [judges, setJudges] = useState<JudgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  // templateId -> Set<judgeId>
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});

  // Run state
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const selectedCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [t, s] of Object.entries(selected)) out[t] = s.size;
    return out;
  }, [selected]);

  useEffect(() => {
    (async () => {
      if (!qid) return;
      setLoading(true);
      setStatus("");
      try {
        const [tRows, jRows, aRows] = await Promise.all([
          listTemplatesForQueue(qid),
          listActiveJudges(),
          listAssignments(qid),
        ]);

        setTemplates(tRows);
        setJudges(jRows);

        const map: Record<string, Set<string>> = {};
        for (const t of tRows) map[t.template_id] = new Set();
        for (const a of aRows) {
          map[a.template_id]?.add(a.judge_id);
        }

        setSelected(map);
      } catch (e: any) {
        setStatus(`Error: ${e?.message ?? String(e)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [qid]);

  function toggle(templateId: string, judgeId: string) {
    setSelected((prev) => {
      const next = { ...prev };
      const s = new Set(next[templateId] ?? []);
      s.has(judgeId) ? s.delete(judgeId) : s.add(judgeId);
      next[templateId] = s;
      return next;
    });
  }

  async function onSaveAll() {
    setStatus("");
    try {
      const payload: Record<string, string[]> = {};
      for (const t of templates) {
        payload[t.template_id] = Array.from(selected[t.template_id] ?? []);
      }
      await replaceAssignments(qid, payload);
      setStatus("Assignments saved.");
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    }
  }

  async function onRunAll() {
    setStatus("");
    setRunning(true);
    try {
      const tasks = await buildQueueEvalTasks(qid);

      if (tasks.length === 0) {
        setStatus("No evaluation tasks found. Assign judges first.");
        return;
      }

      setProgress({ done: 0, total: tasks.length });

      for (let i = 0; i < tasks.length; i++) {
        await callEvaluateFunction(tasks[i]);
        setProgress({ done: i + 1, total: tasks.length });
      }

      setStatus(`Completed ${tasks.length} evaluation${tasks.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  if (!qid) return <div>Missing queueId.</div>;

  return (
    <div style={{ background: "#f9fafb", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 20 }}>
        <Link to="/queues" style={{ fontSize: 14 }}>
          ← Back to queues
        </Link>

        <header>
          <h1 style={{ marginBottom: 6 }}>Queue: {qid}</h1>
          <p style={{ color: "#555" }}>
            Assign active judges to each question template, then run evaluations.
          </p>
        </header>

        {/* Actions */}
        <section style={card}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={onSaveAll} disabled={loading || running}>
              Save assignments
            </button>

            <button onClick={onRunAll} disabled={loading || running}>
              {running ? "Running…" : "Run AI judges"}
            </button>

            {running && (
              <span style={{ fontSize: 13, color: "#555" }}>
                Progress {progress.done}/{progress.total}
              </span>
            )}
          </div>

          {status && <div style={statusText}>{status}</div>}
        </section>

        {/* Content */}
        {loading ? (
          <div>Loading…</div>
        ) : templates.length === 0 ? (
          <div>No question templates found for this queue.</div>
        ) : judges.length === 0 ? (
          <div>No active judges found. Create one on the Judges page.</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {templates.map((t) => (
              <div key={t.template_id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {t.template_id}
                      <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 6 }}>
                        ({t.question_type})
                      </span>
                    </div>
                    <div style={{ marginTop: 6 }}>{t.question_text}</div>
                  </div>

                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    selected {selectedCounts[t.template_id] ?? 0}
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {judges.map((j) => {
                    const checked = (selected[t.template_id] ?? new Set()).has(j.id);
                    return (
                      <label
                        key={j.id}
                        style={{ display: "flex", gap: 8, alignItems: "center" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(t.template_id, j.id)}
                          disabled={running}
                        />
                        <span>{j.name}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          ({j.model})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- styles ---------- */

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
};

const statusText: React.CSSProperties = {
  marginTop: 12,
  fontSize: 13,
  color: "#374151",
};
