import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SpeakerWaveIcon,
  UserGroupIcon,
  PlayIcon,
  PauseIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';

interface DemoResultProps {
  result: string;
  type: 'document' | 'voice' | 'voiceclone' | 'leads';
}

const DemoResult: React.FC<DemoResultProps> = ({ result, type }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  let parsedResult: any;
  let hasValidResult = true;
  try {
    parsedResult = JSON.parse(result);
  } catch {
    hasValidResult = false;
    parsedResult = {};
  }

  // Initialize audio when voice clone result is received
  useEffect(() => {
    if (type === 'voiceclone' && parsedResult.audioGenerated) {
      // Create a mock audio element with a sample audio file
      // In production, this would be the actual generated audio URL
      const audio = new Audio();
      
      // Use a text-to-speech API or pre-recorded sample
      // For demo purposes, we'll use the Web Speech API
      if ('speechSynthesis' in window) {
        audioRef.current = audio;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [type, parsedResult]);

  const handlePlayPause = () => {
    if ('speechSynthesis' in window && parsedResult.originalText) {
      const synth = window.speechSynthesis;
      
      if (isPlaying) {
        synth.cancel();
        setIsPlaying(false);
        setAudioProgress(0);
      } else {
        try {
          const utterance = new SpeechSynthesisUtterance(parsedResult.originalText);
          utterance.voice = synth.getVoices().find(voice => voice.name.includes('English')) || null;
          utterance.rate = 0.9;
          utterance.pitch = 1;
          
          utterance.onstart = () => {
            setIsPlaying(true);
            setAudioError(null);
          };
          
          utterance.onend = () => {
            setIsPlaying(false);
            setAudioProgress(0);
          };
          
          utterance.onerror = () => {
            setIsPlaying(false);
            setAudioProgress(0);
            setAudioError('Audio playback failed');
          };
          
          // Simple progress simulation
          const duration = parsedResult.originalText.length * 50; // Approximate duration
          let progress = 0;
          const progressInterval = setInterval(() => {
            if (progress < 100) {
              progress += 100 / (duration / 100);
              setAudioProgress(Math.min(progress, 100));
            } else {
              clearInterval(progressInterval);
            }
          }, 100);
          
          utterance.onend = () => {
            setIsPlaying(false);
            setAudioProgress(0);
            clearInterval(progressInterval);
          };
          
          synth.speak(utterance);
        } catch (error) {
          setAudioError('Speech synthesis not available');
          console.error('Speech synthesis error:', error);
        }
      }
    } else {
      setAudioError('Speech synthesis not supported in this browser');
    }
  };

  // Handle invalid JSON after hooks are called
  if (!hasValidResult) {
    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
        <p className="text-red-700">{result}</p>
      </div>
    );
  }

  const renderDocumentResult = () => (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center mb-4">
        <DocumentTextIcon className="h-6 w-6 text-dreamer-blue mr-2" />
        <h4 className="text-lg font-semibold text-dreamer-dark">Document Analysis Complete</h4>
        <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-2 text-dreamer-blue" />
            Executive Summary
          </h5>
          <p className="text-gray-700 text-sm leading-relaxed">
            {parsedResult.summary || 'Document successfully analyzed with key insights extracted.'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
            <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
            Key Insights
          </h5>
          <ul className="space-y-1">
            {parsedResult.keyPoints?.map((point: string, index: number) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <span className="inline-block w-2 h-2 bg-dreamer-blue rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {point}
              </li>
            )) || (
              <li className="text-sm text-gray-700">Advanced analysis completed successfully</li>
            )}
          </ul>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 bg-white rounded-lg p-3">
        <span className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          Processed in 1.2 seconds
        </span>
        <span className="font-medium text-dreamer-blue">
          {parsedResult.processedBy || 'Dreamer AI Document Intelligence'}
        </span>
      </div>
    </div>
  );

  const renderVoiceCloneResult = () => (
    <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-center mb-4">
        <SpeakerWaveIcon className="h-6 w-6 text-purple-600 mr-2" />
        <h4 className="text-lg font-semibold text-dreamer-dark">Voice Generation Complete</h4>
        <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h5 className="font-medium text-gray-900 mb-3">Audio Preview</h5>
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <SpeakerWaveIcon className="h-12 w-12 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">Professional Voice Generated</p>
            
            {/* Audio waveform visualization */}
            {isPlaying && (
              <div className="flex items-center justify-center space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-purple-600 rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Progress bar */}
            {(isPlaying || audioProgress > 0) && (
              <div className="w-full bg-gray-300 rounded-full h-1 mb-3">
                <div 
                  className="bg-purple-600 h-1 rounded-full transition-all duration-100"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            )}
            
            <button 
              onClick={handlePlayPause}
              className="mt-3 px-6 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center justify-center mx-auto space-x-2"
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="h-4 w-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  <span>Play Sample</span>
                </>
              )}
            </button>
            
            {audioError && (
              <p className="text-xs text-red-600 mt-2">{audioError}</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h5 className="font-medium text-gray-900 mb-3">Generation Details</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Voice Profile:</span>
              <span className="font-medium">{parsedResult.voiceProfile || 'Professional Business'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quality:</span>
              <span className="font-medium text-green-600">{parsedResult.quality || 'Studio Quality'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Time:</span>
              <span className="font-medium">{parsedResult.processingTime || '2.1s'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Audio Length:</span>
              <span className="font-medium">12 seconds</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 bg-white rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Original Text:</p>
        <p className="text-sm text-gray-700 italic">"{parsedResult.originalText}"</p>
      </div>
    </div>
  );

  const renderVoiceTranscriptionResult = () => (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center mb-4">
        <MicrophoneIcon className="h-6 w-6 text-blue-600 mr-2" />
        <h4 className="text-lg font-semibold text-dreamer-dark">Voice Analysis Complete</h4>
        <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h5 className="font-medium text-gray-900 mb-3">Transcription</h5>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 italic">"{parsedResult.transcription}"</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{parsedResult.analysis?.wordCount || 0}</div>
              <div className="text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{parsedResult.analysis?.confidenceScore || 0}%</div>
              <div className="text-gray-600">Confidence</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h5 className="font-medium text-gray-900 mb-3">Audio Analysis</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Language:</span>
              <span className="font-medium">{parsedResult.analysis?.languageDetected || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Audio Quality:</span>
              <span className="font-medium text-green-600">{parsedResult.technicalMetrics?.audioQuality || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Speaking Rate:</span>
              <span className="font-medium">{parsedResult.analysis?.avgWordsPerMinute || 0} WPM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Clarity:</span>
              <span className="font-medium">{parsedResult.analysis?.clarity || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {parsedResult.insights && (
        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
          <h5 className="font-medium text-gray-900 mb-2">AI Insights</h5>
          <ul className="space-y-1">
            {parsedResult.insights.map((insight: string, index: number) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderLeadResult = () => (
    <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
      <div className="flex items-center mb-4">
        <UserGroupIcon className="h-6 w-6 text-green-600 mr-2" />
        <h4 className="text-lg font-semibold text-dreamer-dark">Lead Generation Complete</h4>
        <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
      </div>
      
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h5 className="font-medium text-gray-900 mb-2">Target Profile</h5>
          <p className="text-gray-700 text-sm">{parsedResult.targetProfile}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">{parsedResult.generatedLeads?.length || 3}</div>
            <div className="text-xs text-gray-600">Qualified Leads</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{parsedResult.conversionProbability || '73%'}</div>
            <div className="text-xs text-gray-600">Conversion Rate</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">92</div>
            <div className="text-xs text-gray-600">Avg Lead Score</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900">Top Prospects</h5>
        {parsedResult.generatedLeads?.map((lead: any, index: number) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <h6 className="font-medium text-gray-900">{lead.name}</h6>
                <p className="text-sm text-gray-600">{lead.title}</p>
                <p className="text-xs text-gray-500">{lead.company}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center">
                  <ChartBarIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">{lead.score}/100</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Lead Score</div>
              </div>
            </div>
          </div>
        )) || (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-600 text-sm">High-quality leads generated successfully</p>
          </div>
        )}
      </div>
    </div>
  );

  switch (type) {
    case 'document':
      return renderDocumentResult();
    case 'voice':
      return renderVoiceTranscriptionResult();
    case 'voiceclone':
      return renderVoiceCloneResult();
    case 'leads':
      return renderLeadResult();
    default:
      return (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Results:</h4>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">{result}</pre>
        </div>
      );
  }
};

export default DemoResult;