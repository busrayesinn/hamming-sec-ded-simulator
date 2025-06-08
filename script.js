let encodedBits = [];
let dataBits = [];
let m = 0;

function encodeData() {
  const dataStr = document.getElementById('dataInput').value.trim();
  const selectedLength = parseInt(document.getElementById('bitCount').value);

  if (!/^[01]+$/.test(dataStr)) {
    alert('Sadece 0 ve 1 içeren bir veri girin.');
    return;
  }

  if (dataStr.length !== selectedLength) {
    alert(`Seçilen uzunluk ${selectedLength} bit olmalı. Lütfen ${selectedLength} bitlik veri girin.`);
    return;
  }

  dataBits = dataStr.split('').map(Number);
  m = dataBits.length;

  const r = Math.ceil(Math.log2(m + Math.log2(m) + 1));
  const n = m + r + 1;

  encodedBits = Array(n).fill(0);
  let j = 0;

  for (let i = 1; i <= n; i++) {
    if (Math.log2(i) % 1 !== 0 && i !== n) {
      encodedBits[i - 1] = dataBits[j++];
    }
  }

  for (let i = 0; i < r; i++) {
    let parityPos = Math.pow(2, i);
    let parity = 0;
    for (let j = 1; j <= n; j++) {
      if ((j & parityPos) !== 0) {
        parity ^= encodedBits[j - 1];
      }
    }
    encodedBits[parityPos - 1] = parity;
  }

  encodedBits[n - 1] = encodedBits.slice(0, n - 1).reduce((a, b) => a ^ b, 0);
  displayBits(encodedBits, 'encoded', 'Kodlanmış Veri:');
}

function displayBits(bits, elementId, label, highlightIndex = -1) {
  const div = document.getElementById(elementId);
  div.innerHTML = `<strong>${label}</strong><div class="bit-box">` +
    bits.map((bit, index) => {
      const bitClass = index === highlightIndex ? 'bit error-bit' : 'bit';
      return `<div class="${bitClass}">${bit}</div>`;
    }).join('') + '</div>';
}

function injectMultipleErrors() {
  const input = document.getElementById('errorBitsInput').value.trim();
  if (!input) return alert("Pozisyon girmelisiniz. Örn: 2,5");
  
  const positions = input.split(',').map(s => parseInt(s.trim()));
  const invalid = positions.some(pos => isNaN(pos) || pos < 0 || pos >= encodedBits.length);

  if (invalid) {
    alert('Geçersiz bit pozisyonu girildi.');
    return;
  }

  for (const pos of positions) {
    encodedBits[pos] ^= 1;
  }

  displayBits(encodedBits, 'errorOutput', `Hata Eklenmiş Veri (bitler ${positions.join(', ')}):`);
}

function calculateSyndrome(bits, r) {
  let syndrome = 0;
  for (let i = 0; i < r; i++) {
    let parityPos = Math.pow(2, i);
    let parity = 0;
    for (let j = 1; j <= bits.length; j++) {
      if ((j & parityPos) !== 0) parity ^= bits[j - 1];
    }
    if (parity) syndrome += parityPos;
  }
  return syndrome;
}

function calculateOverallParity(bits) {
  return bits.reduce((a, b) => a ^ b, 0);
}

function correctData() {
  const n = encodedBits.length;
  const r = Math.ceil(Math.log2(n));
  const syndrome = calculateSyndrome(encodedBits, r);
  const overallParity = calculateOverallParity(encodedBits);

  let message = `<p><strong>Sendrom:</strong> ${syndrome}</p>`;

  if (syndrome === 0 && overallParity === 0) {
    message += '<p class="ok">✅ Hata yok.</p>';
    displayBits(encodedBits, 'correctionOutput', 'Düzeltilmiş Veri:');
  } else if (syndrome > 0 && overallParity === 1) {
    message += `<p class="fixed">🔧 Tekil hata bulundu. Bit ${syndrome - 1} düzeltildi.</p>`;
    encodedBits[syndrome - 1] ^= 1;
    displayBits(encodedBits, 'correctionOutput', 'Düzeltilmiş Veri:', syndrome - 1);
  } else if (syndrome === 0 && overallParity === 1) {
    message += '<p class="error">❌ İkili hata algılandı. Düzeltilemez!</p>';
    displayBits(encodedBits, 'correctionOutput', 'Veri (düzeltilemez):');
  } else if (syndrome > 0 && overallParity === 0) {
    message += '<p class="error">❌ İkili hata algılandı. Düzeltilemez!</p>';
    displayBits(encodedBits, 'correctionOutput', 'Veri (düzeltilemez):');
  } else {
    message += '<p class="warning">⚠️ Tanımsız durum!</p>';
    displayBits(encodedBits, 'correctionOutput', 'Veri:');
  }

  document.getElementById('correctionOutput').innerHTML += message;
}



