/**
 * @constructor
 * @param {Number} pitch A midi note number.
 */
 function Note(pitch) {
  this.pitch = pitch;
  this.etfreq = 440 * Math.pow(2, ((this.pitch - 60)/12));
  this.freq = this.etfreq;
  this.synth = null;
}

Note.prototype.on = function() {
  this.synth = new Synth(audiolet, this.freq);

  /*
  var curgain = this.synth.gain.getValue();
  var f = this.getFrequency(this.pitch);
  console.log("Note: " + this.pitch + ", Frequency: " + f);
  //var numNotes = Object.keys(keys.keyState).length;
  //var value = numNotes > 0 ? 0.8 / numNotes : 0.8;
  var value = 0.8;
  this.synth.setFrequency(f);
  this.synth.gain.setValue(value);
  */
  this.synth.connect(audiolet.output);
  //this.synth.connect(limiter.inputs[0]);

  this.synth.trigger.trigger.setValue(1);

}

Note.prototype.off = function() {
  //this.synth.lag.lag.setValue(1);
  //this.synth.gain.setValue(0);
  /*
  var lag = this.synth.lag.lag.getValue();
  var that = this;
  setTimeout(function() {
  //  that.synth.remove();
  }, lag * 1000);
  */
}

Note.prototype.getFrequency = function() {
  return this.freq;
}

Note.prototype.offsetFrequency = function(offset) {
  this.freq = this.etfreq + offset;
}
