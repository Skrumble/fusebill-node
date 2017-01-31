'use strict';

var http = require('http');
var https = require('https');
var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');

var utils = require('./utils');
var Error = require('./Error');

var hasOwn = {}.hasOwnProperty;

// Provide extension mechanism for Fusebill Resource Sub-Classes
FusebillResource.extend = utils.protoExtend;

// Expose method-creator & prepared (basic) methods
FusebillResource.method = require('./FusebillMethod');
FusebillResource.BASIC_METHODS = require('./FusebillMethod.basic');

/**
 * Encapsulates request logic for a Fusebill Resource
 */
function FusebillResource(fusebill, urlData) {
  this._fusebill = fusebill;
  this._urlData = urlData || {};

  this.basePath = utils.makeURLInterpolator(fusebill.getApiField('basePath'));
  this.path = utils.makeURLInterpolator(this.path);

  if (this.includeBasic) {
    this.includeBasic.forEach(function(methodName) {
      this[methodName] = FusebillResource.BASIC_METHODS[methodName];
    }, this);
  }

  this.initialize.apply(this, arguments);
}

FusebillResource.prototype = {

  path: '',

  initialize: function() {},

  // Function to override the default data processor. This allows full control
  // over how a FusebillResource's request data will get converted into an HTTP
  // body. This is useful for non-standard HTTP requests. The function should
  // take method name, data, and headers as arguments.
  requestDataProcessor: null,

  // String that overrides the base API endpoint. If `overrideHost` is not null
  // then all requests for a particular resource will be sent to a base API
  // endpoint as defined by `overrideHost`.
  overrideHost: null,

  createFullPath: function(commandPath, urlData) {
    return path.join(
      this.basePath(urlData),
      this.path(urlData),
      typeof commandPath == 'function' ?
        commandPath(urlData) : commandPath
    ).replace(/\\/g, '/'); // ugly workaround for Windows
  },

  createUrlData: function() {
    var urlData = {};
    // Merge in baseData
    for (var i in this._urlData) {
      if (hasOwn.call(this._urlData, i)) {
        urlData[i] = this._urlData[i];
      }
    }
    return urlData;
  },

  createDeferred: function(callback) {
    var deferred = Promise.defer();

    if (callback) {
      // Callback, if provided, is a simply translated to Promise'esque:
      // (Ensure callback is called outside of promise stack)
      deferred.promise.then(function(res) {
          setTimeout(function() { callback(null, res) }, 0);
        }, function(err) {
          setTimeout(function() { callback(err, null); }, 0);
        });
    }

    return deferred;
  },

  _timeoutHandler: function(timeout, req, callback) {
    var self = this;
    return function() {
      var timeoutErr = new Error('ETIMEDOUT');
      timeoutErr.code = 'ETIMEDOUT';

      req._isAborted = true;
      req.abort();

      callback.call(
        self,
        new Error.FusebillConnectionError({
          message: 'Request aborted due to timeout being reached (' + timeout + 'ms)',
          detail: timeoutErr,
        }),
        null
      );
    }
  },

  _responseHandler: function(req, callback) {
    var self = this;
    return function(res) {
      var response = [];

      var headers = res.headers || {};
      if (_.startsWith(headers['content-type'], 'application/json')) {
        res.setEncoding('utf8');
      }

      res.on('data', function(chunk) {
        response.push(chunk);
      });

      res.on('end', function() {
        try {
          if (_.startsWith(headers['content-type'], 'application/json')) {
            response = response.join('');

            // No Content then response body can not be parsed
            // TODO: response should not be null I think there is a fusebill bug
            if (res.statusCode === 204 || response === "null") {
              response = '{}';
            }

            response = JSON.parse(response);
            if (response.Errors) {
              var err;

              response.error = {};
              response.error.statusCode = res.statusCode;
              response.error.message = _.map(response.Errors, 'Value').join(', ');
              // response.error.requestId = headers['request-id'];
              if (res.statusCode === 401) {
                err = new Error.FusebillAuthenticationError(response.error);
              } else if (res.statusCode === 429) {
                err = new Error.FusebillRateLimitError(response.error);
              } else {
                if (res.statusCode === 400) {
                  response.error.type = 'invalid_request_error';
                }
                err = Error.FusebillError.generate(response.error);
              }
              return callback.call(self, err, null);
            }
            if (res.statusCode >= 400) {
              // For some reason response.Errors is not always set
              // Some 404s have response.Message
              response = JSON.parse(response);
              err = Error.FusebillError.generate(response.error);
              return callback.call(self, err, null);
            }
          } else {
            var resData = Buffer.concat(response);
            response = {
              data: resData
            };
          }
        } catch (e) {
          return callback.call(
            self,
            new Error.FusebillAPIError({
              message: 'Invalid JSON received from the Fusebill API',
              response: response,
              exception: e,
              requestId: headers['request-id'],
            }),
            null
          );
        }

        // Expose res object
        Object.defineProperty(response, 'lastResponse', {
          enumerable: false,
          writable: false,
          value: res,
        });
        callback.call(self, null, response);
      });
    };
  },

  _errorHandler: function(req, callback) {
    var self = this;
    return function(error) {
      if (req._isAborted) {
        // already handled
        return;
      }
      callback.call(
        self,
        new Error.FusebillConnectionError({
          message: 'An error occurred with our connection to Fusebill',
          detail: error,
        }),
        null
      );
    }
  },

  _request: function(method, path, data, auth, options, callback) {
    var self = this;
    var requestData;

    if (self.requestDataProcessor) {
      requestData = self.requestDataProcessor(method, data, options.headers);
    } else {
      // Changed body to JSON instead of x-www-form-urlencode
      // requestData = utils.stringifyRequestData(data || {});
      requestData = JSON.stringify(data);
    }

    var apiVersion = this._fusebill.getApiField('version');

    var headers = {
      // Use specified auth token or use default from this fusebill instance:
      'Authorization': auth ?
        'Basic ' + new Buffer(auth + ':').toString('base64') :
        this._fusebill.getApiField('auth'),
      'Accept': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData),
      'User-Agent': 'Fusebill/v1 NodeBindings/' + this._fusebill.getConstant('PACKAGE_VERSION'),
    };

    if (apiVersion) {
      headers['Fusebill-Version'] = apiVersion;
    }

    // Grab client-user-agent before making the request:
    this._fusebill.getClientUserAgent(function(cua) {
      headers['X-Fusebill-Client-User-Agent'] = cua;

      if (options.headers) {
        headers = _.extend(headers, options.headers);
      }

      makeRequest();
    });

    function makeRequest() {
      var timeout = self._fusebill.getApiField('timeout');
      var isInsecureConnection = self._fusebill.getApiField('protocol') == 'http';

      var host = self.overrideHost || self._fusebill.getApiField('host');

      var req = (
        isInsecureConnection ? http : https
      ).request({
        host: host,
        port: self._fusebill.getApiField('port'),
        path: path,
        method: method,
        agent: self._fusebill.getApiField('agent'),
        headers: headers,
        ciphers: 'DEFAULT:!aNULL:!eNULL:!LOW:!EXPORT:!SSLv2:!MD5',
      });

      req.setTimeout(timeout, self._timeoutHandler(timeout, req, callback));
      req.on('response', self._responseHandler(req, callback));
      req.on('error', self._errorHandler(req, callback));

      req.on('socket', function(socket) {
        socket.on((isInsecureConnection ? 'connect' : 'secureConnect'), function() {
          // Send payload; we're safe:
          req.write(requestData);
          req.end();
        });
      });
    }
  },

};

module.exports = FusebillResource;
