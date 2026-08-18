import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ExhibitionStudio from "./app/ExhibitionStudio";
import "./app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExhibitionStudio />
  </StrictMode>,
);
