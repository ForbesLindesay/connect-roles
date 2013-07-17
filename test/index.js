var assert = require('assert');
var roles = require('../');

beforeEach(function () {
  roles.reset();
});
afterEach(function () {
  roles.reset();
});

describe('middleware', function () {
    describe('when there is a user', function () {
        it('adds methods', function (done) {
            var req = {user: { id: 'Forbes' }};
            var res = {};
            roles(req, res, function (err) {
                if (err) return done(err);
                assert.strictEqual(req.user.isAuthenticated, true);
                assert.strictEqual(typeof req.user.can, 'function');
                assert.strictEqual(typeof req.user.is, 'function');
                done();
            });
        });
        it('adds locals', function (done) {
            var req = {user: { id: 'Forbes' }};
            var res = {locals: {}};
            roles(req, res, function (err) {
                if (err) return done(err);
                assert.strictEqual(req.user.isAuthenticated, true);
                assert.strictEqual(typeof req.user.can, 'function');
                assert.strictEqual(typeof req.user.is, 'function');
                assert.strictEqual(res.locals.user.isAuthenticated, true);
                assert.strictEqual(typeof res.locals.user.can, 'function');
                assert.strictEqual(typeof res.locals.user.is, 'function');
                done();
            });
        });
    });
    describe('when there is no user', function () {
        it('adds methods and the anonymous user', function (done) {
            var req = {};
            var res = {};
            roles(req, res, function (err) {
                if (err) return done(err);
                assert.strictEqual(req.user.isAuthenticated, false);
                assert.strictEqual(typeof req.user.can, 'function');
                assert.strictEqual(typeof req.user.is, 'function');
                done();
            });
        });
        it('adds locals for the anonymous user', function (done) {
            var req = {};
            var res = {locals: {}};
            roles(req, res, function (err) {
                if (err) return done(err);
                assert.strictEqual(req.user.isAuthenticated, false);
                assert.strictEqual(typeof req.user.can, 'function');
                assert.strictEqual(typeof req.user.is, 'function');
                assert.strictEqual(res.locals.user.isAuthenticated, false);
                assert.strictEqual(typeof res.locals.user.can, 'function');
                assert.strictEqual(typeof res.locals.user.is, 'function');
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
        before(function () {
            roles.setFailureHandler(notCalled('Failure Handler'));
        });
        it('passes the test', function (done) {
            var req = {user: { isAuthenticated: true }};
            var res = {send: notCalled('send')};
            roles.isAuthenticated(req, res, function (err) {
                if (err) return done(err);
                done();
            });
        });
        after(function () {
            roles.setFailureHandler(function failureHandler(req, res, action) {
                res.send(403);
            });
        });
    });
    describe('when there is a user but they aren\'t authenticated.', function () {
        it('fails the test', function (done) {
            var req = {user: { id: 'Forbes' }};
            var res = {send: send};
            function send(code) {
                assert.strictEqual(code, 403);
                done();
            }
            roles.isAuthenticated(req, res, notCalled('next'));
        });
    });
    describe('when there is no user', function () {
        it('adds methods and the anonymous user', function (done) {
            var req = {};
            var res = {};
            roles(req, res, function (err) {
                if (err) return done(err);
                assert.strictEqual(req.user.isAuthenticated, false);
                assert.strictEqual(typeof req.user.can, 'function');
                assert.strictEqual(typeof req.user.is, 'function');
                done();
            });
        });
    });
});

describe('when there are no handlers', function () {
  it('requests are rejected by default', function (done) {
    roles.setFailureHandler(function () { done(); });
    roles.is('any')({}, {}, notCalled('next'));
  });
});
describe('when there are no handlers that return `true` or `false`', function () {
  it('requests are rejected by default', function (done) {
    roles.setFailureHandler(function () { done(); });
    roles.use(function (req, action) { assert(action === 'any'); });
    roles.is('any')({}, {}, notCalled('next'));
  });
});
describe('when the first handler returns `false`', function () {
  it('requests are rejected', function (done) {
    roles.setFailureHandler(function () { done(); });
    roles.use(function (req, action) { assert(action === 'any'); return false; });
    roles.use(function (req, action) { assert(action === 'any'); return true; });
    roles.is('any')({}, {}, notCalled('next'));
  });
});
describe('when one handler returns `true', function () {
  it('requests are accepted', function (done) {
    roles.setFailureHandler(notCalled('failureHandler'));
    roles.use(function (req, action) { assert(action === 'any'); });
    roles.use(function (req, action) { assert(action === 'any'); return true; });
    roles.is('any')({}, {}, done);
  });
});
