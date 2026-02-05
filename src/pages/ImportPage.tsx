import { useState } from "react";
import { importJsonString } from "../lib/importer";

export function ImportPage() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>AI Judge — Import</h1>

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
            setStatus(`Done ✅ queues=${res.queues}, submissions=${res.submissions}, templates=${res.templates}, answers=${res.answers}`);
          } catch (err: any) {
            setStatus(`Error ❌ ${err?.message ?? String(err)}`);
          } finally {
            setBusy(false);
          }
        }}
      />

      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{status}</pre>
    </div>
  );
}
