import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  VideoCameraIcon, 
  MicrophoneIcon, 
  PhoneXMarkIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface WebRTCChatProps {
  aiAgentId?: string;
  onCallEnd?: (duration: number) => void;
  onError?: (error: string) => void;
}

interface CallState {
  isConnecting: boolean;
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isMuted: boolean;
  error: string | null;
  duration: number;
  aiAgent: {
    name: string;
    avatar: string;
    status: 'available' | 'busy' | 'offline';
  } | null;
}

const WebRTCChat: React.FC<WebRTCChatProps> = ({
  aiAgentId = 'default-agent',
  onCallEnd,
  onError
}) => {
  const [callState, setCallState] = useState<CallState>({
    isConnecting: false,
    isConnected: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isMuted: false,
    error: null,
    duration: 0,
    aiAgent: null
  });

  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'ai';
    message: string;
    timestamp: number;
  }>>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebRTC configuration
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
      // Add TURN servers for production
    ],
    iceCandidatePoolSize: 10
  };

  // Initialize WebSocket connection for signaling
  const initializeWebSocket = useCallback(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://api.dreamerai.io/ws';
    wsRef.current = new WebSocket(`${wsUrl}/webrtc`);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected for WebRTC signaling');
    };

    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await handleSignalingMessage(data);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      setCallState(prev => ({ 
        ...prev, 
        isConnected: false, 
        error: 'Connection lost' 
      }));
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: 'WebSocket connection failed' 
      }));
    };
  }, []);

  // Handle WebRTC signaling messages
  const handleSignalingMessage = useCallback(async (data: any) => {
    const { type, payload } = data;
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;

    try {
      switch (type) {
        case 'offer':
          await peerConnection.setRemoteDescription(payload);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          sendSignalingMessage('answer', answer);
          break;

        case 'answer':
          await peerConnection.setRemoteDescription(payload);
          break;

        case 'ice-candidate':
          await peerConnection.addIceCandidate(payload);
          break;

        case 'agent-info':
          setCallState(prev => ({ ...prev, aiAgent: payload }));
          break;

        case 'call-ended':
          endCall();
          break;

        default:
          console.warn('Unknown signaling message type:', type);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: 'Signaling error occurred' 
      }));
    }
  }, []);

  // Send signaling message via WebSocket
  const sendSignalingMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        payload,
        agentId: aiAgentId,
        timestamp: Date.now()
      }));
    }
  }, [aiAgentId]);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = peerConnection;

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage('ice-candidate', event.candidate);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('Connection state:', state);

      switch (state) {
        case 'connected':
          setCallState(prev => ({ 
            ...prev, 
            isConnected: true, 
            isConnecting: false 
          }));
          startCallTimer();
          break;

        case 'disconnected':
        case 'failed':
          setCallState(prev => ({ 
            ...prev, 
            isConnected: false,
            error: 'Connection failed'
          }));
          break;
      }
    };

    // Create data channel for text chat
    const dataChannel = peerConnection.createDataChannel('chat', {
      ordered: true
    });
    
    dataChannel.onopen = () => {
      console.log('Data channel opened');
      dataChannelRef.current = dataChannel;
    };

    dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        message: message.text,
        timestamp: Date.now()
      }]);
    };

    // Handle incoming data channel
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          message: message.text,
          timestamp: Date.now()
        }]);
      };
    };

    return peerConnection;
  }, [sendSignalingMessage]);

  // Get user media (camera and microphone)
  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callState.isVideoEnabled,
        audio: callState.isAudioEnabled
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Camera and microphone access denied');
    }
  }, [callState.isVideoEnabled, callState.isAudioEnabled]);

  // Start video call with AI agent
  const startCall = useCallback(async () => {
    try {
      setCallState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: null 
      }));

      // Initialize WebSocket
      initializeWebSocket();

      // Get user media
      const stream = await getUserMedia();

      // Initialize peer connection
      const peerConnection = initializePeerConnection();

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      });

      await peerConnection.setLocalDescription(offer);

      // Send offer to AI agent
      sendSignalingMessage('start-call', {
        offer,
        agentId: aiAgentId,
        features: {
          video: callState.isVideoEnabled,
          audio: callState.isAudioEnabled,
          chat: true
        }
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setCallState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to start call'
      }));
      onError?.(error instanceof Error ? error.message : 'Failed to start call');
    }
  }, [getUserMedia, initializePeerConnection, initializeWebSocket, sendSignalingMessage, aiAgentId, callState.isVideoEnabled, callState.isAudioEnabled, onError]);

  // End video call
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    const duration = callState.duration;
    
    setCallState({
      isConnecting: false,
      isConnected: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
      isMuted: false,
      error: null,
      duration: 0,
      aiAgent: null
    });

    setMessages([]);
    
    onCallEnd?.(duration);
  }, [callState.duration, onCallEnd]);

  // Start call timer
  const startCallTimer = useCallback(() => {
    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !callState.isVideoEnabled;
        setCallState(prev => ({ 
          ...prev, 
          isVideoEnabled: !prev.isVideoEnabled 
        }));
      }
    }
  }, [callState.isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !callState.isAudioEnabled;
        setCallState(prev => ({ 
          ...prev, 
          isAudioEnabled: !prev.isAudioEnabled 
        }));
      }
    }
  }, [callState.isAudioEnabled]);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (dataChannelRef.current?.readyState === 'open') {
      const messageData = {
        text: message,
        timestamp: Date.now()
      };

      dataChannelRef.current.send(JSON.stringify(messageData));
      
      setMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        sender: 'user',
        message,
        timestamp: Date.now()
      }]);
    }
  }, []);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callState.isConnected || callState.isConnecting) {
        endCall();
      }
    };
  }, []);

  return (
    <div className="webrtc-chat bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          AI Video Consultation
        </h3>
        {callState.isConnected && (
          <div className="text-sm text-gray-600">
            Duration: {formatDuration(callState.duration)}
          </div>
        )}
      </div>

      {/* Error Display */}
      {callState.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{callState.error}</span>
          </div>
        </div>
      )}

      {/* Video Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Remote Video (AI Agent) */}
        <div className="relative bg-gray-900 rounded-lg aspect-video">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover rounded-lg"
            autoPlay
            playsInline
          />
          {!callState.isConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                {callState.aiAgent ? (
                  <>
                    <img 
                      src={callState.aiAgent.avatar} 
                      alt={callState.aiAgent.name}
                      className="w-16 h-16 rounded-full mx-auto mb-2"
                    />
                    <p className="font-medium">{callState.aiAgent.name}</p>
                    <p className="text-sm opacity-75">AI Assistant</p>
                  </>
                ) : (
                  <p>Connecting to AI Agent...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Video (User) */}
        <div className="relative bg-gray-800 rounded-lg aspect-video">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover rounded-lg"
            autoPlay
            playsInline
            muted
          />
          {!callState.isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <VideoCameraIcon className="h-12 w-12 text-white opacity-50" />
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {!callState.isConnected && !callState.isConnecting && (
          <button
            onClick={startCall}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Video Call
          </button>
        )}

        {(callState.isConnected || callState.isConnecting) && (
          <>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-lg transition-colors ${
                callState.isVideoEnabled 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              aria-label="Toggle video"
            >
              <VideoCameraIcon className="h-6 w-6" />
            </button>

            <button
              onClick={toggleAudio}
              className={`p-3 rounded-lg transition-colors ${
                callState.isAudioEnabled 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              aria-label="Toggle audio"
            >
              <MicrophoneIcon className="h-6 w-6" />
            </button>

            <button
              onClick={endCall}
              className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors"
              aria-label="End call"
            >
              <PhoneXMarkIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Chat Messages */}
      {callState.isConnected && (
        <div className="border-t pt-6">
          <div className="flex items-center mb-4">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-medium text-gray-900">Chat</h4>
          </div>
          
          <div className="h-32 overflow-y-auto bg-gray-50 rounded-lg p-3 mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-3 py-1 rounded-lg text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-900 border'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value.trim());
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input?.value.trim()) {
                  sendMessage(input.value.trim());
                  input.value = '';
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebRTCChat;