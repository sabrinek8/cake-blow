document.addEventListener("DOMContentLoaded", function () {
  const cake = document.querySelector(".cake");
  const candleCountDisplay = document.getElementById("candleCount");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;

  // Load candles from URL on page load
  loadCandlesFromURL();

  function updateCandleCount() {
    const activeCandles = candles.filter(
      (candle) => !candle.classList.contains("out")
    ).length;
    candleCountDisplay.textContent = activeCandles;
  }

  function addCandle(left, top, isOut = false) {
    const candle = document.createElement("div");
    candle.className = "candle";
    if (isOut) candle.classList.add("out");
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
    updateURL();
  }

  function saveCandlesToURL() {
    const candleData = candles.map(candle => {
      return {
        left: parseInt(candle.style.left),
        top: parseInt(candle.style.top),
        out: candle.classList.contains("out")
      };
    });
    
    const encoded = btoa(JSON.stringify(candleData));
    const url = new URL(window.location);
    url.searchParams.set('candles', encoded);
    window.history.replaceState({}, '', url);
  }

  function loadCandlesFromURL() {
    const params = new URLSearchParams(window.location.search);
    const candleData = params.get('candles');
    
    if (candleData) {
      try {
        const decoded = JSON.parse(atob(candleData));
        decoded.forEach(candleInfo => {
          addCandle(candleInfo.left, candleInfo.top, candleInfo.out);
        });
      } catch (error) {
        console.log('Error loading candles from URL:', error);
      }
    }
  }

  function updateURL() {
    saveCandlesToURL();
  }

  // Global functions for button clicks
  window.copyShareLink = function() {
    saveCandlesToURL();
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Shareable link copied to clipboard!');
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Shareable link copied to clipboard!');
    });
  };

  window.clearCandles = function() {
    candles.forEach(candle => candle.remove());
    candles = [];
    updateCandleCount();
    
    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete('candles');
    window.history.replaceState({}, '', url);
  };

  cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    addCandle(left, top);
  });

  function isBlowing() {
    if (!analyser) return false;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;

    return average > 40;
  }

  function blowOutCandles() {
    let blownOut = 0;

    if (isBlowing()) {
      candles.forEach((candle) => {
        if (!candle.classList.contains("out") && Math.random() > 0.5) {
          candle.classList.add("out");
          blownOut++;
        }
      });
    }

    if (blownOut > 0) {
      updateCandleCount();
      updateURL(); // Save state when candles are blown out
    }
  }

  // Initialize microphone
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        setInterval(blowOutCandles, 200);
      })
      .catch(function (err) {
        console.log("Unable to access microphone: " + err);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
});