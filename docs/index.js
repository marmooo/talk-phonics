const playPanel = document.getElementById("playPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const replyPlease = document.getElementById("replyPlease");
const reply = document.getElementById("reply");
const gameTime = 180;
let problems = [];
let problemCandidate;
let answer = "Gopher";
let firstRun = true;
let correctCount = 0;
let englishVoices = [];
const voiceInput = setVoiceInput();
let endAudio, incorrectAudio, correctAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
  if (localStorage.getItem("voice") == 0) {
    document.getElementById("voiceOn").classList.add("d-none");
    document.getElementById("voiceOff").classList.remove("d-none");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

function toggleVoice() {
  if (localStorage.getItem("voice") != 0) {
    localStorage.setItem("voice", 0);
    document.getElementById("voiceOn").classList.add("d-none");
    document.getElementById("voiceOff").classList.remove("d-none");
    speechSynthesis.cancel();
  } else {
    localStorage.setItem("voice", 1);
    document.getElementById("voiceOn").classList.remove("d-none");
    document.getElementById("voiceOff").classList.add("d-none");
    speak(answer);
  }
}

function playAudio(audioBuffer, volume) {
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    audioSource.connect(gainNode);
    audioSource.start();
  } else {
    audioSource.connect(audioContext.destination);
    audioSource.start();
  }
}

function unlockAudio() {
  audioContext.resume();
}

function loadAudio(url) {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          resolve(audioBuffer);
        }, (err) => {
          reject(err);
        });
      });
    });
}

function loadAudios() {
  promises = [
    loadAudio("mp3/end.mp3"),
    loadAudio("mp3/incorrect1.mp3"),
    loadAudio("mp3/correct3.mp3"),
  ];
  Promise.all(promises).then((audioBuffers) => {
    endAudio = audioBuffers[0];
    incorrectAudio = audioBuffers[1];
    correctAudio = audioBuffers[2];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    englishVoices = voices.filter((voice) => voice.lang == "en-US");
  });
}
loadVoices();

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.onend = () => {
    voiceInput.start();
  };
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "en-US";
  voiceInput.stop();
  speechSynthesis.speak(msg);
}

function respeak() {
  speak(answer);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function nextProblem() {
  const searchButton = document.getElementById("searchButton");
  searchButton.disabled = true;
  setTimeout(() => {
    searchButton.disabled = false;
  }, 2000);
  if (problemCandidate.length <= 0) {
    problemCandidate = problems.slice();
  }
  const problem =
    problemCandidate.splice(getRandomInt(0, problemCandidate.length), 1)[0];
  const input = document.getElementById("cse-search-input-box-id");
  input.value = problem.ja;
  answer = problem.en;
  document.getElementById("problemJa").textContent = problem.ja;
  document.getElementById("problemEn").textContent = `(${problem.en})`;
  if (localStorage.getItem("voice") != 0) {
    speak(answer);
  }
}

function initProblems() {
  const grade = document.getElementById("gradeOption").radio.value;
  fetch("data/" + grade + ".csv")
    .then((response) => response.text())
    .then((tsv) => {
      problems = [];
      tsv.trim().split("\n").forEach((line) => {
        const [en, ja] = line.split(",");
        problems.push({ en: en, ja: ja });
      });
      problemCandidate = problems.slice();
    });
}
initProblems();

function searchByGoogle(event) {
  event.preventDefault();
  const input = document.getElementById("cse-search-input-box-id");
  const element = google.search.cse.element.getElement("searchresults-only0");
  nextProblem();
  if (input.value == "") {
    element.clearAllResults();
  } else {
    voiceInput.stop();
    element.execute(input.value);
  }
  if (firstRun) {
    const gophers = document.getElementById("gophers");
    while (gophers.firstChild) {
      gophers.removeChild(gophers.lastChild);
    }
    firstRun = false;
  }
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  return false;
}
document.getElementById("cse-search-box-form-id").onsubmit = searchByGoogle;

function setVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    document.getElementById("noSTT").classList.remove("d-none");
  } else {
    const voiceInput = new webkitSpeechRecognition();
    voiceInput.lang = "en-US";
    // voiceInput.interimResults = true;
    voiceInput.continuous = true;

    voiceInput.onstart = () => {
      document.getElementById("startVoiceInput").classList.add("d-none");
      document.getElementById("stopVoiceInput").classList.remove("d-none");
    };
    voiceInput.onend = () => {
      if (!speechSynthesis.speaking) {
        voiceInput.start();
      }
    };
    voiceInput.onresult = (event) => {
      const replyText = event.results[0][0].transcript;
      if (replyText.toLowerCase().split(" ").includes(answer.toLowerCase())) {
        correctCount += 1;
        playAudio(correctAudio);
        if (correctCount < 15) {
          reply.textContent = "⭕ " + answer;
          document.getElementById("searchButton").classList.add(
            "animate__heartBeat",
          );
        } else {
          clearInterval(gameTimer);
          playAudio(endAudio);
          playPanel.classList.add("d-none");
          scorePanel.classList.remove("d-none");
          document.getElementById("score").textContent = correctCount;
        }
      } else {
        playAudio(incorrectAudio);
        reply.textContent = "❌ " + replyText;
      }
      replyPlease.classList.add("d-none");
      reply.classList.remove("d-none");
      voiceInput.stop();
    };
    return voiceInput;
  }
}

function startVoiceInput() {
  voiceInput.start();
}

function stopVoiceInput() {
  document.getElementById("startVoiceInput").classList.remove("d-none");
  document.getElementById("stopVoiceInput").classList.add("d-none");
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  voiceInput.stop();
}

let gameTimer;
function startGameTimer() {
  clearInterval(gameTimer);
  const timeNode = document.getElementById("time");
  initTime();
  gameTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.textContent = t - 1;
    } else {
      clearInterval(gameTimer);
      playAudio(endAudio);
      playPanel.classList.add("d-none");
      scorePanel.classList.remove("d-none");
      document.getElementById("score").textContent = correctCount;
    }
  }, 1000);
}

let countdownTimer;
function countdown() {
  clearTimeout(countdownTimer);
  countPanel.classList.remove("d-none");
  playPanel.classList.add("d-none");
  scorePanel.classList.add("d-none");
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  const counter = document.getElementById("counter");
  counter.textContent = 3;
  countdownTimer = setInterval(() => {
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      clearTimeout(countdownTimer);
      countPanel.classList.add("d-none");
      playPanel.classList.remove("d-none");
      correctCount = 0;
      document.getElementById("score").textContent = 0;
      document.getElementById("searchButton").classList.add(
        "animate__heartBeat",
      );
      startGameTimer();
    }
  }, 1000);
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleVoice").onclick = toggleVoice;
document.getElementById("restartButton").onclick = countdown;
document.getElementById("startButton").onclick = countdown;
document.getElementById("startVoiceInput").onclick = startVoiceInput;
document.getElementById("stopVoiceInput").onclick = stopVoiceInput;
document.getElementById("respeak").onclick = respeak;
document.getElementById("searchButton").addEventListener(
  "animationend",
  (e) => {
    e.target.classList.remove("animate__heartBeat");
  },
);
document.getElementById("gradeOption").onchange = initProblems;
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
