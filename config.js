// Configuration for Weather Hub with OpenAI API
const config = {
  weather: {
    apiKey: '2aa939fed7a78e3a3239ec5a87e31a05'
  },
  openai: {
    apiKey: '', // Add your OpenAI API key here
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7
  },
  app: {
    name: 'Weather Hub',
    version: '1.0.0',
    enableAIChat: true
  }
};

// Make config available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.config = config;
} 