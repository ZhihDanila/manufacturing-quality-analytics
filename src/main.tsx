import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import Overview from "./pages/Overview";
import "./styles/index.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <Overview />
    </MotionConfig>
  </React.StrictMode>,
);
