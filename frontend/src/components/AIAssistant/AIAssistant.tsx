import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { chatAPI } from '../../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to DreamerAI! I\'m here to help you learn about our AI solutions. How can I assist you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const quickActions = [
    { text: 'Our Services', message: 'Tell me about your services' },
    { text: 'Pricing', message: 'What are your pricing plans?' },
    { text: 'AI Benefits', message: 'What are the benefits of AI?' },
    { text: 'Get Started', message: 'How do I get started?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickAction = (message: string) => {
    setInputText(message);
    setShowQuickActions(false);
    setTimeout(() => handleSendMessage(message), 100);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputText;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setShowQuickActions(false);

    try {
      const response = await chatAPI.sendMessage(text, conversationId || undefined);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(response.conversationId);
    } catch (error) {
      // Provide intelligent fallback responses
      let fallbackResponse = 'I apologize, but I\'m currently unavailable. Please try again later or contact us at support@dreamerai.io.';
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('service') || lowerText.includes('tool') || lowerText.includes('offer')) {
        fallbackResponse = 'We offer AI Voice Clone, Voice AI Assistant, Document Analyzer, Data Insights Generator, Automation Builder, and Smart Recommendations. Each tool is designed to transform your business operations.';
      } else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('plan')) {
        fallbackResponse = 'We offer flexible pricing plans starting with 5 free uses per tool after signup. Contact us for enterprise pricing and custom solutions.';
      } else if (lowerText.includes('benefit') || lowerText.includes('advantage') || lowerText.includes('help')) {
        fallbackResponse = 'AI can automate repetitive tasks, provide data-driven insights, improve customer experiences, reduce costs, and help you make better business decisions.';
      } else if (lowerText.includes('start') || lowerText.includes('begin') || lowerText.includes('how')) {
        fallbackResponse = 'Getting started is easy! Sign up for a free account, choose your AI tools, and begin transforming your business. Our team is here to help you every step of the way.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-dreamer-blue text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-all ${
          isOpen ? 'hidden' : 'block'
        }`}
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col transition-all transform ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-dreamer-blue text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="Dreamer AI" className="h-8 w-8 mr-3" />
            <div>
              <h3 className="font-semibold">Dreamer AI Assistant</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-dreamer-blue text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Quick Actions */}
          {showQuickActions && messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.message)}
                  className="bg-dreamer-blue text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 transition-colors"
                >
                  {action.text}
                </button>
              ))}
            </div>
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dreamer-blue"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-dreamer-blue text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;