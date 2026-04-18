import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { roles } from "@petec/shared";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { AppRoutes } from "../config/appRoutes";
import { PATIENTS_NAV_TYPES } from "../features/patients/constants/patients.constants";
import {
  MAIN_PAGE_TYPES,
  SYSTEM_MANAGEMENT_TAB_TYPES,
} from "../components/MainPage/MainPage.constants";

const Login = lazy(() => import("../components/Login/Login"));
const ForgotPassword = lazy(
  () => import("../components/ForgotPassword/ForgotPassword"),
);
const ResetPassword = lazy(
  () => import("../components/ResetPassword/ResetPassword"),
);
const MainPage = lazy(() => import("../components/MainPage/MainPage"));

const PATIENT_ROUTES = [
  {
    path: AppRoutes.Patients.List,
    patientsNavType: PATIENTS_NAV_TYPES.PATIENTS_LIST,
  },
  {
    path: AppRoutes.Patients.NewPatient,
    patientsNavType: PATIENTS_NAV_TYPES.NEW_PATIENT,
  },
  {
    path: AppRoutes.Patients.DailyPlan,
    patientsNavType: PATIENTS_NAV_TYPES.DAILY_PLAN,
  },
  {
    path: AppRoutes.Patients.Details.path,
    patientsNavType: PATIENTS_NAV_TYPES.PATIENT_CASE,
  },
  {
    path: AppRoutes.Patients.Archive,
    patientsNavType: PATIENTS_NAV_TYPES.ARCHIVE,
  },
] as const;

const ADMIN_ROUTES = [
  {
    path: AppRoutes.SystemManagement.Users,
    systemManagementType: SYSTEM_MANAGEMENT_TAB_TYPES.USERS,
  },
  {
    path: AppRoutes.SystemManagement.SystemTypes,
    systemManagementType: SYSTEM_MANAGEMENT_TAB_TYPES.SYSTEM_TYPES,
  },
  {
    path: AppRoutes.SystemManagement.History,
    systemManagementType: SYSTEM_MANAGEMENT_TAB_TYPES.HISTORY,
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
        <Route path={AppRoutes.Login} element={<Login />} />
        <Route path={AppRoutes.ForgotPassword} element={<ForgotPassword />} />
        <Route path={AppRoutes.ResetPassword.path} element={<ResetPassword />} />

        <Route
          path={AppRoutes.Root}
          element={<Navigate to={AppRoutes.Login} replace />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path={AppRoutes.Patients.Calendar}
            element={<MainPage type={MAIN_PAGE_TYPES.CALENDAR} />}
          />
          {PATIENT_ROUTES.map(({ path, patientsNavType }) => (
            <Route
              key={path}
              path={path}
              element={
                <MainPage
                  type={MAIN_PAGE_TYPES.PATIENTS}
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
                  type={MAIN_PAGE_TYPES.SYSTEM_MANAGEMENT}
                  systemManagementType={systemManagementType}
                />
              }
            />
          ))}
        </Route>

        <Route path={AppRoutes.Unauthorized} element={<UnauthorizedPage />} />
        <Route
          path={AppRoutes.CatchAll}
          element={<Navigate to={AppRoutes.Login} replace />}
        />
      </Routes>
    </Suspense>
  );
}
