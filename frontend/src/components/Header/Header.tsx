import "./Header.css";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/AuthProvider";
import { authApi } from "../../features/auth/auth.api";
import { Role } from "@petec/shared";

import { IHeaderProps } from "./Header.types";

function Header({ type }: IHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { mutate: doLogout, isPending } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      navigate("/login", { replace: true });
    },
  });

  return (
    <header className="main-page-header">
      <div className="logout-and-hello-user-container">
        <div className="hello-user">
          <span>,שלום</span>{" "}
          <span>{user?.username}</span>
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
          src={"assets/images/logo_reversed.jpg"}
          alt="logo_image"
        />
        <nav className="navbar header-navbar">
          {user?.role === Role.ADMIN && (
            <button
              className={`btn ${
                type === "system-management" ? "btn-active" : ""
              }`}
              title="system-management"
              onClick={() => {
                navigate("/systemManagement/users");
              }}
              disabled={type === "system-management"}
            >
              ניהול מערכת
            </button>
          )}
          <button
            className={`btn ${type === "patients" ? "btn-active" : ""}`}
            title="patients"
            onClick={() => {
              navigate("/patients/patientsList");
            }}
            disabled={type === "patients"}
          >
            מטופלים
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
