import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface AreaChartComponentProps {
  data: any[];
  config: any;
  height: number;
  onError?: (error: Error) => void;
}

const AreaChartComponent: React.FC<AreaChartComponentProps> = ({ 
  data, 
  config, 
  height,
  onError 
}) => {
  try {
    return (
      <ChartContainer config={config} className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="var(--color-revenue)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  } catch (error) {
    onError?.(error as Error);
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg" style={{ height }}>
        <p className="text-red-600">Failed to load area chart</p>
      </div>
    );
  }
};

export default AreaChartComponent;