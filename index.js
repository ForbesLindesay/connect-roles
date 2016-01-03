"use strict";

var Promise = require('promise');
var ert = require('ert');
var pathToRegexp = require('path-to-regexp');

module.exports = ConnectRoles;
function ConnectRoles(options) {
  options = options || {};
  this.functionList = [];
  this.failureHandler = options.failureHandler || defaultFailureHandler;
  this.async = options.async || false;
  this.userProperty = options.userProperty || 'user';
  this.matchRelativePaths = options.matchRelativePaths || false;
}

ConnectRoles.prototype.use = function () {
  if (arguments.length === 1) {
    this.use1(arguments[0]);
  } else if (arguments.length === 2) {
    this.use2(arguments[0], arguments[1]);
  } else if (arguments.length === 3) {
    this.use3(arguments[0], arguments[1], arguments[2]);
  } else {
    throw new Error('use can have 1, 2 or 3 arguments, not ' + arguments.length);
  }
};

ConnectRoles.prototype.use1 = function (fn) {
  if (typeof fn !== 'function') throw new TypeError('Expected fn to be of type function');
  this.functionList.push(fn);
};

ConnectRoles.prototype.use2 = function (action, fn) {
  if (typeof action !== 'string') throw new TypeError('Expected action to be of type string');
  if (action[0] === '/') throw new TypeError('action can\'t start with `/`');
  this.use1(function (req, act) {
    if (act === action) {
      return fn(req);
    }
  });
};
ConnectRoles.prototype.use3 = function (action, path, fn) {
  var self = this;
  if (typeof path !== 'string') throw new Error('Expected path to be of type string');
  var keys = [];
  var exp = pathToRegexp(path, keys);
  this.use2(action, function (req) {
    var pathToMatch = null;
    if(self.matchRelativePaths === true) {
      pathToMatch = req.url;
    } else {
      pathToMatch = req.app.path().replace(/\/$/, '') + req.path;
    }

    var match;
    if (match = exp.exec(pathToMatch)) {
      req = Object.create(req);
      req.params = Object.create(req.params || {});
      keys.forEach(function (key, i) {
        req.params[key.name] = match[i + 1];
      });
      return fn(req);
    }
  });
}

ConnectRoles.prototype.can = routeTester('can');
ConnectRoles.prototype.is = routeTester('is');
ConnectRoles.prototype.isAuthenticated = function () {
  var msg = 'Expected req.isAuthenticated to be a function. '
          + 'If you are using passport, make sure the passport '
          + 'middleware comes first';
  var res = function (req, res, next) {
    if (typeof req.isAuthenticated !== 'function') {
      throw new Error(msg);
    }
    if (req.isAuthenticated()) return next();
    else return this.failureHandler(req, res, "isAuthenticated");
  }.bind(this);
  res.here = function (req, res, next) {
    if (typeof req.isAuthenticated !== 'function') {
      throw new Error(msg);
    }
    if (req.isAuthenticated()) return next();
    else return next('route');
  }.bind(this);
  return res;
};
ConnectRoles.prototype.test = function (req, action) {
  if (this.async) {
    return this.functionList.reduce(function (accumulator, fn) {
      return accumulator.then(function (result) {
        if (typeof result === 'boolean') return result;
        else return fn(req, action);
      });
    }, Promise.resolve(null)).then(function (result) {
      if (typeof result == 'boolean') return result;
      else return false;
    });
  } else {
    for (var i = 0; i < this.functionList.length; i++){
      var fn = this.functionList[i];
      var vote = fn(req, action);
      if (typeof vote === 'boolean') {
        return vote;
      }
    }
    return false;
  }
};
ConnectRoles.prototype.middleware = function (options) {
  options = options || {};
  var userProperty = options.userProperty || this.userProperty;
  return function (req, res, next) {
    if (req[userProperty] && res.locals && !res.locals[userProperty])
      res.locals[userProperty] = req[userProperty];
    if (req[userProperty]) {
      req[userProperty].is = tester(this, req,'is');
      req[userProperty].can = tester(this, req,'can');
    }
    req.userIs = tester(this, req, 'is');
    req.userCan = tester(this, req, 'can');
    if (res.locals) {
      res.locals.userIs = tester(this, req, 'is');
      res.locals.userCan = tester(this, req, 'can');
      if (typeof req.isAuthenticated === 'function')
        res.locals.isAuthenticated = req.isAuthenticated.bind(req);
    }
    next();
  }.bind(this);
};
function tester(roles, req, verb) {
  return function (action) {
    var act = ert(req, action);
    return roles.test(req, act)
  }
}

function routeTester(verb) {
  return function (action){
    function handle(onFail) {
      return function (req, res, next) {
        var act = ert(req, action);
        if (this.async) {
          this.test(req, act).done(function (result) {
            if (result) {
              next();
            } else {
              //Failed authentication.
              onFail(req, res, next, act);
            }
          }.bind(this), next);
        } else {
          if(this.test(req, act)){
            next();
          }else{
            //Failed authentication.
            onFail(req, res, next, act);
          }
        }
      }.bind(this);
    }
    var failureHandler = this.failureHandler;
    var result = handle.call(this, function (req, res, next, act) {
      failureHandler(req, res, act);
    });
    result.here = handle.call(this, function (req, res, next) {
      next('route');
    });
    return result;
  };
}

function defaultFailureHandler(req, res, action) {
  (res.sendStatus || res.send).bind(res)(403);
}
