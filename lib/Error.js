'use strict';

var utils = require('./utils');

module.exports = _Error;

/**
 * Generic Error klass to wrap any errors returned by fusebill-node
 */
function _Error(raw) {
  this.populate.apply(this, arguments);
  this.stack = (new Error(this.message)).stack;
}

// Extend Native Error
_Error.prototype = Object.create(Error.prototype);

_Error.prototype.type = 'GenericError';
_Error.prototype.populate = function(type, message) {
  this.type = type;
  this.message = message;
};

_Error.extend = utils.protoExtend;

/**
 * Create subclass of internal Error klass
 * (Specifically for errors returned from Fusebill's REST API)
 */
var FusebillError = _Error.FusebillError = _Error.extend({
  type: 'FusebillError',
  populate: function(raw) {
    // Move from prototype def (so it appears in stringified obj)
    this.type = this.type;

    this.stack = (new Error(raw.message)).stack;
    this.rawType = raw.type;
    this.code = raw.code;
    this.param = raw.param;
    this.message = raw.message;
    this.detail = raw.detail;
    this.raw = raw;
    this.requestId = raw.requestId;
    this.statusCode = raw.statusCode;
  },
});

/**
 * Helper factory which takes raw fusebill errors and outputs wrapping instances
 */
FusebillError.generate = function(rawFusebillError) {
  switch (rawFusebillError.type) {
    case 'card_error':
      return new _Error.FusebillCardError(rawFusebillError);
    case 'invalid_request_error':
      return new _Error.FusebillInvalidRequestError(rawFusebillError);
    case 'api_error':
      return new _Error.FusebillAPIError(rawFusebillError);
  }

  if (rawFusebillError.statusCode >= 500) {
    return new _Error('Server', rawFusebillError.message || 'Unknown Error');
  }

  return new _Error('Generic', rawFusebillError.message || 'Unknown Error');
};

// Specific Fusebill Error types:
_Error.FusebillCardError = FusebillError.extend({type: 'FusebillCardError'});
_Error.FusebillInvalidRequestError = FusebillError.extend({type: 'FusebillInvalidRequestError'});
_Error.FusebillAPIError = FusebillError.extend({type: 'FusebillAPIError'});
_Error.FusebillAuthenticationError = FusebillError.extend({type: 'FusebillAuthenticationError'});
_Error.FusebillRateLimitError = FusebillError.extend({type: 'FusebillRateLimitError'});
_Error.FusebillConnectionError = FusebillError.extend({type: 'FusebillConnectionError'});
