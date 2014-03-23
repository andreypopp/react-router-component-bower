;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['react'], factory);
  } else {
    root.ReactRouter = factory(root.React);
  }
})(this, function(React) {

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

!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ReactRouter=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

var Router                    = _dereq_('./lib/Router');
var Route                     = _dereq_('./lib/Route');
var Link                      = _dereq_('./lib/Link');

var RouterMixin               = _dereq_('./lib/RouterMixin');
var AsyncRouteRenderingMixin  = _dereq_('./lib/AsyncRouteRenderingMixin');
var RouteRenderingMixin       = _dereq_('./lib/RouteRenderingMixin');

var NavigatableMixin          = _dereq_('./lib/NavigatableMixin');

var Environment               = _dereq_('./lib/Environment');

module.exports = {
  Locations: Router.Locations,
  Pages: Router.Pages,

  Location: Route.Route,
  Page: Route.Route,
  NotFound: Route.NotFound,

  Link: Link,

  Environment: Environment,

  RouterMixin: RouterMixin,
  RouteRenderingMixin: RouteRenderingMixin,
  AsyncRouteRenderingMixin: AsyncRouteRenderingMixin,

  NavigatableMixin: NavigatableMixin
};

},{"./lib/AsyncRouteRenderingMixin":2,"./lib/Environment":3,"./lib/Link":4,"./lib/NavigatableMixin":5,"./lib/Route":6,"./lib/RouteRenderingMixin":7,"./lib/Router":8,"./lib/RouterMixin":9}],2:[function(_dereq_,module,exports){
"use strict";

var prefetchAsyncState  = _dereq_('react-async/lib/prefetchAsyncState');
var isAsyncComponent    = _dereq_('react-async/lib/isAsyncComponent');
var cloneWithProps      = (window.__ReactShim.cloneWithProps);

/**
 * Mixin for router components which prefetches state of async components
 * (as in react-async).
 */
var AsyncRouteRenderingMixin = {

  shouldComponentUpdate: function(nextProps, nextState) {

    if (nextState.pendingChildren) {
      return true;
    }

    var match = nextState.match;
    var handler = match.getHandler(true);

    if (handler && isAsyncComponent(handler)) {

      prefetchAsyncState(handler, function(err, handler) {
        // check if we router is still mounted and have the same match in state
        // as we started fetching state with
        if (this.isMounted() && this.state.match === match) {

          this.replaceState({
            match: this.state.match,
            prefix: this.state.prefix,
            navigation: this.state.navigation,
            pendingChildren: handler
          });

        }
      }.bind(this));

      return false;
    }

    return true;
  },

  renderRouteHandler: function() {
    if (this.state.pendingChildren) {
      var ref = this.state.match.route && this.state.match.route.ref;
      return cloneWithProps(this.state.pendingChildren, {ref: ref});
    } else {
      return this.state.match.getHandler();
    }
  }

};

module.exports = AsyncRouteRenderingMixin;

},{"react-async/lib/isAsyncComponent":11,"react-async/lib/prefetchAsyncState":12}],3:[function(_dereq_,module,exports){
"use strict";
/**
 * Routing environment.
 *
 * It specifies how routers read its state from DOM and synchronise it back.
 */

var ReactUpdates          = (window.__ReactShim.ReactUpdates);
var emptyFunction         = (window.__ReactShim.emptyFunction);
var ExecutionEnvironment  = (window.__ReactShim.ExecutionEnvironment);

/**
 * Base abstract class for a routing environment.
 *
 * @private
 */
function Environment() {
  this.routers = [];
  this.path = this.getPath();
}

/**
 * Notify routers about the change.
 *
 * @param {Object} navigation
 * @param {Function} cb
 */
Environment.prototype.notify = function notify(navigation, cb) {
  var latch = this.routers.length;

  if (latch === 0) {
    return cb && cb();
  }

  function callback() {
    latch -= 1;
    if (cb && latch === 0) {
      cb();
    }
  }

  ReactUpdates.batchedUpdates(function() {
    for (var i = 0, len = this.routers.length; i < len; i++) {
      this.routers[i].setPath(this.path, navigation, callback);
    }
  }.bind(this));
}

Environment.prototype.makeHref = function makeHref(path) {
  return path;
}

Environment.prototype.navigate = function navigate(path, navigation, cb) {
  if (typeof navigation === 'function' && cb === undefined) {
    cb = navigation;
    navigation = {};
  }
  return this.setPath(path, navigation, cb);
}

Environment.prototype.setPath = function(path, navigation, cb) {
  if (!navigation.isPopState) {
    if (navigation.replace) {
      this.replaceState(path, navigation);
    } else {
      this.pushState(path, navigation);
    }
  }
  this.path = path;
  this.notify(navigation, cb);
}

/**
 * Register router with an environment.
 */
Environment.prototype.register = function register(router) {
  if (this.routers.length === 0) {
    this.start();
  }

  if (!router.getParentRouter()) {
    this.routers.push(router);
  }
}

/**
 * Unregister router from an environment.
 */
Environment.prototype.unregister = function unregister(router) {
  if (this.routers.indexOf(router) > -1) {
    this.routers.splice(this.routers.indexOf(router), 1);
  }

  if (this.routers.length === 0) {
    this.stop();
  }
}

/**
 * Routing environment which routes by `location.pathname`.
 */
function PathnameEnvironment() {
  Environment.call(this);
}

PathnameEnvironment.prototype = Object.create(Environment.prototype);
PathnameEnvironment.prototype.constructor = PathnameEnvironment;

PathnameEnvironment.prototype.getPath = function() {
  return window.location.pathname;
}

PathnameEnvironment.prototype.pushState = function(path, navigation) {
  window.history.pushState({}, '', path);
}

PathnameEnvironment.prototype.replaceState = function(path, navigation) {
  window.history.replaceState({}, '', path);
}

PathnameEnvironment.prototype.start = function() {
  window.addEventListener('popstate', this.onPopState.bind(this));
};

PathnameEnvironment.prototype.stop = function() {
  window.removeEventListener('popstate', this.onPopState.bind(this));
};

PathnameEnvironment.prototype.onPopState = function(e) {
  var path = window.location.pathname;

  if (this.path !== path) {
    this.setPath(path, {isPopState: true});
  }
};

/**
 * Routing environment which routes by `location.hash`.
 */
function HashEnvironment() {
  Environment.call(this);
}

HashEnvironment.prototype = Object.create(Environment.prototype);
HashEnvironment.prototype.constructor = HashEnvironment;

HashEnvironment.prototype.getPath = function() {
  return window.location.hash.slice(1) || '/';
};

HashEnvironment.prototype.pushState = function(path, navigation) {
  window.location.hash = path;
}

HashEnvironment.prototype.replaceState = function(path, navigation) {
  var href = window.location.href.replace(/(javascript:|#).*$/, '');
  window.location.replace(href + '#' + path);
}

HashEnvironment.prototype.start = function() {
  window.addEventListener('hashchange', this.onHashChange.bind(this));
};

HashEnvironment.prototype.stop = function() {
  window.removeEventListener('hashchange', this.onHashChange.bind(this));
};

HashEnvironment.prototype.onHashChange = function() {
  var path = this.getPath();

  if (this.path !== path) {
    this.setPath(path, {isPopState: true});
  }
};

/**
 * Dummy routing environment which provides no path.
 *
 * Should be used on server or in WebWorker.
 */
function DummyEnvironment() {
  Environment.call(this);
}

DummyEnvironment.prototype = Object.create(Environment.prototype);
DummyEnvironment.prototype.constructor = DummyEnvironment;

DummyEnvironment.prototype.getPath = emptyFunction.thatReturnsNull;

DummyEnvironment.prototype.setPath = function(path, cb) {
  this.path = path;
  cb();
};

DummyEnvironment.prototype.start = emptyFunction;

DummyEnvironment.prototype.stop = emptyFunction;

/**
 * Mixin for routes to keep attached to an environment.
 *
 * This mixin assumes the environment is passed via props.
 */
var Mixin = {

  componentDidMount: function() {
    this.getEnvironment().register(this);
  },

  componentWillUnmount: function() {
    this.getEnvironment().unregister(this);
  }
};

var pathnameEnvironment;
var hashEnvironment;
var defaultEnvironment;
var dummyEnvironment;

if (ExecutionEnvironment.canUseDOM) {

  pathnameEnvironment = new PathnameEnvironment();
  hashEnvironment     = new HashEnvironment();
  defaultEnvironment  = (window.history !== undefined) ?
                        pathnameEnvironment :
                        hashEnvironment; 

} else {

  dummyEnvironment    = new DummyEnvironment();
  pathnameEnvironment = dummyEnvironment;
  hashEnvironment     = dummyEnvironment;
  defaultEnvironment  = dummyEnvironment;

}

module.exports = {
  pathnameEnvironment: pathnameEnvironment,
  hashEnvironment: hashEnvironment,
  defaultEnvironment: defaultEnvironment,
  dummyEnvironment: dummyEnvironment,

  Environment: Environment,
  PathnameEnvironment: PathnameEnvironment,
  HashEnvironment: HashEnvironment,

  Mixin: Mixin
};

},{}],4:[function(_dereq_,module,exports){
"use strict";

var React             = (window.__ReactShim.React);
var NavigatableMixin  = _dereq_('./NavigatableMixin');
var Environment       = _dereq_('./Environment');

/**
 * Link.
 *
 * A basic navigatable component which renders into <a> DOM element and handles
 * onClick event by transitioning onto different route (defined by
 * this.props.href).
 */
var Link = React.createClass({
  mixins: [NavigatableMixin],

  displayName: 'Link',

  propTypes: {
    href: React.PropTypes.string.isRequired,
    global: React.PropTypes.bool,
    globalHash: React.PropTypes.bool
  },

  onClick: function(e) {
    if (this.props.onClick) {
      this.props.onClick(e);
    }
    if (!e.defaultPrevented) {
      e.preventDefault();
      this._navigate(this.props.href, function(err) {
        if (err) {
          throw err;
        }
      });
    }
  },

  _navigationParams: function() {
    var params = {};
    for (var k in this.props) {
      if (!this.constructor.propTypes[k]) {
        params[k] = this.props[k];
      }
    }
    return params;
  },

  _createHref: function() {
    return this.props.global ?
      Environment.defaultEnvironment.makeHref(this.props.href) :
      this.makeHref(this.props.href);
  },

  _navigate: function(path, cb) {
    if (this.props.globalHash) {
      return Environment.hashEnvironment.navigate(path, cb);
    }

    if (this.props.global) {
      return Environment.defaultEnvironment.navigate(path, cb);
    }

    return this.navigate(path, this._navigationParams(), cb);
  },

  render: function() {
    var props = {
      onClick: this.onClick,
      href: this._createHref()
    };
    return this.transferPropsTo(React.DOM.a(props, this.props.children));
  }
});

module.exports = Link;

},{"./Environment":3,"./NavigatableMixin":5}],5:[function(_dereq_,module,exports){
"use strict";

var React       = (window.__ReactShim.React);
var Environment = _dereq_('./Environment');


/**
 * NavigatableMixin
 *
 * A mixin for a component which operates in context of a router and can
 * navigate to a different route using `navigate(path, cb)` method.
 */
var NavigatableMixin = {

  contextTypes: {
    router: React.PropTypes.component,
  },

  /**
   * @private
   */
  _getNavigable: function() {
    return this.context.router || Environment.defaultEnvironment;
  },

  getPath: function() {
    return this._getNavigable().getPath();
  },

  navigate: function(path, cb) {
    return this._getNavigable().navigate(path, cb);
  },

  makeHref: function(path) {
    return this._getNavigable().makeHref(path);
  }
};

module.exports = NavigatableMixin;

},{"./Environment":3}],6:[function(_dereq_,module,exports){
"use strict";

var invariant = (window.__ReactShim.invariant);
var merge     = (window.__ReactShim.merge);
var mergeInto = (window.__ReactShim.mergeInto);

/**
 * Create a new route descriptor from a specification.
 *
 * @param {Object} spec
 * @param {?Object} defaults
 */
function createRoute(spec, defaults) {

  var handler = spec.handler;
  var path = spec.path;
  var ref = spec.ref;
  var props = merge({}, spec);

  delete props.path;
  delete props.handler;
  delete props.ref;

  var route = {
    path: path,
    handler: handler,
    props: props,
    ref: ref
  };

  if (defaults) {
    mergeInto(route, defaults);
  }

  invariant(
    typeof route.handler === 'function',
    "Route handler should be a component or a function but got: %s", handler
  );

  invariant(
    route.path !== undefined,
    "Route should have an URL pattern specified: %s", handler
  );

  return route;
}

/**
 * Regular route descriptor.
 *
 * @param {Object} spec
 */
function Route(spec) {
  return createRoute(spec);
}

/**
 * Catch all route descriptor.
 *
 * @param {Object} spec
 */
function NotFound(spec) {
  return createRoute(spec, {path: null});
}

module.exports = {
  Route: Route,
  NotFound: NotFound
};

},{}],7:[function(_dereq_,module,exports){
"use strict";

/**
 * Mixin for routers which implements the simplest rendering strategy.
 */
var RouteRenderingMixin = {

  renderRouteHandler: function() {
    return this.state.match.getHandler();
  }

};

module.exports = RouteRenderingMixin;

},{}],8:[function(_dereq_,module,exports){
"use strict";

var React                     = (window.__ReactShim.React);
var RouterMixin               = _dereq_('./RouterMixin');
var AsyncRouteRenderingMixin  = _dereq_('./AsyncRouteRenderingMixin');

/**
 * Create a new router class
 *
 * @param {String} name
 * @param {ReactComponent} component
 */
function createRouter(name, component) {

  return React.createClass({

    mixins: [RouterMixin, AsyncRouteRenderingMixin],

    displayName: name,

    getRoutes: function(props) {
      return props.children;
    },

    getDefaultProps: function() {
      return {
        component: component
      }
    },

    render: function() {
      var handler = this.renderRouteHandler();
      return this.transferPropsTo(this.props.component(null, handler));
    }
  });
}

module.exports = {
  createRouter: createRouter,
  Locations: createRouter('Locations', React.DOM.div),
  Pages: createRouter('Pages', React.DOM.body),
}

},{"./AsyncRouteRenderingMixin":2,"./RouterMixin":9}],9:[function(_dereq_,module,exports){
"use strict";

var React         = (window.__ReactShim.React);
var invariant     = (window.__ReactShim.invariant);
var emptyFunction = (window.__ReactShim.emptyFunction);
var matchRoutes   = _dereq_('./matchRoutes');
var Environment   = _dereq_('./Environment');

var RouterMixin = {
  mixins: [Environment.Mixin],

  propTypes: {
    path: React.PropTypes.string,
    contextual: React.PropTypes.bool,
    onBeforeNavigation: React.PropTypes.func,
    onNavigation: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      onBeforeNavigation: emptyFunction,
      onNavigation: emptyFunction
    };
  },

  childContextTypes: {
    router: React.PropTypes.component
  },

  getChildContext: function() {
    return {
      router: this
    };
  },

  contextTypes: {
    router: React.PropTypes.component
  },

  getInitialState: function() {
    return this.getRouterState(this.props);
  },

  componentWillReceiveProps: function(nextProps) {
    var nextState = this.getRouterState(nextProps);
    this.replaceState(nextState);
  },

  getRouterState: function(props) {
    var path;
    var prefix;

    var parent = this.getParentRouter();

    if (props.contextual && parent) {

      var match = parent.getMatch();

      invariant(
        props.path || isString(match.unmatchedPath),
        "contextual router has nothing to match on: %s", match.unmatchedPath
      );

      path = props.path || match.unmatchedPath;
      prefix = match.matchedPath;
    } else {

      path = props.path || this.getEnvironment().getPath();

      invariant(
        isString(path),
        ("router operate in environment which cannot provide path, " +
         "pass it a path prop; or probably you want to make it contextual")
      );

      prefix = '';
    }

    if (path[0] !== '/') {
      path = '/' + path;
    }

    return {
      match: matchRoutes(this.getRoutes(props), path),
      prefix: prefix,
      navigation: {}
    };
  },

  getEnvironment: function() {
    if (this.props.environment) {
      return this.props.environment;
    }
    if (this.props.hash) {
      return Environment.hashEnvironment;
    }
    if (this.props.contextual && this.context.router) {
      return this.context.router.getEnvironment();
    }
    return Environment.defaultEnvironment;
  },

  /**
   * Return parent router or undefined.
   */
  getParentRouter: function() {
    var current = this.context.router;
    var environment = this.getEnvironment();

    while (current) {
      if (current.getEnvironment() === environment) {
        return current;
      }
    }
  },

  /**
   * Return current match.
   */
  getMatch: function() {
    return this.state.match;
  },

  /**
   * Make href scoped for the current router.
   */
  makeHref: function(href) {
    return join(this.state.prefix, href);
  },

  /**
   * Navigate to a path
   *
   * @param {String} path
   * @param {Callback} cb
   */
  navigate: function(path, navigation, cb) {
    if (typeof navigation === 'function' && cb === undefined) {
      cb = navigation;
      navigation = {};
    }
    navigation = navigation || {};
    path = join(this.state.prefix, path);
    this.getEnvironment().setPath(path, navigation, cb);
  },

  /**
   * Set new path.
   *
   * This function is called by environment.
   *
   * @private
   *
   * @param {String} path
   * @param {String} path
   * @param {Callback} cb
   */
  setPath: function(path, navigation, cb) {
    this.props.onBeforeNavigation(path, navigation);
    this.replaceState({
      match: matchRoutes(this.getRoutes(this.props), path),
      prefix: this.state.prefix,
      navigation: navigation
    }, function() {
      this.props.onNavigation();
      cb();
    }.bind(this));
  },

  /**
   * Return the current path
   */
  getPath: function () {
    return this.state.match.path;
  }

};

function join(a, b) {
  return (a + b).replace(/\/\//g, '/');
}

function isString(o) {
  return Object.prototype.toString.call(o) === '[object String]';
}

module.exports = RouterMixin;

},{"./Environment":3,"./matchRoutes":10}],10:[function(_dereq_,module,exports){
"use strict";

var pattern   = _dereq_('url-pattern');
var mergeInto = (window.__ReactShim.mergeInto);
var invariant = (window.__ReactShim.invariant);

/**
 * Match rotues against a path
 *
 * @param {Array.<Route>} routes
 * @param {String} path
 */
function matchRoutes(routes, path) {
  var match, page, notFound;

  if (!Array.isArray(routes)) {
    routes = [routes];
  }

  for (var i = 0, len = routes.length; i < len; i++) {
    var current = routes[i];

    if ("development" !== "production") {
      invariant(
        current.handler !== undefined && current.path !== undefined,
        "Router should contain either Route or NotFound components " +
        "as routes")
    }

    if (current.path) {
      current.pattern = current.pattern || pattern(current.path);
      if (!page) {
        match = current.pattern.match(path);
        if (match) {
          page = current;
        }
      }
    }
    if (!notFound && current.path === null) {
      notFound = current;
    }
  }

  return new Match(
    path,
    page ? page : notFound ? notFound : null,
    match
  );
}

/**
 * Match object
 *
 * @private
 */
function Match(path, route, match) {
  this.path = path;
  this.route = route;
  this.match = match;

  this.unmatchedPath = this.match && this.match._ ?
    this.match._[0] :
    null;

  this.matchedPath = this.unmatchedPath ?
    this.path.substring(0, this.path.length - this.unmatchedPath.length) :
    this.path;
}

Match.prototype.getHandler = function(ignoreRef) {
  var props = {
    ref: !ignoreRef && this.route ? this.route.ref : undefined
  };
  if (this.route && this.match) {
    mergeInto(props, this.match);
    mergeInto(props, this.route.props);
  }
  return this.route ? this.route.handler(props) : undefined;
}

module.exports = matchRoutes;

},{"url-pattern":26}],11:[function(_dereq_,module,exports){
"use strict";

/**
 * Check if a component is an async component.
 *
 * @param {ReactComponent} component
 */
function isAsyncComponent(component) {
  return typeof Object.getPrototypeOf(component).getInitialStateAsync === 'function';
}

module.exports = isAsyncComponent;

},{}],12:[function(_dereq_,module,exports){
"use strict";

var invariant         = _dereq_('react/lib/invariant');
var cloneWithProps    = _dereq_('react/lib/cloneWithProps');
var isAsyncComponent  = _dereq_('./isAsyncComponent');

/**
 * Prefetch an async state for an unmounted async component instance.
 *
 * @param {ReactComponent} component
 * @param {Callback} cb
 */
function prefetchAsyncState(component, cb) {

  invariant(
    isAsyncComponent(component),
    "%s should be an async component to be able to prefetch async state, " +
    "but getInitialStateAsync(cb) method is missing or is not a function",
    component.displayName
  );

  var getInitialStateAsync = Object.getPrototypeOf(component).getInitialStateAsync;

  getInitialStateAsync.call(component, function(err, asyncState) {
    if (err) {
      return cb(err);
    }

    cb(null, cloneWithProps(component, {asyncState: asyncState}));
  });
}

module.exports = prefetchAsyncState;

},{"./isAsyncComponent":11,"react/lib/cloneWithProps":14,"react/lib/invariant":17}],13:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTransferer
 */

"use strict";

var emptyFunction = _dereq_("./emptyFunction");
var invariant = _dereq_("./invariant");
var joinClasses = _dereq_("./joinClasses");
var merge = _dereq_("./merge");

/**
 * Creates a transfer strategy that will merge prop values using the supplied
 * `mergeStrategy`. If a prop was previously unset, this just sets it.
 *
 * @param {function} mergeStrategy
 * @return {function}
 */
function createTransferStrategy(mergeStrategy) {
  return function(props, key, value) {
    if (!props.hasOwnProperty(key)) {
      props[key] = value;
    } else {
      props[key] = mergeStrategy(props[key], value);
    }
  };
}

/**
 * Transfer strategies dictate how props are transferred by `transferPropsTo`.
 * NOTE: if you add any more exceptions to this list you should be sure to
 * update `cloneWithProps()` accordingly.
 */
var TransferStrategies = {
  /**
   * Never transfer `children`.
   */
  children: emptyFunction,
  /**
   * Transfer the `className` prop by merging them.
   */
  className: createTransferStrategy(joinClasses),
  /**
   * Never transfer the `key` prop.
   */
  key: emptyFunction,
  /**
   * Never transfer the `ref` prop.
   */
  ref: emptyFunction,
  /**
   * Transfer the `style` prop (which is an object) by merging them.
   */
  style: createTransferStrategy(merge)
};

/**
 * ReactPropTransferer are capable of transferring props to another component
 * using a `transferPropsTo` method.
 *
 * @class ReactPropTransferer
 */
var ReactPropTransferer = {

  TransferStrategies: TransferStrategies,

  /**
   * Merge two props objects using TransferStrategies.
   *
   * @param {object} oldProps original props (they take precedence)
   * @param {object} newProps new props to merge in
   * @return {object} a new object containing both sets of props merged.
   */
  mergeProps: function(oldProps, newProps) {
    var props = merge(oldProps);

    for (var thisKey in newProps) {
      if (!newProps.hasOwnProperty(thisKey)) {
        continue;
      }

      var transferStrategy = TransferStrategies[thisKey];

      if (transferStrategy && TransferStrategies.hasOwnProperty(thisKey)) {
        transferStrategy(props, thisKey, newProps[thisKey]);
      } else if (!props.hasOwnProperty(thisKey)) {
        props[thisKey] = newProps[thisKey];
      }
    }

    return props;
  },

  /**
   * @lends {ReactPropTransferer.prototype}
   */
  Mixin: {

    /**
     * Transfer props from this component to a target component.
     *
     * Props that do not have an explicit transfer strategy will be transferred
     * only if the target component does not already have the prop set.
     *
     * This is usually used to pass down props to a returned root component.
     *
     * @param {ReactComponent} component Component receiving the properties.
     * @return {ReactComponent} The supplied `component`.
     * @final
     * @protected
     */
    transferPropsTo: function(component) {
      ("production" !== "development" ? invariant(
        component._owner === this,
        '%s: You can\'t call transferPropsTo() on a component that you ' +
        'don\'t own, %s. This usually means you are calling ' +
        'transferPropsTo() on a component passed in as props or children.',
        this.constructor.displayName,
        component.constructor.displayName
      ) : invariant(component._owner === this));

      component.props = ReactPropTransferer.mergeProps(
        component.props,
        this.props
      );

      return component;
    }

  }
};

module.exports = ReactPropTransferer;

},{"./emptyFunction":16,"./invariant":17,"./joinClasses":18,"./merge":21}],14:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @typechecks
 * @providesModule cloneWithProps
 */

"use strict";

var ReactPropTransferer = _dereq_("./ReactPropTransferer");

var keyOf = _dereq_("./keyOf");
var warning = _dereq_("./warning");

var CHILDREN_PROP = keyOf({children: null});

/**
 * Sometimes you want to change the props of a child passed to you. Usually
 * this is to add a CSS class.
 *
 * @param {object} child child component you'd like to clone
 * @param {object} props props you'd like to modify. They will be merged
 * as if you used `transferPropsTo()`.
 * @return {object} a clone of child with props merged in.
 */
function cloneWithProps(child, props) {
  if ("production" !== "development") {
    ("production" !== "development" ? warning(
      !child.props.ref,
      'You are calling cloneWithProps() on a child with a ref. This is ' +
      'dangerous because you\'re creating a new child which will not be ' +
      'added as a ref to its parent.'
    ) : null);
  }

  var newProps = ReactPropTransferer.mergeProps(props, child.props);

  // Use `child.props.children` if it is provided.
  if (!newProps.hasOwnProperty(CHILDREN_PROP) &&
      child.props.hasOwnProperty(CHILDREN_PROP)) {
    newProps.children = child.props.children;
  }

  return child.constructor.ConvenienceConstructor(newProps);
}

module.exports = cloneWithProps;

},{"./ReactPropTransferer":13,"./keyOf":20,"./warning":24}],15:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule copyProperties
 */

/**
 * Copy properties from one or more objects (up to 5) into the first object.
 * This is a shallow copy. It mutates the first object and also returns it.
 *
 * NOTE: `arguments` has a very significant performance penalty, which is why
 * we don't support unlimited arguments.
 */
function copyProperties(obj, a, b, c, d, e, f) {
  obj = obj || {};

  if ("production" !== "development") {
    if (f) {
      throw new Error('Too many arguments passed to copyProperties');
    }
  }

  var args = [a, b, c, d, e];
  var ii = 0, v;
  while (args[ii]) {
    v = args[ii++];
    for (var k in v) {
      obj[k] = v[k];
    }

    // IE ignores toString in object iteration.. See:
    // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
    if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
        (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
      obj.toString = v.toString;
    }
  }

  return obj;
}

module.exports = copyProperties;

},{}],16:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule emptyFunction
 */

var copyProperties = _dereq_("./copyProperties");

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

copyProperties(emptyFunction, {
  thatReturns: makeEmptyFunction,
  thatReturnsFalse: makeEmptyFunction(false),
  thatReturnsTrue: makeEmptyFunction(true),
  thatReturnsNull: makeEmptyFunction(null),
  thatReturnsThis: function() { return this; },
  thatReturnsArgument: function(arg) { return arg; }
});

module.exports = emptyFunction;

},{"./copyProperties":15}],17:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition) {
  if (!condition) {
    var error = new Error(
      'Minified exception occured; use the non-minified dev environment for ' +
      'the full error message and additional helpful warnings.'
    );
    error.framesToPop = 1;
    throw error;
  }
};

if ("production" !== "development") {
  invariant = function(condition, format, a, b, c, d, e, f) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }

    if (!condition) {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      var error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.framesToPop = 1; // we don't care about invariant's own frame
      throw error;
    }
  };
}

module.exports = invariant;

},{}],18:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule joinClasses
 * @typechecks static-only
 */

"use strict";

/**
 * Combines multiple className strings into one.
 * http://jsperf.com/joinclasses-args-vs-array
 *
 * @param {...?string} classes
 * @return {string}
 */
function joinClasses(className/*, ... */) {
  if (!className) {
    className = '';
  }
  var nextClass;
  var argLength = arguments.length;
  if (argLength > 1) {
    for (var ii = 1; ii < argLength; ii++) {
      nextClass = arguments[ii];
      nextClass && (className += ' ' + nextClass);
    }
  }
  return className;
}

module.exports = joinClasses;

},{}],19:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

"use strict";

var invariant = _dereq_("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  ("production" !== "development" ? invariant(
    obj instanceof Object && !Array.isArray(obj),
    'keyMirror(...): Argument must be an object.'
  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{"./invariant":17}],20:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],21:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule merge
 */

"use strict";

var mergeInto = _dereq_("./mergeInto");

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
var merge = function(one, two) {
  var result = {};
  mergeInto(result, one);
  mergeInto(result, two);
  return result;
};

module.exports = merge;

},{"./mergeInto":23}],22:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeHelpers
 *
 * requiresPolyfills: Array.isArray
 */

"use strict";

var invariant = _dereq_("./invariant");
var keyMirror = _dereq_("./keyMirror");

/**
 * Maximum number of levels to traverse. Will catch circular structures.
 * @const
 */
var MAX_MERGE_DEPTH = 36;

/**
 * We won't worry about edge cases like new String('x') or new Boolean(true).
 * Functions are considered terminals, and arrays are not.
 * @param {*} o The item/object/value to test.
 * @return {boolean} true iff the argument is a terminal.
 */
var isTerminal = function(o) {
  return typeof o !== 'object' || o === null;
};

var mergeHelpers = {

  MAX_MERGE_DEPTH: MAX_MERGE_DEPTH,

  isTerminal: isTerminal,

  /**
   * Converts null/undefined values into empty object.
   *
   * @param {?Object=} arg Argument to be normalized (nullable optional)
   * @return {!Object}
   */
  normalizeMergeArg: function(arg) {
    return arg === undefined || arg === null ? {} : arg;
  },

  /**
   * If merging Arrays, a merge strategy *must* be supplied. If not, it is
   * likely the caller's fault. If this function is ever called with anything
   * but `one` and `two` being `Array`s, it is the fault of the merge utilities.
   *
   * @param {*} one Array to merge into.
   * @param {*} two Array to merge from.
   */
  checkMergeArrayArgs: function(one, two) {
    ("production" !== "development" ? invariant(
      Array.isArray(one) && Array.isArray(two),
      'Tried to merge arrays, instead got %s and %s.',
      one,
      two
    ) : invariant(Array.isArray(one) && Array.isArray(two)));
  },

  /**
   * @param {*} one Object to merge into.
   * @param {*} two Object to merge from.
   */
  checkMergeObjectArgs: function(one, two) {
    mergeHelpers.checkMergeObjectArg(one);
    mergeHelpers.checkMergeObjectArg(two);
  },

  /**
   * @param {*} arg
   */
  checkMergeObjectArg: function(arg) {
    ("production" !== "development" ? invariant(
      !isTerminal(arg) && !Array.isArray(arg),
      'Tried to merge an object, instead got %s.',
      arg
    ) : invariant(!isTerminal(arg) && !Array.isArray(arg)));
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkMergeLevel: function(level) {
    ("production" !== "development" ? invariant(
      level < MAX_MERGE_DEPTH,
      'Maximum deep merge depth exceeded. You may be attempting to merge ' +
      'circular structures in an unsupported way.'
    ) : invariant(level < MAX_MERGE_DEPTH));
  },

  /**
   * Checks that the supplied merge strategy is valid.
   *
   * @param {string} Array merge strategy.
   */
  checkArrayStrategy: function(strategy) {
    ("production" !== "development" ? invariant(
      strategy === undefined || strategy in mergeHelpers.ArrayStrategies,
      'You must provide an array strategy to deep merge functions to ' +
      'instruct the deep merge how to resolve merging two arrays.'
    ) : invariant(strategy === undefined || strategy in mergeHelpers.ArrayStrategies));
  },

  /**
   * Set of possible behaviors of merge algorithms when encountering two Arrays
   * that must be merged together.
   * - `clobber`: The left `Array` is ignored.
   * - `indexByIndex`: The result is achieved by recursively deep merging at
   *   each index. (not yet supported.)
   */
  ArrayStrategies: keyMirror({
    Clobber: true,
    IndexByIndex: true
  })

};

module.exports = mergeHelpers;

},{"./invariant":17,"./keyMirror":19}],23:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeInto
 * @typechecks static-only
 */

"use strict";

var mergeHelpers = _dereq_("./mergeHelpers");

var checkMergeObjectArg = mergeHelpers.checkMergeObjectArg;

/**
 * Shallow merges two structures by mutating the first parameter.
 *
 * @param {object} one Object to be merged into.
 * @param {?object} two Optional object with properties to merge from.
 */
function mergeInto(one, two) {
  checkMergeObjectArg(one);
  if (two != null) {
    checkMergeObjectArg(two);
    for (var key in two) {
      if (!two.hasOwnProperty(key)) {
        continue;
      }
      one[key] = two[key];
    }
  }
}

module.exports = mergeInto;

},{"./mergeHelpers":22}],24:[function(_dereq_,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule warning
 */

"use strict";

var emptyFunction = _dereq_("./emptyFunction");

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if ("production" !== "development") {
  warning = function(condition, format ) {var args=Array.prototype.slice.call(arguments,2);
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (!condition) {
      var argIndex = 0;
      console.warn('Warning: ' + format.replace(/%s/g, function()  {return args[argIndex++];}));
    }
  };
}

module.exports = warning;

},{"./emptyFunction":16}],25:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
var common,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module.exports = common = {
  getNames: function(arg) {
    var name, names, regex, results;
    if (arg instanceof RegExp) {
      return [];
    }
    regex = /((:?:[^\/]+)|(?:[\*]))/g;
    names = [];
    results = regex.exec(arg);
    while (results != null) {
      name = results[1].slice(1);
      if (name === '_') {
        throw new TypeError(":_ can't be used as a pattern name in pattern " + arg);
      }
      if (__indexOf.call(names, name) >= 0) {
        throw new TypeError("duplicate pattern name :" + name + " in pattern " + arg);
      }
      names.push(name || '_');
      results = regex.exec(arg);
    }
    return names;
  },
  toRegexString: function(arg) {
    common.getNames(arg).forEach(function(name) {
      return arg = arg.replace(':' + name, '([^\/]+)');
    });
    return '^' + arg.replace(/\*/g, '(.*)') + '$';
  }
};

},{}],26:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
var common, patternPrototype;

common = _dereq_('./common');

patternPrototype = {
  match: function(url) {
    var bound, captured, i, match, name, value, _i, _len;
    match = this.regex.exec(url);
    if (match == null) {
      return null;
    }
    captured = match.slice(1);
    if (this.isRegex) {
      return captured;
    }
    bound = {};
    for (i = _i = 0, _len = captured.length; _i < _len; i = ++_i) {
      value = captured[i];
      name = this.names[i];
      if (name === '_') {
        if (bound._ == null) {
          bound._ = [];
        }
        bound._.push(value);
      } else {
        bound[name] = value;
      }
    }
    return bound;
  }
};

module.exports = function(arg) {
  var isRegex, p;
  isRegex = arg instanceof RegExp;
  if (!(('string' === typeof arg) || isRegex)) {
    throw new TypeError('argument must be a regex or a string');
  }
  p = Object.create(patternPrototype);
  p.isRegex = isRegex;
  p.regex = isRegex ? arg : new RegExp(common.toRegexString(arg));
  if (!isRegex) {
    p.names = common.getNames(arg);
  }
  return p;
};

},{"./common":25}]},{},[1])
(1)
});});
