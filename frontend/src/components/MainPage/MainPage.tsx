import Header from "../Header/Header";
import Patients from "../Patients/Patients";
import SystemManagement from "../SystemManagement/SystemManagement";
import "./MainPage.css";

import { IMainPageProps } from "./MainPage.types";

function MainPage({
  type,
  systemManagementType,
  patientsNavType,
}: IMainPageProps) {
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
