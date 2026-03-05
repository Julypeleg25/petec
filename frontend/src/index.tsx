import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { setupHebrewZodErrorMap } from "@petec/shared";
import App from "./App";

setupHebrewZodErrorMap();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    'Root element with id "root" not found. Make sure public/index.html has <div id="root">.'
  );
}

createRoot(rootElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
