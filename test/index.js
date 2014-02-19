var assert = require('assert');
var Roles = require('../');

function constant(val) {
  return function () {
    return val;
  };
}
function request(user) {
  return {
    user: user,
    isAuthenticated: constant(user ? true : false)
  };
}
function response() {
  return {
    locals: {}
  };
}
describe('middleware', function () {
  describe('when there is a user', function () {
    it('adds methods', function (done) {
      var roles = new Roles();
      var req = request({ id: 'Forbes' });
      var res = response();
      roles.middleware()(req, res, function (err) {
        if (err) return done(err);
        assert.strictEqual(typeof req.user.can, 'function');
        assert.strictEqual(typeof req.user.is, 'function');
        assert.strictEqual(req.user.can('foo'), false);
        assert.strictEqual(req.user.is('foo'), false);
        assert.strictEqual(typeof req.userCan, 'function');
        assert.strictEqual(typeof req.userIs, 'function');
        assert.strictEqual(req.userCan('foo'), false);
        assert.strictEqual(req.userIs('foo'), false);
        
        assert.strictEqual(res.locals.isAuthenticated(), true);
        assert.strictEqual(typeof res.locals.user.can, 'function');
        assert.strictEqual(typeof res.locals.user.is, 'function');
        assert.strictEqual(res.locals.user.can('foo'), false);
        assert.strictEqual(res.locals.user.is('foo'), false);
        assert.strictEqual(typeof res.locals.userCan, 'function');
        assert.strictEqual(typeof res.locals.userIs, 'function');
        assert.strictEqual(res.locals.userCan('foo'), false);
        assert.strictEqual(res.locals.userIs('foo'), false);
        done();
      });
    });
  });
  describe('when there is no user', function () {
    it('adds methods and the anonymous user', function (done) {
      var roles = new Roles();
      var req = request();
      var res = response();
      roles.middleware()(req, res, function (err) {
        if (err) return done(err);
        assert.strictEqual(typeof req.userCan, 'function');
        assert.strictEqual(typeof req.userIs, 'function');
        assert.strictEqual(req.userCan('foo'), false);
        assert.strictEqual(req.userIs('foo'), false);
        
        assert.strictEqual(res.locals.isAuthenticated(), false);
        assert.strictEqual(typeof res.locals.userCan, 'function');
        assert.strictEqual(typeof res.locals.userIs, 'function');
        assert.strictEqual(res.locals.userCan('foo'), false);
        assert.strictEqual(res.locals.userIs('foo'), false);
        done();
      });
    });
  });
});

function notCalled(name) {
  return function notCalled() {
    throw new Error('The function ' + name + ' should not be called here.');
  }
}
describe('isAuthenticated route middleware', function () {
  describe('when there is a user', function () {
    it('passes the test', function (done) {
      var roles = new Roles({
        failureHandler: notCalled('Failure Handler')
      });
      var req = request({id: 'Forbes'});
      var res = {send: notCalled('send')};
      roles.isAuthenticated()(req, res, function (err) {
        if (err) return done(err);
        done();
      });
    });
  });
  describe('when there is no user.', function () {
    it('fails the test', function (done) {
      var roles = new Roles();
      function send(code) {
        assert.strictEqual(code, 403);
        done();
      }
      var req = request();
      var res = {send: send};
      roles.isAuthenticated()(req, res, notCalled('next'));
    });
    it('calls the failure handler', function (done) {
      var roles = new Roles({
        failureHandler: function (request, response, action) {
          assert.strictEqual(request, req);
          assert.strictEqual(response, res);
          assert.strictEqual(action, 'isAuthenticated');
          done();
        }
      });
      var req = request();
      var res = {};
      roles.isAuthenticated()(req, res, notCalled('next'));
    });
  });
});
describe('can middleware', function () {
  describe('when the user is authenticated', function () {
    it('passes the test', function (done) {
      var roles = new Roles();
      var req = request();
      var res = {};
      roles.use(function (req, action) { assert.strictEqual(action, 'any'); return true; });
      roles.can('any')(req, res, function (err) {
        if (err) return done(err);
        done();
      });
    });
  });
  describe('when the user is not authenticated', function () {
    it('fails the test', function (done) {
      var roles = new Roles();
      roles.use(function (req, action) { assert.strictEqual(action, 'any'); return false; });
      function send(code) {
        assert.strictEqual(code, 403);
        done();
      }
      var req = request();
      var res = {send: send};
      roles.can('any')(req, res, notCalled('next'));
    });
    it('calls the failure handler', function (done) {
      var roles = new Roles({
        failureHandler: function (request, response, action) {
          assert.strictEqual(request, req);
          assert.strictEqual(response, res);
          assert.strictEqual(action, 'any');
          done();
        }
      });
      roles.use(function (req, action) { assert.strictEqual(action, 'any'); return false; });
      var req = request();
      var res = {};
      roles.can('any')(req, res, notCalled('next'));
    });
  });
});

describe('when there are no handlers', function () {
  it('requests are rejected by default', function () {
    var roles = new Roles();
    assert.strictEqual(roles.test(request(), 'any'), false);
  });
});
describe('when there are no handlers that return `true` or `false`', function () {
  it('requests are rejected by default', function () {
    var roles = new Roles();
    var called = false;
    roles.use(function (req, action) { assert(action === 'any'); called = true; });
    assert.strictEqual(roles.test(request(), 'any'), false);
    assert.strictEqual(called, true);
  });
});
describe('when the first handler to return a value returns `false`', function () {
  it('requests are rejected', function () {
    var roles = new Roles();
    roles.use(function (req, action) { assert(action === 'any'); });
    roles.use(function (req, action) { assert(action === 'any'); return false; });
    roles.use(function (req, action) { assert(action === 'any'); return true; });
    assert.strictEqual(roles.test(request(), 'any'), false);
  });
});
describe('when the first handler to return a value returns `true`', function () {
  it('requests are accepted', function () {
    var roles = new Roles();
    roles.use(function (req, action) { assert(action === 'any'); });
    roles.use(function (req, action) { assert(action === 'any'); return true; });
    roles.use(function (req, action) { assert(action === 'any'); return false; });
    assert.strictEqual(roles.test(request(), 'any'), true);
  });
});
