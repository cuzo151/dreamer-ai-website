import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface BarChartComponentProps {
  data: any[];
  config: any;
  height: number;
  onError?: (error: Error) => void;
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  data, 
  config, 
  height,
  onError 
}) => {
  try {
    return (
      <ChartContainer config={config} className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="projects" fill="var(--color-projects)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="clients" fill="var(--color-clients)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  } catch (error) {
    onError?.(error as Error);
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg" style={{ height }}>
        <p className="text-red-600">Failed to load bar chart</p>
      </div>
    );
  }
};

export default BarChartComponent;