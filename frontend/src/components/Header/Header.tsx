import "./Header.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FaBars, FaTimes } from "react-icons/fa";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { mutate: doLogout, isPending } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      navigate(AppRoutes.Login, { replace: true });
    },
  });

  const navigateFromMenu = (route: string) => {
    setIsMobileMenuOpen(false);
    navigate(route);
  };

  const logoutFromMenu = () => {
    setIsMobileMenuOpen(false);
    doLogout();
  };

  return (
    <header className="main-page-header">
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
      <div className="logo-and-navbar-container">
        <img
          className="logo-and-navbar-logo-img"
          src={"/assets/images/house_logo.png"}
          alt="logo_image"
        />
        <nav className="navbar header-navbar">
          {user?.role === roles.ADMIN && (
            <button
              className={`btn ${
                type === MAIN_PAGE_TYPES.SYSTEM_MANAGEMENT
                  ? "btn-selected"
                  : "btn-active"
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
          <button
            className={`btn ${
              type === MAIN_PAGE_TYPES.CLINICA
                ? "btn-selected"
                : "btn-active"
            }`}
            title="clinica"
            onClick={() => {
              navigate(AppRoutes.Clinica);
            }}
            disabled={type === MAIN_PAGE_TYPES.CLINICA}
          >
            קליניקה
          </button>
          <button
            className={`btn ${
              type === MAIN_PAGE_TYPES.CALENDAR
                ? "btn-selected"
                : "btn-active"
            }`}
            title="calendar"
            onClick={() => {
              navigate(AppRoutes.Patients.Calendar);
            }}
            disabled={type === MAIN_PAGE_TYPES.CALENDAR}
          >
            יומן
          </button>
          <button
            className={`btn ${
              type === MAIN_PAGE_TYPES.PATIENTS
                ? "btn-selected"
                : "btn-active"
            }`}
            title="patients"
            onClick={() => {
              navigate(AppRoutes.Patients.List);
            }}
            disabled={type === MAIN_PAGE_TYPES.PATIENTS}
          >
            מטופלים
          </button>
        </nav>
      </div>
      <div className="header-mobile-menu">
        <button
          type="button"
          className="btn header-mobile-menu__trigger"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="header-mobile-menu-panel"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          <span>תפריט</span>
        </button>
        <div id="header-contextual-menu" />
        {isMobileMenuOpen && (
          <div id="header-mobile-menu-panel" className="header-mobile-menu__panel">
            {user?.role === roles.ADMIN && (
              <button
                type="button"
                className={
                  type === MAIN_PAGE_TYPES.SYSTEM_MANAGEMENT ? "is-active" : ""
                }
                onClick={() => navigateFromMenu(AppRoutes.SystemManagement.Users)}
                disabled={type === MAIN_PAGE_TYPES.SYSTEM_MANAGEMENT}
              >
                ניהול מערכת
              </button>
            )}
            <button
              type="button"
              className={type === MAIN_PAGE_TYPES.CLINICA ? "is-active" : ""}
              onClick={() => navigateFromMenu(AppRoutes.Clinica)}
              disabled={type === MAIN_PAGE_TYPES.CLINICA}
            >
              קליניקה
            </button>
            <button
              type="button"
              className={type === MAIN_PAGE_TYPES.CALENDAR ? "is-active" : ""}
              onClick={() => navigateFromMenu(AppRoutes.Patients.Calendar)}
              disabled={type === MAIN_PAGE_TYPES.CALENDAR}
            >
              יומן
            </button>
            <button
              type="button"
              className={type === MAIN_PAGE_TYPES.PATIENTS ? "is-active" : ""}
              onClick={() => navigateFromMenu(AppRoutes.Patients.List)}
              disabled={type === MAIN_PAGE_TYPES.PATIENTS}
            >
              מטופלים
            </button>
            <button
              type="button"
              className="header-mobile-menu__logout"
              onClick={logoutFromMenu}
              disabled={isPending}
            >
              התנתקות
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
