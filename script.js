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

// Google Gemini API-powered AI Chatbot
let isAIChatOpen = false;
let chatHistory = [];
let userPreferences = {
  units: 'metric',
  language: 'en'
};

// Rate limiting and retry logic
let requestCount = 0;
let lastRequestTime = 0;
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 15; // Gemini allows more requests per minute
let isRateLimited = false;
let rateLimitResetTime = 0;

// Check if Gemini API is configured
function isGeminiConfigured() {
  return window.config && window.config.gemini && window.config.gemini.apiKey && window.config.gemini.apiKey.trim() !== '';
}

// Check rate limiting
function checkRateLimit() {
  const now = Date.now();
  
  // Reset counter if window has passed
  if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    lastRequestTime = now;
    isRateLimited = false;
  }
  
  // Check if we're currently rate limited
  if (isRateLimited) {
    if (now < rateLimitResetTime) {
      const remainingTime = Math.ceil((rateLimitResetTime - now) / 1000);
      return {
        limited: true,
        message: `Rate limit active. Please wait ${remainingTime} seconds before trying again.`,
        remainingTime: remainingTime
      };
    } else {
      isRateLimited = false;
      requestCount = 0;
    }
  }
  
  // Check if we're approaching the limit
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    isRateLimited = true;
    rateLimitResetTime = now + RATE_LIMIT_WINDOW;
    return {
      limited: true,
      message: `Rate limit reached. Please wait ${Math.ceil(RATE_LIMIT_WINDOW / 1000)} seconds before trying again.`,
      remainingTime: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    };
  }
  
  return { limited: false };
}

// Update UI to show rate limit status and city status
function updateRateLimitUI() {
  const aiHeader = document.querySelector('.ai-header');
  const aiInput = document.getElementById('aiInput');
  const aiSendBtn = document.getElementById('aiSendBtn');
  
  if (!aiHeader || !aiInput || !aiSendBtn) return;
  
  if (isRateLimited) {
    const remainingTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
    if (remainingTime > 0) {
      // Add rate limit indicator to header
      let rateLimitIndicator = document.getElementById('rateLimitIndicator');
      if (!rateLimitIndicator) {
        rateLimitIndicator = document.createElement('div');
        rateLimitIndicator.id = 'rateLimitIndicator';
        rateLimitIndicator.className = 'rate-limit-indicator';
        aiHeader.appendChild(rateLimitIndicator);
      }
      
      rateLimitIndicator.innerHTML = `⏳ Rate limited: ${remainingTime}s`;
      rateLimitIndicator.style.display = 'block';
      
      // Disable input and button
      aiInput.disabled = true;
      aiInput.placeholder = `Rate limited. Wait ${remainingTime}s...`;
      aiSendBtn.disabled = true;
      aiSendBtn.style.opacity = '0.5';
    } else {
      // Rate limit expired
      isRateLimited = false;
      requestCount = 0;
      
      // Remove rate limit indicator
      const rateLimitIndicator = document.getElementById('rateLimitIndicator');
      if (rateLimitIndicator) {
        rateLimitIndicator.style.display = 'none';
      }
      
      // Re-enable input and button
      aiInput.disabled = false;
      aiInput.placeholder = 'Ask me about the weather...';
      aiSendBtn.disabled = false;
      aiSendBtn.style.opacity = '1';
    }
  }
  
  // Show current request count and city status in the info section
  const aiInfo = document.querySelector('.ai-info');
  if (aiInfo) {
    const remainingRequests = Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount);
    const cityStatus = currentWeatherData ? `✅ City: ${currentWeatherData.name}` : '🌍 No city selected';
    const infoText = aiInfo.querySelector('p');
    if (infoText) {
      infoText.innerHTML = `💡 <strong>Status:</strong> ${cityStatus} | ${remainingRequests} requests remaining this minute. ${isRateLimited ? `Rate limited for ${Math.ceil((rateLimitResetTime - Date.now()) / 1000)}s.` : 'All good!'}`;
    }
  }
}

// Get Gemini API response
async function getGeminiResponse(userMessage) {
  if (!isGeminiConfigured()) {
    return "I'm sorry, but the Gemini API is not configured. Please add your Gemini API key to the config.js file to enable AI-powered responses.";
  }

  // Check rate limiting first
  const rateLimitCheck = checkRateLimit();
  if (rateLimitCheck.limited) {
    // Use fallback response instead of just showing rate limit message
    return `⏳ ${rateLimitCheck.message}\n\n💡 In the meantime, here's what I can tell you:\n\n${getFallbackResponse(userMessage)}`;
  }

  try {
    // Increment request counter
    requestCount++;
    
    // Prepare the conversation context
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI weather assistant with access to REAL-TIME weather data from OpenWeatherMap API. You can provide intelligent insights about weather conditions, clothing recommendations, and weather-related advice.

Current weather context: ${getWeatherContext()}

IMPORTANT INSTRUCTIONS: 
1. You have ACCESS TO REAL-TIME WEATHER DATA including sunrise/sunset times, temperature, humidity, wind, pressure, UV index, and more. Use this data to provide accurate, current information.
2. If the user asks about a specific city or location and no weather data is available, guide them to search for that city first using the search bar above. Say something like: "I'd love to tell you about the weather in [city]! Please use the search bar above to search for that city first, then I can provide detailed insights."
3. If weather data IS available, provide detailed, helpful responses using the REAL-TIME data you have access to. You can answer questions about sunrise/sunset times, current conditions, and provide analysis.
4. NEVER say you don't have access to real-time information - you DO have access to current weather data through the OpenWeatherMap API.
5. Be conversational, helpful, and provide practical advice. Keep responses concise but informative. Use emojis appropriately and format responses with markdown when helpful.`
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${window.config.gemini.model}:generateContent?key=${window.config.gemini.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
          }]
        }],
        generationConfig: {
          maxOutputTokens: window.config.gemini.maxTokens,
          temperature: window.config.gemini.temperature
        }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited by Gemini - set our local rate limit
        isRateLimited = true;
        rateLimitResetTime = Date.now() + 60000; // 1 minute
        return "I'm experiencing high demand right now. Please wait a minute before asking another question. This helps ensure everyone gets a fair chance to use the service.";
      } else if (response.status === 400) {
        return "Bad request: Please check your message format or try rephrasing your question.";
      } else if (response.status === 403) {
        return "Access denied: Please check your Gemini API key in the config.js file.";
      } else if (response.status >= 500) {
        return "Gemini servers are experiencing issues. Please try again in a few minutes.";
      } else {
        throw new Error(`Gemini API error: ${response.status}`);
      }
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Provide fallback responses for common errors
    if (error.message.includes('429')) {
      return "I'm experiencing high demand right now. Please wait a minute before asking another question.";
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      return "I'm having trouble connecting to the AI service. Please check your internet connection and try again.";
    } else {
      return `I'm sorry, I encountered an error while processing your request: ${error.message}. Please try again later.`;
    }
  }
}

// Get current weather context for Gemini API
function getWeatherContext() {
  if (!currentWeatherData) {
    return "No weather data available. User needs to search for a city first.";
  }
  
  // Check if weather data is fresh (less than 10 minutes old)
  const dataAge = Date.now() - (currentWeatherData.dt * 1000);
  const isFresh = dataAge < 600000; // 10 minutes in milliseconds
  const dataFreshness = isFresh ? "FRESH" : "RECENT";

  const data = currentWeatherData;
  const temp = Math.round(data.main.temp);
  const tempF = Math.round(convertToF(temp));
  const feelsLike = Math.round(data.main.feels_like);
  const feelsLikeF = Math.round(convertToF(feelsLike));
  const tempMin = Math.round(data.main.temp_min);
  const tempMax = Math.round(data.main.temp_max);
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed * 3.6);
  const windSpeedMph = Math.round(data.wind.speed * 2.237);
  const visibility = Math.round(data.visibility / 1000);
  const pressure = data.main.pressure;
  const description = data.weather[0].description;
  const mainCondition = data.weather[0].main;
  const city = data.name;
  const country = data.sys.country;
  
  // Get sunrise and sunset times
  const sunrise = formatTime(data.sys.sunrise, data.timezone);
  const sunset = formatTime(data.sys.sunset, data.timezone);
  
  // Get UV index if available
  let uvInfo = '';
  const uvElement = document.getElementById('uvIndex');
  if (uvElement && uvElement.textContent !== '--') {
    const uvIndex = uvElement.textContent;
    const uvLevel = document.getElementById('uvLevel').textContent;
    uvInfo = `\nUV Index: ${uvIndex} (${uvLevel})`;
  }

  return `**${dataFreshness} WEATHER DATA FOR ${city.toUpperCase()}, ${country.toUpperCase()}**

📍 **Location**: ${city}, ${country}
🌡️ **Temperature**: ${temp}°C (${tempF}°F)
🌡️ **Feels Like**: ${feelsLike}°C (${feelsLikeF}°F)
🌡️ **Range**: ${tempMin}°C to ${tempMax}°C
🌤️ **Weather**: ${description} (${mainCondition})
💧 **Humidity**: ${humidity}%
💨 **Wind Speed**: ${windSpeed} km/h (${windSpeedMph} mph)
👁️ **Visibility**: ${visibility} km
🌪️ **Pressure**: ${pressure} hPa
🌅 **Sunrise**: ${sunrise}
🌇 **Sunset**: ${sunset}${uvInfo}
⏰ **Current Time**: ${new Date().toLocaleTimeString()}
⏱️ **Data Age**: ${Math.round(dataAge / 60000)} minutes ago

**IMPORTANT**: This is REAL-TIME weather data from OpenWeatherMap API. You have access to all this information and can provide detailed insights, recommendations, and analysis based on this current data. The data is ${isFresh ? 'fresh and current' : 'recent and reliable'}.`;
}

// Fallback responses when API is rate limited
function getFallbackResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  if (!currentWeatherData) {
    // Check if the user is asking about a specific city
    const cityKeywords = ['weather in', 'temperature in', 'how is', 'what is', 'tell me about', 'forecast for', 'conditions in'];
    const isAskingAboutCity = cityKeywords.some(keyword => message.includes(keyword));
    
    if (isAskingAboutCity) {
      return "🌍 I'd love to tell you about the weather in that city! Please use the search bar above to search for the city first. Once you do that, I can provide detailed insights about the current conditions, temperature, humidity, wind, and more!";
    }
    
    return "I'd be happy to help with weather questions! 🌍 First, please search for a city using the search bar above to get current weather data. Once you do that, I can provide personalized insights about that location's weather conditions, clothing recommendations, and more!";
  }
  
  const data = currentWeatherData;
  const temp = Math.round(data.main.temp);
  const tempF = Math.round(convertToF(temp));
  const description = data.weather[0].description;
  
  if (message.includes('wear') || message.includes('clothing') || message.includes('dress')) {
    if (temp < 10) return "🥶 It's quite cold at ${temp}°C (${tempF}°F). I recommend wearing a warm coat, gloves, and a hat.";
    else if (temp < 20) return "🧥 It's cool at ${temp}°C (${tempF}°F). A light jacket or sweater would be comfortable.";
    else if (temp < 25) return "👕 It's pleasant at ${temp}°C (${tempF}°F). Light clothing should be fine.";
    else return "☀️ It's warm at ${temp}°C (${tempF}°F). Shorts and t-shirts would be comfortable.";
  }
  
  if (message.includes('temperature') || message.includes('hot') || message.includes('cold')) {
    return `🌡️ Current temperature is ${temp}°C (${tempF}°F). ${temp < 15 ? 'It\'s on the cooler side.' : temp > 25 ? 'It\'s quite warm!' : 'It\'s a comfortable temperature.'}`;
  }
  
  if (message.includes('wind') || message.includes('breezy')) {
    const windSpeed = Math.round(data.wind.speed * 3.6);
    return `💨 Wind speed is ${windSpeed} km/h. ${windSpeed < 10 ? 'It\'s calm.' : windSpeed < 20 ? 'There\'s a light breeze.' : 'It\'s quite windy!'}`;
  }
  
  if (message.includes('rain') || message.includes('precipitation')) {
    if (description.includes('rain')) return "☔ Yes, there's rain in the forecast. Don't forget your umbrella!";
    else return "🌤️ No rain expected right now. The weather looks clear!";
  }
  
  if (message.includes('sun') || message.includes('uv')) {
    const uvElement = document.getElementById('uvIndex');
    if (uvElement && uvElement.textContent !== '--') {
      const uvIndex = uvElement.textContent;
      const uvLevel = document.getElementById('uvLevel').textContent;
      return `☀️ UV Index is ${uvIndex} (${uvLevel}). ${uvIndex > 5 ? 'High UV - wear sunscreen and protective clothing!' : 'Moderate UV - sunscreen recommended.'}`;
    }
    return "☀️ Check the UV index above for sun protection advice. Remember to wear sunscreen when spending time outdoors!";
  }
  
  if (message.includes('sunrise') || message.includes('sunset') || message.includes('sun times')) {
    const sunrise = formatTime(data.sys.sunrise, data.timezone);
    const sunset = formatTime(data.sys.sunset, data.timezone);
    return `🌅 **Sun Times for ${data.name}**:\n🌅 Sunrise: ${sunrise}\n🌇 Sunset: ${sunset}`;
  }
  
  if (message.includes('pressure') || message.includes('atmospheric')) {
    return `🌪️ Current atmospheric pressure is ${data.main.pressure} hPa. ${data.main.pressure < 1000 ? 'Low pressure - might indicate unsettled weather.' : data.main.pressure > 1020 ? 'High pressure - usually means stable, clear weather.' : 'Normal pressure range.'}`;
  }
  
  if (message.includes('visibility') || message.includes('how far')) {
    const visibility = Math.round(data.visibility / 1000);
    return `👁️ Visibility is ${visibility} km. ${visibility < 5 ? 'Reduced visibility - drive carefully!' : visibility < 10 ? 'Moderate visibility.' : 'Good visibility conditions.'}`;
  }
  
  return `I can see it's currently ${description} with a temperature of ${temp}°C (${tempF}°F). What specific weather information would you like to know?`;
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
    // Get Gemini API response
    const aiResponse = await getGeminiResponse(userMessage);
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
  
  // Reset rate limiting when clearing chat
  requestCount = 0;
  isRateLimited = false;
  rateLimitResetTime = 0;
  
  // Add welcome message back
  addMessageToChat('bot', "Hello! I'm your AI-powered weather assistant. I can help you understand weather conditions, provide detailed insights, clothing recommendations, and answer any weather-related questions. What would you like to know about today's weather?");
  
  // Add rate limit info message
  addMessageToChat('bot', "💡 <strong>Note:</strong> I'm limited to 15 requests per minute to ensure fair usage. If you hit the limit, I'll provide helpful fallback responses while you wait!");
  
  // Add getting started message
  addMessageToChat('bot', "🌍 <strong>Getting Started:</strong> To get personalized weather insights, first search for a city using the search bar above. Once you do that, I can answer questions about that location's weather!");
  
  // Add data availability message
  addMessageToChat('bot', "📊 <strong>Available Data:</strong> I have access to real-time weather data including temperature, humidity, wind, pressure, visibility, UV index, sunrise/sunset times, and more from OpenWeatherMap API!");
  
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
  console.log('Setting up Gemini-powered AI chatbot...');
  
  // Start rate limit UI update timer
  setInterval(updateRateLimitUI, 1000);
  
  const aiToggleBtn = document.getElementById('aiToggleBtn');
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiInput = document.getElementById('aiInput');
  
  // Check Gemini configuration and update UI accordingly
  if (!isGeminiConfigured()) {
    console.warn('Gemini API not configured. Please add your API key to config.js');
    const aiHeader = document.querySelector('.ai-header');
    if (aiHeader) {
      aiHeader.classList.add('no-api');
      aiHeader.title = 'Gemini API not configured - Add your API key to config.js';
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

// --- LEAFLET WEATHER MAP ---
// Ensure DOM is loaded
window.addEventListener('DOMContentLoaded', function() {
  // Map container
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;

  // Set map height for mobile
  mapDiv.style.height = window.innerWidth < 600 ? '300px' : '400px';

  // Default map center (London)
  const defaultLatLng = [51.505, -0.09];
  const map = L.map('map').setView(defaultLatLng, 4);

  // Base map layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // --- Weather Overlay Layers ---
  const owmApiKey = apiKey;
  // OpenWeatherMap tile layers
  const tempLayer = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmApiKey}`, {opacity: 0.6, attribution: 'Temp © OWM'});
  const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${owmApiKey}`, {opacity: 0.5, attribution: 'Clouds © OWM'});
  const precipLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${owmApiKey}`, {opacity: 0.5, attribution: 'Precip © OWM'});
  const windLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${owmApiKey}`, {opacity: 0.5, attribution: 'Wind © OWM'});
  const aqiLayer = L.tileLayer(`https://tile.openweathermap.org/map/air_pollution/{z}/{x}/{y}.png?appid=${owmApiKey}`, {opacity: 0.5, attribution: 'AQI © OWM'});

  // Layer control
  const baseLayers = { 'OpenStreetMap': map._layers[Object.keys(map._layers)[0]] };
  const overlays = {
    'Temperature': tempLayer,
    'Clouds': cloudsLayer,
    'Precipitation': precipLayer,
    'Wind': windLayer,
    'Air Quality (AQI)': aqiLayer
  };
  L.control.layers(baseLayers, overlays, {collapsed: false, position: 'topright'}).addTo(map);

  // Add default overlay
  tempLayer.addTo(map);

  // --- Timeline Slider (Forecast Animation) ---
  // OWM tiles support time steps via {time} param, but public API is limited. For demo, we can animate overlays by toggling layers.
  // For a real timeline, use a paid OWM plan or Windy API.
  // Here, we add a simple slider to fade between overlays.
  const timelineDiv = L.control({position: 'bottomleft'});
  timelineDiv.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    div.style.background = 'rgba(255,255,255,0.8)';
    div.style.padding = '8px 12px';
    div.innerHTML = '<label style="font-size:0.95em;">Overlay:</label> <select id="layerSelect"><option value="Temperature">Temperature</option><option value="Clouds">Clouds</option><option value="Precipitation">Precipitation</option><option value="Wind">Wind</option><option value="Air Quality (AQI)">Air Quality (AQI)</option></select>';
    return div;
  };
  timelineDiv.addTo(map);
  document.getElementById('layerSelect').addEventListener('change', function(e) {
    // Remove all overlays
    Object.values(overlays).forEach(layer => map.removeLayer(layer));
    // Add selected
    overlays[e.target.value].addTo(map);
  });

  // --- Search Bar Integration (Leaflet Control Geocoder) ---
  if (typeof L.Control.Geocoder !== 'undefined') {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: 'Search city or place...'
    })
    .on('markgeocode', function(e) {
      const bbox = e.geocode.bbox;
      const center = e.geocode.center;
      map.fitBounds(bbox);
      map.setView(center, 10);
      // Optionally trigger weather fetch for this location
      showForecastPopup(center.lat, center.lng);
    })
    .addTo(map);
  }

  // --- Click-to-Forecast Popup ---
  function showForecastPopup(lat, lon) {
    // Fetch weather for clicked point
    fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${owmApiKey}&units=metric`)
      .then(res => res.json())
      .then(data => {
        const temp = Math.round(data.current.temp);
        const desc = data.current.weather[0].description;
        const icon = data.current.weather[0].icon;
        const emoji = weatherEmojis[icon] || '☀️';
        const aqi = data.current.aqi ? `<br>AQI: ${data.current.aqi}` : '';
        L.popup()
          .setLatLng([lat, lon])
          .setContent(`<b>${emoji} ${temp}°C</b><br>${desc}${aqi}`)
          .openOn(map);
      });
  }
  map.on('click', function(e) {
    showForecastPopup(e.latlng.lat, e.latlng.lng);
  });

  // --- Responsive map resize ---
  window.addEventListener('resize', function() {
    mapDiv.style.height = window.innerWidth < 600 ? '300px' : '400px';
    map.invalidateSize();
  });
});
// --- END LEAFLET WEATHER MAP ---
