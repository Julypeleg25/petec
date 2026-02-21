import { useNavigate } from "react-router-dom";
import "./SystemManagement.css";
import UsersTab from "./UsersTab/UsersTab";
import SystemTypesTab from "./SystemTypesTab/SystemTypesTab";
import HistoryTab from "./HistoryTab/HistoryTab";
import { AppRoutes } from "../../config/app-routes";
import { ISystemManagementProps } from "./SystemManagement.types";
function SystemManagement({ type = "users" }: ISystemManagementProps) {
  const navigate = useNavigate();

  return (
    <div className="systemManagement">
      <nav className="navbar system-management-navbar">
        <button
          className={`btn ${type === "history" ? "" : "btn-active"}`}
          title="היסטוריית פעולות"
          onClick={() => navigate(AppRoutes.SystemManagement.History)}
          disabled={type === "history"}
        >
          היסטוריית פעולות
        </button>
        <button
          className={`btn ${type === "system-types" ? "" : "btn-active"}`}
          title="ישויות מערכת"
          onClick={() => navigate(AppRoutes.SystemManagement.SystemTypes)}
          disabled={type === "system-types"}
        >
          ישויות מערכת
        </button>
        <button
          className={`btn ${type === "users" ? "" : "btn-active"}`}
          title="משתמשים"
          onClick={() => navigate(AppRoutes.SystemManagement.Users)}
          disabled={type === "users"}
        >
          משתמשים
        </button>
      </nav>
      <main className="system-management-main">
        {type === "users" && <UsersTab />}
        {type === "system-types" && <SystemTypesTab />}
        {type === "history" && <HistoryTab />}
      </main>
    </div>
  );
}

export default SystemManagement;
