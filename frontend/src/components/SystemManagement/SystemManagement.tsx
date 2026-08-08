import { useNavigate } from "react-router-dom";
import "./SystemManagement.css";
import { Button } from "../../utils/Button/Button";
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
        <Button
          active={type !== SYSTEM_MANAGEMENT_TAB_TYPES.HISTORY}
          selected={type === SYSTEM_MANAGEMENT_TAB_TYPES.HISTORY}
          title="היסטוריית פעולות"
          onClick={() => navigate(AppRoutes.SystemManagement.History)}
          disabled={type === SYSTEM_MANAGEMENT_TAB_TYPES.HISTORY}
        >
          היסטוריית פעולות
        </Button>
        <Button
          active={type !== SYSTEM_MANAGEMENT_TAB_TYPES.SYSTEM_TYPES}
          selected={type === SYSTEM_MANAGEMENT_TAB_TYPES.SYSTEM_TYPES}
          title="ישויות מערכת"
          onClick={() => navigate(AppRoutes.SystemManagement.SystemTypes)}
          disabled={type === SYSTEM_MANAGEMENT_TAB_TYPES.SYSTEM_TYPES}
        >
          ישויות מערכת
        </Button>
        <Button
          active={type !== SYSTEM_MANAGEMENT_TAB_TYPES.USERS}
          selected={type === SYSTEM_MANAGEMENT_TAB_TYPES.USERS}
          title="משתמשים"
          onClick={() => navigate(AppRoutes.SystemManagement.Users)}
          disabled={type === SYSTEM_MANAGEMENT_TAB_TYPES.USERS}
        >
          משתמשים
        </Button>
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
