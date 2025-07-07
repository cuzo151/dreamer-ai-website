import React from 'react';
import './AITools.css';

interface Tool {
  icon: string;
  title: string;
  description: string;
  action: string;
}

const tools: Tool[] = [
  {
    icon: '🎤',
    title: 'AI Voice Clone Tool',
    description: 'Create realistic voice clones with advanced AI technology. Perfect for content creation, accessibility, and personalized experiences.',
    action: 'Try Voice Clone'
  },
  {
    icon: '🤖',
    title: 'Voice AI Assistant',
    description: 'Intelligent voice assistant powered by Eleven Labs integration. Natural conversations and smart responses.',
    action: 'Launch Assistant'
  },
  {
    icon: '📄',
    title: 'Document Analyzer',
    description: 'AI-powered document analysis and insights. Extract key information and generate summaries automatically.',
    action: 'Analyze Documents'
  },
  {
    icon: '📊',
    title: 'Data Insights Generator',
    description: 'Transform raw data into actionable business insights with our advanced analytics AI.',
    action: 'Generate Insights'
  },
  {
    icon: '⚙️',
    title: 'Automation Builder',
    description: 'Build custom automation workflows with our intuitive AI-powered platform.',
    action: 'Build Automation'
  },
  {
    icon: '🎯',
    title: 'Smart Recommendations',
    description: 'Get personalized recommendations based on AI analysis of your business patterns.',
    action: 'Get Recommendations'
  }
];

const AITools: React.FC = () => {
  const handleToolClick = (toolTitle: string) => {
    // TODO: Implement tool navigation/modal
    console.log(`Clicked on ${toolTitle}`);
    alert(`${toolTitle} - Coming Soon!`);
  };

  return (
    <section id="ai-tools" className="ai-tools-section">
      <div className="container">
        <div className="ai-tools">
          <h2>Our AI-Powered Tools</h2>
          <div className="tools-grid">
            {tools.map((tool, index) => (
              <div key={index} className="tool-card">
                <div className="tool-icon">{tool.icon}</div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleToolClick(tool.title)}
                >
                  {tool.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AITools;