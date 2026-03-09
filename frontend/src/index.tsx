import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { setupHebrewZodErrorMap } from "@petec/shared";
import App from "./App";

setupHebrewZodErrorMap();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    'אלמנט השורש עם המזהה "root" לא נמצא. יש לוודא שבקובץ public/index.html קיים <div id="root">.'
  );
}

createRoot(rootElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
