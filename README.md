# e3dc grid charge

## What is this about?

This will get prices from the tibber api, find out the cheapest hours and charge an E3 DC battey storage system via modbus
e3dc rscp protocoll mainly based on https://github.com/git-kick/ioBroker.e3dc-rscp

## Setup
* clone repo
* ```cd e3dc_grid_charge```
* ```sudo apt-get install npm```
* ```npm install```
* ```cp config.json.example config.json```
* ```nano config.json``` (change config to fit your needs)


## Start Server
* ```node index.js```

## How to run on a server
It is a good idea to use this script on a raspberry pi, to run it you could use pm2:
* ```sudo npm install pm2 --global```
* ```pm2 startup``` (to autostart pm2 on boot)
* ```pm2 start index.js```
* ```pm2 save``` (to save that the line above should always be started on startup)
* view logs with ```pm2 log```

## Found a bug/need a feature?
Please use the Issue tracker on github