$(function() {
    $('body').on('click', '.temp-up', function(){
	var tempElement = $('.temperature-display .temperature-display-wrapper .target .temperature');
	var temperature = parseInt(tempElement.html());
	temperature++;
	postTemperature(temperature);
    });
    
    $('body').on('click', '.temp-down', function(){
	var tempElement = $('.temperature-display .temperature-display-wrapper .target .temperature');
	var temperature = parseInt(tempElement.html());
	temperature--;
	postTemperature(temperature);
    });

    var centerY = 405;
    var centerX = 456;

    var tempTimeout;
    var stateTimeout;
    
    $('.grabber').on('touchmove', function(e){
	$('.message .m').text("touch");
	var xPoint = event.touches[0].pageX;
	var yPoint = event.touches[0].pageY;
	$('.message .x').text(xPoint);
	$('.message .y').text(yPoint);
	$('.message .r').text(rotation);
	
	var divX = $('.wrapper').position().left;
	var divY = $('.wrapper').position().top;
	var rotation = Math.atan2(centerY - yPoint, centerX - xPoint) * 180 / Math.PI;
	//console.log("Rotation: " + rotation);
	if ((rotation > -50 && rotation < 180) || (rotation > -180 && rotation < -130)) {   
	    $('.touch-box').css({'transform': 'rotate(' + (rotation-45) + 'deg)'});
	    var adjustedRotation;
	    var degreeIncrease;
	    if (rotation > -50 && rotation < 180){
		adjustedRotation = rotation + 50;
	    } else {
		adjustedRotation = rotation + 180 + 230;
	    }
	    console.log("Adjusted rotation: " + adjustedRotation);
	    degreeIncrease = adjustedRotation / 9.2;
	    var finalTemp = (55 + (Math.ceil(degreeIncrease)));
	    var celcius = ((finalTemp -32) * (5/9));
	    var hue = 27 + ((finalTemp - 56) * 11.1);
	    $('.wrapper-back').css({'background-color': 'hsl(' + hue + ', 100%, 50%)'});
	    $('.wrapper-front .target .temperature').text(finalTemp);

	    if(tempTimeout){
		clearTimeout(tempTimeout);
	    }

	    if(stateTimeout){
		clearTimeout(stateTimeout);
		stateTimeout = setTimeout(function() {
		    currentStatusPoll(true);
		}, 5000);
	    }

	    tempTimeout = setTimeout(function() {
		postTemperature(finalTemp);
	    }, 1000);
	}
	
    });

    function postTemperature(temperature) {
	$.ajax({
	    type: 'POST',
	    url: 'setTemperature',
	    data: JSON.stringify(
		{
		    'temperature': temperature
		}
	    ),
	    contentType: 'application/json;charset=UTF-8',
	    success: function(data){
		currentStatusPoll(false)
	    }
	});
    }
    
    $('body').on('click', '.run-schedule', function(){
	$.ajax({
	    type: 'POST',
	    url: 'runSchedule',
	    success: function(data){
		currentStatusPoll(false)
	    }
	});
    });
    
    $('body').on('click', '.heat-control', function(){
	$.ajax({
	    type: 'POST',
	    url: 'toggleHeat',
	    success: function(data){
		currentStatusPoll(false)
	    }
	});
    });
    
    $('body').on('click', '.fan-control', function(){
	$.ajax({
	    type: 'POST',
	    url: 'toggleFan',
	    success: function(data){
		currentStatusPoll(false)
	    }
	});
    });
    
    $('body').on('click', '.schedule-page-btn', function(){
	$('.temperature-control').addClass('hidden');
	$('.schedule-control').removeClass('hidden');
    });

    $('body').on('click', '.thermostat-page-btn', function(){
	$('.temperature-control').removeClass('hidden');
	$('.schedule-control').addClass('hidden');
    });
    
    function currentStatusPoll(repeat){
	$.ajax({
	    type: 'GET',
	    url: 'currentState',
	    success: function(data){
		var temperature = data['curTemp'];
		var temporary = data['usingTemporary'];
                var target_temperature = data['targetTemp'];
		var is_heat_on = data['isHeatOn'];
		var is_allowing_heat = data['allowingHeat'];
		var is_allowing_fan = data['allowingFan'];
		
		var currentTempElement = $('.temperature-display .temperature-display-wrapper .current .temperature');
		var targetTempElement = $('.temperature-display .temperature-display-wrapper .target .temperature');
		var wrapper = $('.temperature-display .temperature-display-wrapper');
		currentTempElement.html(parseInt(temperature));
		targetTempElement.html(parseInt(target_temperature));
		
		if(temporary){
		    wrapper.addClass("temporary");
		} else {
		    wrapper.removeClass("temporary");
                }
		
		if(is_heat_on) {
		    wrapper.addClass("running");
		} else {
		    wrapper.removeClass("running");
		}
		
		var heatToggle = $(".heat-control .control");
		if(is_allowing_heat) {
		    heatToggle.addClass("on");
		    heatToggle.removeClass("off");
		} else {
		    heatToggle.addClass("off");
		    heatToggle.removeClass("on");
		    
		}
		
		var fanToggle = $(".fan-control .control");
		if(is_allowing_fan) {
		    fanToggle.addClass("on");
		    fanToggle.removeClass("off");
		} else {
		    fanToggle.addClass("off");
		    fanToggle.removeClass("on");
		    
		}

		var degreeIncrease = target_temperature - 56
		var adjustedRotation = degreeIncrease * 9.2;
		var rotation = adjustedRotation - 90;
		$('.touch-box').css({'transform': 'rotate(' + (rotation) + 'deg)'});
		
		var celcius = ((target_temperature - 32) * (5/9));
		var outer_hue = 27 + ((target_temperature - 56) * 11.1);
		var inner_hue = 27 + ((temperature - 56) * 11.1);
		$('.wrapper-back').css({'background-color': 'hsl(' + outer_hue + ', 100%, 50%)'});
		$("#touch-box").css({'background-color': 'hsl(' + inner_hue + ', 100%, 50%)'});

		var dt = new Date();
		var time = dt.getHours() + ":" + dt.getMinutes()
		$('.forecast-header .span').html(time);
		
		if(repeat){
		    stateTimeout = setTimeout(function(){currentStatusPoll(true)}, 5000);
		}
	    },
	    error: function(){
		window.location = '/thermostat'
	    }
	});
    };

    function _getWeather() {
        $.ajax({
            url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22billings%2C%20mt%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
            method: "GET",
            success: function (response) {
		var conditions = {
		    "Mostly Cloudy": 'cloudy',
		    "Cloudy": 'cloudy',
		    "Partly Cloudy": "partly-cloudy",
		    "Mostly Sunny": 'sunny',
		    "Snow Showers": 'snow-s-rain',
		    "Rain And Snow": 'snow-s-rain',
		    "Rain": 'rain',
		    'Showers': 'scattered-showers',
		    "Scattered Showers": 'scattered-showers',
		    'Windy': 'windy',
		    'Breezy': 'windy',
		    'Blowing Snow': 'blowing-snow',
		    'Snow': 'snow',
		    'Sunny': 'sunny'
		};
		$('[data-forecast-current] span').html( response.query.results.channel.item.condition.temp);
		$('[data-high]').html(response.query.results.channel.item.forecast[0].high);
		$('[data-low]').html(response.query.results.channel.item.forecast[0].low);
		$('[data-forecast-current-with-wind] span').html(response.query.results.channel.wind.chill);

		var className = conditions[response.query.results.channel.item.condition.text];
		$('.forecast-temp-condition-value .condition').addClass(className);
		$('[data-condition-text]').html(response.query.results.channel.item.condition.text);
                console.log(response);
                setTimeout(_getWeather, parseInt(response.query.results.channel.ttl) * 1000);
            }
        });
    }

    _getWeather();
    
    currentStatusPoll(true);
});
