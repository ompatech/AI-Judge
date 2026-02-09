import { useState } from "react";
import { importJsonString } from "../lib/importer";

export function ImportPage() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div
      style={{
        background: "#f9fafb",
        padding: "40px 20px",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Import data</h1>
        <p style={{ marginTop: 0, marginBottom: 16, color: "#555" }}>
          Upload a JSON file containing queues, submissions, and answers.
        </p>

        <input
          type="file"
          accept="application/json"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;

            setBusy(true);
            setStatus("Reading file...");
            try {
              const text = await f.text();
              setStatus("Importing...");
              const res = await importJsonString(text);
              setStatus(
                `Import complete.\nQueues: ${res.queues}\nSubmissions: ${res.submissions}\nTemplates: ${res.templates}\nAnswers: ${res.answers}`
              );
            } catch (err: any) {
              setStatus(`Error: ${err?.message ?? String(err)}`);
            } finally {
              setBusy(false);
            }
          }}
        />

        {status && (
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              background: "#f3f4f6",
              borderRadius: 8,
              fontSize: 13,
              whiteSpace: "pre-wrap",
            }}
          >
            {status}
          </pre>
        )}
      </div>
    </div>
  );
}
