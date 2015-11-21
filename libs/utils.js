var isURL = function(urlParsed) {
    if (!urlParsed) return false;
    if (typeof urlParsed != 'object') return false;
    if (!urlParsed.protocol) return false;
    if (!urlParsed.protocol.match(/http/i)) return false;
    if (!urlParsed.host) return false;
    return true;
};


module.exports = {
    isURL:isURL
};
