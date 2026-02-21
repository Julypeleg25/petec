import { LabelProps } from "recharts";

export interface AppLineChartProps {
    data: { name: string; value: number }[];
    className?: string;
    label?: string;
    CustomXAxisLabel?: React.FC<LabelProps>;
}
