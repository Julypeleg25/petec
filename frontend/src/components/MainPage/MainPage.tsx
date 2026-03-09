import Header from "../Header/Header";
import Patients from "../Patients/Patients";
import SystemManagement from "../SystemManagement/SystemManagement";
import type {
  MainPageType,
  SystemManagementTabType,
} from "./MainPage.constants";
import "./MainPage.css";

interface MainPageProps {
  type: MainPageType;
  systemManagementType?: SystemManagementTabType;
  patientsNavType?: string;
}

function MainPage({
  type,
  systemManagementType,
  patientsNavType,
}: MainPageProps) {
  return (
    <div className="main-page">
      <Header type={type} />
      <main className="main-page-main">
        {type === "patients" && <Patients patientsNavType={patientsNavType} />}
        {type === "system-management" && (
          <SystemManagement type={systemManagementType} />
        )}
      </main>
    </div>
  );
}

export default MainPage;
