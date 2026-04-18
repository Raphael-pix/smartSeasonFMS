import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { CropStage } from '@/types/api.types'

const ORDER: CropStage[] = ['PLANTED', 'GROWING', 'READY', 'HARVESTED']
const LABELS: Record<CropStage, string> = {
  PLANTED: 'Planted',
  GROWING: 'Growing',
  READY: 'Ready',
  HARVESTED: 'Harvested',
}

export function StageBarChart({ data }: { data: Record<CropStage, number> }) {
  const chartData = ORDER.map((k) => ({
    stage: LABELS[k],
    count: data[k],
  }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="stage"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: 'var(--border)',
              fontSize: 12,
            }}
            cursor={{ fill: 'var(--muted)' }}
          />
          <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
