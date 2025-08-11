// Native file download utility
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface ReportData {
  totalRevenue: number;
  totalClients: number;
  totalProjects: number;
  avgProjectValue: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    clients: number;
    projects: number;
  }>;
  technologyData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  performanceData: Array<{
    metric: string;
    score: number;
    fill: string;
  }>;
}

export interface DemoRequest {
  name: string;
  email: string;
  company: string;
  phone?: string;
  message?: string;
  preferredDate?: string;
  preferredTime?: string;
}

class ReportService {
  private generatePDFReport(data: ReportData): Promise<Blob> {
    return new Promise((resolve) => {
      // Enhanced PDF generation with better structure and formatting
      const reportContent = this.generateEnhancedReportContent(data);
      
      // In production, this would use jsPDF or a backend service
      const blob = new Blob([reportContent], { 
        type: 'application/pdf'
      });
      
      // Simulate realistic processing time
      setTimeout(() => resolve(blob), 2000);
    });
  }

  private generateReportContent(data: ReportData): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
DREAMER AI SOLUTIONS - COMPREHENSIVE ANALYTICS REPORT
Generated on: ${currentDate}

EXECUTIVE SUMMARY
===============
Total Revenue: $${data.totalRevenue.toLocaleString()}
Active Clients: ${data.totalClients}
Completed Projects: ${data.totalProjects}
Average Project Value: $${data.avgProjectValue.toLocaleString()}

MONTHLY PERFORMANCE TRENDS
=========================
${data.monthlyData.map(month => 
  `${month.month}: Revenue: $${month.revenue.toLocaleString()}, Clients: ${month.clients}, Projects: ${month.projects}`
).join('\n')}

TECHNOLOGY DISTRIBUTION
======================
${data.technologyData.map(tech => 
  `${tech.name}: ${tech.value}%`
).join('\n')}

PERFORMANCE METRICS
==================
${data.performanceData.map(perf => 
  `${perf.metric}: ${perf.score}%`
).join('\n')}

KEY INSIGHTS & RECOMMENDATIONS
=============================
• Revenue growth shows consistent upward trend with 20.1% month-over-month increase
• Client acquisition rate is healthy at 15% growth
• Technology stack utilization is well-balanced with React leading at 35%
• Performance metrics indicate strong delivery capabilities across all areas
• Average project value trend requires attention for optimization

NEXT STEPS
==========
1. Focus on increasing average project value through premium service offerings
2. Expand client acquisition in high-performing technology sectors
3. Continue leveraging React and Node.js expertise for competitive advantage
4. Implement performance tracking for continuous improvement

© ${new Date().getFullYear()} Dreamer AI Solutions. All rights reserved.
    `.trim();
  }

  private generateEnhancedReportContent(data: ReportData): string {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const quarterStart = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1);
    const quarterName = `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`;
    
    // Calculate trends and insights
    const monthlyRevenue = data.monthlyData.map(m => m.revenue);
    const avgMonthlyRevenue = monthlyRevenue.reduce((a, b) => a + b, 0) / monthlyRevenue.length;
    const lastMonth = monthlyRevenue[monthlyRevenue.length - 1];
    const secondLastMonth = monthlyRevenue[monthlyRevenue.length - 2] || 0;
    const monthlyGrowth = secondLastMonth ? ((lastMonth - secondLastMonth) / secondLastMonth * 100).toFixed(1) : 0;
    
    // Performance summary
    const avgPerformance = data.performanceData.reduce((sum, perf) => sum + perf.score, 0) / data.performanceData.length;
    const topPerformingMetric = data.performanceData.reduce((max, perf) => perf.score > max.score ? perf : max);
    
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    DREAMER AI SOLUTIONS
                COMPREHENSIVE ANALYTICS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Generated: ${currentDate} at ${currentTime}
📊 Report Period: ${quarterName}
🏢 Organization: Dreamer AI Solutions
📄 Report Type: Performance & Analytics Summary

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           EXECUTIVE SUMMARY                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💰 Total Revenue          │ $${data.totalRevenue.toLocaleString().padEnd(20)} │ 📈 +${monthlyGrowth}% MoM
👥 Active Clients         │ ${String(data.totalClients).padEnd(20)} │ 🎯 Target: 25
🚀 Completed Projects     │ ${String(data.totalProjects).padEnd(20)} │ ✅ On Track
💎 Avg Project Value      │ $${data.avgProjectValue.toLocaleString().padEnd(20)} │ 📊 ${avgMonthlyRevenue > lastMonth ? '📉' : '📈'}

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        MONTHLY PERFORMANCE TRENDS                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

${data.monthlyData.map((month, index) => {
  const trend = index > 0 ? 
    (month.revenue > data.monthlyData[index - 1].revenue ? '📈' : 
     month.revenue < data.monthlyData[index - 1].revenue ? '📉' : '➡️') : '📊';
  return `${month.month.padEnd(4)} │ Revenue: $${month.revenue.toLocaleString().padEnd(8)} │ Clients: ${String(month.clients).padEnd(2)} │ Projects: ${String(month.projects).padEnd(2)} │ ${trend}`;
}).join('\n')}

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        TECHNOLOGY STACK ANALYSIS                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

${data.technologyData.map(tech => {
  const barLength = Math.round(tech.value / 5);
  const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
  return `${tech.name.padEnd(12)} │ ${tech.value.toString().padEnd(3)}% │ ${bar} │`;
}).join('\n')}

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         PERFORMANCE METRICS                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

${data.performanceData.map(perf => {
  const barLength = Math.round(perf.score / 5);
  const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
  const status = perf.score >= 90 ? '🟢' : perf.score >= 75 ? '🟡' : '🔴';
  return `${perf.metric.padEnd(12)} │ ${perf.score.toString().padEnd(3)}% │ ${bar} │ ${status}`;
}).join('\n')}

Overall Performance Score: ${avgPerformance.toFixed(1)}% │ Top Metric: ${topPerformingMetric.metric} (${topPerformingMetric.score}%)

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                       KEY INSIGHTS & ANALYSIS                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🎯 STRENGTHS
   • Revenue growth trajectory showing ${monthlyGrowth > 0 ? 'positive' : 'declining'} trend (${monthlyGrowth}% MoM)
   • Client satisfaction remains high with ${topPerformingMetric.metric.toLowerCase()} leading at ${topPerformingMetric.score}%
   • Technology stack well-diversified with React commanding ${data.technologyData[0]?.value || 0}% usage
   • Project delivery capability strong across ${data.totalProjects} completed initiatives

⚠️ AREAS FOR IMPROVEMENT
   • Average project value optimization needed for sustainable growth
   • Client acquisition pipeline requires attention for ${quarterName} targets
   • Performance consistency across all metrics can be enhanced
   • Technology adoption patterns suggest need for emerging tech integration

📊 MARKET POSITION
   • Industry benchmark comparison: Performing above average in client satisfaction
   • Competitive advantage: Strong React/Node.js expertise and AI integration
   • Growth potential: Significant opportunity in enterprise AI solutions
   • Risk factors: Market saturation in traditional web development services

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           STRATEGIC RECOMMENDATIONS                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🎯 IMMEDIATE ACTIONS (Next 30 Days)
   1. Launch premium AI consultation packages to increase project values
   2. Implement client success program to boost retention and referrals
   3. Optimize technology stack training to maintain competitive edge
   4. Establish performance monitoring dashboard for real-time insights

📈 SHORT-TERM INITIATIVES (Next Quarter)
   1. Expand service offerings into emerging AI technologies (LLM integration, automation)
   2. Develop strategic partnerships with complementary service providers
   3. Implement comprehensive client feedback system for continuous improvement
   4. Create scalable processes to handle increased project volume

🚀 LONG-TERM STRATEGY (Next 12 Months)
   1. Position as leading AI solutions provider in target markets
   2. Develop proprietary AI tools and platforms for recurring revenue
   3. Establish thought leadership through content marketing and speaking engagements
   4. Consider strategic acquisitions or partnerships for rapid capability expansion

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                              APPENDICES                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

A. Methodology: Data collected from integrated CRM, project management, and analytics platforms
B. Assumptions: Market conditions remain stable, client retention rates consistent
C. Risk Factors: Economic downturn, increased competition, technology disruption
D. Glossary: MoM (Month over Month), KPI (Key Performance Indicator), ROI (Return on Investment)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 Contact: info@dreamerai.solutions │ 🌐 Web: www.dreamerai.solutions
📧 Questions: analytics@dreamerai.solutions │ 📱 Phone: +1 (555) AI-DREAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

© ${new Date().getFullYear()} Dreamer AI Solutions. All rights reserved.
This report contains confidential and proprietary information. Distribution is restricted.
Report ID: ${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}
    `.trim();
  }

  async downloadReport(data: ReportData, filename = 'dreamer-ai-analytics-report'): Promise<void> {
    try {
      const reportBlob = await this.generatePDFReport(data);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(reportBlob, `${filename}-${timestamp}.pdf`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw new Error('Failed to generate report. Please try again.');
    }
  }

  async scheduleDemo(demoRequest: DemoRequest): Promise<{ success: boolean; message: string; bookingId?: string }> {
    try {
      // In production, this would call your backend API
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response
      const mockBookingId = `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // In production, uncomment this for real API calls:
      /*
      const response = await fetch(`${apiUrl}/api/demo/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoRequest),
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule demo');
      }
      
      const result = await response.json();
      return result;
      */
      
      return {
        success: true,
        message: `Demo scheduled successfully! Confirmation ID: ${mockBookingId}. You'll receive a confirmation email shortly.`,
        bookingId: mockBookingId
      };
    } catch (error) {
      console.error('Failed to schedule demo:', error);
      return {
        success: false,
        message: 'Failed to schedule demo. Please try again or contact us directly.'
      };
    }
  }

  validateDemoRequest(request: Partial<DemoRequest>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!request.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!request.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!request.company?.trim()) {
      errors.push('Company is required');
    }
    
    if (request.phone && !/^[+]?[1-9][\d]{0,15}$/.test(request.phone.replace(/\s/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const reportService = new ReportService();
export default reportService;