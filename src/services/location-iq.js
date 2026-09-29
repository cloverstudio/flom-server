const { Config } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { LocationIQCache } = require("#models");

class LocationIQ {
  constructor() {
    this.baseUrl = Config.locationIqUrl;
    this.apiKey = Config.locationIqKey;
  }

  async autocomplete({ address, countryCode }) {
    try {
      if (!address || !countryCode) {
        logger.error("LocationIQService, autocomplete: missing address or countryCode");
        return null;
      }

      const apiRequest = {
        method: "GET",
        url: this.baseUrl + "/v1/autocomplete",
        query: {
          key: this.apiKey,
          q: address,
          countrycodes: countryCode.toLowerCase(),
          limit: 10,
          dedupe: 1,
          normalizeaddress: 1,
          format: "json",
          layers: "address,street",
        },
        headers: {
          Accept: "application/json",
        },
      };

      const queryString = apiRequest.query
        ? Object.entries(apiRequest.query)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .filter((i) => !i.startsWith("key="))
            .join("&")
        : "";

      const urlToSearch = apiRequest.url + "?" + queryString;

      return await this.fetchData({ apiRequest, urlWithoutKey: urlToSearch });
    } catch (error) {
      logger.error("LocationIQService, autocomplete:", error);
      return null;
    }
  }

  async directions({ mode, origin, destination }) {
    try {
      if (!mode || !origin || !destination) {
        logger.error("LocationIQService, directions: missing mode, origin, or destination");
        return null;
      }

      const apiRequest = {
        method: "GET",
        url: this.baseUrl + "/v1/directions/" + mode + "/" + origin + ";" + destination,
        query: {
          key: this.apiKey,
          overview: "false",
        },
      };

      return await this.fetchData({ apiRequest, urlWithoutKey: apiRequest.url });
    } catch (error) {
      logger.error("LocationIQService, directions:", error);
      return null;
    }
  }

  async address({ lat, lon }) {
    try {
      if (!lat || !lon) {
        logger.error("LocationIQService, address: missing lat or lon");
        return null;
      }

      const urlWithoutKey = `${this.baseUrl}/v1/address?lat=${lat}&lon=${lon}&format=json&normalizeaddress=1`;
      const url = urlWithoutKey + `&key=${this.apiKey}`;

      const apiRequest = { method: "GET", url };

      return await this.fetchData({ apiRequest, urlWithoutKey });
    } catch (error) {
      logger.error("LocationIQService, address:", error);
      return null;
    }
  }

  async fetchData({ apiRequest, urlWithoutKey }) {
    try {
      let data;

      const cache = await LocationIQCache.findOne({
        url: urlWithoutKey,
        modified: { $gt: Date.now() - 4 * 60 * 60 * 1000 },
      }).lean();

      if (cache) {
        data = cache.data;
      } else {
        const { data: d } = await Utils.sendRequest(apiRequest);

        if (!d) {
          logger.error("LocationIQService, fetchData: no response");
          return null;
        }

        data = d;

        await LocationIQCache.updateOne(
          { url: urlWithoutKey },
          { url: urlWithoutKey, data: d, modified: Date.now() },
          { upsert: true },
        );
      }

      return data;
    } catch (error) {
      logger.error("LocationIQService, fetchData:", error);
      return null;
    }
  }
}

// Autocomplete response example:
/*
[
    {
        "place_id": "322410501966",
        "osm_id": "3761799952",
        "osm_type": "node",
        "licence": "https://locationiq.com/attribution",
        "lat": "43.5155981",
        "lon": "16.4312198",
        "boundingbox": [
            "43.5155481",
            "43.5156481",
            "16.4311698",
            "16.4312698"
        ],
        "class": "place",
        "type": "house",
        "display_name": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia",
        "display_place": "Jobova",
        "display_address": "14, Poljud, Split, Split-Dalmatia County, 21000, Croatia",
        "address": {
            "name": "Jobova",
            "house_number": "14",
            "road": "Jobova",
            "neighbourhood": "Poljud",
            "city": "Split",
            "county": "Split-Dalmatia County",
            "postcode": "21000",
            "country": "Croatia",
            "country_code": "hr"
        }
    }
]
*/

// Directions URL example:
// https://us1.locationiq.com/v1/directions/walking/16.431191277275307,43.515762721856305;16.458801102615958,43.50384642817355?key=pk.f4c8e61030a5c67c3eb241babd751833&overview=false

// Directions response example:
/*
{
    "code": "Ok",
    "routes": [
        {
            "legs": [
                {
                    "steps": [],
                    "weight": 2255.4,
                    "summary": "",
                    "duration": 2255.4,
                    "distance": 3123.8
                }
            ],
            "weight_name": "duration",
            "weight": 2255.4,
            "duration": 2255.4,
            "distance": 3123.8
        }
    ],
    "waypoints": [
        {
            "hint": "_bOvhAC0r4R-AAAAMQEAAAAAAAAAAAAAFy2MQcceKUIAAAAAAAAAAH4AAAAxAQAAAAAAAAAAAABCAAAAaLj6ACn_lwJXuPoAc_-XAgAADwX5lZZZ",
            "location": [
                16.431208,
                43.515689
            ],
            "name": "",
            "distance": 8.335696344
        },
        {
            "hint": "HyBRkCMgUZAyAAAAoAAAADcAAACOAAAAjpniQCyWsEGE__JAvgWeQTIAAACgAAAANwAAAI4AAABCAAAAxCP7AE7QlwIxJPsA5tCXAgIAXwf5lZZZ",
            "location": [
                16.458692,
                43.503694
            ],
            "name": "Spinčićeva ulica",
            "distance": 19.04843064
        }
    ]
}
*/

module.exports = new LocationIQ();
