import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = document.getElementById("root")!;

// Force full-viewport light background
document.body.style.margin = "0";
document.body.style.background = "#f9fafb";
document.body.style.color = "#111827";

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
