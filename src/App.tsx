import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { ImportPage } from "./pages/ImportPage";
import { JudgesPage } from "./pages/JudgesPage";
import { QueuesPage } from "./pages/QueuesPage";
import { QueueDetailPage } from "./pages/QueueDetailPage";
import { ResultsPage } from "./pages/ResultsPage";

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? "#111827" : "#4b5563",
        padding: "6px 10px",
        borderRadius: 6,
        background: active ? "#e5e7eb" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* App background */}
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          color: "#111827",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Centered layout container */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "24px 20px 40px",
          }}
        >
          {/* Top navigation */}
          <nav
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 24,
              paddingBottom: 12,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <NavLink to="/import" label="Import" />
            <NavLink to="/judges" label="Judges" />
            <NavLink to="/queues" label="Queues" />
            <NavLink to="/results" label="Results" />
          </nav>

          {/* Page content */}
          <Routes>
            <Route path="/" element={<ImportPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/judges" element={<JudgesPage />} />
            <Route path="/queues" element={<QueuesPage />} />
            <Route path="/queues/:queueId" element={<QueueDetailPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
