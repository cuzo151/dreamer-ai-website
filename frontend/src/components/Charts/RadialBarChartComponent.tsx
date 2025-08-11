import React from 'react';
import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface RadialBarChartComponentProps {
  data: any[];
  dataKey?: string;
  height?: number;
  innerRadius?: string;
  outerRadius?: string;
}

const RadialBarChartComponent: React.FC<RadialBarChartComponentProps> = ({
  data,
  dataKey = 'value',
  height = 300,
  innerRadius = '10%',
  outerRadius = '80%'
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} data={data}>
        <RadialBar
          label={{ position: 'insideStart', fill: '#fff' }}
          background
          dataKey={dataKey}
        />
        <Tooltip />
        <Legend />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export default RadialBarChartComponent;