import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { ImportPage } from './pages/ImportPage';
import { JudgesPage } from './pages/JudgesPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: 1000, margin: "20px auto", padding: 16, fontFamily: "system-ui" }}>
        <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Link to="/import">Import</Link>
          <Link to="/judges">Judges</Link>
        </nav>

        <Routes>
          <Route path="/" element={<ImportPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/judges" element={<JudgesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
