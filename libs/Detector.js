var Detector = function() {
    this._name = '';
    this._info = [];
    this._score = 0;
    this._nbTest = 0;
    this._tests = {};
    this._total = 0;
};

Detector.prototype.incrementScore = function(match,weight,comment) {
    if (match) {
        this._total+=weight;
    }
    this._nbTest+=weight;

    if (comment) {
        if (!this._tests[comment]) this._tests[comment] = 0;
        if (match) {
            this._tests[comment]=weight+'/'+weight;
        } else {
            this._tests[comment]='0/'+weight;
        }
    }

    if (this._total>0) {
        this._score = Math.round((this._total * 100) / this._nbTest);
    }

    //console.log('incrementScore',this._name,this._total,this._nbTest);
};

Detector.prototype.getScore = function() {
    return {
        tests:this._tests,
        score:this._score
    }
};

Detector.prototype.setName = function(name) {
    this._name = name;
};

Detector.prototype.getName = function() {
    return this._name;
};

Detector.prototype.setInfo = function(info) {
    this._info = info;
};

Detector.prototype.getInfo = function() {
    return this._info;
};

module.exports = Detector;
