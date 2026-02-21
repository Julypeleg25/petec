import { useEffect, useState } from "react";
import AppLineChart from "../AppLineChart/AppLineChart";
import "./PatientCharts.css";
import { patientsApi } from "../../features/patients/patients.api";
import MyLoader from "../../utils/MyLoader/MyLoader";
import type { LabelProps } from "recharts";
import type { ChartDataPoint } from "@petec/shared";

import { PatientChartsProps } from "./PatientCharts.types";

function PatientCharts({ caseId }: PatientChartsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [temperatureData, setTemperatureData] = useState<ChartDataPoint[]>([]);
  const [pulseData, setPulseData] = useState<ChartDataPoint[]>([]);
  const [respirationData, setRespirationData] = useState<ChartDataPoint[]>([]);
  const [weightData, setWeightData] = useState<ChartDataPoint[]>([]);

  const getChartsData = async () => {
    try {
      const data = await patientsApi.getChartsData(caseId);
      setTemperatureData(data.temperature);
      setPulseData(data.pulse);
      setRespirationData(data.respiration);
      setWeightData(data.weight);
      setIsLoading(false);
    } catch { /* handled by interceptor */ }
  };

  const CustomXAxisLabel: React.FC<LabelProps> = (props) => {
    const val = String((props as { payload?: { value?: string } }).payload?.value ?? "");
    const time = val.split(" ")[0];
    const date = val.split(" ")[1];
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    return (
      <g>
        <text
          x={x}
          y={y}
          dy={16}
          textAnchor="middle"
          fill="#666"
          fontSize={14}
        >
          {time}
        </text>
        <text
          x={x}
          y={y + 20}
          dy={16}
          textAnchor="middle"
          fill="#666"
          fontSize={14}
        >
          {date}
        </text>
      </g>
    );
  };

  useEffect(() => {
    getChartsData();
  }, []);

  return (
    <div className="PatientCharts">
      <label className="form-label patient-charts-label">מידע גרפי</label>
      <div className="charts-container">
        {isLoading ? (
          <MyLoader />
        ) : (
          <>
            <AppLineChart
              data={temperatureData}
              className={"patient-charts-chart"}
              label="טמפרטורה"
              CustomXAxisLabel={CustomXAxisLabel}
            />
            <AppLineChart
              data={pulseData}
              className={"patient-charts-chart"}
              label="דופק"
              CustomXAxisLabel={CustomXAxisLabel}
            />
            <AppLineChart
              data={respirationData}
              className={"patient-charts-chart"}
              label="נשימה"
              CustomXAxisLabel={CustomXAxisLabel}
            />
            <AppLineChart
              data={weightData}
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

export default PatientCharts;
