import type { LabelProps } from "recharts";
import AppLineChart from "../AppLineChart/AppLineChart";
import "./PatientCharts.css";
import { patientsApi } from "../../features/patients/patients.api";
import MyLoader from "../../utils/MyLoader/MyLoader";
import { useQuery } from "@tanstack/react-query";

interface PatientChartsProps {
  caseId: string;
}

const CustomXAxisLabel = (props: LabelProps) => {
  const val = String((props as { payload?: { value?: string } }).payload?.value ?? "");
  const time = val.split(" ")[0];
  const date = val.split(" ")[1];
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  return (
    <g>
      <text x={x} y={y} dy={16} textAnchor="middle" fill="#666" fontSize={14}>
        {time}
      </text>
      <text x={x} y={y + 20} dy={16} textAnchor="middle" fill="#666" fontSize={14}>
        {date}
      </text>
    </g>
  );
};

export default function PatientCharts({ caseId }: PatientChartsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["patientCharts", caseId],
    queryFn: () => patientsApi.getChartsData(caseId),
  });

  return (
    <div className="PatientCharts">
      <label className="form-label patient-charts-label">מידע גרפי</label>
      <div className="charts-container">
        {isLoading || !data ? (
          <MyLoader />
        ) : (
          <>
            <AppLineChart
              data={data.temperature}
              className={"patient-charts-chart"}
              label="טמפרטורה"
              CustomXAxisLabel={CustomXAxisLabel}
            />
            <AppLineChart
              data={data.pulse}
              className={"patient-charts-chart"}
              label="דופק"
              CustomXAxisLabel={CustomXAxisLabel}
            />
            <AppLineChart
              data={data.respiration}
              className={"patient-charts-chart"}
              label="נשימה"
              CustomXAxisLabel={CustomXAxisLabel}
            />
            <AppLineChart
              data={data.weight}
              className={"patient-charts-chart"}
              label="משקל"
              CustomXAxisLabel={CustomXAxisLabel}
            />
          </>
        )}
      </div>
    </div>
  );
}
