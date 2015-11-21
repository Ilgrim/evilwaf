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
        .action(function(myUrl) {
            var urlParsed = url.parse(myUrl);
            urlParsed.protocol = urlParsed.protocol || '';

            cb(null,{
                url:myUrl,
                urlParsed:urlParsed,
                timeout:program.timeout
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
