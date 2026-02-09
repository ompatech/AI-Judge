import { useEffect, useMemo, useState } from "react";
import { createJudge, listJudges, updateJudge, type JudgeRow } from "../api/judges";

const DEFAULT_MODEL = "gpt-4o-mini";

export function JudgesPage() {
  const [judges, setJudges] = useState<JudgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  // Create form
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a strict grader. Output ONLY valid JSON:\n{"verdict":"pass|fail|inconclusive","reasoning":"..."}\n\nUse the rubric to judge the user's answer.`
  );
  const [model, setModel] = useState(DEFAULT_MODEL);

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingJudge = useMemo(
    () => judges.find((j) => j.id === editingId) ?? null,
    [judges, editingId]
  );

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listJudges();
      setJudges(rows);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate() {
    setStatus("");
    try {
      if (!name.trim()) throw new Error("Name is required.");
      if (!systemPrompt.trim()) throw new Error("System prompt is required.");

      await createJudge({
        name: name.trim(),
        system_prompt: systemPrompt.trim(),
        model: model.trim() || DEFAULT_MODEL,
      });

      setName("");
      setStatus("Judge created.");
      await refresh();
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    }
  }

  async function onToggleActive(j: JudgeRow) {
    setStatus("");
    try {
      await updateJudge(j.id, { active: !j.active });
      await refresh();
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    }
  }

  async function onSaveEdit() {
    if (!editingJudge) return;
    setStatus("");
    try {
      await updateJudge(editingJudge.id, {
        name: editingJudge.name,
        system_prompt: editingJudge.system_prompt,
        model: editingJudge.model,
      });
      setEditingId(null);
      setStatus("Changes saved.");
      await refresh();
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div style={{ background: "#f9fafb", padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 6 }}>Judges</h1>
          <p style={{ color: "#555" }}>
            Create rubric-style AI judges and manage which ones are active.
          </p>
        </header>

        {/* Create Judge */}
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Create judge</h2>

          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
            </label>

            <label>
              Model
              <input value={model} onChange={(e) => setModel(e.target.value)} style={input} />
            </label>

            <label>
              System prompt / rubric
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={6}
                style={textarea}
              />
            </label>

            <button onClick={onCreate} style={primaryButton}>
              Create judge
            </button>

            {status && <div style={statusText}>{status}</div>}
          </div>
        </section>

        {/* Existing Judges */}
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Existing judges</h2>

          {loading ? (
            <div>Loading…</div>
          ) : judges.length === 0 ? (
            <div>No judges created yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {judges.map((j) => (
                <div key={j.id} style={subCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{j.name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {j.model} • {j.active ? "active" : "inactive"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditingId(j.id)}>Edit</button>
                      <button onClick={() => void onToggleActive(j)}>
                        {j.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>

                  {editingId === j.id && (
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      <label>
                        Name
                        <input
                          value={j.name}
                          onChange={(e) =>
                            setJudges((prev) =>
                              prev.map((x) => (x.id === j.id ? { ...x, name: e.target.value } : x))
                            )
                          }
                          style={input}
                        />
                      </label>

                      <label>
                        Model
                        <input
                          value={j.model}
                          onChange={(e) =>
                            setJudges((prev) =>
                              prev.map((x) => (x.id === j.id ? { ...x, model: e.target.value } : x))
                            )
                          }
                          style={input}
                        />
                      </label>

                      <label>
                        System prompt
                        <textarea
                          value={j.system_prompt}
                          onChange={(e) =>
                            setJudges((prev) =>
                              prev.map((x) =>
                                x.id === j.id ? { ...x, system_prompt: e.target.value } : x
                              )
                            )
                          }
                          rows={6}
                          style={textarea}
                        />
                      </label>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={onSaveEdit} style={primaryButton}>
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
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

const subCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
};

const textarea: React.CSSProperties = {
  ...input,
  resize: "vertical",
};

const primaryButton: React.CSSProperties = {
  width: "fit-content",
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
};

const statusText: React.CSSProperties = {
  fontSize: 13,
  color: "#374151",
};
