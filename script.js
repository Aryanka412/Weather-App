const apiKey = '2aa939fed7a78e3a3239ec5a87e31a05';

// Weather condition to emoji mapping
const weatherEmojis = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️'
};

// Global variables
let isCelsius = true;
let currentWeatherData = null;
let currentForecastData = null;
let currentAirQuality = null;
let chatHistory = [];
let isChatOpen = false;

// AI Response Templates and Context Data
const aiKnowledgeBase = {
  // Weather-based recommendations
  clothingRecommendations: {
    sunny: ['Light clothing', 'Sunglasses', 'Hat', 'Sunscreen', 'Breathable fabrics'],
    rainy: ['Waterproof jacket', 'Umbrella', 'Waterproof shoes', 'Rain boots', 'Quick-dry clothing'],
    snowy: ['Warm coat', 'Gloves', 'Scarf', 'Winter boots', 'Thermal layers'],
    cloudy: ['Light jacket', 'Layers', 'Comfortable shoes', 'Light sweater'],
    windy: ['Windbreaker', 'Secure hat', 'Closed shoes', 'Avoid loose clothing'],
    hot: ['Light colors', 'Loose fitting clothes', 'Hat', 'Minimal layers', 'Cotton fabrics'],
    cold: ['Warm layers', 'Insulated jacket', 'Warm hat', 'Thermal underwear', 'Warm socks']
  },
  
  activities: {
    sunny: ['Beach activities', 'Hiking', 'Outdoor sports', 'Picnics', 'Cycling', 'Walking', 'Photography'],
    rainy: ['Museums', 'Indoor shopping', 'Cafes', 'Movies', 'Reading', 'Cooking', 'Board games'],
    snowy: ['Skiing', 'Snowboarding', 'Ice skating', 'Hot chocolate', 'Winter photography', 'Sledding'],
    cloudy: ['Walking', 'Sightseeing', 'Outdoor markets', 'Light hiking', 'Photography'],
    windy: ['Kite flying', 'Sailing', 'Windsurfing', 'Indoor activities', 'Wind-protected areas']
  },

  healthTips: {
    sunny: ['Stay hydrated', 'Use sunscreen SPF 30+', 'Seek shade during peak hours', 'Wear UV protection'],
    rainy: ['Vitamin D supplement', 'Stay dry to avoid illness', 'Be cautious of wet surfaces'],
    snowy: ['Protect against frostbite', 'Stay warm and dry', 'Be aware of hypothermia signs'],
    windy: ['Protect eyes from debris', 'Secure loose items', 'Be cautious of wind chill'],
    hot: ['Drink extra water', 'Avoid prolonged sun exposure', 'Watch for heat exhaustion signs'],
    cold: ['Layer clothing', 'Keep extremities warm', 'Stay active to maintain circulation']
  },

  cityAttractions: {
    default: ['Historic landmarks', 'Local restaurants', 'Parks and gardens', 'Museums', 'Shopping districts', 'Cultural sites']
  }
};

// Advanced AI Chat Responses
const aiResponses = {
  greetings: [
    "Hello! I'm your AI Weather Assistant. How can I help you today? 🌤️",
    "Hi there! Ready to explore weather insights and recommendations? ☀️",
    "Welcome! I'm here to provide intelligent weather analysis and city guidance. 🤖"
  ],
  
  weatherAnalysis: {
    generateInsight: (weatherData) => {
      const temp = weatherData.main.temp;
      const condition = weatherData.weather[0].main.toLowerCase();
      const humidity = weatherData.main.humidity;
      const windSpeed = weatherData.wind.speed * 3.6;
      
      let insights = [];
      
      // Temperature analysis
      if (temp > 30) {
        insights.push("🌡️ It's quite hot today! Stay hydrated and seek shade during peak hours.");
      } else if (temp < 5) {
        insights.push("🥶 Bundle up! It's cold outside. Layer your clothing for warmth.");
      } else if (temp > 20 && temp <= 30) {
        insights.push("🌤️ Perfect temperature for outdoor activities!");
      }
      
      // Condition analysis
      if (condition.includes('rain')) {
        insights.push("☔ Rain expected - perfect time for indoor activities or cozy moments with a hot drink!");
      } else if (condition.includes('clear') || condition.includes('sun')) {
        insights.push("☀️ Beautiful clear weather - ideal for outdoor adventures!");
      } else if (condition.includes('cloud')) {
        insights.push("☁️ Overcast skies create perfect lighting for photography and comfortable temperatures for walking.");
      }
      
      // Humidity analysis
      if (humidity > 80) {
        insights.push("💧 High humidity levels - you might feel warmer than the actual temperature.");
      } else if (humidity < 30) {
        insights.push("🏜️ Low humidity - consider using moisturizer and staying hydrated.");
      }
      
      // Wind analysis
      if (windSpeed > 20) {
        insights.push("💨 Windy conditions - secure loose items and be cautious outdoors.");
      } else if (windSpeed > 10) {
        insights.push("🍃 Nice breeze today - perfect for activities like kite flying!");
      }
      
      return insights;
    }
  },

  contextualResponses: {
    getResponse: (userInput, context) => {
      const input = userInput.toLowerCase();
      
      // Weather questions
      if (input.includes('weather') || input.includes('forecast')) {
        if (currentWeatherData) {
          const city = currentWeatherData.name;
          const temp = Math.round(currentWeatherData.main.temp);
          const condition = currentWeatherData.weather[0].description;
          return `Current weather in ${city}: ${temp}°C with ${condition}. ${getWeatherAdvice(currentWeatherData.weather[0].main)}`;
        }
        return "Please search for a city first, and I'll provide detailed weather information!";
      }
      
      // Clothing recommendations
      if (input.includes('wear') || input.includes('clothing') || input.includes('dress')) {
        if (currentWeatherData) {
          return getClothingRecommendation(currentWeatherData);
        }
        return "Search for a city's weather first, and I'll recommend what to wear!";
      }
      
      // Activity suggestions
      if (input.includes('activity') || input.includes('activities') || input.includes('do')) {
        if (currentWeatherData) {
          return getActivityRecommendation(currentWeatherData);
        }
        return "Let me know your city first, and I'll suggest perfect activities for the weather!";
      }
      
      // 7-day forecast
      if (input.includes('7-day') || input.includes('week') || input.includes('forecast')) {
        return "I currently show 24-hour forecasts. For extended forecasts, I recommend checking multiple days or using detailed weather services!";
      }
      
      // Local attractions
      if (input.includes('attraction') || input.includes('places') || input.includes('visit') || input.includes('local')) {
        if (currentWeatherData) {
          return getCityRecommendations(currentWeatherData.name);
        }
        return "Search for a city first, and I'll suggest local attractions and places to visit!";
      }
      
      // Health tips
      if (input.includes('health') || input.includes('tips') || input.includes('advice')) {
        if (currentWeatherData) {
          return getHealthTips(currentWeatherData);
        }
        return "Share your location first, and I'll provide weather-related health tips!";
      }
      
      // Default responses
      const defaultResponses = [
        "I'm here to help with weather insights! Try asking about clothing recommendations, activities, or local attractions.",
        "Ask me about what to wear, what activities to do, or places to visit in your city!",
        "I can provide weather analysis, outfit suggestions, activity recommendations, and local insights. What interests you?"
      ];
      
      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
  }
};

// Utility functions for AI responses
function getWeatherAdvice(condition) {
  const adviceMap = {
    'Clear': '☀️ Perfect day for outdoor activities!',
    'Clouds': '☁️ Comfortable weather for any plans!',
    'Rain': '☔ Great day for indoor activities or cozy moments!',
    'Snow': '❄️ Winter wonderland - perfect for warm drinks!',
    'Thunderstorm': '⛈️ Stay safe indoors during the storm!',
    'Drizzle': '🌦️ Light rain - perfect with an umbrella!',
    'Mist': '🌫️ Mysterious atmospheric conditions!',
    'Fog': '🌫️ Low visibility - drive safely!'
  };
  return adviceMap[condition] || '🌤️ Have a wonderful day!';
}

function getClothingRecommendation(weatherData) {
  const temp = weatherData.main.temp;
  const condition = weatherData.weather[0].main.toLowerCase();
  const city = weatherData.name;
  
  let recommendations = [];
  
  // Temperature-based recommendations
  if (temp > 30) {
    recommendations.push(...aiKnowledgeBase.clothingRecommendations.hot);
  } else if (temp > 20) {
    recommendations.push(...aiKnowledgeBase.clothingRecommendations.sunny);
  } else if (temp > 10) {
    recommendations.push(...aiKnowledgeBase.clothingRecommendations.cloudy);
  } else {
    recommendations.push(...aiKnowledgeBase.clothingRecommendations.cold);
  }
  
  // Condition-based additions
  if (condition.includes('rain')) {
    recommendations.push(...aiKnowledgeBase.clothingRecommendations.rainy);
  } else if (condition.includes('snow')) {
    recommendations.push(...aiKnowledgeBase.clothingRecommendations.snowy);
  }
  
  if (weatherData.wind.speed > 5) {
    recommendations.push(...aiKnowledgeBase.clothingRecommendations.windy);
  }
  
  const uniqueRecommendations = [...new Set(recommendations)];
  const randomSelection = uniqueRecommendations.slice(0, 3);
  
  return `For ${city}'s current weather (${Math.round(temp)}°C), I recommend: ${randomSelection.join(', ')}. Stay comfortable! 👕`;
}

function getActivityRecommendation(weatherData) {
  const condition = weatherData.weather[0].main.toLowerCase();
  const temp = weatherData.main.temp;
  const city = weatherData.name;
  
  let activities = [];
  
  if (condition.includes('clear') || condition.includes('sun')) {
    activities = aiKnowledgeBase.activities.sunny;
  } else if (condition.includes('rain')) {
    activities = aiKnowledgeBase.activities.rainy;
  } else if (condition.includes('snow')) {
    activities = aiKnowledgeBase.activities.snowy;
  } else if (condition.includes('cloud')) {
    activities = aiKnowledgeBase.activities.cloudy;
  }
  
  const randomActivities = activities.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  return `Perfect activities for ${city}'s weather: ${randomActivities.join(', ')}! The weather is great for ${temp > 20 ? 'outdoor' : 'cozy indoor'} experiences. 🎯`;
}

function getCityRecommendations(cityName) {
  const attractions = aiKnowledgeBase.cityAttractions.default;
  const randomAttractions = attractions.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  return `Popular places to visit in ${cityName}: ${randomAttractions.join(', ')}. Each city has unique attractions - explore local guides for specific recommendations! 🏛️`;
}

function getHealthTips(weatherData) {
  const condition = weatherData.weather[0].main.toLowerCase();
  const temp = weatherData.main.temp;
  
  let tips = [];
  
  if (temp > 30) {
    tips = aiKnowledgeBase.healthTips.hot;
  } else if (temp < 5) {
    tips = aiKnowledgeBase.healthTips.cold;
  } else if (condition.includes('rain')) {
    tips = aiKnowledgeBase.healthTips.rainy;
  } else if (condition.includes('snow')) {
    tips = aiKnowledgeBase.healthTips.snowy;
  } else if (condition.includes('clear')) {
    tips = aiKnowledgeBase.healthTips.sunny;
  }
  
  const randomTips = tips.slice(0, 2);
  return `Health tips for today's weather: ${randomTips.join(' and ')}. Stay safe and healthy! 🏥`;
}

// City Guide phrases (updated)
const cityPhrases = {
  greeting: [
    "Ask me anything about weather and your city! 🌍",
    "Ready to explore weather insights? 🔍",
    "Your AI weather assistant is here! ⛅"
  ],
  loading: [
    "Analyzing weather data with AI... ⏳",
    "Generating intelligent insights... 🧠",
    "Processing weather information... 📡"
  ],
  sunny: [
    "Perfect day for outdoor activities! ☀️",
    "Beautiful weather - ask me what to do! 🌞",
    "Sunny and amazing - need activity ideas? 😎"
  ],
  cloudy: [
    "Nice and comfortable! Want suggestions? ☁️",
    "Great weather for exploring! 🌤️",
    "Perfect day - ask me for recommendations! 🌥️"
  ],
  rainy: [
    "Cozy weather ahead! Indoor activity ideas? ☔",
    "Perfect for hot drinks! Need suggestions? ☕",
    "Rainy day fun - ask me what to do! 🌧️"
  ],
  snowy: [
    "Winter wonderland! Want winter activities? ❄️",
    "Perfect for hot chocolate! Need tips? ☕",
    "Snowy day ahead - ask for recommendations! ⛄"
  ],
  hot: [
    "Stay cool! Need hydration tips? 💧",
    "Hot weather - want cooling suggestions? 🏖️",
    "Perfect beach weather! Activity ideas? 🏊‍♀️"
  ],
  cold: [
    "Bundle up! Want warming tips? 🧥",
    "Perfect for cozy activities! Suggestions? ☕",
    "Cold day - need warming advice? 🧣"
  ],
  windy: [
    "Breezy day! Kite flying weather? 💨",
    "Windy conditions - need safe activity ideas? 🍃",
    "Fresh air ahead! Want suggestions? 🌬️"
  ],
  error: [
    "City not found - try another location! 🤔",
    "Search help needed? Ask me! 🔍",
    "Let's find your city together! 📍"
  ]
};

// Initialize with current date and show start screen
window.addEventListener('load', () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('currentDate').textContent = currentDate;
  document.getElementById('startScreen').style.display = 'flex';
  updateGuideMessage('greeting');
  
  // Initialize chat
  initializeChat();
});

// Chat initialization
function initializeChat() {
  // Hide notification after a while
  setTimeout(() => {
    const notification = document.getElementById('fabNotification');
    if (notification) {
      notification.style.display = 'none';
    }
  }, 5000);
  
  // Add enter key listener for chat input
  document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Chat functionality
function toggleChat() {
  const chatContainer = document.getElementById('chatContainer');
  const chatFab = document.getElementById('chatFab');
  
  isChatOpen = !isChatOpen;
  
  if (isChatOpen) {
    chatContainer.style.display = 'flex';
    chatFab.style.display = 'none';
    // Hide suggestions if weather is available
    if (currentWeatherData) {
      document.getElementById('chatSuggestions').style.display = 'none';
    }
  } else {
    chatContainer.style.display = 'none';
    chatFab.style.display = 'flex';
  }
}

function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  // Add user message
  addMessage(message, 'user');
  chatInput.value = '';
  
  // Generate AI response
  setTimeout(() => {
    const aiResponse = generateAIResponse(message);
    addMessage(aiResponse, 'ai');
  }, 500);
}

function sendSuggestion(suggestion) {
  document.getElementById('chatInput').value = suggestion;
  sendMessage();
}

function addMessage(text, sender) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${sender === 'ai' ? '🤖' : '👤'}</div>
    <div class="message-content">
      <div class="message-text">${text}</div>
      <div class="message-time">${currentTime}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Store in chat history
  chatHistory.push({text, sender, time: currentTime});
}

function generateAIResponse(userInput) {
  // Context-aware response generation
  const response = aiResponses.contextualResponses.getResponse(userInput, {
    currentWeather: currentWeatherData,
    currentForecast: currentForecastData,
    chatHistory: chatHistory
  });
  
  return response;
}

// Search functionality
document.getElementById('cityInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    getWeather();
  }
});

// Weather fetching function with AI insights
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    showError('Please enter a city name');
    updateGuideMessage('error');
    return;
  }

  // Start fade out animation
  fadeOutContent();
  updateGuideMessage('loading');
  
  showLoading();
  hideError();
  hideStartScreen();

  try {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('City not found');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    // Fetch UV data with coordinates
    const uvResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/uvi?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${apiKey}`
    );
    const uvData = uvResponse.ok ? await uvResponse.json() : null;
    
    // Generate mock air quality data
    const airQualityData = generateMockAirQuality();

    // Store global data
    currentWeatherData = currentData;
    currentForecastData = forecastData;
    currentAirQuality = airQualityData;
    
    // Add UV data to weather data
    if (uvData) {
      currentData.uvi = uvData.value;
    }

    // Wait for fade out to complete then display new data
    setTimeout(() => {
      displayWeather(currentData, airQualityData);
      displayHourlyForecast(forecastData);
      generateAIInsights(currentData);
      setBackgroundByWeather(currentData.weather[0].icon);
      
      hideLoading();
      fadeInContent();
      
      // Update guide message based on weather
      updateGuideMessageByWeather(currentData);
      
      // Add AI message about new location
      if (isChatOpen) {
        setTimeout(() => {
          const aiMessage = `I've updated the weather for ${currentData.name}! Ask me about clothing, activities, or local recommendations. 🌍`;
          addMessage(aiMessage, 'ai');
        }, 1000);
      }
    }, 300);

  } catch (error) {
    hideLoading();
    showError('City not found. Please try again.');
    updateGuideMessage('error');
    fadeInContent();
    console.error('Error fetching weather:', error);
  }
}

// Generate AI insights
function generateAIInsights(weatherData) {
  const aiInsightsGrid = document.getElementById('aiInsights');
  aiInsightsGrid.innerHTML = '';
  
  const insights = aiResponses.weatherAnalysis.generateInsight(weatherData);
  
  insights.forEach((insight, index) => {
    const insightCard = document.createElement('div');
    insightCard.className = 'ai-insight-card';
    insightCard.style.animationDelay = `${index * 0.2}s`;
    
    const icons = ['🧠', '💡', '⚡', '🎯', '🌟'];
    const icon = icons[index % icons.length];
    
    insightCard.innerHTML = `
      <div class="insight-icon">${icon}</div>
      <div class="insight-title">AI Analysis</div>
      <div class="insight-text">${insight}</div>
    `;
    
    aiInsightsGrid.appendChild(insightCard);
  });
}

// Fade transition functions
function fadeOutContent() {
  const weatherContent = document.getElementById('weatherContent');
  const container = document.querySelector('.container');
  
  weatherContent.classList.remove('show');
  container.classList.add('fade-out');
}

function fadeInContent() {
  const weatherContent = document.getElementById('weatherContent');
  const container = document.querySelector('.container');
  
  setTimeout(() => {
    container.classList.remove('fade-out');
    container.classList.add('fade-in');
    weatherContent.classList.add('show');
  }, 100);
}

function generateMockAirQuality() {
  // Generate realistic mock air quality data
  const aqi = Math.floor(Math.random() * 5) + 1;
  const pm25 = Math.floor(Math.random() * 50) + 5;
  const pm10 = Math.floor(Math.random() * 80) + 10;
  const o3 = Math.floor(Math.random() * 100) + 30;
  
  const levels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  
  return {
    main: { aqi },
    components: { pm2_5: pm25, pm10, o3 },
    level: levels[aqi - 1]
  };
}

function displayWeather(data, airQuality) {
  const cityName = `${data.name}, ${data.sys.country}`;
  const temperature = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed * 3.6);
  const visibility = Math.round(data.visibility / 1000);
  const pressure = data.main.pressure;
  const uvIndex = data.uvi || Math.floor(Math.random() * 11);

  document.getElementById('cityName').textContent = cityName;
  document.getElementById('temperature').textContent = `${isCelsius ? temperature : convertToF(temperature)}°`;
  document.getElementById('description').textContent = capitalize(description);
  document.getElementById('weatherIcon').textContent = weatherEmojis[iconCode] || '☀️';
  document.getElementById('humidity').textContent = `${humidity}%`;
  document.getElementById('windSpeed').textContent = `${windSpeed} km/h`;
  document.getElementById('visibility').textContent = `${visibility} km`;
  document.getElementById('feelsLike').textContent = `${isCelsius ? feelsLike : convertToF(feelsLike)}°`;
  document.getElementById('uvIndex').textContent = uvIndex;
  document.getElementById('pressure').textContent = `${pressure} hPa`;

  // Display air quality
  if (airQuality) {
    document.getElementById('aqiValue').textContent = airQuality.main.aqi * 20;
    document.getElementById('aqiLevel').textContent = airQuality.level;
    document.getElementById('pm25').textContent = `${airQuality.components.pm2_5} μg/m³`;
    document.getElementById('pm10').textContent = `${airQuality.components.pm10} μg/m³`;
    document.getElementById('ozone').textContent = `${airQuality.components.o3} μg/m³`;
    
    // Color code AQI
    const aqiCard = document.querySelector('.air-quality-card');
    const colors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97'];
    aqiCard.style.borderLeft = `4px solid ${colors[airQuality.main.aqi - 1]}`;
  }
}

function displayHourlyForecast(forecastData) {
  const forecastGrid = document.getElementById('forecastGrid');
  forecastGrid.innerHTML = '';

  const timezoneOffset = forecastData.city.timezone;
  const nowUTC = Math.floor(Date.now() / 1000);
  const nowInCityTime = nowUTC + timezoneOffset;

  const futureForecasts = forecastData.list.filter(item => item.dt >= nowInCityTime).slice(0, 8);

  futureForecasts.forEach((item, index) => {
    const forecastTime = new Date((item.dt + timezoneOffset) * 1000);
    const hour = forecastTime.getUTCHours();
    const formattedHour = hour === 0 ? '12 AM' :
                          hour === 12 ? '12 PM' :
                          hour > 12 ? `${hour - 12} PM` : `${hour} AM`;

    const temperature = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;
    const emoji = weatherEmojis[iconCode] || '☀️';
    const precipitation = item.pop ? Math.round(item.pop * 100) : 0;

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="time">${formattedHour}</div>
      <div class="weather-icon">${emoji}</div>
      <div class="temp">${isCelsius ? temperature : convertToF(temperature)}°</div>
      <div class="precipitation">${precipitation}%</div>
    `;
    forecastGrid.appendChild(card);
  });
}

// Utility functions
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('weatherContent').classList.remove('show');
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function hideStartScreen() {
  const startScreen = document.getElementById('startScreen');
  startScreen.style.opacity = '0';
  startScreen.style.transform = 'translateY(-20px)';
  setTimeout(() => {
    startScreen.style.display = 'none';
  }, 500);
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  document.getElementById('weatherContent').classList.remove('show');
  document.getElementById('startScreen').style.display = 'none';
}

function hideError() {
  document.getElementById('error').style.display = 'none';
}

function setBackgroundByWeather(iconCode) {
  const body = document.body;
  body.className = '';

  const isDay = iconCode.includes('d');

  if (iconCode.startsWith('01')) {
    body.classList.add(isDay ? 'sunny' : 'night');
  } else if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) {
    body.classList.add('cloudy');
  } else if (iconCode.startsWith('09') || iconCode.startsWith('10') || iconCode.startsWith('11')) {
    body.classList.add('rainy');
  } else if (iconCode.startsWith('13')) {
    body.classList.add('snowy');
  } else {
    body.classList.add('cloudy');
  }
}

function convertToF(celsius) {
  return Math.round((celsius * 9/5) + 32);
}

function convertToC(fahrenheit) {
  return Math.round((fahrenheit - 32) * 5/9);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toggleTemperatureUnit() {
  isCelsius = !isCelsius;
  document.getElementById('unitToggleBtn').textContent = isCelsius ? 'Show °F' : 'Show °C';

  if (currentWeatherData) displayWeather(currentWeatherData, currentAirQuality);
  if (currentForecastData) displayHourlyForecast(currentForecastData);
}

document.getElementById('unitToggleBtn').addEventListener('click', toggleTemperatureUnit);

// City Guide Functions
function updateGuideMessage(type) {
  const guideMessage = document.getElementById('guideMessage');
  const phrases = cityPhrases[type];
  
  if (phrases && phrases.length > 0) {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Fade out current message
    guideMessage.style.opacity = '0';
    guideMessage.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      guideMessage.textContent = randomPhrase;
      guideMessage.style.opacity = '1';
      guideMessage.style.transform = 'translateY(0)';
    }, 200);
  }
}

function updateGuideMessageByWeather(weatherData) {
  const condition = weatherData.weather[0].main.toLowerCase();
  const temp = weatherData.main.temp;
  const windSpeed = weatherData.wind.speed * 3.6;
  
  let messageType = 'greeting';
  
  // Determine message type based on weather conditions
  if (condition.includes('rain') || condition.includes('drizzle')) {
    messageType = 'rainy';
  } else if (condition.includes('snow')) {
    messageType = 'snowy';
  } else if (condition.includes('clear')) {
    messageType = 'sunny';
  } else if (condition.includes('cloud')) {
    messageType = 'cloudy';
  } else if (temp > 30) {
    messageType = 'hot';
  } else if (temp < 5) {
    messageType = 'cold';
  } else if (windSpeed > 20) {
    messageType = 'windy';
  } else {
    messageType = 'sunny';
  }
  
  updateGuideMessage(messageType);
}

// Add some dynamic behavior - update guide message periodically
setInterval(() => {
  if (currentWeatherData) {
    updateGuideMessageByWeather(currentWeatherData);
  }
}, 15000); // Update every 15 seconds with weather-based messages