import React, { useState } from 'react';
import { 
  PlayIcon, 
  DocumentTextIcon, 
  MicrophoneIcon,
  UserGroupIcon,
  SpeakerWaveIcon 
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Interactive: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState('document');
  const [demoText, setDemoText] = useState('');
  const [demoResult, setDemoResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    company: '',
    industry: '',
    size: ''
  });
  const [voiceText, setVoiceText] = useState('');

  const handleDocumentAnalysis = async () => {
    if (!demoText.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/showcase/analyze-document', {
        text: demoText,
        type: 'legal'
      });
      setDemoResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setDemoResult('Demo service temporarily unavailable. Please try again later.');
    }
    setLoading(false);
  };

  const handleLeadGeneration = async () => {
    if (!leadFormData.company || !leadFormData.industry) return;
    
    setLoading(true);
    try {
      // Simulate lead generation analysis
      const mockLeads = [
        { name: 'Sarah Johnson', title: 'Legal Director', company: 'Corporate Law Firm', score: 95 },
        { name: 'Michael Chen', title: 'Managing Partner', company: 'Business Solutions Inc', score: 88 },
        { name: 'Emily Rodriguez', title: 'Compliance Officer', company: 'Tech Enterprises', score: 82 }
      ];
      
      setDemoResult(JSON.stringify({
        targetProfile: `${leadFormData.industry} companies with ${leadFormData.size} employees`,
        generatedLeads: mockLeads,
        conversionProbability: '73%',
        processedBy: 'Dreamer AI Lead Intelligence'
      }, null, 2));
    } catch (error) {
      setDemoResult('Lead generation demo temporarily unavailable.');
    }
    setLoading(false);
  };

  const handleVoiceClone = async () => {
    if (!voiceText.trim()) return;
    
    setLoading(true);
    try {
      // Simulate voice cloning
      setDemoResult(JSON.stringify({
        originalText: voiceText,
        voiceProfile: 'Professional Business Voice',
        audioGenerated: true,
        quality: 'Studio Quality',
        processingTime: '2.3 seconds',
        processedBy: 'Dreamer AI Voice Synthesis'
      }, null, 2));
    } catch (error) {
      setDemoResult('Voice cloning demo temporarily unavailable.');
    }
    setLoading(false);
  };

  const demos = [
    {
      id: 'document',
      name: 'Document Analysis',
      description: 'AI-powered legal document insights',
      icon: DocumentTextIcon
    },
    {
      id: 'voice',
      name: 'Voice Transcription',
      description: 'Speech-to-text conversion',
      icon: MicrophoneIcon
    },
    {
      id: 'voiceclone',
      name: 'Voice Cloning',
      description: 'Generate professional voice content',
      icon: SpeakerWaveIcon
    },
    {
      id: 'leads',
      name: 'Lead Generator',
      description: 'AI-powered prospect identification',
      icon: UserGroupIcon
    }
  ];

  return (
    <section id="interactive" className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-dreamer-blue">Live Demos</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-dreamer-dark sm:text-4xl">
            Experience Dreamer AI in Action
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Try our AI capabilities with these interactive demonstrations.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          {/* Demo selector */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
            {demos.map((demo, index) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`flex flex-col items-center p-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  activeDemo === demo.id
                    ? 'bg-dreamer-blue text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <demo.icon className="h-8 w-8 mb-2" />
                <span className="text-sm font-semibold">{demo.name}</span>
                <span className="text-xs opacity-75 text-center mt-1">{demo.description}</span>
              </button>
            ))}
          </div>

          {/* Document Analysis Demo */}
          {activeDemo === 'document' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-lg font-semibold text-dreamer-dark mb-4">
                Document Analysis Demo
              </h3>
              <p className="text-gray-600 mb-6">
                Paste a legal document excerpt to see AI-powered analysis in action.
              </p>
              
              <textarea
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                placeholder="Paste your document text here..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dreamer-blue focus:border-transparent"
              />
              
              <button
                onClick={handleDocumentAnalysis}
                disabled={loading || !demoText.trim()}
                className="mt-4 px-6 py-2 bg-dreamer-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze Document'}
              </button>

              {demoResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Analysis Results:</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {demoResult}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Voice Demo */}
          {activeDemo === 'voice' && (
            <div className="bg-white rounded-lg shadow-sm p-8 transform transition-all duration-300">
              <h3 className="text-lg font-semibold text-dreamer-dark mb-4">
                Voice Transcription Demo
              </h3>
              <p className="text-gray-600 mb-6">
                This demo showcases our voice-to-text capabilities. Full functionality available in production.
              </p>
              
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  Voice transcription demo - Real-time processing available in full version
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  99.2% accuracy • Multi-language support • Real-time processing
                </p>
              </div>
            </div>
          )}

          {/* Voice Cloning Demo */}
          {activeDemo === 'voiceclone' && (
            <div className="bg-white rounded-lg shadow-sm p-8 transform transition-all duration-300">
              <h3 className="text-lg font-semibold text-dreamer-dark mb-4">
                Voice Cloning Demo
              </h3>
              <p className="text-gray-600 mb-6">
                Generate professional voice content with our AI voice synthesis technology.
              </p>
              
              <textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="Enter text to convert to professional voice (e.g., 'Welcome to our law firm. We provide comprehensive legal services to help you succeed.')"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dreamer-blue focus:border-transparent mb-4"
              />
              
              <div className="flex items-center justify-between mb-4">
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dreamer-blue">
                  <option>Professional Business Voice</option>
                  <option>Legal Expert Voice</option>
                  <option>Warm Customer Service</option>
                </select>
                <button
                  onClick={handleVoiceClone}
                  disabled={loading || !voiceText.trim()}
                  className="px-6 py-2 bg-dreamer-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Voice'}
                </button>
              </div>

              {demoResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Voice Generation Results:</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {demoResult}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Lead Generator Demo */}
          {activeDemo === 'leads' && (
            <div className="bg-white rounded-lg shadow-sm p-8 transform transition-all duration-300">
              <h3 className="text-lg font-semibold text-dreamer-dark mb-4">
                AI Lead Generator Demo
              </h3>
              <p className="text-gray-600 mb-6">
                Let our AI identify and score potential clients based on your target profile.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Company type (e.g., Law Firms)"
                  value={leadFormData.company}
                  onChange={(e) => setLeadFormData({...leadFormData, company: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dreamer-blue focus:border-transparent"
                />
                <select
                  value={leadFormData.industry}
                  onChange={(e) => setLeadFormData({...leadFormData, industry: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dreamer-blue"
                >
                  <option value="">Select Industry</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Real Estate">Real Estate</option>
                </select>
                <select
                  value={leadFormData.size}
                  onChange={(e) => setLeadFormData({...leadFormData, size: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dreamer-blue"
                >
                  <option value="">Company Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201+">201+ employees</option>
                </select>
              </div>
              
              <button
                onClick={handleLeadGeneration}
                disabled={loading || !leadFormData.company || !leadFormData.industry}
                className="w-full md:w-auto px-6 py-3 bg-dreamer-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Generating Leads...' : 'Generate Lead Prospects'}
              </button>

              {demoResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Lead Generation Results:</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {demoResult}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Interactive;