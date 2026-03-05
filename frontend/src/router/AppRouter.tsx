import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { roles } from "@petec/shared";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";

const Login = lazy(() => import("../components/Login/Login"));
const ForgotPassword = lazy(
  () => import("../components/ForgotPassword/ForgotPassword"),
);
const ResetPassword = lazy(
  () => import("../components/ResetPassword/ResetPassword"),
);
const MainPage = lazy(() => import("../components/MainPage/MainPage"));

const ROUTE_PATHS = {
  ROOT: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgotPassword",
  RESET_PASSWORD: "/resetPassword/:token",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",
  PATIENTS_LIST: "/patients/patientsList",
  NEW_PATIENT: "/patients/newPatient",
  DAILY_PLAN: "/patients/dailyPlan",
  PATIENT_CASE: "/patients/patientCase/:masterCaseId/:caseId",
  ARCHIVE: "/patients/archive",
  SYSTEM_USERS: "/systemManagement/users",
  SYSTEM_TYPES: "/systemManagement/systemTypes",
  SYSTEM_HISTORY: "/systemManagement/history",
} as const;

const PATIENT_PAGE_TYPE = "patients";
const SYSTEM_MANAGEMENT_PAGE_TYPE = "system-management";

const PATIENT_ROUTES = [
  {
    path: ROUTE_PATHS.PATIENTS_LIST,
    patientsNavType: "patients-list",
  },
  {
    path: ROUTE_PATHS.NEW_PATIENT,
    patientsNavType: "new-patient",
  },
  {
    path: ROUTE_PATHS.DAILY_PLAN,
    patientsNavType: "daily-plan",
  },
  {
    path: ROUTE_PATHS.PATIENT_CASE,
    patientsNavType: "patientCase",
  },
  {
    path: ROUTE_PATHS.ARCHIVE,
    patientsNavType: "archive",
  },
] as const;

const ADMIN_ROUTES = [
  {
    path: ROUTE_PATHS.SYSTEM_USERS,
    systemManagementType: "users",
  },
  {
    path: ROUTE_PATHS.SYSTEM_TYPES,
    systemManagementType: "system-types",
  },
  {
    path: ROUTE_PATHS.SYSTEM_HISTORY,
    systemManagementType: "history",
  },
] as const;

function PageLoader() {
  return (
    <div className="page-loader" aria-label="טוען...">
      <div className="spinner" />
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="error-boundary">
      <h2>אין הרשאה</h2>
      <p>אין לך הרשאות מספיקות לצפות בדף זה.</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTE_PATHS.LOGIN} element={<Login />} />
        <Route
          path={ROUTE_PATHS.FORGOT_PASSWORD}
          element={<ForgotPassword />}
        />
        <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPassword />} />

        <Route
          path={ROUTE_PATHS.ROOT}
          element={<Navigate to={ROUTE_PATHS.LOGIN} replace />}
        />

        <Route element={<ProtectedRoute />}>
          {PATIENT_ROUTES.map(({ path, patientsNavType }) => (
            <Route
              key={path}
              path={path}
              element={
                <MainPage
                  type={PATIENT_PAGE_TYPE}
                  patientsNavType={patientsNavType}
                />
              }
            />
          ))}
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[roles.ADMIN]} />}>
          {ADMIN_ROUTES.map(({ path, systemManagementType }) => (
            <Route
              key={path}
              path={path}
              element={
                <MainPage
                  type={SYSTEM_MANAGEMENT_PAGE_TYPE}
                  systemManagementType={systemManagementType}
                />
              }
            />
          ))}
        </Route>

        <Route path={ROUTE_PATHS.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route
          path={ROUTE_PATHS.NOT_FOUND}
          element={<Navigate to={ROUTE_PATHS.LOGIN} replace />}
        />
      </Routes>
    </Suspense>
  );
}
