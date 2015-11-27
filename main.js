var util = require('util');
var events = require('events').EventEmitter;
var utils = require('./libs/utils.js');
var url = require('url');
var fs = require('fs');
var dns = require('dns');
var async = require('async');
var request = require('request');
var randomstring = require('randomstring');
var https = require('https');
var http = require('http');

// Allow self signed certificates for requests and proxied requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var evilwaf = function(opts,cb) {

    if (false === (this instanceof evilwaf)) {
        return new evilwaf(opts,cb);
    }
    var self = this;
    this.options = opts;
    this.callback = cb;
    this.result = {};
    this.scores = {};
    this.requestOptions = {
        agent:null,
        agentOptions:{
            rejectUnauthorized:false
        },
        followRedirect:false,
        headers:{
            //'User-Agent':'evilwaf https://github.com/eviltik/evilwaf',
            'Cache-Control':'max-age=0',
            'Connection':'close'
        }
    };
    this.detectors = [];

    var detectorsDir = __dirname+'/detectors';
    var detectors = fs.readdirSync(detectorsDir);
    detectors.forEach(function(detector) {
        self.detectors.push(require(detectorsDir+'/'+detector));
    });

    events.call(self);
    setTimeout(this.run.bind(this),1);
};

util.inherits(evilwaf, events);

evilwaf.prototype.checkOptions = function() {
    var err;

    if (!this.options) {
        err = 'missing options, at least {url:myUrl}';
    }

    if (!err && !this.options.url) {
        err = 'missing URL';
    }

    if (!err && this.options.timeout && typeof this.options.timeout != 'number') {
        err = 'timeout must be a number (millisecond)';
    }

    if (err) {
        this.callback && this.callback(err);
        return this.emit('error',err);
    }

    if (!this.options.timeout) this.options.timeout = 2000;

    if (this.options.silent) {
        delete this.requestOptions.headers['User-Agent'];
    }

    if (!this.options.urlParsed) {
        this.options.urlParsed = url.parse(this.options.url);
        this.options.urlParsed.protocol = this.options.urlParsed.protocol || '';
    }

    if (!utils.isURL(this.options.urlParsed)) {
        this.emit('error','passed arguments is not a valid URL');
        return;
    }

    this.result.url = this.options.url;

    this.emit('ready');
};

evilwaf.prototype.formatRawHeaders = function(rawHeaders) {
    var i = 0;
    var max = rawHeaders.length;
    var tmp = {};
    var headersTableWithOriginalOrder = [];
    var name,value;
    for (i=0;i<max;i++) {
        if (i%2) {
            value = rawHeaders[i];
            tmp[name] = value;
            headersTableWithOriginalOrder.push(tmp);
            tmp = {};
        } else {
            name = rawHeaders[i];
        }
    }

    return headersTableWithOriginalOrder;
};

evilwaf.prototype.formatResponse = function(response,body) {

    return {
        request: {
            rawHeaders: response.req._header,
        },
        rawHeaders:this.formatRawHeaders(response.rawHeaders),
        headers:response.headers,
        status:{
            code:response.statusCode,
            message:response.statusMessage
        },
        body:body
    }
};

evilwaf.prototype.setupTimeout = function(self,req,cb) {
    req.on('socket',function(socket) {
        socket.on('timeout',function() {
            cb('timeout '+self.options.timeout+' ms');
        });
        socket.on('connect',function() {
            socket.setTimeout(self.options.timeout);
        });
        socket.setTimeout(self.options.timeout);
    });
};

evilwaf.prototype.scan = function(cb) {
    var self = this;
    this.emit('start',this.options);

    var getOptions = function() {

        // We NEED a new Agent() for each request to avoid some cache effect side

        var opts = JSON.parse(JSON.stringify(self.requestOptions));
        if (self.options.urlParsed.protocol.match(/https/)) {
            opts.agent = new https.Agent();
        } else {
            opts.agent = new http.Agent();
        }

        return opts;
    };

    async.series([

        function lookup(callback) {
            //console.log('lookup',self.options.urlParsed.hostname);
            dns.lookup(self.options.urlParsed.hostname,function(err,res) {
                //console.log('lookup callback');
                if (err) return cb(err);
                self.result.ip = res;
                self.result.response = {};
                callback();
            })
        },


        function requestNormal(callback) {
            var opts = getOptions();
            var r = request.get(self.options.url,opts,function(err,response,body) {
                if (err) return cb(err);
                //console.log('requestNormal',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.normal = self.formatResponse(response,body);
                callback();
            });
            self.setupTimeout(self,r,cb);
        },

        function requestCommandInjection(callback) {
            var opts = getOptions();

            var urlTmp = JSON.parse(JSON.stringify(self.options.urlParsed));
            if (!urlTmp.search) {
                urlTmp.search = randomstring.generate()+Math.random()+'=cmd.exe';
            } else {
                urlTmp.search+= '&'+randomstring.generate()+'=cmd.exe';
            }
            urlTmp = url.format(urlTmp);

            var r = request.get(urlTmp,opts,function(err,response,body) {
                if (err) return cb(err);
                //console.log('requestCommandInjection',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.commandInjection = self.formatResponse(response,body);
                callback();
            });
            self.setupTimeout(self,r,cb);
        },

        function requestNoHost(callback) {
            var opts = getOptions();
            var r = request.get(self.options.url,opts,function(err,response,body) {
                if (err) return cb(err);
                //console.log('requestNoHost',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.noHost = self.formatResponse(response,body);
                callback();
            });
            r.removeHeader('host');
            self.setupTimeout(self,r,cb);
        },

        function requestBadHost(callback) {
            var opts = getOptions();
            opts.headers.host = randomstring.generate();

            var r = request.get(self.options.url,opts,function(err,response,body) {
                if (err) return cb(err);
                //console.log('requestBadHost',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.badHost = self.formatResponse(response,body);
                callback();
            });
            self.setupTimeout(self,r,cb);
        },

        function analyseResult(callback) {

            async.mapSeries(self.detectors,function (detector,next) {
                detector.analyze(self,function(err,score) {
                    if (detector.getName) self.scores[detector.getName()] = score;
                    next();
                });
            },callback);

        },

        function displayResult() {
            if (self.options.verbose) {
                console.log(JSON.stringify(self,null,4));
            }
            cb(null,self);
        }
    ]);
};

evilwaf.prototype.run = function() {
    var self = this;
    self.checkOptions();
    self.scan(function(err,data) {
        if (self.callback) {

            if (err) return self.callback(err);

            return self.callback(err,{
                scores:self.scores
            });
        }
        self.emit('done');
    });

};


module.exports = evilwaf;
