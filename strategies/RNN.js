var zerorpc = require('zerorpc');
var log = require('../core/log');
var deasync = require('deasync');

function RNNClient() {
  this.client = new zerorpc.Client();
  this.invoke = deasync(this.client.invoke.bind(this.client));
}

RNNClient.prototype.addTick = function (value, time) {
  return this.invoke('add_tick', value, time);
};
RNNClient.prototype.getPrediction = function () {
  return this.invoke('get_prediction');
};
RNNClient.prototype.takeAction = function (action) {
  return this.invoke('take_action', action);
};

RNNClient.prototype.connect = function () {
  this.client.connect('tcp://127.0.0.1:4242');
};

// Let's create our own strat
var strat = {
  client: new RNNClient(),
};

// Prepare everything our method needs
strat.init = function () {
  console.log('RNN', 'start');
  this.input = 'candle';
  this.currentTrend = 'long';
  this.requiredHistory = 0;
  this.client.connect();
  this.startAt = Date.now();
};

// What happens on every new candle?
strat.update = function (candle) {
  this.client.addTick(candle.close, Date.now() - this.startAt);
  console.log('adding tick', candle.close);
};

// For debugging purposes.
strat.log = function () {
  log.debug('RNN is running:', this.currentTrend);
};

strat.check = function () {
  let now = Date.now();
  let decision = this.client.getPrediction();
  if (decision !== this.currentTrend && decision !== 'stable') {
    console.log('Decision:', decision, ' / currentTrend', this.currentTrend);
    this.currentTrend = decision;
    this.advice(decision);
    this.client.takeAction(decision);
    return this.currentTrend;
  }
};

module.exports = strat;
