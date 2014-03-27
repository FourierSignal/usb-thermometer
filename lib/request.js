"use strict";

try {	
	var request = require('request');

	var fs = require('fs');

	var config = require('config');

	var sensorId = config.Sensor.id;

	var serviceURL = config.API.serviceURL;

	var tokenEndPoint = config.API.tokenEndPoint;

	var postEndPoint = config.API.postEndPoint;

	var clientKey = config.API.clientKey;

	var clientSecret = config.API.clientSecret;

	var accessTokenFilename = config.API.accessTokenFilename;
	
	if ( process.argv[2] == undefined ) {
		throw('Input temperature not defined');
	}

	var temperature = process.argv[2];

	console.log('Input temperature: '+temperature);
	
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
						console.log('Temperature logged');
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
						throw body;
					break;
					default: // random error
						throw response;
				}
				
				
		    }
		);
	};
	
	var data = {
		'grant_type': 'client_credentials',
		'sensor_id': sensorId,
		'temperature': temperature
	};
	
	// get access token from config
	if ( fs.existsSync(accessTokenFilename) ) {
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
}
catch(err) {
	console.log(err);
}