var findup = require('findup-sync');
var fs = require('fs');
var url = require('url');
var program = require('commander');
var package = JSON.parse(fs.readFileSync(findup('package.json')));

var parse = function(args,cb) {

    program
        .version(package.version)
        .arguments('<url>')
        .usage('[options] <url> \n\nExample: evilwaf http://www.test.com')
        .option('-t, --timeout <timeout>','TCP and HTTP timeout, default 2000',2000)
        .option('-a, --about','display evilwaf infos')
        .option('-j, --json','json output format')
        //.option('-ua, --user-agent','custom User-Agent header') @todo
        .option('-s, --silent','remove default User-Agent header "evilwaf"')
        .option('-v, --verbose','display more infos')
        .action(function(myUrl) {
            cb(null,{
                url:myUrl,
                timeout:program.timeout,
                silent:program.silent,
                verbose:program.verbose
            });
        })
        .parse(args);

    if (!process.argv.slice(2).length) {
        program.outputHelp();
        process.exit(0);
    }

    if (program.about) {
        console.log("%s v%s, %s\n%s",package.name,package.version,package.description,package.repository.url.replace(/git/,'http'));
        process.exit(0);
    }



};


module.exports = {
    parse:parse
};
