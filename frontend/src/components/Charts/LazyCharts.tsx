import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import LoadingAnimation from '../Animation/LoadingAnimation';

// Lazy load individual chart components to reduce initial bundle size
const AreaChart = lazy(() => import('recharts').then(module => ({ default: module.AreaChart })));
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })));
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));
const RadialBarChart = lazy(() => import('recharts').then(module => ({ default: module.RadialBarChart })));

// Lazy load chart components
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })));
const Area = lazy(() => import('recharts').then(module => ({ default: module.Area })));
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })));
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })));
const RadialBar = lazy(() => import('recharts').then(module => ({ default: module.RadialBar })));

// Lazy load axis and grid components
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const Legend = lazy(() => import('recharts').then(module => ({ default: module.Legend })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));

// Chart loading fallback component
const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height }}>
    <div className="text-center">
      <LoadingAnimation variant="dots" size="medium" />
      <p className="text-sm text-gray-500 mt-2">Loading chart...</p>
    </div>
  </div>
);

// Enhanced loading skeleton with chart-specific animations
const EnhancedChartSkeleton: React.FC<{ 
  type: 'area' | 'bar' | 'line' | 'pie' | 'radial';
  height?: number;
}> = ({ type, height = 300 }) => {
  const skeletonElements = {
    area: (
      <div className="w-full h-full flex flex-col justify-end items-center space-x-1">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-gradient-to-t from-blue-200 to-blue-100 rounded-t"
            style={{
              width: '12%',
              height: `${20 + Math.random() * 60}%`,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 1,
              delay: i * 0.1,
              repeat: Infinity,
              repeatType: 'reverse',
              repeatDelay: 2
            }}
          />
        ))}
      </div>
    ),
    bar: (
      <div className="w-full h-full flex justify-center items-end space-x-2 px-4">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-gradient-to-t from-green-300 to-green-200 rounded-t"
            style={{
              width: '12%',
              height: `${30 + Math.random() * 50}%`,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 0.8,
              delay: i * 0.15,
              repeat: Infinity,
              repeatType: 'reverse',
              repeatDelay: 3
            }}
          />
        ))}
      </div>
    ),
    line: (
      <div className="w-full h-full relative flex items-center justify-center">
        <svg width="80%" height="60%" viewBox="0 0 300 150">
          <motion.path
            d="M10,100 Q75,20 150,50 T290,80"
            stroke="#3B82F6"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
              repeatDelay: 1
            }}
          />
        </svg>
      </div>
    ),
    pie: (
      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          className="w-32 h-32 rounded-full border-8 border-gray-200"
          style={{
            background: 'conic-gradient(from 0deg, #3B82F6 0deg 120deg, #10B981 120deg 240deg, #F59E0B 240deg 360deg)'
          }}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>
    ),
    radial: (
      <div className="w-full h-full flex items-center justify-center">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-4"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i],
              borderTopColor: 'transparent',
            }}
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    )
  };

  return (
    <div 
      className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg relative overflow-hidden"
      style={{ height }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {skeletonElements[type]}
      </div>
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 flex items-center">
        <LoadingAnimation variant="spinner" size="small" />
        <span className="ml-2">Loading {type} chart...</span>
      </div>
    </div>
  );
};

// Optimized chart wrapper with lazy loading and error boundaries
interface LazyChartProps {
  type: 'area' | 'bar' | 'line' | 'pie' | 'radial';
  data: any[];
  config: any;
  height?: number;
  className?: string;
  onError?: (error: Error) => void;
}

export const LazyChart: React.FC<LazyChartProps> = ({
  type,
  data,
  config,
  height = 300,
  className = '',
  onError
}) => {
  const ChartComponent = React.useMemo(() => {
    switch (type) {
      case 'area':
        return lazy(() => import('./AreaChartComponent'));
      case 'bar':
        return lazy(() => import('./BarChartComponent'));
      case 'line':
        return lazy(() => import('./LineChartComponent'));
      case 'pie':
        return lazy(() => import('./PieChartComponent'));
      case 'radial':
        return lazy(() => import('./RadialBarChartComponent'));
      default:
        throw new Error(`Unsupported chart type: ${type}`);
    }
  }, [type]);

  // Prepare props based on chart type
  const chartProps = React.useMemo(() => {
    const baseProps = {
      data,
      height,
      ...config
    };

    // Add dataKey for LineChartComponent
    if (type === 'line' && !baseProps.dataKey) {
      baseProps.dataKey = config?.dataKey || 'value';
    }

    // Add dataKey for PieChartComponent and RadialBarChartComponent
    if ((type === 'pie' || type === 'radial') && !baseProps.dataKey) {
      baseProps.dataKey = config?.dataKey || 'value';
    }

    return baseProps;
  }, [type, data, height, config]);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <Suspense fallback={<EnhancedChartSkeleton type={type} height={height} />}>
        <ChartComponent
          {...chartProps}
          onError={onError}
        />
      </Suspense>
    </div>
  );
};

// Pre-built optimized chart components
export {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  RadialBarChart,
  Bar,
  Line,
  Area,
  Pie,
  Cell,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ChartSkeleton,
  EnhancedChartSkeleton
};

export default LazyChart;