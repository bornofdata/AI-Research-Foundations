import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  metricName: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  unit,
  referenceMin,
  referenceMax,
  metricName,
}) => {
  return (
    <div className="w-full bg-surface-container rounded-xl p-3">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value: number) => [`${value} ${unit}`, metricName]}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          {referenceMin !== undefined && (
            <ReferenceLine
              y={referenceMin}
              stroke="#9e9e9e"
              strokeDasharray="4 3"
              label={{ value: 'Min', fontSize: 9, fill: '#9e9e9e' }}
            />
          )}
          {referenceMax !== undefined && (
            <ReferenceLine
              y={referenceMax}
              stroke="#9e9e9e"
              strokeDasharray="4 3"
              label={{ value: 'Max', fontSize: 9, fill: '#9e9e9e' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4a6fa5"
            strokeWidth={2}
            dot={{ r: 4, fill: '#4a6fa5' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
