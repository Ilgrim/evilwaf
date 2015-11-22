var apacheError_400 = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>400 Bad Request</title>\n</head><body>\n<h1>Bad Request</h1>\n<p>Your browser sent a request that this server could not understand.<br />\n</p>\n</body></html>\n';
var apacheError_403 = /<!DOCTYPE HTML PUBLIC "-\/\/IETF\/\/DTD HTML 2.0\/\/EN">\n<html><head>\n<title>403 Forbidden<\/title>\n<\/head><body>\n<h1>Forbidden<\/h1>\n<p>You don\'t have permission to access .+\non this server.<\/p>\n<\/body><\/html>\n/g;

var utils = {};

utils.isApacheError = function(code,response) {
    if (
        code == 400 &&
        response.status.code == 400 &&
        response.status.message == 'Bad Request' &&
        response.body == apacheError_400
    ) return true;


    if (
        code == 403 &&
        response.status.code == 403 &&
        response.status.message == 'Forbidden' &&
        response.body.match(apacheError_403)
    ) return true;

    return false;
};

utils.setCookieNameMatch = function(re,headers) {
    var match = false;
    if (!headers['set-cookie']) return false;
    headers['set-cookie'].forEach(function(cookie) {
        if (!match) match = cookie.split('=')[0].match(re);
    });
    return match;
};

utils.hasHeader = function(name,headers) {
    if (headers[name]) return true;
    return false;
};

utils.isURL = function(urlParsed) {
    if (!urlParsed) return false;
    if (typeof urlParsed != 'object') return false;
    if (!urlParsed.protocol) return false;
    if (!urlParsed.protocol.match(/http/i)) return false;
    if (!urlParsed.host) return false;
    return true;
};


module.exports = utils;
