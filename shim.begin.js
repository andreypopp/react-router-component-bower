;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['react', 'react-async'], factory);
  } else {
    root.ReactRouter = factory(root.React, root.ReactAsync);
  }
})(this, function(React, ReactAsync) {

  var __ReactShim = window.__ReactShim = window.__ReactShim || {};

  __ReactShim.React = React;

  __ReactShim.cloneWithProps = React.addons.cloneWithProps;

  __ReactShim.invariant = function(check, msg) {
    if (!check) {
      throw new Error(msg);
    }
  }

  var mergeInto = __ReactShim.mergeInto = function(dst, src) {
    for (var k in src) {
      if (src.hasOwnProperty(k)) {
        dst[k] = src[k];
      }
    }
  }

  __ReactShim.merge = function(a, b) {
    var c = {};
    mergeInto(c, a);
    mergeInto(c, b);
    return c;
  }

  __ReactShim.emptyFunction = function() {
  }

  __ReactShim.ExecutionEnvironment = {
    canUseDOM: true
  };

  __ReactShim.ReactUpdates = {
    batchedUpdates: function(cb) { cb(); }
  };

  __ReactAsyncShim.isAsyncComponent = ReactAsync.isAsyncComponent;
  __ReactAsyncShim.prefetchAsyncState = ReactAsync.prefetchAsyncState;

  return
