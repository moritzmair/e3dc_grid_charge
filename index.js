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

// e3dc
var E3dcRscp = require('./e3dc_rscp_lib/e3dcrscp.js');
e3dc = new E3dcRscp(config_file);

e3dc.initChannel();
// --------------

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

function start_stop_charging(state){
  // Trigger: derate power is reached, i.e. power to grid will be capped
  // Action: reset battery charge power limit to maximum, as specified under SYS_SPECS
  on( {
    id: 'e3dc-rscp.0.EMS.POWER_GRID', 
    valLe: -getState('e3dc-rscp.0.EMS.DERATE_AT_POWER_VALUE').val, 
    change: 'lt', 
    logic: 'and'
  }, (obj) => {
    console.log('Trigger: power to grid is at derate threshold - reset charge power limit');
    setState('e3dc-rscp.0.EMS.MAX_CHARGE_POWER', getState('e3dc-rscp.0.EMS.SYS_SPECS.maxBatChargePower').val );
  });
}

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}
