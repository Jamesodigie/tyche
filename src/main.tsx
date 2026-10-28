// Self-hosted fonts (latin) — no third-party font requests.
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/fraunces/latin-400.css";
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/fraunces/latin-700.css";
import "@fontsource/fraunces/latin-400-italic.css";
import "@fontsource/fraunces/latin-600-italic.css";
import "@fontsource/caveat/latin-500.css";
import "@fontsource/caveat/latin-700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { StoreProvider } from "./lib/store";
import { PwaProvider } from "./lib/pwa";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PrivacyChoices } from "./components/PrivacyChoices";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <StoreProvider>
        <PwaProvider>
          <App />
          <PrivacyChoices />
        </PwaProvider>
      </StoreProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
