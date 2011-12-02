/**
 * TODO
 * @constructor
 */
function Tunings(limit) {
  this.primes = [1, 3, 5, 7, 11, 13, 19];
  this.limit = limit || 19;
  this.ratios = [];
  //this.generateRatios();
}

Tunings.prototype.nearestLowerPow2 = function(n) {
  var m = n;
  for(var i = 0; m > 1; i++) {
    m = m >>> 1;
  }
  return 1 << i;
}

Tunings.prototype.generateRatios = function() {
  //for (var i = 0; i < this.primes.length; i++) {
  for (var i = 1; i < this.limit; i + 2) {
    var n = this.primes[i];
    if (n == 1) {
      this.ratios['1:1'] = 1;
    }
    else {
      var d = this.nearestLowerPow2(n);
      this.ratios[n + ':' + d] = n/d;
      this.ratios[d + ':' + n] = d/n;
    }
  }
}

Tunings.prototype.setTuning = function(tuning) {
  $('.key').each(function() {
    var keyId = $(this).attr("id");
    switch (tuning) {
      case "et":
        ee.emit('tuningSetPitch', [keyId, 0]);
      break;
      case "5-limit":
        var fiveLimit = {
        0: [1,1],
        1: [25,32],
        2: [9,8],
        3: [6,5],
        4: [5,4],
        5: [4,3],
        6: [25,24],
        7: [3,2],
        8: [2,24],
        9: [8,5],
        10: [25,24],
        11: [25,24],
      }

      var base = keyId - (keyId % 12);
      var ratio = fiveLimit[keyId % 12]
      var n = ratio[0];
      var d = ratio[1];
      var f = n / d;
      var baseEtfreq = etfreq || 440 * Math.pow(2, ((base - 60)/12));
      var etfreq = 440 * Math.pow(2, ((keyId - 60)/12));
      var jiFreq = f * baseEtfreq;
      var offset = 3986.3 * ((Math.log(jiFreq) / Math.LN10) - (Math.log(etfreq) / Math.LN10));

      ee.emit('tuningSetPitch', [keyId, offset]);
      break;
    }
  });
}
