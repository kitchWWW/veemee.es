function averageInRange(array, i, j) {
  // Ensure valid range
  if (i < 0 || j >= array.length || i > j) {
    throw new Error('Invalid range');
  }

  // Calculate sum of elements in the range
  let sum = 0;
  for (let index = i; index <= j; index++) {
    sum += array[index];
  }

  // Calculate the average
  const rangeLength = j - i + 1;
  const average = sum / rangeLength;

  return average;
}


/**
 * Copy a string to clipboard
 * @param  {String} string         The string to be copied to clipboard
 * @return {Boolean}               returns a boolean correspondent to the success of the copy operation.
 * @see https://stackoverflow.com/a/53951634/938822
 */
function copyToClipboard(string) {
  let textarea;
  let result;

  try {
    textarea = document.createElement('textarea');
    textarea.setAttribute('readonly', true);
    textarea.setAttribute('contenteditable', true);
    textarea.style.position = 'fixed'; // prevent scroll from jumping to the bottom when focus is set.
    textarea.value = string;

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    const range = document.createRange();
    range.selectNodeContents(textarea);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    textarea.setSelectionRange(0, textarea.value.length);
    result = document.execCommand('copy');
  } catch ( err ) {
    console.error(err);
    result = null;
  } finally {
    document.body.removeChild(textarea);
  }

  // manual copy fallback using prompt
  if (!result) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const copyHotkey = isMac ? '⌘C' : 'CTRL+C';
    result = prompt(`Press ${copyHotkey}`, string); // eslint-disable-line no-alert
    if (!result) {
      return false;
    }
  }
  return true;
}

function formatAsTime(secs) {
  var sec_num = parseInt(secs, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return minutes + ':' + seconds;
}

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

var uploadingDiv = document.getElementById("uploadingDiv");
var loadingDots = document.getElementById("loadingDots");
var successDiv = document.getElementById("successDiv");
var timestampDiv = document.getElementById("recordingtimestamp")
var resArea = document.getElementById("resArea")
var afterShareMessage = document.getElementById("afterShareMessage")

uploadingDiv.style.display = "none"
successDiv.style.display = "none"
resArea.style.display = "block"

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);


recordButton.disabled = false;
stopButton.disabled = true;
pauseButton.disabled = true;

recordButton.style.display = 'inline-block'
stopButton.style.display = 'none'
pauseButton.style.display = 'none'


timeSoFar = 0
startTimeOfCurrentSection = 0
isRecording = false

setInterval(function() {
  timeToDisplay = ""
  if (isRecording) {
    timeToDisplay = formatAsTime(timeSoFar + (Date.now() - startTimeOfCurrentSection) / 1000)
  } else {
    timeToDisplay = formatAsTime(timeSoFar)
  }
  timestampDiv.innerHTML = timeToDisplay + " / 5:00"
}, 100)

function startRecording() {
  console.log("recordButton clicked");

  /*
      Simple constraints object, for more advanced audio features see
      https://addpipe.com/blog/audio-constraints-getusermedia/
  */

  var constraints = {
    audio: true,
    video: false
  }

  /*
      Disable the record button until we get a success or fail from getUserMedia() 
  */

  recordButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false

  recordButton.style.display = 'none'
  stopButton.style.display = 'none'
  pauseButton.style.display = 'inline-block'

  /*
      We're using the standard promise based getUserMedia() 
      https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  */

  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

    /*
        create an audio context after getUserMedia is called
        sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
        the sampleRate defaults to the one set in your OS for your playback device

    */
    audioContext = new AudioContext();

    /*  assign to gumStream for later use  */
    gumStream = stream;

    /* use the stream */
    input = audioContext.createMediaStreamSource(stream);
    var bufferSize = 1024
    const canvas = document.getElementById("canvasss");
    const ctx = canvas.getContext("2d");
    var scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1); // Buffer size, input channels, output channels
    console.log("hfeiuwahfliuaweh")
    scriptNode.onaudioprocess = function(event) {
      // Get the input audio buffer
      var inputBuffer = event.inputBuffer;

      // Get the channel data (assuming mono audio)
      var inputData = inputBuffer.getChannelData(0);
      var canvasHeight = 200
      var canvasWidth = 200

      ctx.strokeStyle = "black";
      ctx.clearRect(0, 0, 200, canvasHeight)

      // Print the data to the console
      if (isRecording) {
        var canvasWidth = canvas.width
        console.log("here?")
        ctx.beginPath();
        // console.log(inputData);
        var numbSections = 50
        var sectionSize = bufferSize / numbSections
        ctx.moveTo(0, canvasHeight / 2);
        for (var i = 0; i < numbSections; i++) {
          ctx.lineTo(i * (canvasWidth / numbSections), (canvasHeight / 2) + inputData[Math.round(i * sectionSize)] * (canvasHeight / 2));
        }
        ctx.stroke();
      }

    };

    input.connect(scriptNode);
    scriptNode.connect(audioContext.destination);


    /* 
        Create the Recorder object and configure to record mono sound (1 channel)
        Recording 2 channels  will double the file size
    */
    rec = new Recorder(input, {
      numChannels: 1
    })

    //start the recording process
    rec.record()
    isRecording = true
    startTimeOfCurrentSection = Date.now()

    console.log("Recording started");

  }).catch(function(err) {
    //enable the record button if getUserMedia() fails
    recordButton.disabled = false;
    stopButton.disabled = true;
    pauseButton.disabled = true

    recordButton.style.display = 'inline-block'
    stopButton.style.display = 'none'
    pauseButton.style.display = 'none'
  });
}

function pauseRecording() {
  console.log("pauseButton clicked rec.recording=", rec.recording);
  if (rec.recording) {
    //pause
    rec.stop();
    isRecording = false
    timeSoFar = timeSoFar + (Date.now() - startTimeOfCurrentSection) / 1000
    pauseButton.innerHTML = "add";
    recordButton.disabled = true;
    stopButton.disabled = false;
    pauseButton.disabled = false
    recordButton.style.display = 'none'
    stopButton.style.display = 'inline-block'
    pauseButton.style.display = 'inline-block'

  } else {
    //resume
    rec.record()
    isRecording = true
    startTimeOfCurrentSection = Date.now()

    pauseButton.innerHTML = "pause";


    recordButton.disabled = true;
    stopButton.disabled = true;
    pauseButton.disabled = false

    recordButton.style.display = 'none'
    stopButton.style.display = 'none'
    pauseButton.style.display = 'inline-block'
  }
}

var dotCount = 1
function startDots() {
  loadingDots.innerHTML = "."
  setInterval(function() {
    dotCount += 1
    loadingDots.innerHTML = ".".repeat(((dotCount % 3) + 1))
  }, 1000)
}

function stopRecording() {
  uploadingDiv.style.display = "block"
  startDots()
  console.log("stopButton clicked");

  //disable the stop button, enable the record too allow for new recordings
  recordButton.disabled = true;
  stopButton.disabled = true;
  pauseButton.disabled = true;

  recordButton.style.display = 'none'
  stopButton.style.display = 'none'
  pauseButton.style.display = 'none'

  //reset button just in case the recording is stopped while paused
  pauseButton.innerHTML = "pause";

  //tell the recorder to stop the recording
  rec.stop();
  isRecording = false
  // timeSoFar = timeSoFar + (Date.now() - startTimeOfCurrentSection) / 1000


  //stop microphone access
  gumStream.getAudioTracks()[0].stop();

  //create the wav blob and pass it on to createDownloadLink
  rec.exportWAV(createDownloadLink);
}

var viewingURL
function doUpload(blob, filename) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function(e) {
    if (this.readyState === 4) {
      console.log("Server returned: ", e.target.responseText);
      uploadingDiv.style.display = "none"
      successDiv.style.display = "block"
      res = JSON.parse(e.target.responseText)
      viewingURL = window.location.href + "view?id=" + res['messageid']
      copyToClipboard(viewingURL)
    }
  };
  var fd = new FormData();
  fd.append("audio_data", blob, filename);
  xhr.open("POST", "/upload", true);
  xhr.send(fd);
}


function createDownloadLink(blob) {
  var filename = new Date().toISOString();
  doUpload(blob, filename)
}


function share() {
  try {
    navigator.share({
      text: "yo, open this vm", // Text to be shared
      url: viewingURL, // URL to be shared
    // files: [] // An array of File objects to be shared
    })
    afterShareMessage.innerHTML = "shared, click to send again!"
  } catch ( e ) {
    copyToClipboard(viewingURL)
    afterShareMessage.innerHTML = "coppied to clipboard!"
  }
}