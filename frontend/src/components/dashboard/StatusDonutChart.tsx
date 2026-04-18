import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { FieldStatus } from "@/types/api.types";

const COLORS: Record<FieldStatus, string> = {
  ACTIVE: "var(--success)",
  AT_RISK: "var(--warning)",
  COMPLETED: "var(--neutral-soft-foreground)",
};

const LABELS: Record<FieldStatus, string> = {
  ACTIVE: "Active",
  AT_RISK: "At Risk",
  COMPLETED: "Completed",
};

export function StatusDonutChart({
  data,
}: {
  data: Record<FieldStatus, number>;
}) {
  const chartData = (Object.keys(data) as FieldStatus[])
    .map((k) => ({ name: LABELS[k], key: k, value: data[k] ?? 0 }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No fields yet
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            stroke="var(--card)"
          >
            {chartData.map((d) => (
              <Cell key={d.key} fill={COLORS[d.key]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: "var(--border)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
