import { createRoot } from "react-dom/client";
import { unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import "./index.css";
import { setupHebrewZodErrorMap } from "@petec/shared";
import App from "./App";
import { appHistory } from "./router/appHistory";

setupHebrewZodErrorMap();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    'אלמנט השורש עם המזהה "root" לא נמצא. יש לוודא שבקובץ public/index.html קיים <div id="root">.'
  );
}

createRoot(rootElement).render(
  <HistoryRouter history={appHistory}>
    <App />
  </HistoryRouter>
);
