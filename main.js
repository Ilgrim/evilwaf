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
var decache = require('decache');

// Allow self signed certificates for requests and proxied requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var _defaultTimeout = 5000;

var detectorsDir = __dirname+'/detectors';
var detectorsList = fs.readdirSync(detectorsDir);

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
    events.call(self);
    this.run();
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
        return this.emit('error',err);
    }

    if (!this.options.timeout) this.options.timeout = _defaultTimeout;

    if (this.options.silent) {
        delete this.requestOptions.headers['User-Agent'];
    }

    if (!this.options.urlParsed) {
        this.options.urlParsed = url.parse(this.options.url);
        this.options.urlParsed.protocol = this.options.urlParsed.protocol || '';
    }

    if (!utils.isURL(this.options.urlParsed)) {
        err = 'passed arguments is not a valid URL';
        return this.emit('error',err);
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

evilwaf.prototype.setupTimeout = function(self,req) {
    req.on('socket',function(socket) {
        socket.on('timeout',function() {
            self.emit('error','timeout '+self.options.timeout+' ms');
            req.end();
        });
        socket.on('connect',function() {
            socket.setTimeout(self.options.timeout);
        });
        socket.setTimeout(self.options.timeout);
    });
};

evilwaf.prototype.scan = function() {
    var self = this;
    this.emit('start',this.options);

    var getRequestOptions = function() {

        // We NEED a new Agent for each request to avoid some cache effect side

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
                if (err) return self.emit('error',err);
                self.result.ip = res;
                self.result.response = {};
                callback();
            })
        },


        function requestNormal(callback) {
            var opts = getRequestOptions();
            var r = request.get(self.options.url,opts,function(err,response,body) {
                if (err) return self.emit('error',err);
                //console.log('requestNormal',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.normal = self.formatResponse(response,body);
                callback();
            });
            self.setupTimeout(self,r);
        },

        function requestCommandInjection(callback) {
            var opts = getRequestOptions();

            if (self.options.testMode) opts.headers['x-attack'] = true;

            var urlTmp = JSON.parse(JSON.stringify(self.options.urlParsed));
            if (!urlTmp.search) {
                urlTmp.search = randomstring.generate()+Math.random()+'=cmd.exe';
            } else {
                urlTmp.search+= '&'+randomstring.generate()+'=cmd.exe';
            }
            urlTmp = url.format(urlTmp);

            var r = request.get(urlTmp,opts,function(err,response,body) {
                if (err) return self.emit('error',err);
                //console.log('requestCommandInjection',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.commandInjection = self.formatResponse(response,body);
                callback();
            });
            self.setupTimeout(self,r);
        },

        function requestNoHost(callback) {
            var opts = getRequestOptions();
            var r = request.get(self.options.url,opts,function(err,response,body) {
                if (err) return self.emit('error',err);
                //console.log('requestNoHost',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.noHost = self.formatResponse(response,body);
                callback();
            });
            r.removeHeader('host');
            self.setupTimeout(self,r);
        },

        function requestBadHost(callback) {
            var opts = getRequestOptions();
            opts.headers.host = randomstring.generate();

            var r = request.get(self.options.url,opts,function(err,response,body) {
                if (err) return self.emit('error',err);
                //console.log('requestBadHost',response.statusCode);
                //console.log(JSON.stringify(r.req._headers,null,4));
                self.result.response.badHost = self.formatResponse(response,body);
                callback();
            });
            self.setupTimeout(self,r);
        },

        function analyseResult(callback) {

            var detectorPath;
            var detector;
            async.mapSeries(detectorsList,function(detector,next) {
                detectorPath = detectorsDir+'/'+detector;

                // the usage of "decache" is probably a proof that i'm an asshole coder :(
                decache(detectorPath);

                detector = require(detectorPath);
                detector.setVerbose(self.options.verbose);
                detector.analyze(self,function(err,score) {
                    self.scores[detector.getName()] = score;
                    next();
                })
            },callback);
        },

        function displayResult() {

            if (self.options.verbose == 2) {
                self.callback(null,{
                    scores:self.scores,
                    result:self.result
                });
            } else {
                self.callback(null, {
                    scores: self.scores
                });
            }

            self.emit('done');
        }
    ]);
};

evilwaf.prototype.run = function() {
    this.on('ready',this.scan);
    this.on('error',function(err) {
        this.callback && this.callback(err);
    });
    this.checkOptions();
};

module.exports = evilwaf;
