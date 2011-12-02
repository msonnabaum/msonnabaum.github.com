window.SynthSettings = {
  gate: 1,
  attack: .001,
  release: .7,
  wave: 'sine',
  wave2: 'saw2'
};

/**
 * @constructor
 * @extends AudioletGroup
 * @param {Audiolet} audiolet The audiolet object.
 * @param {Number} frequency The initial frequency.
 */
function Synth (audiolet, frequency) {
  var settings = window.SynthSettings;

  AudioletGroup.call(this, audiolet, 0, 1);
  // base oscillator
  switch (settings.wave) {
    case 'sine':
      this.osc = new Sine(audiolet,frequency);
    break;
    case 'square':
      this.osc = new Square(audiolet,frequency);
    break;
    case 'triangle':
      this.osc = new Triangle(audiolet,frequency);
    break;
    case 'saw':
      this.osc = new Saw(audiolet, frequency);
    break;
  }

  switch (settings.wave2) {
    case 'sine2':
      this.modulator = new Sine(audiolet, frequency);
    break;
    case 'square2':
      this.modulator = new Square(audiolet, frequency);
    break;
    case 'triangle2':
      this.modulator = new Triangle(audiolet,frequency);
    break;
    case 'saw2':
      this.modulator = new Saw(audiolet, frequency);
    break;
  }

  this.modulator_op = new MulAdd(audiolet, frequency/4, frequency);
  this.modulator.connect(this.modulator_op,0,0);
  this.modulator_op.connect(this.osc);

  // Note on trigger
  this.trigger = new TriggerControl(audiolet);

  // Gain envelope
  this.gainEnv = new PercussiveEnvelope(audiolet, settings.gate, settings.attack, settings.release, function() {
    // Remove the group ASAP when env is complete
    this.audiolet.scheduler.addRelative(0, this.remove.bind(this));
    }.bind(this)
  );

  this.gainEnvMulAdd = new MulAdd(audiolet, 0.2);
  this.gain = new Gain(audiolet);

  // Feedback delay
  this.delay = new FeedbackDelay(audiolet, 0.01, 0.01);
  //this.delay = new Delay(audiolet, 0.01, 0.01);
  //this.feedbackLimiter = new Gain(audiolet, 0.8);

  // Stereo panner
  this.pan = new Pan(audiolet);
  this.panLFO = new Sine(audiolet, 1 / 8);

  // Connect oscillator
  this.osc.connect(this.gain);

  // Connect trigger and envelope
  this.trigger.connect(this.gainEnv);
  this.gainEnv.connect(this.gainEnvMulAdd);
  this.gainEnvMulAdd.connect(this.gain, 0, 1);
  this.gain.connect(this.delay);

  // Connect delay
  //this.delay.connect(this.feedbackLimiter);
  //this.feedbackLimiter.connect(this.delay);
  this.gain.connect(this.pan);
  this.delay.connect(this.pan);

  // Connect panner
  this.panLFO.connect(this.pan, 0, 1);
  this.pan.connect(this.outputs[0]);

}
extend(Synth, AudioletGroup);

Synth.prototype.setParam = function(param, value) {
  for (var key in this.notes) {
    var note = this.notes[key];
    note.synth.gain.setValue(value);
  }
}

Synth.prototype.setFrequency = function(frequency) {
  this.osc.frequency.setValue(frequency);
}

