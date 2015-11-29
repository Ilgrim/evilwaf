var apacheResponse_400 = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>400 Bad Request</title>\n</head><body>\n<h1>Bad Request</h1>\n<p>Your browser sent a request that this server could not understand.<br />\n</p>\n</body></html>\n';
var apacheResponse_403 = /<!DOCTYPE HTML PUBLIC "-\/\/IETF\/\/DTD HTML 2.0\/\/EN">\n<html><head>\n<title>403 Forbidden<\/title>\n<\/head><body>\n<h1>Forbidden<\/h1>\n<p>You don\'t have permission to access .+\non this server.<\/p>\n<\/body><\/html>\n/g;
var apacheResponse_407 = "<!DOCTYPE HTML PUBLIC \"-//IETF//DTD HTML 2.0//EN\">\n<html><head>\n<title>407 Proxy Authentication Required</title>\n</head><body>\n<h1>Proxy Authentication Required</h1>\n<p>This server could not verify that you\nare authorized to access the document\nrequested.  Either you supplied the wrong\ncredentials (e.g., bad password), or your\nbrowser doesn't understand how to supply\nthe credentials required.</p>\n</body></html>\n";
var apacheResponse_301 = /<!DOCTYPE HTML PUBLIC "-\/\/IETF\/\/DTD HTML 2.0\/\/EN">\n<html><head>\n<title>301 Moved Permanently<\/title>\n<\/head><body>\n<h1>Moved Permanently<\/h1>\n<p>The document has moved <a href=".+">here<\/a>.<\/p>\n<\/body><\/html>\n/g;


var utils = {};

utils.isApacheError = function(code,response) {
    if (
        code == 400 &&
        response.status.code == 400 &&
        response.status.message == 'Bad Request' &&
        response.body == apacheResponse_400
    ) return true;


    if (
        code == 403 &&
        response.status.code == 403 &&
        response.status.message == 'Forbidden' &&
        response.body.match(apacheResponse_403)
    ) return true;

    if (
        code == 407 &&
        response.status.code == 407 &&
        response.status.message == 'Proxy Authentication Required' &&
        response.body == apacheResponse_407
    ) return true;

    if (
        code == 301 &&
        response.status.code == 301 &&
        response.status.message == 'Moved Permanently' &&
        response.body.match(apacheResponse_301)
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
