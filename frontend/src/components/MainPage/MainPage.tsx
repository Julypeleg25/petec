import Header from "../Header/Header";
import Calendar from "../Patients/Calendar/Calendar";
import Patients from "../Patients/Patients";
import SystemManagement from "../SystemManagement/SystemManagement";
import { ClinicaClientsPage } from "../../features/clinica";
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
  const mainClassName = `main-page-main ${
    type === "clinica" ? "main-page-main--scrollable" : ""
  }`;

  return (
    <div className="main-page">
      <Header type={type} />
      <main className={mainClassName}>
        {type === "calendar" && <Calendar />}
        {type === "clinica" && <ClinicaClientsPage />}
        {type === "patients" && <Patients patientsNavType={patientsNavType} />}
        {type === "system-management" && (
          <SystemManagement type={systemManagementType} />
        )}
      </main>
    </div>
  );
}

export default MainPage;
