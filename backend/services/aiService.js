const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

// Initialize AI clients (hidden from frontend)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Company context for the AI assistant
const COMPANY_CONTEXT = `You are the Dreamer AI Solutions assistant. You help visitors understand our AI solutions and capabilities.

About Dreamer AI Solutions:
- We provide cutting-edge AI solutions for law firms and enterprise clients
- Our solutions include document analysis, voice transcription, workflow automation, and data insights
- We prioritize security, compliance, and professional-grade implementations
- Contact: support@dreamerai.io or jlasalle@dreamerai.io
- Website: dreamerai.io

Key capabilities (without mentioning specific technologies):
1. Document Intelligence: Transform complex documents into actionable insights
2. Voice Solutions: Convert speech to text with industry-leading accuracy
3. Visual AI: Generate professional presentations and visuals
4. Automation Tools: Streamline workflows with intelligent automation
5. Data Analysis: Extract meaningful patterns from business data

Always maintain a professional, helpful tone suitable for law firms and enterprise clients.
Never mention the specific AI technologies or APIs we use - only refer to "Dreamer AI technology".`;

async function processChat(message, conversationId) {
  try {
    // Try Claude API first
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        system: COMPANY_CONTEXT,
        messages: [{
          role: 'user',
          content: message
        }]
      });

      return {
        text: response.content[0].text,
        conversationId: conversationId || generateConversationId()
      };
    } catch (claudeError) {
      console.log('Falling back to OpenAI...');
      
      // Fallback to OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: COMPANY_CONTEXT },
          { role: 'user', content: message }
        ],
        max_tokens: 500
      });

      return {
        text: completion.choices[0].message.content,
        conversationId: conversationId || generateConversationId()
      };
    }
  } catch (error) {
    console.error('AI Service error:', error);
    throw new Error('Unable to process request');
  }
}

function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  processChat
};