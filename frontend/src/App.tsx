import "./App.css";
import { Toaster } from "react-hot-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { AppRouter } from "./router/AppRouter";
import { MuiRtlProvider } from "./theme/MuiRtlProvider";


export default function App() {
  return (
    <MuiRtlProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: { direction: "rtl" },
              }}
            />
            <AppRouter />
          </ErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </MuiRtlProvider>
  );
}
