import { createRoot } from "react-dom/client";
import { unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { setupHebrewZodErrorMap } from "@petec/shared";
import App from "./App";
import "./index.css";
import { appHistory } from "./router/appHistory";

setupHebrewZodErrorMap();

const ROOT_ELEMENT_ID = "root";

const rootElement = document.getElementById(ROOT_ELEMENT_ID);

if (!rootElement) {
  throw new Error(`Root element "#${ROOT_ELEMENT_ID}" was not found.`);
}

createRoot(rootElement).render(
  <HistoryRouter history={appHistory}>
    <App />
  </HistoryRouter>,
);
