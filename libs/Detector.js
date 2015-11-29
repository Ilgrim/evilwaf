var detector = function() {
    var self = this;

    self.name = '';
    self.info = [];
    self.score = 0;
    self.nbTest = 0;
    self.tests = {};
    self.total = 0;

    var incrementScore = function(match,weight,comment) {

        if (match) {
            self.total+=weight;
        }
        self.nbTest+=weight;

        if (comment) {
            if (!self.tests[comment]) self.tests[comment] = 0;
            if (match) {
                self.tests[comment]=weight+'/'+weight;
            } else {
                self.tests[comment]='0/'+weight;
            }
        }

        if (self.total>0) {
            self.score = Math.round((self.total * 100) / self.nbTest);
        }

        //console.log('incrementScore',self.name,self.total,self.nbTest,self.score);
    };

    var getScore = function(data) {
        if (!self.verbosity) {
            return {
                score:self.score
            }
        }

        if (self.verbosity) {
            return {
                tests: self.tests,
                score: self.score
            }
        }
    };

    var setName = function(detectorName) {
        self.name = detectorName;
    };

    var getName = function() {
        return self.name;
    };

    var setInfo = function(detectorInfo) {
        self.info = detectorInfo;
    };

    var getInfo = function() {
        return self.info;
    };

    var setVerbose = function(verbosity) {
        self.verbosity = verbosity
    };

    //reset();

    return {
        incrementScore:incrementScore,
        getName:getName,
        setName:setName,
        setInfo:setInfo,
        getInfo:getInfo,
        getScore:getScore,
        setVerbose:setVerbose
    }
};

module.exports = detector;