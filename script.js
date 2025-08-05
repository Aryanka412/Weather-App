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

// AI Personality Class
class NimbusAI {
  constructor() {
    this.name = "Nimbus";
    this.personality = "friendly";
    this.mood = "cheerful";
    this.lastWeatherData = null;
    this.conversationCount = 0;
    this.isVisible = false;
    
    // Initialize with welcome message
    setTimeout(() => {
      this.speak(this.getWelcomeMessage());
    }, 2000);
  }

  getWelcomeMessage() {
    const welcomes = [
      "Hi there! I'm Nimbus, your weather companion! ☁️ Click on me anytime for weather insights!",
      "Hey! Nimbus here! 👋 I love talking about weather patterns and giving you local tips!",
      "Welcome! I'm your AI weather buddy Nimbus! Let's explore the skies together! ✨"
    ];
    return this.randomChoice(welcomes);
  }

  generateWeatherCommentary(weatherData) {
    const temp = Math.round(weatherData.main.temp);
    const condition = weatherData.weather[0].main.toLowerCase();
    const humidity = weatherData.main.humidity;
    const windSpeed = Math.round(weatherData.wind.speed * 3.6);
    const cityName = weatherData.name;

    let commentary = [];

    // Temperature comments
    if (temp > 30) {
      commentary.push("🔥 Whoa! It's scorching out there! Stay hydrated and find some shade!");
    } else if (temp > 25) {
      commentary.push("☀️ Perfect weather for outdoor activities! Maybe grab some sunglasses?");
    } else if (temp > 15) {
      commentary.push("🌤️ Nice and comfortable! Great day to be outside!");
    } else if (temp > 5) {
      commentary.push("🧥 A bit chilly! You might want to grab a light jacket.");
    } else {
      commentary.push("🥶 Brrr! Bundle up warm out there!");
    }

    // Weather condition comments
    switch(condition) {
      case 'clear':
        commentary.push("Clear skies ahead! Perfect visibility for stargazing tonight! ✨");
        break;
      case 'clouds':
        commentary.push("Those clouds are putting on quite a show! Great for photography! 📸");
        break;
      case 'rain':
        commentary.push("Rain drops keep falling! Don't forget your umbrella! ☔");
        break;
      case 'thunderstorm':
        commentary.push("Nature's light show is happening! Stay safe indoors! ⚡");
        break;
      case 'snow':
        commentary.push("Winter wonderland mode activated! Time for hot cocoa! ❄️");
        break;
      case 'mist':
      case 'fog':
        commentary.push("Mysterious and misty! Drive carefully and embrace the mystique! 🌫️");
        break;
    }

    // Humidity comments
    if (humidity > 80) {
      commentary.push("💧 It's quite humid! You might feel a bit sticky today.");
    } else if (humidity < 30) {
      commentary.push("🏜️ Pretty dry conditions! Stay moisturized!");
    }

    // Wind comments
    if (windSpeed > 25) {
      commentary.push("💨 Windy day ahead! Hold onto your hat!");
    } else if (windSpeed < 5) {
      commentary.push("🍃 Very calm winds today - perfect for outdoor dining!");
    }

    // Location-specific fun facts
    commentary.push(this.getLocationFact(cityName));

    return this.randomChoice(commentary);
  }

  getLocationFact(cityName) {
    const facts = [
      `Fun fact: ${cityName} has its own unique microclimate! 🌍`,
      `${cityName} is looking lovely today! I bet the locals are enjoying this weather! 🏠`,
      `Weather in ${cityName} can be quite unique - each city has its own personality! 🌆`,
      `${cityName}'s weather is part of what makes it special! 💫`
    ];
    return this.randomChoice(facts);
  }

  getRandomTip() {
    const tips = [
      "💡 Pro tip: Check the UV index before heading out for extended sun exposure!",
      "🌡️ Did you know? Humidity affects how hot it feels - that's called the 'heat index'!",
      "⚡ Lightning fact: You're more likely to be struck by lightning than win the lottery!",
      "🌈 Rainbow science: You need sun AND rain at the same time to see one!",
      "❄️ No two snowflakes are exactly alike - each one is a unique crystal!",
      "🌪️ Tornadoes spin counterclockwise in the Northern Hemisphere!",
      "☁️ Clouds are made of tiny water droplets or ice crystals floating in the air!",
      "🌊 The ocean influences weather patterns across the entire planet!"
    ];
    return this.randomChoice(tips);
  }

  getRandomQuip() {
    const quips = [
      "I'm having a partly cloudy day myself! ☁️😄",
      "Weather is just the sky's way of showing off! ✨",
      "I predict... you're going to have a great day! 🔮",
      "Remember: there's no bad weather, only inappropriate clothing! 👕",
      "Every storm runs out of rain eventually! 🌦️➡️☀️",
      "I love my job - every day brings new atmospheric adventures! 🌤️",
      "Weather watching is my favorite hobby! What's yours? 🤔",
      "The atmosphere is literally always changing - just like us! 🌀"
    ];
    return this.randomChoice(quips);
  }

  speak(message) {
    const aiMessage = document.getElementById('aiMessage');
    const aiTyping = document.getElementById('aiTyping');
    const aiAvatar = document.getElementById('aiAvatar');
    const speechBubble = document.getElementById('aiSpeechBubble');

    // Show typing animation
    aiMessage.style.display = 'none';
    aiTyping.style.display = 'flex';
    speechBubble.classList.add('show');
    aiAvatar.classList.add('talking');

    // Simulate typing delay
    setTimeout(() => {
      aiTyping.style.display = 'none';
      aiMessage.style.display = 'block';
      aiMessage.textContent = message;
      aiAvatar.classList.remove('talking');
      
      // Auto-hide after reading time
      setTimeout(() => {
        speechBubble.classList.remove('show');
      }, Math.max(3000, message.length * 50));
    }, 1000 + Math.random() * 1000);

    this.conversationCount++;
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  onWeatherUpdate(weatherData) {
    this.lastWeatherData = weatherData;
    setTimeout(() => {
      this.speak(this.generateWeatherCommentary(weatherData));
    }, 2000);
  }

  handleUserInteraction() {
    if (this.lastWeatherData) {
      const interactions = [
        this.generateWeatherCommentary(this.lastWeatherData),
        this.getRandomTip(),
        this.getRandomQuip()
      ];
      this.speak(this.randomChoice(interactions));
    } else {
      const greetings = [
        "Hi! Search for a city and I'll give you some weather insights! 🔍",
        "Hey there! I'm ready to chat about weather whenever you are! ☁️",
        "Hello! Try searching for your city and I'll share some cool weather facts! 🌟"
      ];
      this.speak(this.randomChoice(greetings));
    }
  }
}

// Initialize AI
const nimbus = new NimbusAI();

// Initialize with current date and show start screen
window.addEventListener('load', () => {
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

function hideSuggestions() {
  const dropdown = document.getElementById('suggestionsDropdown');
  dropdown.classList.remove('show');
  dropdown.innerHTML = '';
}
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

    displayWeather(currentData);
    displayHourlyForecast(forecastData);

    // Notify AI about weather update
    nimbus.onWeatherUpdate(currentData);

    hideLoading();
    document.getElementById('weatherContent').classList.add('show');
  } catch (error) {
    hideLoading();
    showError('City not found. Please try again.');
    console.error('Error fetching weather:', error);
  }
}

function displayWeather(data) {
  currentWeatherData = data; // save for toggle
  const cityName = `${data.name}, ${data.sys.country}`;
  const temperature = Math.round(data.main.temp);
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed * 3.6);
  const visibility = Math.round(data.visibility / 1000);

  document.getElementById('cityName').textContent = cityName;
  document.getElementById('temperature').textContent = `${isCelsius ? temperature : convertToF(temperature)}°`;
  document.getElementById('description').textContent = capitalize(description);
  document.getElementById('weatherIcon').textContent = weatherEmojis[iconCode] || '☀️';
  document.getElementById('humidity').textContent = `${humidity}%`;
  document.getElementById('windSpeed').textContent = `${windSpeed} km/h`;
  document.getElementById('visibility').textContent = `${visibility} km`;

  setBackgroundByWeather(iconCode);
}

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

let isCelsius = true;
let currentWeatherData = null;
let currentForecastData = null;

function convertToF(celsius) {
  return Math.round((celsius * 9/5) + 32);
}

function convertToC(fahrenheit) {
  return Math.round((fahrenheit - 32) * 5/9);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

document.getElementById('unitToggleBtn').addEventListener('click', () => {
  isCelsius = !isCelsius;
  document.getElementById('unitToggleBtn').textContent = isCelsius ? 'Show °F' : 'Show °C';

  if (currentWeatherData) displayWeather(currentWeatherData);
  if (currentForecastData) displayHourlyForecast(currentForecastData);
});

// AI Toggle Function
function toggleAI() {
  nimbus.handleUserInteraction();
}
