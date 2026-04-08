import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { queryClient } from "./queryClient";
import { SoundProvider } from "./sound/SoundProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SoundProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SoundProvider>
    </QueryClientProvider>
  </StrictMode>
);
