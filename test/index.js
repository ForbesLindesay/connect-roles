var roles = require('../');
var assert = require('should');
var middleware = roles.initialize();

describe('middleware', function () {
    describe('when there is a user', function () {
        it('adds methods', function (done) {
            var req = {user: { id: 'Forbes' }};
            var res = {};
            middleware(req, res, function (err) {
                if (err) return done(err);
                req.user.isAuthenticated.should.equal(true);
                req.user.can.should.be.a('function');
                req.user.is.should.be.a('function');
                done();
            });
        });
        it('adds locals', function (done) {
            var req = {user: { id: 'Forbes' }};
            var res = {locals: {}};
            middleware(req, res, function (err) {
                if (err) return done(err);
                req.user.isAuthenticated.should.equal(true);
                req.user.can.should.be.a('function');
                req.user.is.should.be.a('function');
                res.locals.user.isAuthenticated.should.equal(true);
                res.locals.user.can.should.be.a('function');
                res.locals.user.is.should.be.a('function');
                done();
            });
        });
    });
    describe('when there is no user', function () {
        it('adds methods and the anonymous user', function (done) {
            var req = {};
            var res = {};
            middleware(req, res, function (err) {
                if (err) return done(err);
                req.user.isAuthenticated.should.equal(false);
                req.user.can.should.be.a('function');
                req.user.is.should.be.a('function');
                done();
            });
        });
        it('adds locals for the anonymous user', function (done) {
            var req = {};
            var res = {locals: {}};
            middleware(req, res, function (err) {
                if (err) return done(err);
                req.user.isAuthenticated.should.equal(false);
                req.user.can.should.be.a('function');
                req.user.is.should.be.a('function');
                res.locals.user.isAuthenticated.should.equal(false);
                res.locals.user.can.should.be.a('function');
                res.locals.user.is.should.be.a('function');
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
            roles.initialize({failureHandler: notCalled('Failure Handler')});
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
            roles.initialize({failureHandler: function failureHandler(req, res, action) {
                res.send(403);
            }});
        });
    });
    describe('when there is a user but they aren\'t authenticated.', function () {
        it('fails the test', function (done) {
            var req = {user: { id: 'Forbes' }};
            var res = {send: send};
            function send(code) {
                code.should.equal(403);
                done();
            }
            roles.isAuthenticated(req, res, notCalled('next'));
        });
    });
    describe('when there is no user', function () {
        it('adds methods and the anonymous user', function (done) {
            var req = {};
            var res = {};
            middleware(req, res, function (err) {
                if (err) return done(err);
                req.user.isAuthenticated.should.equal(false);
                req.user.can.should.be.a('function');
                req.user.is.should.be.a('function');
                done();
            });
        });
    });
});