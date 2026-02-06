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
        setStatus(`Error ❌ ${e?.message ?? String(e)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1>Queues</h1>
      <p>Select a queue to assign judges to question templates.</p>

      {status && <div style={{ marginBottom: 12 }}>{status}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : queues.length === 0 ? (
        <div>No queues found. Import a JSON file first.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {queues.map((q) => (
            <Link
              key={q.queue_id}
              to={`/queues/${q.queue_id}`}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, textDecoration: "none" }}
            >
              <div style={{ fontWeight: 700 }}>{q.queue_id}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>created: {new Date(q.created_at).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
