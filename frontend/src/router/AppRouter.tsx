import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { Role } from "@petec/shared";

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────

const Login = lazy(() => import("../components/Login/Login"));
const ForgotPassword = lazy(() => import("../components/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("../components/ResetPassword/ResetPassword"));

// Authenticated pages — via MainPage layout (preserves existing layout)
const MainPage = lazy(() => import("../components/MainPage/MainPage"));

// Fallback spinner while lazy chunks load
function PageLoader() {
  return (
    <div className="page-loader" aria-label="טוען...">
      <div className="spinner" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/resetPassword/:token" element={<ResetPassword />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected patient routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/patients/patientsList"
            element={<MainPage type="patients" patientsNavType="patients-list" />}
          />
          <Route
            path="/patients/newPatient"
            element={<MainPage type="patients" patientsNavType="new-patient" />}
          />
          <Route
            path="/patients/dailyPlan"
            element={<MainPage type="patients" patientsNavType="daily-plan" />}
          />
          <Route
            path="/patients/patientCase/:masterCaseId/:caseId"
            element={<MainPage type="patients" patientsNavType="patientCase" />}
          />
          <Route
            path="/patients/archive"
            element={<MainPage type="patients" patientsNavType="archive" />}
          />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
          <Route
            path="/systemManagement/users"
            element={<MainPage type="system-management" systemManagementType="users" />}
          />
          <Route
            path="/systemManagement/systemTypes"
            element={<MainPage type="system-management" systemManagementType="system-types" />}
          />
          <Route
            path="/systemManagement/history"
            element={<MainPage type="system-management" systemManagementType="history" />}
          />
        </Route>

        {/* Unauthorized catch-all */}
        <Route
          path="/unauthorized"
          element={
            <div className="error-boundary">
              <h2>אין הרשאה</h2>
              <p>אין לך הרשאות מספיקות לצפות בדף זה.</p>
            </div>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Suspense>
  );
}
