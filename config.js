// Configuration for Weather Hub with Google Gemini API
const config = {
  weather: {
    apiKey: '2aa939fed7a78e3a3239ec5a87e31a05'
  },
  gemini: {
    apiKey: 'AIzaSyD4Sh2m0PGQQ_Sr2nJcwvG-mehCN3GWhhM', // Get from: https://makersuite.google.com/app/apikey
    model: 'gemini-1.5-flash', // or 'gemini-1.5-pro' for more advanced responses
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
