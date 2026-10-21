import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { StoreProvider } from "./lib/store";
import { PwaProvider } from "./lib/pwa";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <StoreProvider>
        <PwaProvider>
          <App />
        </PwaProvider>
      </StoreProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
