'use strict';

const suncalc = require('suncalc');
var inherits = require('util').inherits;

module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic;
  const Service = homebridge.hap.Service;
  const Accessory = homebridge.hap.Accessory;
  const uuid = homebridge.hap.uuid;
  
  const PeriodValue = function() {
    Characteristic.call(this, 'Suncalc Period Value', '4d640a06-34fe-45d7-bf7c-736bb2cf5693');
    this.setProps({
      format: Characteristic.Formats.UINT8,
      maxValue: 5,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(PeriodValue, Characteristic);
  
  const PeriodName = function() {
    Characteristic.call(this, 'Suncalc Period Name', '4d640a06-34fe-45d7-bf7c-736bb2cf5694');
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ]
    });
    this.value = this.getDefaultValue();
  };
  inherits(PeriodName, Characteristic);
  
  const Suncalc = function(displayName, subtype) {
	  Service.call(this, displayName, '61f96c67-1b62-4c2b-a300-58c242355017', subtype);

	  // Required Characteristics
	  this.addCharacteristic(PeriodValue);
	  this.addCharacteristic(PeriodName);

	  // Optional Characteristics
	  this.addOptionalCharacteristic(Characteristic.StatusActive);
	  this.addOptionalCharacteristic(Characteristic.StatusFault);
	  this.addOptionalCharacteristic(Characteristic.StatusTampered);
	  this.addOptionalCharacteristic(Characteristic.StatusLowBattery);
	  this.addOptionalCharacteristic(Characteristic.Name);
	};
	inherits(Suncalc, Service);

  class SuncalcAccessory {
    constructor(log, config) {
      if (!config.location ||
          !Number.isFinite(config.location.lat) ||
          !Number.isFinite(config.location.lng)) {
        throw new Error('Invalid or missing `location` configuration.');
      }
	  
	  this.sunriseEndOffset = 0
	  this.sunsetStartOffset = 0
	  
      if (!config.offset || !config.offset.sunriseEnd) {
      	this.sunriseEndOffset = 0
      } else {
      	this.sunriseEndOffset = config.offset.sunriseEnd
      }
	  
      if (!config.offset || !config.offset.sunsetStart) {
      	this.sunsetStartOffset = 0
      } else {
      	this.sunsetStartOffset = config.offset.sunsetStart
      }

      this.location = config.location;
      // this.service = new Service.LightSensor(config.name);
	  this.service = new Suncalc(config.name);
  	  this.log = log;
      this.updateAmbientLightLevel();
    }

    updateAmbientLightLevel() {
      const nowDate = new Date();
      const now = nowDate.getTime();

      const sunDates = suncalc.getTimes(
        nowDate,
        this.location.lat,
        this.location.lng
      );
      const times = {
  	  	nightEnd: sunDates.nightEnd.getTime(),
		nauticalDawn: sunDates.nauticalDawn.getTime(),
  	  	dawn: sunDates.dawn.getTime(),
		sunrise: sunDates.sunrise.getTime(),
        sunriseEnd: sunDates.sunriseEnd.getTime() + (this.sunriseEndOffset * 1000 * 60),
        sunsetStart: sunDates.sunsetStart.getTime() + (this.sunsetStartOffset * 1000 * 60),
        sunset: sunDates.sunset.getTime(),
  	  	dusk: sunDates.dusk.getTime(),
	  	nauticalDusk: sunDates.nauticalDusk.getTime(),
  		night: sunDates.night.getTime()
      };

      let lightRatio;
	  let sunCalc;
      let nextUpdate;
	  let periodName;
	  
	  if (now < times.dawn) {
		  // Nightime
	  	this.log("Currently Nighttime(0). Morning Twilight begins at " + sunDates.dawn.toLocaleTimeString())
    	nextUpdate = times.dawn
		sunCalc = 0
		periodName = "Night"
	  } else if (now >= times.dawn && now < times.sunrise) {
		  // Morning Twilight
	  	this.log("Currently Morning Twilight(1). Sunrise is at " + sunDates.sunrise.toLocaleTimeString())
  		if (this.sunriseEndOffset != 0) {
  			this.log("Sunrise time will be offset by " + this.sunriseEndOffset + " minute(s)")
  		}
		nextUpdate = times.sunrise
		sunCalc = 1
		periodName = "Morning Twilight"
	  } else if (now >= times.sunrise && now < times.sunriseEnd) {
		  // Sunrise
	  	this.log("Currently Sunrise(2). Sunrise ends at " + sunDates.sunriseEnd.toLocaleTimeString())
    	nextUpdate = times.sunriseEnd
		sunCalc = 2
    	periodName = "Sunrise"
	  } else if (now >= times.sunriseEnd && now < times.sunsetStart) {
		  // Daytime
	  	this.log("Currently Daytime(3). Sunset is at " + sunDates.sunsetStart.toLocaleTimeString())
		if (this.sunsetStartOffset != 0) {
			this.log("Sunset time will be offset by " + this.sunsetStartOffset + " minute(s)")
		}
    	nextUpdate = times.sunsetStart
		sunCalc = 3		 
		periodName = "Daytime"
	  } else if (now >= times.sunsetStart && now < times.sunset) {
		  // Sunset
	  	this.log("Currently Sunset(4). Evening Twilight begins at " + sunDates.sunset.toLocaleTimeString())
		nextUpdate = times.sunset
		sunCalc = 4
    	periodName = "Sunset"
	  } else if (now >= times.sunset && now < times.dusk){
		  // Evening Twilight
	  	this.log("Currently Evening Twilight(5). Night begins at " + sunDates.dusk.toLocaleTimeString())
		nextUpdate = times.dusk
		sunCalc = 5
		periodName = "Evening Twilight"  
	  } else {
 	  	 // Nighttime
		sunCalc = 0		  
		var tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		const tomorrowsTimes = suncalc.getTimes(tomorrow,this.location.lat,this.location.lng)
  	  	this.log("Currently Nighttime(0). Morning Twilight begins at " + tomorrowsTimes.dawn.toLocaleTimeString())
  		nextUpdate = tomorrowsTimes.dawn.getTime()
		periodName = "Night"
	  }
	  
      this.service.setCharacteristic(
        PeriodValue,
        sunCalc
      );
	  
      this.service.setCharacteristic(
        PeriodName,
        periodName
      );
	  
      setTimeout(this.updateAmbientLightLevel.bind(this), nextUpdate - now);
    }

    getServices() {
      return [this.service];
    }
  }

  homebridge.registerAccessory('homebridge-suncalc', 'Suncalc', SuncalcAccessory);
};
