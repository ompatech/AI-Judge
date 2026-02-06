import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { ImportPage } from "./pages/ImportPage";
import { JudgesPage } from "./pages/JudgesPage";
import { QueuesPage } from "./pages/QueuesPage";
import { QueueDetailPage } from "./pages/QueueDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: 1100, margin: "20px auto", padding: 16, fontFamily: "system-ui" }}>
        <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Link to="/import">Import</Link>
          <Link to="/judges">Judges</Link>
          <Link to="/queues">Queues</Link>
        </nav>

        <Routes>
          <Route path="/" element={<ImportPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/judges" element={<JudgesPage />} />
          <Route path="/queues" element={<QueuesPage />} />
          <Route path="/queues/:queueId" element={<QueueDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
