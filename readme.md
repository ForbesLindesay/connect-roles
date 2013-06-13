# Connect Roles
<img src="http://i.imgur.com/opZKqAi.png" align="right"/>

  Connect roles is designed to work with connect or express.  It is an authorisation provider, not an authentication provider.  It is designed to support context sensitive roles/abilities, through the use of middleware style authorisation strategies.

  If you're looking for an authentication system I suggest you check out [passport.js](https://github.com/jaredhanson/passport)

[![Build Status](https://secure.travis-ci.org/ForbesLindesay/connect-roles.png?branch=master)](http://travis-ci.org/ForbesLindesay/connect-roles)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/connect-roles.png)](https://gemnasium.com/ForbesLindesay/connect-roles)
[![NPM version](https://badge.fury.io/js/connect-roles.png)](http://badge.fury.io/js/connect-roles)

## Installation

    $ npm install connect-roles

## Usage

```javascript
var authentication = require('your-authentication-module-here');
var user = require('connect-roles');
var express = require('express');
var app = express();

app.use(authentication)
app.use(user);

//anonymous users can only access the home page
//returning false stops any more rules from being
//considered
user.use(function (req, action) {
  if (!req.user.isAuthenticated) return action === 'access home page';
})

//moderator users can access private page, but
//they might not be the only one so we don't return
//false if the user isn't a moderator
user.use('access private page', function (req) {
  if (req.user.role ==== 'moderator') {
    return true;
  }
})

//admin users can access all pages
user.use(function (req) {
  if (req.user.role === 'admin') {
    return true;
  }
});

//optionally controll the access denid page displayed
user.setFailureHandler(function (req, res, action){
  var accept = req.headers.accept || '';
  res.status(403);
  if (~accept.indexOf('html')) {
    res.render('access-denied', {action: action});
  } else {
    res.send('Access Denied - You don\'t have permission to: ' + action);
  }
});


app.get('/', user.can('access home page'), function (req, res) {
  res.render('private');
});
app.get('/private', user.can('access private page'), function (req, res) {
  res.render('private');
});
app.get('/admin', user.can('access admin page'), function (req, res) {
  res.render('admin');
});

app.listen(3000);
```

## API

### roles.use(fn(req, action))

  Define and authorisation strategy which takes the current request and the action being performed.  fn may return `true`, `false` or `undefined`/`null`

  If `true` is returned then no further strategies are considred, and the user is **granted** access.

  If `false` is returned, no further strategies are considered, and the user is **denied** access.

  If `null`/`undefined` is returned, the next strategy is considerd.  If it is the last strategy then access is **denied**.

### roles.use(action, fn(req))

  The strategy `fn` is only used when the action is equal to `action`.  It has the same behaviour with regards to return values as `roles.use(fn(req, action))` (see above).

  It is equivallent to calling:

  ```javascript
  roles.use(function (req, act) {
    if (act === action) {
      return fn(req);
    }
  });
  ```

  **N.B.** The action must not start with a `/` character or it will call `roles.use(path, fn(req, action))`

### roles.use(action, path, fn(req))

  Path must be an express style route.  It will then attach any parameters to `req.params`.

  e.g.

```javascript
roles.use('edit user', '/user/:userID', function (req) {
  if (req.params.userID === req.user.id) return true;
});
```

  Note that this authorisation strategy will only be used on routes that match `path`.

  It is equivallent to calling:

```javascript
var keys = [];
var exp = pathToRegexp(path);
roles.use(function (req, act) {
  var match;
  if (act === action && match = exp.exec(req.path)) {
    req = Object.create(req);
    req.params = Object.create(req.params || {});
    keys.forEach(function (key, i) {
      req.params[key.name] = match[i+1];
    });
    return fn(req);
  }
});
```

### roles.can(action) and roles.is(action)

  `can` and `is` are synonyms everywhere they appear.

  You can use these as express route middleware:

```javascript
var user = roles;

app.get('/profile/:id', user.can('edit profile'), function (req, res) {
  req.render('profile-edit', { id: req.params.id });
})
app.get('/admin', user.is('admin'), function (req, res) {
  res.render('admin');
}
```

### req.user.can(action) and req.user.is(action)

  `can` and `is` are synonyms everywhere they appear.

  These functions return `true` or `false` depending on whether the user has access.

  e.g.

```javascript
app.get('/', function (req, res) {
  if (req.user.is('admin')) {
    res.render('home/admin');
  } else if (user.can('login')) {
    res.render('home/login');
  } else {
    res.render('home');
  }
})
```

### user.can(action) and user.is(action)

  Inside the views of an express application you may use `user.can` and `user.is` which are equivallent to `req.user.can` and `req.user.is`

  e.g.

```html
<% if (user.can('impersonate')) { %>
  <button id="impersonate">Impersonate</button>
<% } %>
```

  **N.B.** not displaying a button doesn't mean someone can't do the thing that the button would do if clicked.  The view is not where your security should go, but it is important for useability that you don't display buttons that will just result in 'access denied' where possible.

### roles.setFailureHandler(fn(req, res, action))

  You can (and should) set the failure handler.  This is called whenever a user fails authorisation in route middleware.

  Defaults to:

```javascript
user.setFailureHandler(function (req, res, action){
  res.send(403);
});
```

  There is no "next" by design, to stop you accidentally calling it and allowing someone into a restricted part of your site.  You are passed the action requested which caused them to be denied access.

  You could using this to redirect the user or render an error page:

```javascript
user.setFailureHandler(function (req, res, action){
  var accept = req.headers.accept || '';
  res.status(403);
  if(req.user.isAuthenticated){
    if (~accept.indexOf('html')) {
      res.render('access-denied', {action: action});
    } else {
      res.send('Access Denied - You don\'t have permission to: ' + action);
    }
  } else {
    res.redirect('/login');
  }
});
```

## License

  MIT
  
  If you find it useful, a payment via [gittip](https://www.gittip.com/ForbesLindesay) would be appreciated.