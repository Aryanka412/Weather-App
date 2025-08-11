// Use config system for API keys
const apiKey = window.config ? window.config.weather.apiKey : '2aa939fed7a78e3a3239ec5a87e31a05';

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

let suggestionTimeout;
let currentSuggestionIndex = -1;
let isCelsius = true;
let currentWeatherData = null;
let currentForecastData = null;
let isWeeklyView = false;


// City suggestions functionality
async function showSuggestions(query) {
  const dropdown = document.getElementById('suggestionsDropdown');
  if (!query || query.length < 2) {
    hideSuggestions();
    return;
  }

  try {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=6&appid=${apiKey}`);
    if (!response.ok) {
      console.error('OpenWeather Geocoding API Error:', response.statusText);
      hideSuggestions();
      return;
    }

    const cities = await response.json();
    if (!cities.length) {
      hideSuggestions();
      return;
    }

    dropdown.innerHTML = cities.map(city => {
      const fullName = `${city.name}, ${city.country}`;
      return `
        <div class="suggestion-item" onclick="handleSuggestionClick('${fullName}')">
          <span class="suggestion-icon">📍</span>
          <span>${fullName}</span>
        </div>
      `;
    }).join('');

    dropdown.classList.add('show');
    currentSuggestionIndex = -1;
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
    hideSuggestions();
  }
}

function handleSuggestionClick(cityName) {
  document.getElementById('cityInput').value = cityName;
  hideSuggestions();
  getWeather();
}

function hideSuggestions() {
  const dropdown = document.getElementById('suggestionsDropdown');
  dropdown.classList.remove('show');
  dropdown.innerHTML = '';
}

function navigateSuggestions(direction) {
  const dropdown = document.getElementById('suggestionsDropdown');
  const items = dropdown.querySelectorAll('.suggestion-item');
  
  if (items.length === 0) return;
  
  // Remove current highlight
  if (currentSuggestionIndex >= 0 && items[currentSuggestionIndex]) {
    items[currentSuggestionIndex].style.background = 'transparent';
  }
  
  if (direction === 'down') {
    currentSuggestionIndex = currentSuggestionIndex < items.length - 1 ? currentSuggestionIndex + 1 : 0;
  } else if (direction === 'up') {
    currentSuggestionIndex = currentSuggestionIndex > 0 ? currentSuggestionIndex - 1 : items.length - 1;
  }
  
  // Highlight new item
  if (items[currentSuggestionIndex]) {
    items[currentSuggestionIndex].style.background = 'rgba(255, 255, 255, 0.2)';
    items[currentSuggestionIndex].scrollIntoView({ block: 'nearest' });
  }
}

// Initialize with current date and show start screen
window.addEventListener('load', async () => {
  // Wait for config to be loaded
  if (!window.config) {
    console.warn('Config not loaded, waiting...');
    await new Promise(resolve => {
      const checkConfig = () => {
        if (window.config) {
          resolve();
        } else {
          setTimeout(checkConfig, 100);
        }
      };
      checkConfig();
    });
  }
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('currentDate').textContent = currentDate;
  
  // Show start screen initially
  document.getElementById('startScreen').style.display = 'flex';
});

// Event listeners for search input
const cityInput = document.getElementById('cityInput');

cityInput.addEventListener('input', function(e) {
  clearTimeout(suggestionTimeout);
  const query = e.target.value.trim();
  suggestionTimeout = setTimeout(() => {
    showSuggestions(query);
  }, 300);
});

cityInput.addEventListener('keydown', function(e) {
  const dropdown = document.getElementById('suggestionsDropdown');
  const items = dropdown.querySelectorAll('.suggestion-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    navigateSuggestions('down');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    navigateSuggestions('up');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentSuggestionIndex >= 0 && items[currentSuggestionIndex]) {
      const cityName = items[currentSuggestionIndex].textContent.trim();
      handleSuggestionClick(cityName);
    } else {
      getWeather();
    }
  } else if (e.key === 'Escape') {
    hideSuggestions();
  }
});

cityInput.addEventListener('blur', function() {
  setTimeout(() => {
    hideSuggestions();
  }, 200);
});

document.addEventListener('click', function(e) {
  const searchContainer = document.querySelector('.search-container');
  if (!searchContainer.contains(e.target)) {
    hideSuggestions();
  }
});

// UV Index fetching function
async function getUVIndex(lat, lon) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    if (response.ok) {
      const uvData = await response.json();
      return Math.round(uvData.value);
    }
  } catch (error) {
    console.error('Error fetching UV data:', error);
  }
  return null;
}

// UV Level determination
function getUVLevel(uvIndex) {
  if (uvIndex <= 2) return { level: 'Low', color: '#4CAF50' };
  if (uvIndex <= 5) return { level: 'Moderate', color: '#FFC107' };
  if (uvIndex <= 7) return { level: 'High', color: '#FF9800' };
  if (uvIndex <= 10) return { level: 'Very High', color: '#FF5722' };
  return { level: 'Extreme', color: '#9C27B0' };
}

// Time formatting function
function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

// Main weather fetching function
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    showError('Please enter a city name');
    return;
  }

  showLoading();
  hideError();
  hideStartScreen();
  hideSuggestions();

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

    // Fetch UV Index
    const uvIndex = await getUVIndex(currentData.coord.lat, currentData.coord.lon);

    displayWeather(currentData, uvIndex);
    displayForecast(forecastData);

    hideLoading();
    document.getElementById('weatherContent').classList.add('show');
  } catch (error) {
    hideLoading();
    showError('City not found. Please try again.');
    console.error('Error fetching weather:', error);
  }
}

// Display weather data
function displayWeather(data, uvIndex) {
  currentWeatherData = data; // save for toggle
  const cityName = `${data.name}, ${data.sys.country}`;
  const temperature = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed * 3.6);
  const visibility = Math.round(data.visibility / 1000);
  const pressure = Math.round(data.main.pressure);

  // Calculate sunrise and sunset times
  const sunrise = formatTime(data.sys.sunrise, data.timezone);
  const sunset = formatTime(data.sys.sunset, data.timezone);

  document.getElementById('cityName').textContent = cityName;
  document.getElementById('temperature').textContent = `${isCelsius ? temperature : convertToF(temperature)}°`;
  document.getElementById('feelsLike').textContent = `Feels like ${isCelsius ? feelsLike : convertToF(feelsLike)}°`;
  document.getElementById('description').textContent = capitalize(description);
  document.getElementById('weatherIcon').textContent = weatherEmojis[iconCode] || '☀️';
  document.getElementById('humidity').textContent = `${humidity}%`;
  document.getElementById('windSpeed').textContent = `${windSpeed} km/h`;
  document.getElementById('visibility').textContent = `${visibility} km`;
  document.getElementById('pressure').textContent = `${pressure} hPa`;
  
  // Display sunrise and sunset
  document.getElementById('sunrise').textContent = sunrise;
  document.getElementById('sunset').textContent = sunset;

  // Display UV Index
  if (uvIndex !== null) {
    const uvInfo = getUVLevel(uvIndex);
    document.getElementById('uvIndex').textContent = uvIndex;
    document.getElementById('uvLevel').textContent = uvInfo.level;
    document.getElementById('uvLevel').style.color = uvInfo.color;
    
    const uvItem = document.querySelector('.uv-item');
    uvItem.style.borderLeft = `4px solid ${uvInfo.color}`;
  } else {
    document.getElementById('uvIndex').textContent = '--';
    document.getElementById('uvLevel').textContent = 'N/A';
  }

  setBackgroundByWeather(iconCode);
}

// Display forecast based on current view mode
function displayForecast(forecastData) {
  if (isWeeklyView) {
    displayWeeklyForecast(forecastData);
  } else {
    displayHourlyForecast(forecastData);
  }
}

// Display hourly forecast
function displayHourlyForecast(forecastData) {
  currentForecastData = forecastData; // save for toggle
  const forecastGrid = document.getElementById('forecastGrid');
  forecastGrid.innerHTML = '';

  const timezoneOffset = forecastData.city.timezone;
  const nowUTC = Math.floor(Date.now() / 1000);
  const nowInCityTime = nowUTC + timezoneOffset;

  const futureForecasts = forecastData.list.filter(item => item.dt >= nowInCityTime).slice(0, 8);

  futureForecasts.forEach((item) => {
    const forecastTime = new Date((item.dt + timezoneOffset) * 1000);
    const hour = forecastTime.getUTCHours();
    const formattedHour = hour === 0 ? '12 AM' :
                          hour === 12 ? '12 PM' :
                          hour > 12 ? `${hour - 12} PM` : `${hour} AM`;

    const temperature = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;
    const emoji = weatherEmojis[iconCode] || '☀️';

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="time">${formattedHour}</div>
      <div class="weather-icon">${emoji}</div>
      <div class="temp">${isCelsius ? temperature : convertToF(temperature)}°</div>
    `;
    forecastGrid.appendChild(card);
  });
}

// Display weekly forecast
function displayWeeklyForecast(forecastData) {
  currentForecastData = forecastData; // save for toggle
  const forecastGrid = document.getElementById('forecastGrid');
  forecastGrid.innerHTML = '';

  // Group forecast data by day
  const dailyForecasts = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    
    if (!dailyForecasts[dayKey]) {
      dailyForecasts[dayKey] = {
        date: date,
        temps: [],
        conditions: [],
        icons: []
      };
    }
    
    dailyForecasts[dayKey].temps.push(item.main.temp);
    dailyForecasts[dayKey].conditions.push(item.weather[0].main);
    dailyForecasts[dayKey].icons.push(item.weather[0].icon);
  });

  // Convert to array and take first 5 days
  const daysArray = Object.values(dailyForecasts).slice(0, 5);

  daysArray.forEach((day) => {
    const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' });
    const maxTemp = Math.round(Math.max(...day.temps));
    const minTemp = Math.round(Math.min(...day.temps));
    
    // Get most common condition for the day
    const conditionCounts = {};
    day.conditions.forEach(condition => {
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });
    const mostCommonCondition = Object.keys(conditionCounts).reduce((a, b) => 
      conditionCounts[a] > conditionCounts[b] ? a : b
    );
    
    // Get most appropriate icon (prefer day icons)
    const dayIcons = day.icons.filter(icon => icon.includes('d'));
    const iconToUse = dayIcons.length > 0 ? dayIcons[0] : day.icons[0];
    const emoji = weatherEmojis[iconToUse] || '☀️';

    const card = document.createElement('div');
    card.className = 'forecast-card weekly';
    card.innerHTML = `
      <div class="time">${dayName}</div>
      <div class="weather-icon">${emoji}</div>
      <div class="temp-range">
        <span class="temp-high">${isCelsius ? maxTemp : convertToF(maxTemp)}°</span>
        <span class="temp-low">${isCelsius ? minTemp : convertToF(minTemp)}°</span>
      </div>
    `;
    forecastGrid.appendChild(card);
  });
}

// Utility functions
function convertToF(celsius) {
  return Math.round((celsius * 9/5) + 32);
}

function convertToC(fahrenheit) {
  return Math.round((fahrenheit - 32) * 5/9);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('weatherContent').classList.remove('show');
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function hideStartScreen() {
  document.getElementById('startScreen').style.display = 'none';
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

// Unit toggle functionality
document.getElementById('unitToggleBtn').addEventListener('click', () => {
  isCelsius = !isCelsius;
  document.getElementById('unitToggleBtn').textContent = isCelsius ? '°F' : '°C';

  if (currentWeatherData) displayWeather(currentWeatherData);
  if (currentForecastData) displayForecast(currentForecastData);
});

// Forecast toggle functionality
document.getElementById('forecastToggle').addEventListener('click', () => {
  isWeeklyView = !isWeeklyView;
  const toggleBtn = document.getElementById('forecastToggle');
  const titleElement = document.getElementById('forecastTitle');
  
  if (isWeeklyView) {
    toggleBtn.textContent = '24-Hour';
    titleElement.textContent = '5-Day Forecast';
  } else {
    toggleBtn.textContent = '5-Day';
    titleElement.textContent = '24-Hour Forecast';
  }
  
  if (currentForecastData) {
    displayForecast(currentForecastData);
  }
});

// OpenAI API-powered AI Chatbot
let isAIChatOpen = false;
let chatHistory = [];
let userPreferences = {
  units: 'metric',
  language: 'en'
};

// Check if OpenAI API is configured
function isOpenAIConfigured() {
  return window.config && window.config.openai && window.config.openai.apiKey && window.config.openai.apiKey.trim() !== '';
}

// Get OpenAI API response
async function getOpenAIResponse(userMessage) {
  if (!isOpenAIConfigured()) {
    return "I'm sorry, but the OpenAI API is not configured. Please add your OpenAI API key to the config.js file to enable AI-powered responses.";
  }

  try {
    // Prepare the conversation context
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI weather assistant. You have access to current weather data and can provide intelligent insights about weather conditions, clothing recommendations, and weather-related advice. 

Current weather context: ${getWeatherContext()}

Be conversational, helpful, and provide practical advice. Keep responses concise but informative. Use emojis appropriately and format responses with markdown when helpful.`
      },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.config.openai.apiKey}`
      },
      body: JSON.stringify({
        model: window.config.openai.model,
        messages: messages,
        max_tokens: window.config.openai.maxTokens,
        temperature: window.config.openai.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    return `I'm sorry, I encountered an error while processing your request: ${error.message}. Please try again later.`;
  }
}

// Get current weather context for OpenAI
function getWeatherContext() {
  if (!currentWeatherData) {
    return "No weather data available. User needs to search for a city first.";
  }

  const data = currentWeatherData;
  const temp = Math.round(data.main.temp);
  const tempF = Math.round(convertToF(temp));
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed * 3.6);
  const visibility = Math.round(data.visibility / 1000);
  const pressure = data.main.pressure;
  const description = data.weather[0].description;
  const mainCondition = data.weather[0].main;
  const city = data.name;
  const country = data.sys.country;

  return `Location: ${city}, ${country}
Temperature: ${temp}°C (${tempF}°F)
Weather: ${description} (${mainCondition})
Humidity: ${humidity}%
Wind Speed: ${windSpeed} km/h
Visibility: ${visibility} km
Pressure: ${pressure} hPa
Current time: ${new Date().toLocaleTimeString()}`;
}

// Enhanced sendMessage function with OpenAI API
async function sendMessage() {
  const aiInput = document.getElementById('aiInput');
  const userMessage = aiInput.value.trim();
  
  if (!userMessage) return;
  
  console.log('Sending message:', userMessage);
  
  // Add user message to chat
  addMessageToChat('user', userMessage);
  aiInput.value = '';
  
  // Show typing indicator
  const typingIndicator = addTypingIndicator();
  
  try {
    // Get OpenAI API response
    const aiResponse = await getOpenAIResponse(userMessage);
    addMessageToChat('bot', aiResponse);
    
    // Add quick action buttons for follow-up questions
    addQuickActions();
  } catch (error) {
    console.error('Error getting AI response:', error);
    addMessageToChat('bot', "I'm sorry, I encountered an error while processing your request. Please try again.");
  } finally {
    removeTypingIndicator(typingIndicator);
  }
}

// Add quick action buttons for common follow-up questions
function addQuickActions() {
  const chatMessages = document.getElementById('aiChatMessages');
  const lastBotMessage = chatMessages.querySelector('.ai-message.ai-bot:last-child');
  
  if (lastBotMessage && currentWeatherData) {
    const quickActionsDiv = document.createElement('div');
    quickActionsDiv.className = 'quick-actions';
    
    const actions = [
      { text: '👕 What should I wear?', query: 'What should I wear today based on the current weather?' },
      { text: '🌡️ Temperature analysis', query: 'Can you analyze the current temperature and what it means for me?' },
      { text: '💨 Wind conditions', query: 'What should I know about the current wind conditions?' },
      { text: '☔ Weather forecast', query: 'What does the weather forecast look like?' },
      { text: '🌅 Sun times', query: 'When are sunrise and sunset today?' }
    ];
    
    quickActionsDiv.innerHTML = actions.map(action => 
      `<button class="quick-action-btn" onclick="sendQuickAction('${action.query}')">${action.text}</button>`
    ).join('');
    
    lastBotMessage.appendChild(quickActionsDiv);
  }
}

// Handle quick action button clicks
function sendQuickAction(query) {
  document.getElementById('aiInput').value = query;
  sendMessage();
}

// Enhanced message display with better formatting
function addMessageToChat(sender, message) {
  const chatMessages = document.getElementById('aiChatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-${sender}`;
  
  const avatar = sender === 'user' ? '👤' : '🤖';
  const avatarClass = sender === 'user' ? 'ai-user' : 'ai-bot';
  
  // Format message with line breaks and emojis
  const formattedMessage = formatMessage(message);
  
  messageDiv.innerHTML = `
    <div class="ai-avatar ${avatarClass}">${avatar}</div>
    <div class="ai-text">${formattedMessage}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Store in chat history
  chatHistory.push({ sender, message, timestamp: new Date() });
  
  // Limit chat history to prevent memory issues
  if (chatHistory.length > 50) {
    chatHistory = chatHistory.slice(-25);
  }
}

// Format message with better readability
function formatMessage(message) {
  // Convert markdown-style formatting
  let formatted = message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  
  // Add weather emojis for common terms
  const weatherEmojis = {
    'temperature': '🌡️',
    'humidity': '💧',
    'wind': '💨',
    'rain': '🌧️',
    'snow': '❄️',
    'sun': '☀️',
    'cloud': '☁️',
    'storm': '⛈️',
    'uv': '☀️',
    'pressure': '🌡️',
    'visibility': '👁️'
  };
  
  Object.entries(weatherEmojis).forEach(([term, emoji]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    formatted = formatted.replace(regex, `${emoji} ${term}`);
  });
  
  return formatted;
}

// Add weather summary when chat is opened
function addWeatherSummary() {
  if (currentWeatherData && chatHistory.length === 1) {
    const temp = Math.round(currentWeatherData.main.temp);
    const tempF = Math.round(convertToF(temp));
    const description = currentWeatherData.weather[0].description;
    const city = currentWeatherData.name;
    
    const summary = `Here's a quick summary of the current weather in ${city}:\n\n🌡️ Temperature: ${temp}°C (${tempF}°F)\n🌤️ Conditions: ${description}\n💧 Humidity: ${currentWeatherData.main.humidity}%\n💨 Wind: ${Math.round(currentWeatherData.wind.speed * 3.6)} km/h\n\nWhat would you like to know more about?`;
    
    addMessageToChat('bot', summary);
  }
}

// Add weather alerts if conditions are severe
function addWeatherAlerts() {
  if (currentWeatherData && chatHistory.length === 1) {
    const alerts = [];
    const temp = currentWeatherData.main.temp;
    const windSpeed = currentWeatherData.wind.speed * 3.6; // km/h
    const visibility = currentWeatherData.visibility / 1000; // km
    const mainCondition = currentWeatherData.weather[0].main;
    
    if (temp < -10) {
      alerts.push("❄️ **Extreme Cold Alert**: Temperatures are dangerously low. Avoid prolonged outdoor exposure.");
    } else if (temp > 35) {
      alerts.push("🔥 **Heat Alert**: High temperatures detected. Stay hydrated and avoid strenuous activities.");
    }
    
    if (windSpeed > 50) {
      alerts.push("💨 **High Wind Alert**: Strong winds detected. Secure loose objects and avoid outdoor activities.");
    }
    
    if (visibility < 1) {
      alerts.push("🌫️ **Low Visibility Alert**: Poor visibility conditions. Drive with extreme caution.");
    }
    
    if (mainCondition === 'Thunderstorm') {
      alerts.push("⛈️ **Storm Alert**: Thunderstorm conditions. Stay indoors and avoid open areas.");
    }
    
    if (alerts.length > 0) {
      setTimeout(() => {
        const alertMessage = `⚠️ **Weather Alerts for ${currentWeatherData.name}**:\n\n${alerts.join('\n\n')}`;
        addMessageToChat('bot', alertMessage);
      }, 2000);
    }
  }
}

// Clear chat history
function clearChat() {
  const chatMessages = document.getElementById('aiChatMessages');
  chatMessages.innerHTML = '';
  chatHistory = [];
  
  // Add welcome message back
  addMessageToChat('bot', "Hello! I'm your AI-powered weather assistant. I can help you understand weather conditions, provide detailed insights, clothing recommendations, and answer any weather-related questions. What would you like to know about today's weather?");
  
  // Add weather summary if available
  if (currentWeatherData) {
    setTimeout(() => {
      addWeatherSummary();
      addWeatherAlerts();
    }, 500);
  }
}

// Add clear chat button to the chat header
function addClearChatButton() {
  const aiHeader = document.querySelector('.ai-header');
  if (aiHeader && !document.getElementById('clearChatBtn')) {
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearChatBtn';
    clearBtn.className = 'clear-chat-btn';
    clearBtn.innerHTML = '🗑️';
    clearBtn.title = 'Clear Chat';
    clearBtn.onclick = clearChat;
    
    aiHeader.appendChild(clearBtn);
  }
}

// Typing indicator functions
function addTypingIndicator() {
  const chatMessages = document.getElementById('aiChatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-message ai-bot typing-indicator';
  typingDiv.id = 'typing-indicator';
  
  typingDiv.innerHTML = `
    <div class="ai-avatar ai-bot">🤖</div>
    <div class="ai-text typing-text">
      <span class="typing-dot">●</span>
      <span class="typing-dot">●</span>
      <span class="typing-dot">●</span>
    </div>
  `;
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return typingDiv;
}

function removeTypingIndicator(typingIndicator) {
  if (typingIndicator && typingIndicator.parentNode) {
    typingIndicator.parentNode.removeChild(typingIndicator);
  }
}

// Enhanced event listeners for the chatbot
document.addEventListener('DOMContentLoaded', () => {
  console.log('Setting up OpenAI-powered AI chatbot...');
  
  const aiToggleBtn = document.getElementById('aiToggleBtn');
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiInput = document.getElementById('aiInput');
  
  // Check OpenAI configuration and update UI accordingly
  if (!isOpenAIConfigured()) {
    console.warn('OpenAI API not configured. Please add your API key to config.js');
    const aiHeader = document.querySelector('.ai-header');
    if (aiHeader) {
      aiHeader.classList.add('no-api');
      aiHeader.title = 'OpenAI API not configured - Add your API key to config.js';
    }
  }
  
  if (aiToggleBtn) {
    aiToggleBtn.addEventListener('click', () => {
      const chatContainer = document.getElementById('aiChatContainer');
      if (isAIChatOpen) {
        chatContainer.style.display = 'none';
        aiToggleBtn.textContent = '💬';
        isAIChatOpen = false;
      } else {
        chatContainer.style.display = 'block';
        aiToggleBtn.textContent = '✕';
        isAIChatOpen = true;
        aiInput.focus();
        
        // Add clear chat button
        addClearChatButton();
        
        // Add weather summary if this is the first time opening chat
        if (chatHistory.length === 1 && currentWeatherData) {
          setTimeout(() => {
            addWeatherSummary();
            addWeatherAlerts();
          }, 500);
        }
      }
    });
  }
  
  if (aiSendBtn) {
    aiSendBtn.addEventListener('click', sendMessage);
  }
  
  if (aiInput) {
    aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Auto-resize input based on content
    aiInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
});
