// auth/auth_ldap

const ldap  = require('ldapjs');

exports.hook_capabilities = function (next, connection) {
    // Don't offer AUTH capabilities by default unless session is encrypted
    if (connection.tls.enabled) {
        const methods = [ 'PLAIN', 'LOGIN' ];
        connection.capabilities.push(`AUTH ${  methods.join(' ')}`);
        connection.notes.allowed_auth_methods = methods;
    }
    next();
}

exports.register = function () {
    this.inherits('auth/auth_base');
    this.load_auth_ldap_ini();
}

exports.load_auth_ldap_ini = function () {

    this.cfg = this.config.get('auth_ldap.ini', {
        booleans: [
            'core.rejectUnauthorized'
        ],
    },
    () => {
        this.load_auth_ldap_ini();
    })
}

exports.check_plain_passwd = function (connection, user, passwd, cb) {

    const ldap_url = this.cfg.core.server ? this.cfg.core.server : 'ldap://127.0.0.1';

    const rejectUnauthorized = this.cfg.core.rejectUnauthorized ?? true;

    const dnList = Object.keys(this.cfg.dns).map((v) => {
        return this.cfg.dns[v];
    })

    let cbCalled = false
    let iter = 0

    function cbOnce (result) {
        if (cbCalled) return
        if (result) {
            cbCalled = true
            cb(result)
        }
        else if (iter === dnList.length) {
            cbCalled = true
            cb(result)
        }
    }

    this.client = ldap.createClient({
        url: ldap_url,
        timeout: this.cfg.core.timeout ?? 5000,
        tlsOptions: {
            rejectUnauthorized
        }
    })

    this.client.on('error', (err) => {
        connection.loginfo(`auth_ldap: client error ${err.message}`);
        iter = dnList.length;
        cbOnce(false);
    })

    this.client.on('connectError', (err) => {
        connection.loginfo(`auth_ldap: connection error ${err.message}`);
        iter = dnList.length;
        cbOnce(false);
    })

    for (const dn of dnList) {
        const u = dn.replace(/%u/g, user)
        this.client.bind(u, passwd, (err) => {
            iter++;
            if (err) {
                connection.loginfo(`auth_ldap: (${u}) ${err.message}`);
                cbOnce(false);
            }
            else {
                cbOnce(true);
            }
            this.client.unbind();
        })
    }
}
