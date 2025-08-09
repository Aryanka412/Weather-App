// Replace YOUR_CHATBOT_ID with your actual Chatbase chatbot ID
const CHATBASE_CHATBOT_ID = 'YOUR_CHATBOT_ID'; // You need to replace this with your actual Chatbase chatbot ID

const apiKey = '2aa939fed7a78e3a3239ec5a87e31a05';

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

// Chatbase Integration
function initializeChatbase() {
  // Create and inject Chatbase script
  const script = document.createElement('script');
  script.src = 'https://www.chatbase.co/embed.min.js';
  script.defer = true;
  script.setAttribute('chatbotId', CHATBASE_CHATBOT_ID);
  script.setAttribute('domain', window.location.hostname);
  
  // Add custom styling and configuration
  script.onload = function() {
    // Configure the chatbot after it loads
    if (window.embeddedChatbotConfig) {
      window.embeddedChatbotConfig.chatbotId = CHATBASE_CHATBOT_ID;
      window.embeddedChatbotConfig.domain = window.location.hostname;
    }
    
    // Send initial weather context if available
    setTimeout(sendWeatherContextToChatbot, 2000);
  };
  
  document.head.appendChild(script);
  
  // Add Chatbase configuration
  window.embeddedChatbotConfig = {
    chatbotId: CHATBASE_CHATBOT_ID,
    domain: window.location.hostname,
    // You can customize the appearance here
    theme: {
      primaryColor: '#667eea',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
    }
  };
}

// Send weather context to Chatbase
function sendWeatherContextToChatbot() {
  if (currentWeatherData && window.ChatbaseWidget) {
    const weatherContext = `Current weather data: ${currentWeatherData.name}, ${currentWeatherData.sys.country} - ${Math.round(currentWeatherData.main.temp)}°C, ${currentWeatherData.weather[0].description}, ${currentWeatherData.main.humidity}% humidity, ${Math.round(currentWeatherData.wind.speed * 3.6)} km/h wind`;
    
    // Send context message to chatbot (this depends on Chatbase's API)
    try {
      // Note: This is a placeholder - you'll need to check Chatbase's documentation for the exact method
      if (window.ChatbaseWidget && window.ChatbaseWidget.sendSystemMessage) {
        window.ChatbaseWidget.sendSystemMessage(weatherContext);
      }
    } catch (error) {
      console.log('Could not send weather context to chatbot:', error);
    }
  }
}

// Show weather info bar when chatbot is opened
function showWeatherInfo() {
  if (currentWeatherData) {
    const infoBar = document.getElementById('weatherInfoBar');
    const cityName = `${currentWeatherData.name}, ${currentWeatherData.sys.country}`;
    const temp = `${isCelsius ? Math.round(currentWeatherData.main.temp) : convertToF(currentWeatherData.main.temp)}°${isCelsius ? 'C' : 'F'}`;
    const condition = currentWeatherData.weather[0].description;
    const humidity = `${currentWeatherData.main.humidity}%`;
    
    document.getElementById('infoCity').textContent = cityName;
    document.getElementById('infoTemp').textContent = temp;
    document.getElementById('infoCondition').textContent = condition;
    document.getElementById('infoHumidity').textContent = humidity;
    
    infoBar.classList.add('show');
  }
}

function hideWeatherInfo() {
  document.getElementById('weatherInfoBar').classList.remove('show');
}

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
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('currentDate').textContent = currentDate;
  
  // Show start screen initially
  document.getElementById('startScreen').style.display = 'flex';
  
  // Initialize Chatbase
  initializeChatbase();
  
  // Show weather info bar when user opens chatbot
  setTimeout(() => {
    // Listen for chatbot open events (this might vary based on Chatbase implementation)
    document.addEventListener('chatbot-opened', showWeatherInfo);
    document.addEventListener('chatbot-closed', hideWeatherInfo);
  }, 3000);
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

    // Send weather context to Chatbase
    sendWeatherContextToChatbot();

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
