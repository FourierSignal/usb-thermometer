"use strict";

try {
	var request = require('request');

	var fs = require('fs');

	var config = require('config');

	if (!config || !config.Sensor || !config.API) {
		throw('Badly formatted config');
	}
	
	if (!config.Sensor.id) {
		throw('No sensorId defined in config');
	}
	
	var sensorId = config.Sensor.id;

	if (!config.API.serviceURL) {
		throw('No serviceURL defined in config');
	}

	var serviceURL = config.API.serviceURL;

	if (!config.API.tokenEndPoint) {
		throw('No tokenEndPoint defined in config');
	}

	var tokenEndPoint = config.API.tokenEndPoint;

	if (!config.API.postEndPoint) {
		throw('No postEndPoint defined in config');
	}

	var postEndPoint = config.API.postEndPoint;

	if (!config.API.clientKey) {
		throw('No clientKey defined in config');
	}

	var clientKey = config.API.clientKey;

	if (!config.API.clientSecret) {
		throw('No clientSecret defined in config');
	}

	var clientSecret = config.API.clientSecret;

	if (!config.API.accessTokenFilename) {
		throw('No accessTokenFilename defined in config');
	}

	var accessTokenFilename = config.API.accessTokenFilename;
	
	if (!config.API.lastTemperatureReadingFilename) {
		throw('No lastTemperatureReadingFilename defined in config');
	}
	
	var lastTemperatureReadingFilename = config.API.lastTemperatureReadingFilename;
	
	if ( process.argv[2] == undefined ) {
		throw('Input temperature not defined');
	}

	var temperature = process.argv[2];

	// get last temperature reading from config
	if (fs.existsSync(lastTemperatureReadingFilename) ) {
		var lastTemperatureReading = fs.readFileSync(lastTemperatureReadingFilename, 'utf8');
		// exit if previous reading is the same as current reading
		if (temperature == lastTemperatureReading) {
			throw('Temperature constant: '+temperature);
		}
	}

	// Write the recorded temperature to config file
	fs.writeFileSync(lastTemperatureReadingFilename, temperature);
	
	var authenticationError = false;
	
	var requestAccessToken = function(callback) {
		request.post(
	    serviceURL+tokenEndPoint,
	    { 	
				auth: {
		    	'user': clientKey,
		    	'pass': clientSecret,
		    	'sendImmediately': true
			  },
				form: { 
					'grant_type': 'client_credentials'
				}
			},
		    function (error, response, body) {
					if (error || response.statusCode != 200) {
						throw response;
					}
					var bodyObj = JSON.parse(body);
					if (bodyObj.access_token == undefined) {
						throw 'No access token returned';
					}			
					if (callback instanceof Function) {
						callback(bodyObj.access_token);
					}
		    }
		);
	};

	var postRequest = function(accessToken, data) {
		request.post(
		    serviceURL+postEndPoint,
		    { 	
			 	headers: {
			        'Authorization': 'Bearer '+accessToken
			    },
				form: data
			},
		    function (error, response, body) {
				switch (response.statusCode) {
					case 200: // success
						console.log('Temperature logged: '+temperature);
					break;
					case 401: // authentication error
						if (authenticationError == true) {
							throw 'Access Token could not be created second time around';
						}
						authenticationError = true;
						requestAccessToken(function(accessToken) {
							authenticationError == false;
							fs.writeFileSync(accessTokenFilename, accessToken);
							// make post request using access token
							postRequest(accessToken, data);
						});
					break;
					case 403:
						throw response.statusCode+' '+body;
					break;
					default: // random error
						throw response.statusCode+' '+body;
				}	
		    }
		);
	};
	
	var data = {
		'grant_type': 'client_credentials',
		'sensor': sensorId,
		'temperature': temperature
	};
	
	// get access token from config
	if (fs.existsSync(accessTokenFilename) ) {
		var accessToken = fs.readFileSync(accessTokenFilename, 'utf8');
		// make post request using access token
		postRequest(accessToken, data);
	} else {
		// if config file doesnt exist - request token and create file
		requestAccessToken(function(accessToken) {
			fs.writeFileSync(accessTokenFilename, accessToken);
			// make post request using access token
			postRequest(accessToken, data);
		});
	}	
} catch(err) {
	console.log(err);
}