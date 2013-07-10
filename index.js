"use strict";

var debug = require('debug')('connect-roles');
var pathToRegexp = require('path-to-regexp');

var functionList = [];
var failureHandler = function failureHandler(req, res, action) {
  res.send(403);
};
var defaultUser = {};
var userProperty = 'user';


var exports = module.exports;

exports.initialize = initialize;
function initialize(options) {
  if(options) {
    failureHandler = options.failureHandler || failureHandler;
    defaultUser = options.defaultUser || defaultUser;
    userProperty = options.userProperty || userProperty;
  }

  return middleware;
};

function middleware(req, res, next) {
  if (res.locals) attachHelpers(req, res.locals);
  attachHelpers(req, req);
  next();
};

exports.use = use;
function use() {
  if (arguments.length === 1) {
    use1.apply(this, arguments);
  } else if (arguments.length === 2) {
    use2.apply(this, arguments);
  } else if (arguments.length === 3) {
    use3.apply(this, arguments);
  } else {
    throw new Error('use can have 1, 2 or 3 arguments, not ' + arguments.length);
  }
}

function use1(fn) {
  if (typeof fn !== 'function') throw new Error('Expected fn to be of type function');
  functionList.push(fn);
}
function use2(action, fn) {
  if (typeof action !== 'string') throw new Error('Expected action to be of type string');
  if (action[0] === '/') throw new Error('action can\'t start with `/`');
  use1(function (req, act) {
    if (act === action) {
      return fn(req);
    }
  });
}
function use3(action, path, fn) {
  if (typeof path !== 'string') throw new Error('Expected path to be of type string');
  var keys = [];
  var exp = pathToRegexp(path, keys);
  use2(action, function (req) {
    var match;
    if (match = exp.exec(req.app.path().replace(/\/$/, '') + req.path)) {
      req = Object.create(req);
      req.params = Object.create(req.params || {});
      keys.forEach(function (key, i) {
        req.params[key.name] = match[i+1];
      });
      return fn(req);
    }
  });
}

exports.can = routeTester('can');
exports.is = routeTester('is');
exports.isAuthenticated = isAuthenticated;
function isAuthenticated(req,res,next) {
  if(arguments.length === 0){ return isAuthenticated; }
  if (req[userProperty] && req[userProperty].isAuthenticated === true){ next(); }
  else if(req[userProperty]){ failureHandler(req, res, "isAuthenticated"); }
  else { throw new Error("Request[userProperty] was null or undefined, include middleware"); }
};

function tester(req, verb){
  return function(action){
    var result = null;
    for (var i = 0; i<functionList.length && result === null; i++){
      var fn = functionList[i];
      var vote = fn(req, action);
      if (typeof vote === 'boolean') {
        result = vote
      }
    }
    debug('Check Permission: ' + (req[userProperty].id||req[userProperty].name||"user") +
        "." + (verb || 'can') + "('" + action + "') -> " + (result === true));
    return (result === true);
  };
}

function routeTester(verb) {
  return function (action){
    return function (req, res, next) {
      if(tester(req,verb)(action)){
        next();
      }else{
        //Failed authentication.
        failureHandler(req, res, action);
      }
    };
  };
}

function attachHelpers(req, obj) {
  var oldUser = req[userProperty];
  obj[userProperty] = req[userProperty] || Object.create(defaultUser);
  if(oldUser){
    obj[userProperty].isAuthenticated = true;
  }else{
    obj[userProperty].isAuthenticated = false;
  }
  if(obj[userProperty]){
    obj[userProperty].is = tester(req,'is');
    obj[userProperty].can = tester(req,'can');
  }
}