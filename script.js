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

// City Guide phrases
const cityPhrases = {
  greeting: [
    "Search for a city to get started! 🌍",
    "Ready to explore the weather? 🔍",
    "Let's discover some weather! ⛅"
  ],
  loading: [
    "Loading weather data... ⏳",
    "Fetching the latest info... 🌐",
    "Getting weather details... 📡"
  ],
  sunny: [
    "Perfect day for outdoor activities! ☀️",
    "Great weather for a walk! 🚶‍♀️",
    "Sunny and beautiful! 🌞",
    "Don't forget your sunglasses! 😎",
    "Ideal weather for a picnic! 🧺"
  ],
  cloudy: [
    "Nice and mild today! ☁️",
    "Comfortable weather ahead! 🌤️",
    "Perfect for a cozy day! ☁️",
    "Great weather for any activity! 🌥️"
  ],
  rainy: [
    "Don't forget your umbrella! ☔",
    "Perfect day to stay cozy inside! 🏠",
    "Great weather for hot coffee! ☕",
    "Time for some indoor fun! 🎮",
    "Puddle jumping weather! 🌧️"
  ],
  snowy: [
    "Winter wonderland vibes! ❄️",
    "Perfect for hot chocolate! ☕",
    "Bundle up and stay warm! 🧥",
    "Beautiful snowy day! ⛄",
    "Time for winter activities! ⛷️"
  ],
  hot: [
    "Stay hydrated and cool! 💧",
    "Perfect beach weather! 🏖️",
    "Time for ice cream! 🍦",
    "Great day for swimming! 🏊‍♀️"
  ],
  cold: [
    "Bundle up and stay warm! 🧥",
    "Perfect weather for warm drinks! ☕",
    "Layer up today! 🧣",
    "Cozy sweater weather! 👕"
  ],
  windy: [
    "Hold onto your hat! 💨",
    "Breezy day ahead! 🍃",
    "Perfect for flying kites! 🪁",
    "Fresh air and wind! 🌬️"
  ],
  error: [
    "Hmm, couldn't find that city 🤔",
    "Try searching for another city! 🔍",
    "City not found, try again! 📍"
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
});

// Search functionality
document.getElementById('cityInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    getWeather();
  }
});

// Weather fetching function with fade transitions
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
      setBackgroundByWeather(currentData.weather[0].icon);
      
      hideLoading();
      fadeInContent();
      
      // Update guide message based on weather
      updateGuideMessageByWeather(currentData);
    }, 300);

  } catch (error) {
    hideLoading();
    showError('City not found. Please try again.');
    updateGuideMessage('error');
    fadeInContent();
    console.error('Error fetching weather:', error);
  }
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
}, 10000); // Update every 10 seconds with weather-based messages