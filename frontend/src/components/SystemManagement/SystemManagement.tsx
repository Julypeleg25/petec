import { useNavigate } from "react-router-dom";
import "./SystemManagement.css";
import UsersTab from "./UsersTab/UsersTab";
import SystemTypesTab from "./SystemTypesTab/SystemTypesTab";
import HistoryTab from "./HistoryTab/HistoryTab";
import { AppRoutes } from "../../config/appRoutes";
import {
  SYSTEM_MANAGEMENT_TAB_TYPES,
  type SystemManagementTabType,
} from "../MainPage/MainPage.constants";

interface SystemManagementProps {
  type?: SystemManagementTabType;
}

function SystemManagement({
  type = SYSTEM_MANAGEMENT_TAB_TYPES.USERS,
}: SystemManagementProps) {
  const navigate = useNavigate();

  return (
    <div className="systemManagement">
      <nav className="navbar system-management-navbar">
        <button
          className={`btn ${
            type === SYSTEM_MANAGEMENT_TAB_TYPES.HISTORY ? "" : "btn-active"
          }`}
          title="היסטוריית פעולות"
          onClick={() => navigate(AppRoutes.SystemManagement.History)}
          disabled={type === SYSTEM_MANAGEMENT_TAB_TYPES.HISTORY}
        >
          היסטוריית פעולות
        </button>
        <button
          className={`btn ${
            type === SYSTEM_MANAGEMENT_TAB_TYPES.SYSTEM_TYPES
              ? ""
              : "btn-active"
          }`}
          title="ישויות מערכת"
          onClick={() => navigate(AppRoutes.SystemManagement.SystemTypes)}
          disabled={type === SYSTEM_MANAGEMENT_TAB_TYPES.SYSTEM_TYPES}
        >
          ישויות מערכת
        </button>
        <button
          className={`btn ${
            type === SYSTEM_MANAGEMENT_TAB_TYPES.USERS ? "" : "btn-active"
          }`}
          title="משתמשים"
          onClick={() => navigate(AppRoutes.SystemManagement.Users)}
          disabled={type === SYSTEM_MANAGEMENT_TAB_TYPES.USERS}
        >
          משתמשים
        </button>
      </nav>
      <main className="system-management-main">
        {type === SYSTEM_MANAGEMENT_TAB_TYPES.USERS && <UsersTab />}
        {type === SYSTEM_MANAGEMENT_TAB_TYPES.SYSTEM_TYPES && <SystemTypesTab />}
        {type === SYSTEM_MANAGEMENT_TAB_TYPES.HISTORY && <HistoryTab />}
      </main>
    </div>
  );
}

export default SystemManagement;
