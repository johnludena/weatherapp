// Forecast.io URL structure:
//https://api.forecast.io/forecast/APIKEY/LATITUDE,LONGITUDE


var BASE_URL = 'https://api.forecast.io/forecast/'
var KEY = '8b05afbea4b599253441eb2e2f59ea21' 

var weatherContainer = document.querySelector('#weather-view')
var buttonsContainer = document.querySelector('#nav-buttons')
var searchInput = document.querySelector("#search")

var icons = new Skycons({"color": "orange"});

icons.set("clear-day", Skycons.CLEAR_DAY);
icons.set("clear-night", Skycons.CLEAR_NIGHT);
icons.set("partly-cloudy-day", Skycons.PARTLY_CLOUDY_DAY);
icons.set("partly-cloudy-night", Skycons.PARTLY_CLOUDY_NIGHT);
icons.set("cloudy", Skycons.CLOUDY);
icons.set("rain", Skycons.RAIN);
icons.set("sleet", Skycons.SLEET);
icons.set("snow", Skycons.SNOW);
icons.set("wind", Skycons.WIND);
icons.set("fog", Skycons.FOG);

icons.play();

// Create function that splits hash string and returns parts as object
var getHashData = function() {
	console.log('calling getHashData')
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


// Adding search functionality
// Google geocoding API format: http://maps.googleapis.com/maps/api/geocode/outputFormat?parameters
var getCityValue = function (eventObj) {

	if (eventObj.keyCode === 13) {
		var inputValue = eventObj.target.value
		var cityPromise = $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address=' + inputValue)
		cityPromise.then(getCityCoords)
	}
}

searchInput.addEventListener('keydown', getCityValue)

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
	
	currentHTML += '<p id="city">Today in your city</p>'
	currentHTML += '<span id="big-temp">' + currentTemp + '</span><span class="fahrenheit">&#8457;</span>'
	currentHTML += '<canvas id="clear-day" width="120" height="120"></canvas>'
	currentHTML += '<p class="weather-summary">' + currentResponse.currently.summary + '</p>'
	
	weatherContainer.innerHTML = currentHTML

}

// Render hourly view
var renderHourlyView =  function (hourlyResponse) {
	var hourlyHTML = ""
	// var maxHours = hourlyResponse.hours.data[0].time
	// console.log(hourlyResponse)
	// console.log('max hours: ' + maxHours)



	hourlyHTML += '<p>This is the hourly view</p>'

	// for (var i = 0; i <= 48; i ++) {
	// 	var hour = hourlyResponse

	// }


	hourlyHTML += '<p>The hourly weather summary is: ' + hourlyResponse.hourly.summary + '</p>'



	weatherContainer.innerHTML = hourlyHTML
}

// Render daily view
var renderDailyView =  function (dailyResponse) {
	var dailyHTML = ""
	
	dailyHTML += '<p>This is the daily view</p>'
	dailyHTML += '<p>The daily weather summary is: ' + dailyResponse.daily.summary + '</p>'



	weatherContainer.innerHTML = dailyHTML
}


var setStartHash = function (inputObj) {
	console.log('invoking function setStartHash')
	var userLat = inputObj.coords.latitude 
	var userLng = inputObj.coords.longitude 

	location.hash = userLat + '/' + userLng + '/current'
	console.log(location.hash)
}

var errorHandler = function(error) {
	console.log('error getting geo position')
}

var controller = function() {
	
	if (!location.hash) {
		navigator.geolocation.getCurrentPosition(setStartHash, errorHandler)
		return
	}

	var hashObj = getHashData()
	
	console.log ('the lat from the new object is: ' + hashObj.lat)
	console.log ('the long from the new object is: ' + hashObj.lng)
	console.log ('the view from the new object is: ' + hashObj.currentView)


	// Get Forecast.io promise
	var weatherPromise = $.getJSON(BASE_URL + KEY + '/' + hashObj.lat + ',' + hashObj.lng)
	
	// Check currentHash to see which views to serve	
	if (hashObj.currentView === 'current') {
		weatherPromise.then(renderCurrentView)
	}
	if (hashObj.currentView === 'hourly') {
		weatherPromise.then(renderHourlyView)
	}
	if (hashObj.currentView === 'daily') {
		weatherPromise.then(renderDailyView)
	}
	
}
	

controller()

window.addEventListener('hashchange', controller)


