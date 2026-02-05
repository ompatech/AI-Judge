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
      setStatus(`Error ❌ ${e?.message ?? String(e)}`);
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
      setStatus("Created ✅");
      await refresh();
    } catch (e: any) {
      setStatus(`Error ❌ ${e?.message ?? String(e)}`);
    }
  }

  async function onToggleActive(j: JudgeRow) {
    setStatus("");
    try {
      await updateJudge(j.id, { active: !j.active });
      await refresh();
    } catch (e: any) {
      setStatus(`Error ❌ ${e?.message ?? String(e)}`);
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
      setStatus("Saved ✅");
      await refresh();
    } catch (e: any) {
      setStatus(`Error ❌ ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div>
      <h1>Judges</h1>
      <p>Create rubric-style judges and store them in the database.</p>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Create Judge</h2>

        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            Model
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            System Prompt / Rubric
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              style={{ width: "100%" }}
            />
          </label>

          <button onClick={onCreate} style={{ width: 180 }}>
            Create
          </button>
        </div>

        <div style={{ marginTop: 8 }}>{status}</div>
      </div>

      <h2>Existing Judges</h2>
      {loading ? (
        <div>Loading…</div>
      ) : judges.length === 0 ? (
        <div>No judges yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {judges.map((j) => (
            <div key={j.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{j.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    model: {j.model} • active: {String(j.active)}
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
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <label>
                    Name
                    <input
                      value={j.name}
                      onChange={(e) =>
                        setJudges((prev) =>
                          prev.map((x) => (x.id === j.id ? { ...x, name: e.target.value } : x))
                        )
                      }
                      style={{ width: "100%" }}
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
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label>
                    System Prompt
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
                      style={{ width: "100%" }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => void onSaveEdit()}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
