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

        // initialize selection map from assignments
        const map: Record<string, Set<string>> = {};
        for (const t of tRows) map[t.template_id] = new Set();

        for (const a of aRows) {
          if (!map[a.template_id]) map[a.template_id] = new Set();
          map[a.template_id].add(a.judge_id);
        }

        setSelected(map);
      } catch (e: any) {
        setStatus(`Error ❌ ${e?.message ?? String(e)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [qid]);

  function toggle(templateId: string, judgeId: string) {
    setSelected((prev) => {
      const next: Record<string, Set<string>> = { ...prev };
      const s = new Set(next[templateId] ?? []);
      if (s.has(judgeId)) s.delete(judgeId);
      else s.add(judgeId);
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
      setStatus("Saved ✅");
    } catch (e: any) {
      setStatus(`Error ❌ ${e?.message ?? String(e)}`);
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

      // Sequential calls: simplest + most reliable
      for (let i = 0; i < tasks.length; i++) {
        await callEvaluateFunction(tasks[i]);
        setProgress({ done: i + 1, total: tasks.length });
      }

      setStatus("Run complete ✅");
    } catch (e: any) {
      setStatus(`Error ❌ ${e?.message ?? String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  if (!qid) return <div>Missing queueId.</div>;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/queues">← Back to Queues</Link>
      </div>

      <h1>Queue: {qid}</h1>
      <p>Assign active judges to each question template in this queue, then run evaluations.</p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => void onSaveAll()} disabled={loading || running}>
          Save assignments
        </button>

        <button onClick={() => void onRunAll()} disabled={loading || running}>
          {running ? "Running…" : "Run AI Judges"}
        </button>

        {running && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Progress: {progress.done}/{progress.total}
          </div>
        )}

        <div>{status}</div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : templates.length === 0 ? (
        <div>No question templates found for this queue (did you import data?).</div>
      ) : judges.length === 0 ? (
        <div>No active judges found. Create one on the Judges page first.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {templates.map((t) => (
            <div
              key={t.template_id}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {t.template_id}{" "}
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      ({t.question_type})
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>{t.question_text}</div>
                </div>

                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  selected: {selectedCounts[t.template_id] ?? 0}
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
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
                      <span style={{ fontSize: 12, opacity: 0.7 }}>({j.model})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
