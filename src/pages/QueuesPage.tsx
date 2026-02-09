import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listQueues, type QueueRow } from "../api/queues";

export function QueuesPage() {
  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setStatus("");
      try {
        const rows = await listQueues();
        setQueues(rows);
      } catch (e: any) {
        setStatus(`Error: ${e?.message ?? String(e)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ background: "#f9fafb", padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 6 }}>Queues</h1>
          <p style={{ color: "#555" }}>
            Select a queue to assign judges to question templates and run evaluations.
          </p>
        </header>

        <section style={card}>
          {/* Error state */}
          {status && status.startsWith("Error") && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 8,
                background: "#fee2e2",
                color: "#991b1b",
                fontSize: 13,
              }}
            >
              {status}
            </div>
          )}

          {loading ? (
            <div>Loading…</div>
          ) : queues.length === 0 ? (
            /* Empty state */
            <div
              style={{
                padding: 20,
                border: "1px dashed #e5e7eb",
                borderRadius: 10,
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: 600 }}>No queues yet</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#555" }}>
                Import a JSON file to create your first queue.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {queues.map((q) => (
                <Link
                  key={q.queue_id}
                  to={`/queues/${q.queue_id}`}
                  style={{
                    display: "block",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 14,
                    textDecoration: "none",
                    color: "#111827",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{q.queue_id}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    created {new Date(q.created_at).toLocaleString()}
                  </div>
                </Link>
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
