'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'subscriptionactivation',
  includeBasic: [],
  activate: fusebillMethod({
    method: 'POST',
    path: function(urlData) {
      var url = '/' + urlData.subscriptionId;
      if (urlData.preview && typeof urlData.preview === 'boolean') {
        url = url + '?preview=' + urlData.preview;
      }
      if (urlData.temporarilyDisableAutoPost && typeof urlData.temporarilyDisableAutoPost === 'boolean') {
        url = url + '?temporarilyDisableAutoPost=' + urlData.temporarilyDisableAutoPost;
      }
      return url;
    },
    urlParams: ['subscriptionId', 'optional!preview', 'optional!temporarilyDisableAutoPost'],
  }),
});
