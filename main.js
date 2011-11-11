var ee = new EventEmitter();
var audiolet = new Audiolet();

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

function Synth (audiolet, frequency) {
  this.audiolet = audiolet;
  this.frequency = frequency || 440;
  AudioletGroup.apply(this, [this.audiolet, 1, 1]);
  this.limiter = new Limiter(this.audiolet, 0.3);

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
  //this.reverb.connect(this.limiter);
  this.limiter.connect(this.audiolet.output);
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
  this.etfreq = 440 * Math.pow(2, ((this.pitch - 60)/12));
  this.freq = this.etfreq;
  this.synth = null;
}

Note.prototype.on = function() {
  this.synth = this.synth || new Synth(audiolet, this.freq);
  var f = this.getFrequency(this.pitch);
  console.log("Note: " + this.pitch + ", Frequency: " + f);
  var numNotes = Object.keys(keys.keyState).length;
  var value = numNotes > 0 ? 0.8 / numNotes : 0.8;
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

Note.prototype.getFrequency = function() {
  return this.freq;
}

Note.prototype.offsetFrequency = function(offset) {
  this.freq = this.etfreq + offset;
}

function App() {
  //this.audiolet = new Audiolet();
  this.audiolet = audiolet;
  this.notes = {};
  this.basePitchClass = 0;
  var instance = this;

  keys = new Keyboard(6);

  ee.addListener('noteOn', this.noteOn, this);
  ee.addListener('noteOff', this.noteOff, this);
  ee.addListener('tuningSetPitch', this.tuningSetPitch, this);
  ee.addListener('basePitchClassSet', this.basePitchClassSet, this);
  ee.addListener('level', this.level, this);

  $('body').prepend('<canvas id="fft" width="812" height="200"></canvas>');

  // Load and render the mustache.
  $.get('keyboard_info.ms', function(tmpl) {
    var rows = ['pitch', 'offset', 'ratio'];
    var headers = [];
    $('.key').each(function() {
      var keyId = $(this).attr("id");
      headers.push({pitch: keyId, offset: 0, ratio: ''});
    });
    tmpl_data = {headers: headers, rows: rows};
    var keyboardInfoTable = Mustache.to_html(tmpl, tmpl_data);
    $('#keyboard').after(keyboardInfoTable);
  });
  $('#keyboard').before('<div id="base-pitchclass">' + this.basePitchClass + '</div>');

  /*
  $.get('Fugue1.mid', function(midi) {
console.dir(midi);
    var t = this.responseText || "";
    var ff = [];
    var mx = t.length;
    var scc= String.fromCharCode;
    for (var z = 0; z < mx; z++) {
      ff[z] = scc(t.charCodeAt(z) & 255);
    }
    midi = ff.join("");

    console.log(midi);
    var midiFile = MidiFile(midi);
    console.log(midiFile);
  });
    */

    //var tuning = new Tunings();
    //tuning.setTuning('5-limit');


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

App.prototype.tuningSetPitch = function(pitch, offset) {
  console.log("SET PITCH");
  console.log(pitch);
  console.log(offset);
  // Note object may not exist yet, so create it if not.
  if (!(pitch.toString() in this.notes)) {
    this.notes[pitch] = new Note(pitch);
  }

  this.notes[pitch].offsetFrequency(offset);

  $('#keyinfo-offset-' + pitch).html(offset);
}

App.prototype.basePitchClassSet = function(pitchclass) {
  this.basePitchClassSet = pitchclass;
  $('#base-pitchclass').html(pitchclass);
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
      ee.emit('noteOff', [data.pitch]);
    }, 400);
  });
  socket.on('tuningSetPitch', function (data) {
    ee.emit('tuningSetPitch', [data.pitch, data.offset]);
  });
  */
});
