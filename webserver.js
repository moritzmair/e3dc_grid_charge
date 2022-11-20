
class Webserver {
  constructor(config) {
    this.config = config;
    this.data = {man_turn_on_until: new Date}
  }

  refresh_parameters(config, hourly_prices, charging_hours){
    this.data = {
      config: this.config,
      hourly_prices: hourly_prices,
      charging_hours: charging_hours,
    };
    this.server.close();
    this.start();
  }

  get_man_turn_on_until(){
    return this.data.man_turn_on_until;
  }
  
  start(){
    const haml = require('hamljs');
    const fs = require('fs');

    const express = require('express');
    const app = express();

    const port = this.config.port_webserver

    const data = this.data

    var webserver = this
    
    app.get('/', function (req, res) {
      if(req.query.turn_on_hours){
        var man_turn_on_until = new Date();
        man_turn_on_until.addHours(req.query.turn_on_hours)
        webserver.data.man_turn_on_until = man_turn_on_until;
      }
      var hamlView = fs.readFileSync('views/home.haml', 'utf8');
      res.end(haml.render(hamlView, {locals: data}) )
    })
  
    app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
  
    this.server = app.listen(port, () => console.log(`listening on port ${port}!`));
  }
}

module.exports = Webserver;