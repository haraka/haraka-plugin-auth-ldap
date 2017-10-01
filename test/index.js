
// node.js built-in modules
const assert   = require('assert');

// npm modules
const fixtures = require('haraka-test-fixtures');

// start of tests
//    assert: https://nodejs.org/api/assert.html
//    mocha: http://mochajs.org

beforeEach(function (done) {
    this.plugin = new fixtures.plugin('auth-ldap');
    done();  // if a test hangs, assure you called done()
});

describe('', function () {
    it('loads', function (done) {
        assert.ok(this.plugin);
        done();
    });
});

describe('load_ini', function () {
    it('loads .ini from config/auth_ldap.ini', function (done) {
        this.plugin.load_auth_ldap_ini();
        assert.ok(this.plugin.cfg);
        done();
    });

    it('initializes enabled boolean', function (done) {
        this.plugin.load_auth_ldap_ini();
        assert.equal(this.plugin.cfg.core.rejectUnauthorized, false, this.plugin.cfg);
        done();
    });
});
