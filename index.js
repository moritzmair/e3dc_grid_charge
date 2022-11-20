// Author: Moritz Mair
// 
// Please do not change anything in this file. Use the config.json file to configure

const https = require('https');
const fetch = require("node-fetch");
const fs = require('fs');

var cron = require('node-cron');

if(typeof URLSearchParams === 'undefined'){
  URLSearchParams = require('url').URLSearchParams;
}

let rawdata = fs.readFileSync('config.json');
let config_file = JSON.parse(rawdata);

var Webserver = require('./webserver.js');

server = new Webserver(config_file)
server.start();

const GRAPHQL_URL = 'https://api.tibber.com/v1-beta/gql';

refresh_epex();


cron.schedule('33 14 * * *', () => {
  // run every day at 14:33
  refresh_epex();
});

async function refresh_epex() {
  console.log("getting price information");
  
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Authorization': 'Bearer '+config_file.tibber_token
    },
    body: JSON.stringify({
      query: `
      {
        viewer {
          homes {
            currentSubscription{
              priceInfo{
                current{
                  total
                  energy
                  tax
                  startsAt
                }
                today {
                  total
                  energy
                  tax
                  startsAt
                }
                tomorrow {
                  total
                  energy
                  tax
                  startsAt
                }
              }
            }
          }
        }
      }
      
      `,
    }),
  });

  const responseBody = await response.json();
  price_info = responseBody.data.viewer.homes[0].currentSubscription.priceInfo
  hourly_prices = price_info.today.concat(price_info.tomorrow);
  sorted_prices = price_info.today.concat(price_info.tomorrow).sort(function(a, b){return a.total - b.total});
  identify_cheapest_hours(Date.now());
}

function identify_cheapest_hours(now){
  charging_hours = new Array(sorted_prices[0].startsAt, sorted_prices[1].startsAt);
}

function turn_switch(sid, identifier, state){
  if(state == 1){
    fritz.setSwitchOn(sid, identifier);
  }else{
    fritz.setSwitchOff(sid, identifier);
  }
}

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}
