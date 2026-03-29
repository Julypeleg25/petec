import "./App.css";
import { Toaster } from "react-hot-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { AppRouter } from "./router/AppRouter";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { direction: "rtl" },
            }}
          />
          <AppRouter />
          <SpeedInsights />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}
