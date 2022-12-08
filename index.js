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
  all_prices = price_info.today.concat(price_info.tomorrow);
  now = new Date();
  all_prices = all_prices.filter(function(ele){
    datetime = new Date(ele.startsAt)
    console.log(datetime);
    console.log(now);
    return datetime > now;
  });
  hourly_prices = all_prices.map(a => ({...a}));;
  sorted_prices = all_prices.sort(function(a, b){return a.total - b.total});
  identify_cheapest_hours(Date.now());
}

// decide_switch every 2 minutes
setInterval(function(){ decide_switch(); }, 1000*120);

function decide_switch(){
  console.log(charging_hours);

  d = new Date();

  current_hour = d.getFullYear()+"-"+(d.getMonth()+1).toString().padStart(2, "0")+"-"+d.getDate().toString().padStart(2, "0")+"T"+d.getHours().toString().padStart(2, "0");

  console.log(current_hour);

  if(charging_hours.some((element) => element.includes(current_hour))){
    console.log("-- start charging --")
    start_charging();
  }else{
    console.log("-- stop charging --")
    stop_charging();
  }
}

function identify_cheapest_hours(now){
  charging_hours = new Array(sorted_prices[0].startsAt, sorted_prices[1].startsAt, sorted_prices[2].startsAt);
}

const rscpEmsSetPowerMode = {
	0: "NORMAL",
	1: "IDLE",
	2: "DISCHARGE",
	3: "CHARGE",
	4: "GRID_CHARGE",
};

function start_charging(){
  e3dc.sendEmsSetPower(4, 5000);
}

function stop_charging(){
  e3dc.sendEmsSetPower(0, 5000);
}

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}
