// Forecast.io URL structure:
//https://api.forecast.io/forecast/APIKEY/LATITUDE,LONGITUDE


var BASE_URL = 'https://api.forecast.io/forecast/'
var KEY = '8b05afbea4b599253441eb2e2f59ea21' 

var weatherContainer = document.querySelector('#weather-view')
var buttonsContainer = document.querySelector('#nav-buttons')
var searchInput = document.querySelector("#search")
var cityName = ""

var objmap = {
   "clear-day": Skycons.CLEAR_DAY,
   "partly-cloudy-day": Skycons.PARTLY_CLOUDY_DAY,
   "partly-cloudy-night": Skycons.PARTLY_CLOUDY_NIGHT,
   "sun": Skycons.CLEAR_DAY,
   "clear-night": Skycons.CLEAR_NIGHT,
   "snow": Skycons.SNOW,
   "sleet": Skycons.SLEET,
   "wind": Skycons.WIND,
   "rain": Skycons.RAIN,
   "cloudy": Skycons.CLOUDY,
   "fog": Skycons.FOG
}

// Create function that splits hash string and returns parts as object
var getHashData = function() {
	var cleanHash = location.hash.substr(1)

	var hashParts = cleanHash.split('/')

	var newObj = {
		lat: hashParts[0],
		lng: hashParts[1],
		currentView: hashParts[2]
	}

	return newObj
}

// Getting current view depending on which button is clicked
var changeView =  function(eventObj) {
	
	// getting values from clicked button
	var newView = eventObj.target.value

	// call hash object and get lat and lng data to update full hash
	var hashObj = getHashData()
	location.hash = hashObj.lat + '/' + hashObj.lng + '/' + newView

}

buttonsContainer.addEventListener('click',changeView)



// Adding search functionality via Google geocoding
var getCityValue = function (eventObj) {

	if (eventObj.keyCode === 13) {
		var inputValue = eventObj.target.value
		var cityPromise = $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address=' + inputValue)
		cityPromise.then(getCityCoords)
	}
}

searchInput.addEventListener('keydown', getCityValue)

// Getting data from promise
var getCityCoords = function(geocodeResponse) {
	console.log('the new city object is: ')
	console.log(geocodeResponse)
	var newLat = geocodeResponse.results[0].geometry.location.lat
	var newLng = geocodeResponse.results[0].geometry.location.lng

	location.hash = newLat + '/' + newLng + '/current'
}

// Render current time view
var renderCurrentView =  function (currentResponse) {
	console.log(currentResponse)
	var currentTemp = Math.floor(currentResponse.currently.temperature)
	var currentIcon = currentResponse.currently.icon

	var currentHTML = ""
	
	currentHTML += '<div class="current-wrapper">'
	currentHTML += 		'<p id="current-city"><i class="fa fa-map-marker" aria-hidden="true"></i> Today in your city</p>'
	currentHTML += 		'<span id="big-temp">' + currentTemp + '</span><span class="fahrenheit">&#8457;</span>'
	currentHTML += 		'<canvas id="big-skycon" width="120" height="120"></canvas>'
	currentHTML += 		'<p class="weather-summary">' + currentResponse.currently.summary + '</p>'
	currentHTML += '<div>'
	
	weatherContainer.innerHTML = currentHTML

	var skycon = new Skycons({"color": "#efa138"})
   	skycon.add("big-skycon", objmap[currentIcon])
   	skycon.play()

}


// Render hourly view
var renderHourlyView =  function (hourlyResponse) {
	
	console.log
	console.log(hourlyResponse)

	var hourlyHTML = ""

	// Getting GMT/UTC time offset data
	var timeOffset = hourlyResponse.offset
	console.log('offset is: ' + timeOffset)

	// Get local city time by grabbing UTC hours and adding offset hours from API data
	var time = new Date()
	var localHours = (time.getUTCHours() + timeOffset) % 24
	console.log('local time at this city is: ' + localHours)

	hourlyHTML += '<table id="hourly-table" class="weather-data">'

	for (var i = 0; i <= 12; i++) {

		hourlyHTML += '<tr>'
		hourlyHTML += 	'<td class="hours">' + ((localHours + i) % 24) + ':00</td>'
		hourlyHTML += 	'<td class="summary">' + hourlyResponse.hourly.data[i].summary + '</td>'
		hourlyHTML += 	'<td class="temp">' + '<span class="avg-temp">' + Math.floor(hourlyResponse.hourly.data[i].temperature) + '</span> &#8457</td>'
		hourlyHTML += '</tr>'
	}

	hourlyHTML += '</table>'


	weatherContainer.innerHTML = hourlyHTML
}

var indexToWeekday = function (indexNumber) {		
	var weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
	// get offset from date object

	var time = new Date()
	var dayOffset = time.getDay()

	var newIndex = (indexNumber + dayOffset) % 7

	return weekdays[newIndex]

	// return weekdays at the new index
}

// Render daily view
var renderDailyView =  function (dailyResponse) {
	var dailyHTML = ""
	console.log(dailyResponse)

	dailyHTML = '<div id="week-block">'

	for (var i = 0; i <= 6; i++) {
		dailyHTML += '<div class="weekday">'
		dailyHTML += 	'<p class="day">' + indexToWeekday(i) + '</p>'

		dailyHTML += 	'<canvas id="icon' + i + '" class="skycon" width="40" height="40"></canvas>'
		dailyHTML += '</div>'
	}

	dailyHTML += '</div>'

	dailyHTML += '<table id="daily-table" class="weather-data">'

	for (var i = 0; i <= 6; i++) {

		dailyHTML += '<tr>'
		dailyHTML += 	'<td class="day">' + indexToWeekday(i) + '</td>'
		dailyHTML += 	'<td class="summary">' + dailyResponse.daily.data[i].summary + '</td>'
		dailyHTML += 	'<td class="temp">' + '<span class="min">' + Math.floor(dailyResponse.daily.data[i].temperatureMin) + '</span>' + ' / ' + '<span class="max">' + Math.floor(dailyResponse.daily.data[i].temperatureMax) + '</span> &#8457' + '</td>'
		dailyHTML += '</tr>' 
	}

	dailyHTML += '</table>'

	weatherContainer.innerHTML = dailyHTML

	// Adding skycons to each new canvas element in loop above
	for (var i = 0; i <= 6; i++) {
		var skycon = new Skycons({"color": "#efa138"})
		skycon.add("icon" + i, objmap[dailyResponse.daily.data[i].icon])
		skycon.play()
	}
	
}

//Setting initial hash to user's latitude, longitude, and serve current (home) view
var setStartHash = function (inputObj) {
	var userLat = inputObj.coords.latitude 
	var userLng = inputObj.coords.longitude 

	location.hash = userLat + '/' + userLng + '/current'
}

// Error handler
var errorHandler = function(error) {
	console.log('error getting geo position')
}

// Fetch weather data promise
var fetchData = function(latitude, longitude) {
	// Get Forecast.io promise
	var weatherPromise = $.getJSON(BASE_URL + KEY + '/' + latitude + ',' + longitude)
	return weatherPromise
}

// Backbone router
var AppRouter = Backbone.Router.extend ({
	routes: {
		':lat/:long/current':'currentView',
		':lat/:long/hourly':'hourlyView',
		':lat/:long/daily':'dailyView',
		'*default':'redirectHome'
	},

	currentView: function(lat, long) {
		fetchData(lat,long).then(renderCurrentView)
	},
	hourlyView: function(lat,long) {
		fetchData(lat,long).then(renderHourlyView)
	},
	dailyView: function(lat, long) {
		fetchData(lat,long).then(renderDailyView)
	},
	redirectHome: function() {
		navigator.geolocation.getCurrentPosition(setStartHash, errorHandler)
	}

})
	
// create a new instance of the router
var rtr = new AppRouter()

// tells Backbone to start watching the hash and tracking browser history
Backbone.history.start()


