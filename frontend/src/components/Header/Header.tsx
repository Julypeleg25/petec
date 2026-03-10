import "./Header.css";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/AuthProvider";
import { authApi } from "../../features/auth/auth.api";
import { roles } from "@petec/shared";
import { AppRoutes } from "../../config/appRoutes";
import {
  MAIN_PAGE_TYPES,
  type MainPageType,
} from "../MainPage/MainPage.constants";

interface HeaderProps {
  type: MainPageType;
}

function Header({ type }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { mutate: doLogout, isPending } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      navigate(AppRoutes.Login, { replace: true });
    },
  });

  return (
    <header className="main-page-header">
      <div className="logo-and-navbar-container">
        <img
          className="logo-and-navbar-logo-img"
          src={"/assets/images/petec_logo_v2.jpg"}
          alt="logo_image"
        />
        <nav className="navbar header-navbar">
          <button
            className={`btn ${
              type === MAIN_PAGE_TYPES.PATIENTS ? "btn-active" : ""
            }`}
            title="patients"
            onClick={() => {
              navigate(AppRoutes.Patients.List);
            }}
            disabled={type === MAIN_PAGE_TYPES.PATIENTS}
          >
            מטופלים
          </button>
          {user?.role === roles.ADMIN && (
            <button
              className={`btn ${
                type === MAIN_PAGE_TYPES.SYSTEM_MANAGEMENT ? "btn-active" : ""
              }`}
              title="system-management"
              onClick={() => {
                navigate(AppRoutes.SystemManagement.Users);
              }}
              disabled={type === MAIN_PAGE_TYPES.SYSTEM_MANAGEMENT}
            >
              ניהול מערכת
            </button>
          )}
        </nav>
      </div>
      <div className="logout-and-hello-user-container">
        <div className="hello-user">
          <span>,שלום</span> <span>{user?.fullName}</span>
        </div>
        <button
          className="btn logout-btn btn-active"
          title="Logout"
          onClick={() => doLogout()}
          disabled={isPending}
        >
          התנתקות
        </button>
      </div>
    </header>
  );
}

export default Header;
