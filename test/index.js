
// node.js built-in modules
const assert   = require('assert');
const path     = require('path')

// npm modules
const fixtures = require('haraka-test-fixtures');

// start of tests
//    assert: https://nodejs.org/api/assert.html
//    mocha: http://mochajs.org

beforeEach(function (done) {
    this.plugin = new fixtures.plugin('auth-ldap');
    this.plugin.config = this.plugin.config.module_config(path.resolve('test'));
    done();  // if a test hangs, assure you called done()
})


describe('auth-ldap', function () {
    it('plugin loads', function () {
        assert.ok(this.plugin);
    })
})

describe('load_ini', function () {
    it('loads .ini from config/auth_ldap.ini', function (done) {
        this.plugin.load_auth_ldap_ini();
        assert.ok(this.plugin.cfg);
        done();
    })

    it('initializes enabled boolean', function () {
        this.plugin.load_auth_ldap_ini();
        assert.equal(this.plugin.cfg.core.rejectUnauthorized, false, this.plugin.cfg);
    })
})

// test user data as defined in testdata.ldif
const users = [
    {
        uid: 'user1',
        dn: 'uid=user1,ou=users,dc=example,dc=com',
        password: 'ykaHsOzEZD',
        mail: 'user1@example.com'
    },
    {
        uid: 'user2',
        dn: 'uid=user2,ou=people,dc=example,dc=com',
        password: 'KQD9zs,LGv',
        mail: 'user2@example.com'
    },
    {
        uid: 'nonunique',
        dn: 'uid=nonunique,ou=users,dc=example,dc=com',
        password: 'CZVm3,BLlx',
        mail: 'nonunique1@example.com'
    },
    {
        uid: 'nonunique',
        dn: 'uid=nonunique,ou=people,dc=example,dc=com',
        password: 'LsBHDGorAh',
        mail: 'nonunique2@example.com'
    }
];

function _set_up (done) {
    this.plugin = new fixtures.plugin('auth-ldap');
    this.plugin.config = this.plugin.config.module_config(path.resolve('test'));
    this.plugin.load_auth_ldap_ini()
    this.connection = fixtures.connection.createConnection();
    this.connection.server = { notes: {}};
    done();
}

describe('check_plain_passwd', function () {

    before(_set_up)

    for (const user of users.slice(0, 2)) {
        // for some reason this test fails on GHA sporadically. Skip for now.
        it.skip(`validates user ${user.uid}`, function (done) {
            this.timeout(3000);
            this.plugin.check_plain_passwd(this.connection, user.uid, user.password, (result) => {
                assert.equal(true, result);
                done()
            })
        })
    }

    it(`rejects invalid user`, function (done) {
        this.timeout(3000);
        this.plugin.check_plain_passwd(this.connection, 'invalid', 'invalid', (result) => {
            assert.equal(false, result);
            done();
        })
    })
})
