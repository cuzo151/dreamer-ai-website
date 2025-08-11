import React, { useEffect } from 'react';
import './ElevenLabsChat.css';

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id'?: string;
        children?: React.ReactNode;
      };
    }
  }
}

const ElevenLabsChat: React.FC = () => {
  useEffect(() => {
    // Load ElevenLabs ConvAI script if not already loaded
    if (!document.querySelector('script[src*="convai-widget"]')) {
      const script = document.createElement('script');
      script.src = 'https://elevenlabs.io/convai-widget/index.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="elevenlabs-chat-container">
      {/* ElevenLabs ConvAI Widget Only - No extra text */}
      <div 
        dangerouslySetInnerHTML={{
          __html: '<elevenlabs-convai agent-id="agent_01jy7cvckbf8k9vyctnmdye8wq"></elevenlabs-convai>'
        }}
      />
    </div>
  );
};

export default ElevenLabsChat;