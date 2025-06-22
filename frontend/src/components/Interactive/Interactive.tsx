import React, { useState } from 'react';
import { PlayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const Interactive: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState('document');
  const [demoText, setDemoText] = useState('');
  const [demoResult, setDemoResult] = useState('');
  const [loading, setLoading] = useState(false);

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

  const demos = [
    {
      id: 'document',
      name: 'Document Analysis',
      description: 'See how our AI extracts key insights from legal documents',
      icon: DocumentTextIcon
    },
    {
      id: 'voice',
      name: 'Voice Transcription',
      description: 'Experience accurate speech-to-text conversion',
      icon: PlayIcon
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

        <div className="mx-auto mt-16 max-w-4xl">
          {/* Demo selector */}
          <div className="flex space-x-4 mb-8">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeDemo === demo.id
                    ? 'bg-dreamer-blue text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <demo.icon className="h-5 w-5 mr-2" />
                {demo.name}
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
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-lg font-semibold text-dreamer-dark mb-4">
                Voice Transcription Demo
              </h3>
              <p className="text-gray-600 mb-6">
                This demo showcases our voice-to-text capabilities. Full functionality available in production.
              </p>
              
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  Voice transcription demo coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Interactive;