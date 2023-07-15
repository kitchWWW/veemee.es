var playPauseButton = document.getElementById("playPauseButton")
var timestampDiv = document.getElementById("timestamp")

playPauseButton.onclick = playPauseFunction

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

var transcriptSection = document.getElementById("transcriptSection")

console.log("here!")


function playbackGenerator(time) {
  return () => {
    playFrom(time)
  }
}

var allSpans = []
var allBits = []
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var obj = this.responseText;
    var obj1 = JSON.parse(obj);
    console.log(obj1)

    for (var i = 0; i < obj1.length; i++) {
      console.log(obj1[i])
      const spanOfWord = document.createElement("span");
      spanOfWord.innerHTML = obj1[i].token + " "
      console.log(obj1[i].start)
      spanOfWord.onclick = playbackGenerator(obj1[i].start)
      transcriptSection.appendChild(spanOfWord)
      allSpans.push(spanOfWord)
      allBits.push(obj1[i])
    }
  }
};
xhttp.open("GET", "/static/messages/" + params.id + ".json", true);
xhttp.send();


var lastStartedTime = Date.now()
var lastOffset = 0

setInterval(function() {
  var currentTime = Date.now()
  if (isPlaying) {
    updatePlaybackForTime(lastOffset + (currentTime - lastStartedTime))
  } else {
    updatePlaybackForTime(lastOffset)
  }
}, 200)

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

var hasEnded = false

function updatePlaybackForTime(t) {
  audioDur = audioButNotForPlaying.duration
  timestampDiv.innerHTML = formatAsTime(t / 1000) + " / " + formatAsTime(audioDur)
  for (var i = 0; i < allBits.length; i++) {
    if (allBits[i]['start'] >= t) {
      allSpans[i].style.color = "rgb(62, 97, 150)";
    } else if (allBits[i]['end'] < t) {
      allSpans[i].style.color = "rgb(50, 50, 50)";
    } else {
      scale = (t - allBits[i].start) / (allBits[i].end - allBits[i].start)
      console.log(scale)
      console.log(12 * scale)
      colorDat = "rgb(" + (50 + (12 * scale)) + ", " + (50 + (47 * scale)) + ", " + (50 + (100 * scale)) + ")";
      console.log(colorDat)
      allSpans[i].style.color = colorDat
    }
  }
}




isPlaying = false

currentPos = 0

function playSound(param1, param2) {
  sound.pause()
  console.log(param2)
  lastStartedTime = Date.now()
  if (param2) {
    lastOffset = param2 * 1000
  } else if (param2 === 0) {
    lastOffset = 0
  } else if (hasEnded) {
    lastOffset = 0
    hasEnded = false
  }
  sound.play(param1, param2)
}

function pauseSound() {
  lastOffset = lastOffset + (Date.now() - lastStartedTime)
  sound.pause()
}

function playPauseFunction() {
  if (isPlaying == false) {
    playSound()
  } else {
    pauseSound()
  }
  isPlaying = !isPlaying
  updateButtonLabel()
}

function updateButtonLabel() {
  if (isPlaying == false) {
    playPauseButton.innerHTML = "play"
  } else {
    playPauseButton.innerHTML = "pause"
  }
}

updateButtonLabel()

function playFrom(starting) {
  console.log(starting)
  timeToStartAt = (starting / 1000.0)
  if (timeToStartAt < 0) {
    timeToStartAt = 0
  }
  console.log(timeToStartAt)
  playSound(0, timeToStartAt)
  isPlaying = true
  updateButtonLabel()
}



var sound = new Pizzicato.Sound({
  source: 'file',
  options: {
    path: "/static/messages/" + params.id + ".wav"
  }
}, function() {
  console.log('sound file loaded!');
});

// And then we also load up the audio file for the other one to get the durration oops

var audioButNotForPlaying = new Audio("/static/messages/" + params.id + ".wav")

sound.on('end', function() {
  isPlaying = false
  hasEnded = true
  lastOffset = audioButNotForPlaying.duration * 1000
  updateButtonLabel()
})


function replyButton() {
  dest = window.location.href.split("/view")[0]
  console.log(dest)
  window.location.href = dest
}

