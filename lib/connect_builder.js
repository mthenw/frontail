'use strict';

var connect = require('connect');
var fs = require('fs');
var CAS = require('cas-sfu');

var ConnectBuilder = function () {
    this.app = connect();
};

ConnectBuilder.prototype.authorize = function (user, pass) {
    this.app.use(connect.basicAuth(function (incomingUser, incomingPass) {
        return user === incomingUser && pass === incomingPass;
    }));

    return this;
};

ConnectBuilder.prototype.build = function () {
    return this.app;
};

ConnectBuilder.prototype.cas = function(service_url, cas_host, cas_baseurl) {
    this.app.use(connect.query())
        .use(connect.cookieParser())
        .use(connect.session({ secret: 'JDSFwsd3', cookie: { maxAge: 60000 }})) 
        .use("/login", function(req, res){
            var cas = new CAS({
                service: service_url,
                casHost: 'http://' + cas_host,
                casBasePath: cas_baseurl,
                loginPath: '/login',
                logoutPath: '/logout',
                validatePath: '/serviceValidate',
                appLogoutPath: '/logout'
            });

            // validate a ticket:
            cas.validate(req.query.ticket, function(err, loggedIn, casResponse) {
                if (loggedIn) {
                    //console.debug("you are logged in as %s", casResponse.user);
                    // login ok, set session cookie
                    var sess = req.session;
                    sess.loggedin = true;
                    res.writeHead(302, {
                        'Location': '/'
                    });
                    res.end();
                } else {
                    //console.debug("log in failed");
                    // not loggedin
                    res.writeHead(302, {
                        'Location': 'http://' + cas_host + cas_baseurl + '/login?service=' + encodeURIComponent(service_url)
                    });
                    res.end();
                }
            });
        
    });
    return this;
}

ConnectBuilder.prototype.index = function (path, files, filesNamespace, theme, service_url, cas_host, cas_baseurl) {
    theme = theme || 'default';

    this.app
        .use(connect.cookieParser())
        .use(connect.session({ secret: 'JDSFwsd3', cookie: { maxAge: 60000 }})) 
        .use(function (req, res) {
            var sess = req.session;
            if (sess.loggedin) {
                fs.readFile(path, function (err, data) {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(data.toString('utf-8')
                        .replace(/__TITLE__/g, files)
                        .replace(/__THEME__/g, theme)
                        .replace(/__NAMESPACE__/g, filesNamespace),
                        'utf-8'
                    );
                });
            } else {
                res.writeHead(302, {
                    'Location': 'http://' + cas_host + cas_baseurl + '/login?service=' + encodeURIComponent(service_url)
                });
                res.end();
            }
    });

    return this;
};

ConnectBuilder.prototype.session = function (secret, key) {
    this.app.use(connect.cookieParser());
    this.app.use(connect.session({secret: secret, key: key}));
    return this;
};

ConnectBuilder.prototype.static = function (path) {
    this.app.use(connect.static(path));
    return this;
};

module.exports = function () {
    return new ConnectBuilder();
};
