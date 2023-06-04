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
var successDiv = document.getElementById("successDiv");
var linkidDiv = document.getElementById("linkidDiv");
var coppiedSuccessDiv = document.getElementById("coppiedSuccessDiv");
var coppiedFailureDiv = document.getElementById("coppiedFailureDiv");
var timestampDiv = document.getElementById("recordingtimestamp")

uploadingDiv.style.display = "none"
successDiv.style.display = "none"
coppiedSuccessDiv.style.display = "none"
coppiedFailureDiv.style.display = "none"

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
    pauseButton.innerHTML = "record more";
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

function stopRecording() {
  uploadingDiv.style.display = "block"

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
  timeSoFar = timeSoFar + (Date.now() - startTimeOfCurrentSection) / 1000


  //stop microphone access
  gumStream.getAudioTracks()[0].stop();

  //create the wav blob and pass it on to createDownloadLink
  rec.exportWAV(createDownloadLink);
}


function doUpload(blob, filename) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function(e) {
    if (this.readyState === 4) {
      console.log("Server returned: ", e.target.responseText);
      uploadingDiv.style.display = "none"
      successDiv.style.display = "block"
      res = JSON.parse(e.target.responseText)
      linkidDiv.innerHTML = res['messageid']
      viewingURL = window.location.href + "view?id=" + res['messageid']
      navigator.clipboard.writeText(viewingURL).then(
        () => {
          console.log("coppied!")
          coppiedSuccessDiv.style.display = "block"
        },
        () => {
          console.log("failed to copy to clipboard!!")
          coppiedFailureDiv.style.display = "block"
        }
      );
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
