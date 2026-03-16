import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home           from "./pages/Home";
import Scan           from "./pages/Scan";
import Results        from "./pages/Results";
import Preferences    from "./pages/Preferences";
import History        from "./pages/History";
import ReadingHistory from "./pages/ReadingHistory";
import Orders         from "./pages/Orders";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/scan"            element={<Scan />} />
        <Route path="/results"         element={<Results />} />
        <Route path="/preferences"     element={<Preferences />} />
        <Route path="/history"         element={<History />} />
        <Route path="/reading-history" element={<ReadingHistory />} />
        <Route path="/orders"          element={<Orders />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
