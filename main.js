var ee = new EventEmitter();
var audiolet = new Audiolet();
var notes = {};


function Synth (audiolet, frequency) {
  this.audiolet = audiolet;
  this.frequency = frequency || 440;
  AudioletGroup.apply(this, [this.audiolet, 1, 1]);
 // this.limiter = new Limiter(this.audiolet, .1);
  this.limiter = new Limiter(this.audiolet, 0.3);
  //this.reverb = new LaggedReverb(this.audiolet, 0.1);

  //this.sine = new Sine(this.audiolet, frequency);
  this.osc = new Triangle(this.audiolet, this.frequency);

  this.lag = new Lag(this.audiolet, 0, 0.2);
  this.gain = this.lag.value;
  this.gainNode = new Gain(this.audiolet);

  this.osc.connect(this.gainNode);
  this.lag.connect(this.gainNode, 0, 1);
  //this.limiter.connect(this.outputs[0]);
  //this.gainNode.connect(this.outputs[0]);
  this.gainNode.connect(this.limiter);
  //this.gainNode.connect(this.outputs[0]);
  //
  //
  //this.reverb.connect(this.limiter);
  this.limiter.connect(this.audiolet.output);

  //this.spectrum();
}
extend(Synth, AudioletGroup);

Synth.prototype.setFrequency = function(frequency) {
  this.osc.frequency.setValue(frequency);
}

function updateSpectrum(audiolet) {
  var canvas = document.getElementById('fft');
  var ctx = canvas.getContext('2d');
  var fft = new FFT(4096, 44100);

  if (window.app.audiolet.output.device.buffer != null) {
    var signal = window.app.audiolet.output.device.buffer.channels[0];
    fft.forward(signal);
    var spectrum = fft.spectrum;
    // Clear the canvas before drawing spectrum
    ctx.clearRect(0,0, canvas.width, canvas.height);
    for (var i = 0; i < spectrum.length; i++ ) {
      // multiply spectrum by a zoom value
      magnitude = spectrum[i] * 4000;

      // Draw rectangle bars for each frequency bin
      ctx.fillRect(i * 4, canvas.height, 3, -magnitude);
    }
  }
  setTimeout("updateSpectrum()", 100);
}

function Note(pitch) {
  this.pitch = pitch;
  this.synth = new Synth(audiolet, pitch);
}

Note.prototype.on = function() {
  var f = this.freq(this.pitch);
  console.log("Note: " + this.pitch + ", Frequency: " + f);
  var value = 0.8 / Object.keys(keys.keyState).length;

  this.synth.setFrequency(f);
  this.synth.gain.setValue(value);
  this.synth.connect(audiolet.output);
}

Note.prototype.off = function() {
  this.synth.lag.lag.setValue(1);
  this.synth.gain.setValue(0);
  var lag = this.synth.lag.lag.getValue();
  var that = this;
  setTimeout(function() {
    that.synth.remove();
  }, lag * 1000);
}

Note.prototype.freq = function() {
  return 440 * Math.pow(2, ((this.pitch - 60)/12));
}


function App() {
  //this.audiolet = new Audiolet();
  this.audiolet = audiolet;
  //this.synth = new Synth(this.audiolet, 440);
  this.notes = {};
  var instance = this;

  keys = new Keyboard(6);

  ee.addListener('noteOn', this.noteOn, this);
  ee.addListener('noteOff', this.noteOff, this);
  ee.addListener('level', this.level, this);

  $('body').prepend('<canvas id="fft" width="812" height="200"></canvas>');
}

App.prototype.noteOn = function(pitch) {
  if (!(pitch.toString() in this.notes)) {
    this.notes[pitch] = new Note(pitch);
  }
  this.notes[pitch].on();
}

App.prototype.noteOff = function(pitch) {
  this.notes[pitch].off();
}

App.prototype.level = function(value) {
  /*
  value = value / 100.0;
  for (var key in this.notes) {
    var note = this.notes[key];
    note.synth.gain.setValue(value);
  }
  */
}

$(document).ready(function() {
  window.app = new App();

  updateSpectrum();
/*
  $('body').append('<div id="controls"><div id="slider-vertical" style="height:200px;"></div></div>');
  $("#slider-vertical").slider({
    orientation: "vertical",
    range: "min",
    min: 0,
    max: 100,
    value: 80,
    slide: function(event, ui) {
      console.log(ui);
      $("#amount").val(ui.value);
      ee.emit('level', [ui.value]);
    }
  });
  $("#amount" ).val($("#slider-vertical").slider("value"));
*/

/*
var socket = io.connect('http://localhost:8089');
  socket.on('noteOn', function (data) {
  ee.emit('noteOn', [data.pitch]);

  setTimeout(function() {
    console.log("NOTEOFF");
    ee.emit('noteOff', [data.pitch]);
    //console.log(notes);
    //notes[data.pitch].off();
  }, 400);

  socket.emit('my other event', { my: 'data' });
});
*/

});
