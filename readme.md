# Connect Roles
<img src="http://i.imgur.com/opZKqAi.png" align="right"/>

Connect roles is designed to work with connect or express.  It is an authorisation provider, not an authentication provider.  It is designed to support context sensitive roles/abilities, through the use of middleware style authorisation strategies.

If you're looking for an authentication system I suggest you check out [passport.js](https://github.com/jaredhanson/passport), which works perfectly with this module.

[![Build Status](https://secure.travis-ci.org/ForbesLindesay/connect-roles.png?branch=master)](http://travis-ci.org/ForbesLindesay/connect-roles)
[![Dependency Status](https://img.shields.io/david/ForbesLindesay/connect-roles.svg)](https://david-dm.org/ForbesLindesay/connect-roles)
[![NPM version](https://img.shields.io/npm/v/connect-roles.svg)](https://www.npmjs.com/package/connect-roles)
[![Gratipay](https://img.shields.io/gratipay/ForbesLindesay.svg)](https://gratipay.com/ForbesLindesay)

## Installation

    $ npm install connect-roles

## Usage

```javascript
var authentication = require('your-authentication-module-here');
var ConnectRoles = require('connect-roles');
var express = require('express');
var app = express();

var user = new ConnectRoles({
  failureHandler: function (req, res, action) {
    // optional function to customise code that runs when
    // user fails authorisation
    var accept = req.headers.accept || '';
    res.status(403);
    if (~accept.indexOf('html')) {
      res.render('access-denied', {action: action});
    } else {
      res.send('Access Denied - You don\'t have permission to: ' + action);
    }
  }
});

app.use(authentication)
app.use(user.middleware());

//anonymous users can only access the home page
//returning false stops any more rules from being
//considered
user.use(function (req, action) {
  if (!req.isAuthenticated()) return action === 'access home page';
})

//moderator users can access private page, but
//they might not be the only ones so we don't return
//false if the user isn't a moderator
user.use('access private page', function (req) {
  if (req.user.role === 'moderator') {
    return true;
  }
})

//admin users can access all pages
user.use(function (req) {
  if (req.user.role === 'admin') {
    return true;
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

To access all methods, you must construct an instance via:

```js
var ConnectRoles = require('connect-roles');
var roles = new ConnectRoles(options);
```

options:

 - failureHandler {Function} - a function that takes (req, res) when the user has failed authorisation
 - async {Boolean} - experimental support for async rules
 - userProperty {String} - the property name for the user object on req.  Defaults to "user"
 - matchRelativePaths {Boolean} - by default, rules use absolute paths from the root of the application.

### roles.use(fn(req, action))

Define and authorisation strategy which takes the current request and the action being performed.  fn may return `true`, `false` or `undefined`/`null`

If `true` is returned then no further strategies are considered, and the user is **granted** access.

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

**N.B.** The action must not start with a `/` character

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
var exp = pathToRegexp(path, key);
roles.use(function (req, act) {
  var match;
  if (act === action && match = exp.exec(req.path)) {
    req = Object.create(req);
    req.params = Object.create(req.params || {});
    keys.forEach(function (key, i) {
      req.params[key.name] = match[i + 1];
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

If you want to skip only the current routes, you can also use `.here`

```js
app.get('/', user.can('see admin page').here, function (req, res, next) {
  res.render('admin-home-page');
});
app.get('/', function (req, res, next) {
  res.render('default-home-page');
});
```

### req.userCan(action) and req.userIs(action)

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

Inside the views of an express application you may use `userCan` and `userIs` which are equivallent to `req.userCan` and `req.userIs`

e.g.

```html
<% if (userCan('impersonate')) { %>
  <button id="impersonate">Impersonate</button>
<% } %>
```

or in jade:

```jade
if userCan('impersonate')
  button#impersonate Impersonate
```

**N.B.** not displaying a button doesn't mean someone can't do the thing that the button would do if clicked.  The view is not where your security should go, but it is important for useability that you don't display buttons that will just result in 'access denied'.

## License

MIT

If you find it useful, a payment via [gittip](https://www.gittip.com/ForbesLindesay) would be appreciated.
