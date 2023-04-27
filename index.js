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

    this.client = ldap.createClient({
        url: ldap_url,
        timeout: this.cfg.core.timeout ?? 5000,
        tlsOptions: {
            rejectUnauthorized
        }
    })

    this.client.on('error', (err) => {
        connection.loginfo(`auth_ldap: client error ${  err.message}`);
        cb(false);
    })

    this.client.on('connectError', (err) => {
        connection.loginfo(`auth_ldap: connection error ${err.message}`);
        cb(false);
    })

    const dnList = Object.keys(this.cfg.dns).map((v) => {
        return this.cfg.dns[v];
    })
    console.log(dnList)

    let iter = 0
    let cbCalled = false

    function cbOnce (result) {
        iter++
        if (cbCalled) return
        if (result) {
            cbCalled = true
            return cb(result)
        }
        if (iter === dnList.length) {
            cbCalled = true
            cb(result)
        }
    }

    for (const dn of dnList) {
        this.client.bind(dn.replace(/%u/g, user), passwd, (err) => {
            if (err) {
                console.error(`auth_ldap: (${dn}) ${err.message}`);
                connection.loginfo(`auth_ldap: (${dn}) ${err.message}`);
                cbOnce(false);
            }
            else {
                this.client.unbind();
                cbOnce(true);
            }
        })
    }
}
