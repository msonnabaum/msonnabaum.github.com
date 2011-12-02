var ee = new EventEmitter();
var audiolet = new Audiolet();

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

/**
 * @constructor
 */
function App() {
  _.extend(this, Backbone.Events);

  this.audiolet = audiolet;
  this.notes = {};
  this.basePitchClass = 0;
  var instance = this;

  keys = new Keyboard(6);

  //ee.addListener('noteOn', this.noteOn, this);
  //ee.addListener('noteOff', this.noteOff, this);
  ee.addListener('tuningSetPitch', this.tuningSetPitch, this);
  ee.addListener('basePitchClassSet', this.basePitchClassSet, this);
  ee.addListener('level', this.level, this);

  keys.bind('noteOn', this.noteOn, this);
  keys.bind('noteOff', this.noteOff, this);

    $('#page').prepend('<canvas id="fft" width="812" height="200"></canvas>');

  // Load and render the mustache template.
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


  $('#keyboard').before('<div id="controls"></div>');
    // Load and render the mustache template.
  $.get('controls.ms', function(tmpl) {
    var controls = Mustache.to_html(tmpl, {knobs: ['attack', 'release']});
    $('#controls').html(controls);
    $(".ui-dial").dial({
      min: 30,
      max: 330,
      value: 180,
      unitsPerPixel: 0.25,
      imageWidth: 80,
      numImages: 41,
      change: function(event, ui) {
        var param = $(this).attr('id');
        window.SynthSettings[param] = (ui.value / 100) - .29999;
        console.log(event, ui);
      }
    });

    $("#oscillator-radio").buttonset();
    $("#oscillator-radio input" ).click(function() {
      var wave = $(this).attr('id');
      console.log("WAVE1 " + wave);
      window.SynthSettings.wave = wave;
      console.log(this);
    });

    $("#oscillator-radio2").buttonset();
    $("#oscillator-radio2 input" ).click(function() {
      var wave = $(this).attr('id');
      console.log("WAVE2 " + wave);
      window.SynthSettings.wave2 = wave;
      console.log(this);
    });
  });

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

App.prototype.setParam = function(param, value) {
  for (var key in this.notes) {
    var note = this.notes[key];
    note.synth.gain.setValue(value);
  }
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

});
