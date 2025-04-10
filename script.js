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
        download: "Download"
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
        download: "Unduh"
      }
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
      const unit = 100;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let time = audioCtx.currentTime;

      morseStr.split("").forEach(char => {
        if (char === ".") {
          playBeep(audioCtx, time, unit);
          time += unit / 1000 + 0.1;
        } else if (char === "-") {
          playBeep(audioCtx, time, unit * 3);
          time += (unit * 3) / 1000 + 0.1;
        } else if (char === " ") {
          time += (unit * 2) / 1000;
        } else if (char === "/") {
          time += (unit * 6) / 1000;
        }
      });
    }

    function playBeep(ctx, startTime, duration) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(750, startTime);
      gainNode.gain.setValueAtTime(1, startTime);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration / 1000);
    }

    // tombol copy-copied
    function copyText(elementId) {
      const el = document.getElementById(elementId);
      const text = el.textContent;

      navigator.clipboard.writeText(text).then(() => {
        const button = el.nextElementSibling;
        const icon = button.querySelector("i");
        const originalText = button.textContent.trim();

        // Ganti ikon dan teks
        icon.classList.remove("fa-clone");
        icon.classList.add("fa-check");
        button.innerHTML = '<i class="fa fa-check"></i> Copied';

        // Kembalikan ke semula setelah 2 detik
        setTimeout(() => {
          button.innerHTML = '<i class="fa fa-clone"></i> Copy';
        }, 2000);
      });
    }

    const themeToggle = document.getElementById("themeToggle");
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });

    // terjemahan
    function switchLanguage(lang) {
      currentLang = lang;
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
          el.textContent = translations[lang][key];
        }
      });

      // Ganti placeholder jika perlu
      const textInput = document.getElementById("textInput");
      if (textInput) {
        textInput.placeholder = lang === "en" ? "Example: Convert to Morse" : "Contoh: Konversi ke Morse";
      }
      const morseInput = document.getElementById("morseInput");
      if (morseInput) {
        morseInput.placeholder = lang === "en" ? "Example: --. .- .-.. .. ...." : "Contoh: --. .- .-.. .. ....";
      }
    }

    // Contoh dropdown atau toggle
    function setupLanguageSwitcher() {
      const switcher = document.getElementById("langSwitcher");
      if (switcher) {
        switcher.addEventListener("change", e => {
          switchLanguage(e.target.value);
        });
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      switchLanguage(currentLang);
      setupLanguageSwitcher();
    });

    // download sound
    function downloadMorseWAV() {
      const morseStr = document.getElementById("morseOutput").textContent;
      const unit = 0.1; // 100ms
      const sampleRate = 44100;
      const freq = 750;

      // Hitung total durasi
      let totalDuration = 0;
      morseStr.split("").forEach(ch => {
        if (ch === ".") totalDuration += unit + unit; // beep + gap
        else if (ch === "-") totalDuration += unit * 3 + unit;
        else if (ch === " ") totalDuration += unit * 2;
        else if (ch === "/") totalDuration += unit * 6;
      });

      const length = Math.ceil(totalDuration * sampleRate);
      const audioBuffer = new Float32Array(length);

      let position = 0;

      function writeBeep(duration) {
        const samples = Math.floor(duration * sampleRate);
        for (let i = 0; i < samples; i++) {
          audioBuffer[position + i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
        }
        position += samples;
      }

      function writeSilence(duration) {
        const samples = Math.floor(duration * sampleRate);
        position += samples;
      }

      // Tulis ke buffer
      morseStr.split("").forEach(ch => {
        if (ch === ".") {
          writeBeep(unit);
          writeSilence(unit);
        } else if (ch === "-") {
          writeBeep(unit * 3);
          writeSilence(unit);
        } else if (ch === " ") {
          writeSilence(unit * 2);
        } else if (ch === "/") {
          writeSilence(unit * 6);
        }
      });

      // Encode ke WAV
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
      view.setUint32(16, 16, true); // Subchunk1Size
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // ByteRate
      view.setUint16(32, 2, true); // BlockAlign
      view.setUint16(34, 16, true); // BitsPerSample
      writeString(view, 36, 'data');
      view.setUint32(40, samples.length * 2, true);

      floatTo16BitPCM(view, 44, samples);
      return view;
    }
