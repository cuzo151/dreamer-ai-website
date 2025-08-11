import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartComponentProps {
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  dataKey,
  xAxisKey = 'name',
  color = '#8884d8',
  height = 300
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={dataKey} stroke={color} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;