"use strict";

var functionList = [];
var failureHandler = function (req, res, action){
    res.send(403);
};
var defaultUser = {};
module.exports = function middleware(req, res, next){
    var oldUser = req.user;
    req.user = req.user || Object.create(defaultUser);
    if(oldUser){
        req.user.isAuthenticated = true;
    }else{
        req.user.isAuthenticated = false;
    }
    if(req.user){
        req.user.is = tester(req,'is');
        req.user.can = tester(req,'can');
    }
    next();
};


module.exports.log = false;

module.exports.can = routeTester('can');
module.exports.is = routeTester('is');
module.exports.isAuthenticated = function(req,res,next){
    if(arguments.length === 0){ return module.exports.isAuthenticated; }
    if (req.user && req.user.isAuthenticated){ next(); }
    else if(req.user){ failureHandler(req, res, "isAuthenticated"); }
    else { throw "Request.user was null or undefined, include middleware"; }
};

module.exports.useAuthorisationStrategy = 
module.exports.useAuthorizationStrategy = function(path, fn){
    if(typeof path === "function"){
        fn = path;
    }
    functionList.push(function(user, action, stop){
            if(typeof path === "string" && path !== action){
                return null;
            }
            return fn.call(this, user, action, stop);
    });
    return this;
};
module.exports.setFailureHandler = function(fn){
    failureHandler = fn;
};
module.exports.setDefaultUser = function(user){
    defaultUser = user;
};


function tester(req, verb){
    return function(action){
        var result = null,
        vote;
        var stop = false;
        function stopNow(vote){
            stop = true;
            if (vote === false){ 
                result = false;
            } else if (vote === true) {
                result = true;
            }
        }
        for (var i = 0; i<functionList.length && !stop; i++){
            var fn = functionList[i];
            vote = fn.call(req, req.user, action, stopNow);
            if(vote === false){
                stop = true; 
                result = false;
            } else if (vote === true){
                result = true;
            }
        }
        if(module.exports.log){
            console.log('Check Permission: ' + (req.user.id||req.user.name||"user") + "."+(verb||'can')+"('" + action + "') -> " + (result === true));
        }
        return (result === true);
    };
}
function routeTester(verb){
    return function (action){    
        return function(req,res,next){
            if(tester(req,verb)(action)){
                next();
            }else{
                //Failed authentication.
                failureHandler(req, res, action);    
            }
        };
    };
}