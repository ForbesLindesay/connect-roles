[![Build Status](https://secure.travis-ci.org/ForbesLindesay/connect-roles.png?branch=master)](http://travis-ci.org/ForbesLindesay/connect-roles)
# Connect Roles

Connect roles is designed to work with connect or express.  It is an authorization provider, not an authentication provider.  It is designed to support context sensitive roles/abilities, through the use of middleware style authentication strategies.

All code samples assume you have already used:

```javascript
var app = require('express').createServer();//could also use connect
var user = require('connect-roles');

app.use(/* Your authentication middleware goes here */);
app.use(user);//Load the connect-roles middleware here
```

For an example of this in use, see server.js (which requires you install express)

## Installation

    npm install connect-roles

## Authorization

Connect Roles assumes that you have authentication middleware to set the user.  It expects the user to be on the request object as `req.user`.  It makes no assumptions about what this value contains.  If this value is not used, it does not matter as the authentication strategies also have access to the request object itself

## Defining authentication strategies

To define authentication strategies, call the useAuthorisationStrategy function:

@param [path] {string}   The action/path/ability/role that this strategy applies to.  The strategy will be ignored for all other roles/abilities.  If it is not present, the strategy is used for all roles/abilities.  
@param fn     {function} The function to call to determine whether the user is authorized.  
@param fn.this           {object}   The value of this inside the function is the current request, useful for dynamic authorization.  
@param fn.user           {object}   The user found at req.user (also available as this.user), note that this could be null/undefined if the user is not authenticated.  
@param fn.action         {string}   The action/role/ability etc. that we are checking permission for.  
@param fn.stop           {function} A function which can be called with or without the vote to make this the last strategy which is used (see anonymous example).  
@param [fn.stop.vote]         {boolean} The vote, true, false or null as below.  
@param [fn.returns vote] {boolean}  The function can optionally return a vote, if this is false, then access will be denied, if this is true and nothing returns false, access will be granted.  
 
```javascript
user.useAuthorisationStrategy(function(user, action, stop){
	//User logic here.
});

//Or

user.useAuthorisationStrategy("create user", function(user, action, stop){
	//User logic here.
});
```

### Anonymous User

You should probably handle anonymous users first.  This is important because it means you then won't have to handle anonymous users individually in every other function, providing you call stop.

If you have anything that an anonymous user is capeable of, you must then check before checking for "anonymous".

```javascript
user.useAuthorisationStrategy("register", function(user){
	if(!user.isAuthenticated) return true;
});

user.useAuthorisationStrategy(function(user, action, stop){
	if(!user.isAuthenticated){
		stop(action === "anonymous");
	}
});
```

### Roles

If you have a user object which looks like `{id:10, roles:["RoleA", "RoleB"]}` you could use the following to provide roles checking.

```javascript
user.useAuthorisationStrategy(function(user, action){
	if(user.isAuthenticated){//You can remove this if already checking for anonymous users
		for(var i = 0; i<user.roles.length; i++){
			if(user.roles[i] === action) return true;
		}
	}
});
```

### Dynamic

This example is what makes this library special.

```javascript
user.useAuthorisationStrategy("edit user", function(user, action){
	if(user.isAuthenticated){//You can remove this if already checking for anonymous users
		if(req.params.userid){
			if(user.id === req.params.userid){
				return true;
			}
		}
	}
});

//Then you can use the following in express
app.get('/user/:userid/edit', user.can("edit user"), function(req,res){
	//Only called if the user is editing themselves, not other people.
});
```

## Inline authorization for connect or express

Providing you have supplied the middleware (see the first section of this guide) you can use the following functions.

### req.isAuthenticated

This is a property that is either true or false to tell you whether the user object is present.

### req.userIs, req.userCan, req.user.can, req.user.is

These functions are all the same, but be aware that methods of the form req.user.* will throw exceptions if user is null.

```javascript
app.get("/canifly", function(req,res){
	if(req.userCan("fly")) res.send("You can fly");
	else res.send("You can't fly");
});

app.get("/logout", function(req,res){
    //Note how we check authenticated first.
	if(req.isAuthenticated && req.user.can("logout")){
		logout();
	}else{
		throw "user can't log out";
	}
});
```

## Route middleware for express

In express you can provide route middleware.  This is perfect for authentication, especially with wildcards.


### Protect entire admin section in one line

Simply put this before you have any other routes beginning /admin

```javascript
app.get("/admin*", user.is("admin"));

```

### Only let people edit themselves

```javascript
user.useAuthorisationStrategy("edit user", function(user, action){
	if(user.isAuthenticated){//You can remove this if already checking for anonymous users
		if(req.params.userid){
			if(user.id === req.params.userid){
				return true;
			}
		}
	}
});

//Then you can use the following in express
app.get('/user/:userid/edit', user.can("edit user"), function(req,res){
	//Only called if the user is editing themselves, not other people.
});
```

### Chain things

```javascript
user.useAuthorisationStrategy("register", function(user){
	if(!user.isAuthenticated) return true;
});

user.useAuthorisationStrategy(function(user, action, stop){
	if(!user.isAuthenticated){
		stop(action === "anonymous");
	}
});

app.get("/register", user.is("anonymous"), user.can("register"), function(req,res){
	//Only called if the user can register.
});
```

## Failure handler

You can (and should) set the failure handler.  This is called whenever a user fails authorization in route middleware.

It is set as follows:

```javascript
user.setFailureHandler(function (req, res, action){
	res.send(403);
});
```

That, incidentally is the default implimentation.  There is no "next" by design, to stop you accidentally calling it and allowing someone into a restricted part of your site.  You are passed the action/role/ability which caused them to be denied access.

### Redirect on failure

You should probably consider using this to redirect the user, something like:

```javascript
user.setFailureHandler(function (req, res, action){
	if(req.user){
		res.redirect('/accessdenied?reason=' + action);
	} else {
		res.redirect('/login');
	}
});
```

## Default User

By default, the user middleware will set the user up to be `{}` and will then add the property `isAuthenticated = false`.

Roles will always add `isAuthenticated = false` but you can configure a default user object as follows.

```javascript
user.setDefaultUser({id:"anonymous"});
```