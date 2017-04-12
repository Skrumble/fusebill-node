'use strict';

Fusebill.DEFAULT_HOST = 'stg-secure.fusebill.com';
Fusebill.DEFAULT_PORT = '443';
Fusebill.DEFAULT_BASE_PATH = '/v1/';
Fusebill.DEFAULT_API_VERSION = null;

// Use node's default timeout:
Fusebill.DEFAULT_TIMEOUT = require('http').createServer().timeout;

Fusebill.PACKAGE_VERSION = require('../package.json').version;

Fusebill.USER_AGENT = {
  bindings_version: Fusebill.PACKAGE_VERSION,
  lang: 'node',
  lang_version: process.version,
  platform: process.platform,
  publisher: 'fusebill',
  uname: null,
};

Fusebill.USER_AGENT_SERIALIZED = null;

var exec = require('child_process').exec;

var resources = {
  // Support Accounts for consistency, Account for backwards compat
  Addresses: require('./resources/Addresses'),
  Customers: require('./resources/Customers'),
  CustomerActivation: require('./resources/CustomerActivation'),
  CustomerAddressPreferences: require('./resources/CustomerAddressPreferences'),
  CustomerBillingSettings: require('./resources/CustomerBillingSettings'),
  CustomerEmailPreferences: require('./resources/CustomerEmailPreferences'),
  CustomerHold: require('./resources/CustomerHold'),
  Coupons: require('./resources/Coupons'),
  Countries: require('./resources/Countries'),
  SubscriptionCoupons: require('./resources/SubscriptionCoupons'),
  DraftInvoices: require('./resources/DraftInvoices'),
  Invoices: require('./resources/Invoices'),
  Plans: require('./resources/Plans'),
  PlanProducts: require('./resources/PlanProducts'),
  Payments: require('./resources/Payments'),
  PaymentMethods: require('./resources/PaymentMethods'),
  Payments: require('./resources/Payments'),
  Products: require('./resources/Products'),
  ProductSummary: require('./resources/ProductSummary'),
  Purchases: require('./resources/Purchases'),
  ReverseCharges: require('./resources/ReverseCharges'),
  Subscriptions: require('./resources/Subscriptions'),
  SubscriptionActivation: require('./resources/SubscriptionActivation'),
  SubscriptionProducts: require('./resources/SubscriptionProducts'),
  SubscriptionProductItems: require('./resources/SubscriptionProductItems'),
  SubscriptionCancellation: require('./resources/SubscriptionCancellation'),
};

Fusebill.FusebillResource = require('./FusebillResource');
Fusebill.resources = resources;

function Fusebill(key, version) {
  if (!(this instanceof Fusebill)) {
    return new Fusebill(key, version);
  }

  this._api = {
    auth: null,
    host: Fusebill.DEFAULT_HOST,
    port: Fusebill.DEFAULT_PORT,
    basePath: Fusebill.DEFAULT_BASE_PATH,
    version: Fusebill.DEFAULT_API_VERSION,
    timeout: Fusebill.DEFAULT_TIMEOUT,
    agent: null,
    dev: false,
  };

  this._prepResources();
  this.setApiKey(key);
  this.setApiVersion(version);
}

Fusebill.prototype = {

  setHost: function(host, port, protocol) {
    this._setApiField('host', host);
    if (port) {
      this.setPort(port);
    }
    if (protocol) {
      this.setProtocol(protocol);
    }
  },

  setProtocol: function(protocol) {
    this._setApiField('protocol', protocol.toLowerCase());
  },

  setPort: function(port) {
    this._setApiField('port', port);
  },

  setApiVersion: function(version) {
    if (version) {
      this._setApiField('version', version);
    }
  },

  setApiKey: function(key) {
    if (key) {
      this._setApiField(
        'auth',
        'Basic ' +  key
      );
    }
  },

  setTimeout: function(timeout) {
    this._setApiField(
      'timeout',
      timeout == null ? Fusebill.DEFAULT_TIMEOUT : timeout
    );
  },

  setHttpAgent: function(agent) {
    this._setApiField('agent', agent);
  },

  _setApiField: function(key, value) {
    this._api[key] = value;
  },

  getApiField: function(key) {
    return this._api[key];
  },

  getConstant: function(c) {
    return Fusebill[c];
  },

  getClientUserAgent: function(cb) {
    if (Fusebill.USER_AGENT_SERIALIZED) {
      return cb(Fusebill.USER_AGENT_SERIALIZED);
    }
    exec('uname -a', function(err, uname) {
      Fusebill.USER_AGENT.uname = uname || 'UNKNOWN';
      Fusebill.USER_AGENT_SERIALIZED = JSON.stringify(Fusebill.USER_AGENT);
      cb(Fusebill.USER_AGENT_SERIALIZED);
    });
  },

  _prepResources: function() {
    for (var name in resources) {
      this[
        name[0].toLowerCase() + name.substring(1)
      ] = new resources[name](this);
    }
  },

};

module.exports = Fusebill;
// expose constructor as a named property to enable mocking with Sinon.JS
module.exports.Fusebill = Fusebill;
