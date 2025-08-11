import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';
import { Button } from '../ui/button';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Target, Download, Calendar } from 'lucide-react';
import { reportService, ReportData } from '../../services/reportService';
import DemoScheduleModal from '../DemoScheduleModal/DemoScheduleModal';
import LoadingAnimation from '../Animation/LoadingAnimation';

const monthlyData = [
  { month: 'Jan', revenue: 45000, clients: 12, projects: 8 },
  { month: 'Feb', revenue: 52000, clients: 15, projects: 11 },
  { month: 'Mar', revenue: 48000, clients: 14, projects: 9 },
  { month: 'Apr', revenue: 61000, clients: 18, projects: 14 },
  { month: 'May', revenue: 55000, clients: 16, projects: 12 },
  { month: 'Jun', revenue: 67000, clients: 22, projects: 16 },
];

const technologyData = [
  { name: 'React', value: 35, fill: '#61DAFB' },
  { name: 'Node.js', value: 25, fill: '#339933' },
  { name: 'Python', value: 20, fill: '#3776AB' },
  { name: 'AI/ML', value: 15, fill: '#FF6B6B' },
  { name: 'Cloud', value: 5, fill: '#4285F4' },
];

const performanceData = [
  { metric: 'Efficiency', score: 85, fill: '#8884d8' },
  { metric: 'Quality', score: 92, fill: '#82ca9d' },
  { metric: 'Innovation', score: 78, fill: '#ffc658' },
  { metric: 'Satisfaction', score: 95, fill: '#ff8042' },
  { metric: 'Growth', score: 88, fill: '#0088fe' },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#8884d8",
  },
  clients: {
    label: "Clients",
    color: "#82ca9d",
  },
  projects: {
    label: "Projects",
    color: "#ffc658",
  },
} as const;

const Dashboard: React.FC = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [reportError, setReportError] = useState<string>('');

  const reportData = useMemo((): ReportData => {
    const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
    const totalClients = monthlyData[monthlyData.length - 1].clients;
    const totalProjects = monthlyData.reduce((sum, item) => sum + item.projects, 0);
    const avgProjectValue = Math.round(totalRevenue / totalProjects);

    return {
      totalRevenue,
      totalClients,
      totalProjects,
      avgProjectValue,
      monthlyData,
      technologyData,
      performanceData
    };
  }, []);

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);
    setReportError('');

    try {
      await reportService.downloadReport(reportData);
      
      // Track conversion event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'report_downloaded', {
          event_category: 'engagement',
          event_label: 'dashboard_report'
        });
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReportError('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleScheduleDemo = () => {
    setIsDemoModalOpen(true);
    
    // Track engagement event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'demo_modal_opened', {
        event_category: 'engagement',
        event_label: 'dashboard_demo_button'
      });
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Analytics Dashboard
          </h2>
          <p className="text-xl text-gray-600">
            Real-time insights into our AI solutions performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${reportData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalClients}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +15% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalProjects}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +12 new this quarter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Project Value</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${reportData.avgProjectValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                -5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trend Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue for the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={reportData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartConfig.revenue.color}
                    fill={chartConfig.revenue.color}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Client Growth Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Client Growth</CardTitle>
              <CardDescription>Number of active clients over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={reportData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="clients"
                    stroke={chartConfig.clients.color}
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Technology Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Technology Distribution</CardTitle>
              <CardDescription>Our tech stack utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={reportData.technologyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.technologyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={reportData.performanceData}>
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff' }}
                    background
                    dataKey="score"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Projects Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Projects Overview</CardTitle>
            <CardDescription>Monthly project completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={reportData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="projects" fill={chartConfig.projects.color} radius={[8, 8, 0, 0]} />
                <Bar dataKey="clients" fill={chartConfig.clients.color} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-12 space-y-4">
          {reportError && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {reportError}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="default"
              size="lg"
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
              className="flex items-center justify-center min-w-48"
            >
              {isGeneratingReport ? (
                <>
                  <LoadingAnimation variant="spinner" size="small" />
                  <span className="ml-2">Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Full Report
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleScheduleDemo}
              className="flex items-center justify-center min-w-48"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Demo
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>Get comprehensive insights and personalized AI solutions for your business</p>
          </div>
        </div>
      </div>

      {/* Demo Schedule Modal */}
      <DemoScheduleModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </section>
  );
};

export default Dashboard;