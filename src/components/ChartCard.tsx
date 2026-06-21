import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import Card from './Card';

interface ChartCardProps {
  title: string;
  data: Array<Record<string, unknown>>;
  type: 'line' | 'donut';
  dataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  type,
  dataKey = 'value',
  xAxisKey = 'name',
  colors = ['#6A35FF'],
  className = '',
}) => {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-soft border border-slate/10">
          <p className="text-sm font-medium text-dark">{label}</p>
          <p className="text-sm text-primary">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold font-poppins text-dark mb-6">{title}</h3>
      {type === 'line' && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#6A35FF"
              strokeWidth={3}
              dot={{ fill: '#6A35FF', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#6A35FF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      {type === 'donut' && (
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {type === 'donut' && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {data.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-slate">{entry.name as string}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ChartCard;
