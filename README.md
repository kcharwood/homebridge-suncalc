# homebridge-suncalc

[Suncalc](https://github.com/mourner/suncalc) plugin for [Homebridge](https://github.com/nfarina/homebridge) that publishes a custom HomeKit accessory that emits an enum value declaring the time period of the day. Note that since this is a custom value, not all HomeKit apps will display the value.

| Time Period              | Enum Value			                                                      |
| ------------------------ | ------------------------------------------------------------------------ |
| Night   		           | 0 |
| Morning Twilight         | 1 |
| Sunrise				   | 2 |
| Daytime				   | 3 | 
| Sunset				   | 4 |
| Evening Twilight		   | 5 |

This is intended for use in triggering scenes using sunrise and sunset.

# Offset

Trigger off a time relative to sunset/sunrise is useful for light triggers. This plugin allows you to specify an offset for the end of sunrise, and the beginning of sunset. For instance, if you want to trigger a scene to start 30 minutes before sunset (useful for interior lighting), you can specify an sunsetStart offset of -30 in the config.json file, as shown below. This fires the trigger 30 minutes earlier than normal, allowing your lights to come on as it gets darker at your location.

# Installation

1. Install Homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-suncalc`
3. Use the [Google Geocoder Tool](https://google-developers.appspot.com/maps/documentation/utils/geocoder/) to get your location coordinates.
4. Update your Homebridge `config.json` using the sample below.

# Configuration

```json
{
  "accessory": "Suncalc",
  "location": {
    "lat": 30.506667,
    "lng": -97.830278
  },
  "offset": {
	  "sunriseEnd" : 30,
	  "sunsetStart" : -30
  },
  "name": "Suncalc"
}
```

Fields:

* `accessory` must be "Suncalc" (required).
* `location` contains your location coordinates (required).
* `name` is the name of the published accessory (required).
* `offset` contains offset values in minutes of when that event should be fired. (optional).