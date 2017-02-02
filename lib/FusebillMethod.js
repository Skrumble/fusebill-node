'use strict';

var _ = require('lodash');
var path = require('path');
var utils = require('./utils');
var OPTIONAL_REGEX = /^optional!/;

/**
 * Create an API method from the declared spec.
 *
 * @param [spec.method='GET'] Request Method (POST, GET, DELETE, PUT)
 * @param [spec.path=''] Path to be appended to the API BASE_PATH, joined with
 *  the instance's path (e.g. 'charges' or 'customers')
 * @param [spec.required=[]] Array of required arguments in the order that they
 *  must be passed by the consumer of the API. Subsequent optional arguments are
 *  optionally passed through a hash (Object) as the penultimate argument
 *  (preceeding the also-optional callback argument
 */
function fusebillMethod(spec) {
  var commandPath = typeof spec.path == 'function' ? spec.path
                  : utils.makeURLInterpolator(spec.path || '');
  var requestMethod = (spec.method || 'GET').toUpperCase();
  var urlParams = spec.urlParams || [];

  return function() {
    var self = this;
    var args = [].slice.call(arguments);

    var callback = typeof args[args.length - 1] == 'function' && args.pop();
    var deferred = this.createDeferred(callback);
    var urlData = this.createUrlData();

    for (var i = 0, l = urlParams.length; i < l; ++i) {
      // Note that we shift the args array after every iteration so this just
      // grabs the "next" argument for use as a URL parameter.
      var arg = args[0];

      var param = urlParams[i];

      var isOptional = OPTIONAL_REGEX.test(param);
      param = param.replace(OPTIONAL_REGEX, '');

      // Fusebill uses request query params for PUT and POST methods as well
      // Need to continue on optional arguments if the arg is and object meant for the req.body
      if (arg === undefined || requestMethod !== 'GET' && typeof arg === 'object') {
        if (isOptional) {
          urlData[param] = '';
          continue;
        }

        var err = new Error(
          'Fusebill: Argument "' + urlParams[i] + '" required, but got: ' + arg +
          ' (on API request to ' + requestMethod + ' ' + commandPath + ')'
        );
        deferred.reject(err);
        return deferred.promise;
      }

      urlData[param] = args.shift();
    }

    var data = utils.getDataFromArgs(args);

    var opts = utils.getOptionsFromArgs(args);

    if (args.length) {
      var err = new Error(
        'Fusebill: Unknown arguments (' + args + '). Did you mean to pass an options ' +
        'object? See https://github.com/justinffs/fusebill-node/wiki/Passing-Options.' +
        ' (on API request to ' + requestMethod + ' ' + commandPath + ')'
      );
      deferred.reject(err);
      return deferred.promise;
    }

    var requestPath = this.createFullPath(commandPath, urlData);
    function requestCallback(err, response) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(
          spec.transformResponseData ?
            spec.transformResponseData(response) :
            response
        );
      }
    };

    var options = {headers: _.extend(opts.headers, spec.headers)};

    // Sending the GET query parameters in the req.write did not work so added it to the URL path
    if (requestMethod === 'GET' && !_.isEmpty(data)) {
      var queryParams = Object.keys(data).map(function(key) {
        return key + '=' + data[key];
      }).join('&');
      requestPath += '?' + queryParams;
    }

    /**
     * Fusebill frequently has errors that can be solved by waiting and retrying
     * Adding this retry mechanism here to retry when there are errors
     * TODO: only retry on specific errors
     * @param count
     * @param times
     * @param interval
     */
    function requestWithRetry(count, times, interval)
    {
      self._request(requestMethod, requestPath, data, opts.auth, options, function(err, response) {
        if (!err || err.type !== 'Server' || count >= times) {
          return requestCallback(err, response)
        }

        setTimeout(function()
        {
          count = count++;
          requestWithRetry(count, times, interval)
        }, interval)
      });
    }

    var count = 1;
    var times = 3;
    var interval = 1000;
    requestWithRetry(count, times, interval);

    return deferred.promise;
  };
};

module.exports = fusebillMethod;
