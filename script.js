// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      console.log('Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.error('Service Worker failed:', err);
    });
  });
}

let currentLang = 'id';
let recordedChunks = [];

// Morse Configuration
let unitDuration = 100; // default unit (ms)
let pitchFrequency = 750;

const morseCode = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----.",
  " ": "/", ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "-": "-....-", "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...",
  "=": "-...-", "+": ".-.-.", "@": ".--.-."
};

const reverseMorseCode = Object.fromEntries(
  Object.entries(morseCode).map(([k, v]) => [v.trim(), k])
);

const input = document.getElementById("textInput");
const morseOutput = document.getElementById("morseOutput");
const error = document.getElementById("errorText");
const soundToggle = document.getElementById("soundToggle");
const morseInput = document.getElementById("morseInput");
const textOutput = document.getElementById("textOutput");


function updateDurations() {
  dotDuration = unitDuration;
  dashDuration = unitDuration * 3;
  symbolGap = unitDuration;
  letterGap = unitDuration * 2;
  wordGap = unitDuration * 6;
}

// Inisialisasi awal durasi
let dotDuration, dashDuration, symbolGap, letterGap, wordGap;
updateDurations();

// Event listener input
input.addEventListener("input", () => {
  const text = input.value.toUpperCase();
  const valid = /^[A-Z0-9\s.,?'\/()&=+\-@]*$/;

  if (!valid.test(text)) {
    error.classList.remove("d-none");
    morseOutput.textContent = "";
    return;
  }

  error.classList.add("d-none");
  const morse = text.split("").map(char => morseCode[char] || "").join(" ");
  morseOutput.textContent = morse;

  if (soundToggle.checked) playMorse(morse);
});

morseInput.addEventListener("input", () => {
  const morse = morseInput.value.trim();
  const words = morse.split(" / ");
  let result = words.map(word =>
    word.split(" ").map(code => reverseMorseCode[code] || "").join("")
  ).join(" ");
  textOutput.textContent = result || "";
});

function playMorse(morseStr = morseOutput.textContent) {
  updateDurations();

  const playButton = document.getElementById("playButton");
  playButton.disabled = true; // Disable tombol saat suara mulai diputar

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let time = audioCtx.currentTime;
  let totalDuration = 0;

  // Hitung total durasi
  morseStr.split("").forEach(char => {
    if (char === ".") {
      totalDuration += dotDuration + symbolGap;
    } else if (char === "-") {
      totalDuration += dashDuration + symbolGap;
    } else if (char === " ") {
      totalDuration += letterGap;
    } else if (char === "/") {
      totalDuration += wordGap;
    }
  });

  // Mainkan suara
  morseStr.split("").forEach(char => {
    if (char === ".") {
      playBeep(audioCtx, time, dotDuration);
      time += (dotDuration + symbolGap) / 1000;
    } else if (char === "-") {
      playBeep(audioCtx, time, dashDuration);
      time += (dashDuration + symbolGap) / 1000;
    } else if (char === " ") {
      time += letterGap / 1000;
    } else if (char === "/") {
      time += wordGap / 1000;
    }
  });

  // Aktifkan tombol kembali setelah durasi selesai
  setTimeout(() => {
    playButton.disabled = false;
  }, totalDuration);
}

function playBeep(ctx, startTime, duration, frequency = pitchFrequency) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(1, startTime);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);
}

function copyText(elementId) {
  const el = document.getElementById(elementId);
  const text = el.textContent;

  navigator.clipboard.writeText(text).then(() => {
    const button = el.nextElementSibling;
    const icon = button.querySelector("i");
    icon.classList.remove("fa-clone");
    icon.classList.add("fa-check");
    button.innerHTML = '<i class="fa fa-check"></i> Copied';

    setTimeout(() => {
      button.innerHTML = '<i class="fa fa-clone"></i> Copy';
    }, 2000);
  });
}

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

document.getElementById("langSwitcher")?.addEventListener("change", e => {
  switchLanguage(e.target.value);
});

document.addEventListener("DOMContentLoaded", () => {
  switchLanguage(currentLang);
  updateDurations();
});
document.getElementById("speedRange").addEventListener("input", function () {
  unitDuration = parseInt(this.value);
  document.getElementById("speedValue").textContent = unitDuration;
});

document.getElementById("pitchRange").addEventListener("input", function () {
  pitchFrequency = parseInt(this.value);
  document.getElementById("pitchValue").textContent = pitchFrequency;
});


function switchLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.getElementById("textInput").placeholder =
    lang === "en" ? "Example: Morse" : "Contoh: Morse";

  document.getElementById("morseInput").placeholder =
    lang === "en" ? "Example: -- --- .-. ... ." : "Contoh: -- --- .-. ... .";
}

function downloadMorseWAV() {
  const morseStr = document.getElementById("morseOutput").textContent;
  const sampleRate = 44100;

  let totalDuration = 0;
  morseStr.split("").forEach(ch => {
    if (ch === ".") totalDuration += dotDuration + symbolGap;
    else if (ch === "-") totalDuration += dashDuration + symbolGap;
    else if (ch === " ") totalDuration += letterGap;
    else if (ch === "/") totalDuration += wordGap;
  });

  const length = Math.ceil(totalDuration / 1000 * sampleRate);
  const audioBuffer = new Float32Array(length);
  let position = 0;

  function writeBeep(duration) {
    const samples = Math.floor(duration / 1000 * sampleRate);
    for (let i = 0; i < samples; i++) {
      audioBuffer[position + i] = Math.sin(2 * Math.PI * pitchFrequency * i / sampleRate);
    }
    position += samples;
  }

  function writeSilence(duration) {
    position += Math.floor(duration / 1000 * sampleRate);
  }

  morseStr.split("").forEach(ch => {
    if (ch === ".") {
      writeBeep(dotDuration);
      writeSilence(symbolGap);
    } else if (ch === "-") {
      writeBeep(dashDuration);
      writeSilence(symbolGap);
    } else if (ch === " ") {
      writeSilence(letterGap);
    } else if (ch === "/") {
      writeSilence(wordGap);
    }
  });

  const wavBuffer = encodeWAV(audioBuffer, sampleRate);
  const blob = new Blob([wavBuffer], { type: "audio/wav" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "morse_beep.wav";
  a.click();
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);
  return view;
}

const translations = {
  en: {
    title: "Morse Code Converter",
    text_input_label: "Enter Text:",
    morse_input_label: "Enter Morse Code:",
    morse_output_label: "Morse Code Result:",
    text_output_label: "Text Result:",
    convert_sound: "Automatic play sound when conversion",
    error: "Only letters A-Z, numbers 0-9, and basic symbols are allowed.",
    mode_text_to_morse: "Text ➜ Morse",
    mode_morse_to_text: "Morse ➜ Text",
    theme_toggle: "Toggle Theme",
    morse_instruction: "Separate letters with spaces, words with `/`.",
    play_sound: "Play Morse Sound",
    download: "Download",
    alert_silent_mode: "Make sure your device is not on mute if you want to play sound.",
    speed: "Speed (ms per unit)"
  },
  id: {
    title: "Konversi Sandi Morse",
    text_input_label: "Masukkan Teks:",
    morse_input_label: "Masukkan Sandi Morse:",
    morse_output_label: "Hasil Sandi Morse:",
    text_output_label: "Hasil Teks:",
    convert_sound: "Otomatis putar suara saat konversi",
    error: "Hanya huruf A-Z, angka 0-9, dan simbol umum yang diperbolehkan.",
    mode_text_to_morse: "Teks ➜ Morse",
    mode_morse_to_text: "Morse ➜ Teks",
    theme_toggle: "Ganti Tema",
    morse_instruction: "Pisahkan huruf dengan spasi, kata dengan tanda `/`.",
    play_sound: "Mainkan Suara Morse",
    download: "Unduh",
    alert_silent_mode: "Pastikan perangkat Anda tidak dalam mode senyap jika Anda ingin memutar suara.",
    speed: "Kecepatan (ms per unit)"
  }
};
