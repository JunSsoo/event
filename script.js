const screenCheck = document.getElementById('screen-check');
const screenCats = document.getElementById('screen-cats');
const screenLetter = document.getElementById('screen-letter');
const buttons = document.getElementById('buttons');
const introGif = document.getElementById('intro-gif');
const goBack = document.getElementById('go-back');
const who = document.getElementById('who');
const frame = document.getElementById('frame');
const cat = document.getElementById('cat');
const stickers = document.getElementById('stickers');
const counter = document.getElementById('counter');
const btnLetter = document.getElementById('btn-letter');

let catIndex = 1; // 지금 보고 있는 고양이 사진 번호

// ---------- 사진 자동 찾기 ----------
// 사진은 jpg뿐 아니라 gif, png, jpeg, webp도 됨. 같은 번호에 여러 형식이 있으면 앞쪽 형식 우선
const EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// base(확장자 뺀 경로)에 EXTS를 차례로 붙여 봐서 처음 열리는 주소를 cb에 넘김. 하나도 없으면 null
function findImage(base, cb, i = 0) {
  if (i >= EXTS.length) return cb(null);
  const img = new Image();
  const url = `${base}.${EXTS[i]}`;
  img.onload = () => cb(url);
  img.onerror = () => findImage(base, cb, i + 1);
  img.src = url;
}

// prefix1, prefix2, prefix3 ... 번호 순서대로 있는 만큼 찾아 list에 담음 (미리 불러오기 겸).
// 번호가 중간에 비면 거기서 멈춤. 하나 찾을 때마다 onFound(지금까지 개수)
function collectImages(dir, prefix, max, list, onFound, n = 1) {
  if (n > max) return;
  findImage(`${dir}/${prefix}${n}`, (url) => {
    if (!url) return;
    list.push(url);
    onFound(list.length);
    collectImages(dir, prefix, max, list, onFound, n + 1);
  });
}

// [아니오] 사진: assets/no/no1, no2, no3 ... (최대 30장). 더 넣으려면 파일만 이어서 추가
const NO_SRCS = [];
let NO_COUNT = 4; // 사진이 하나도 없을 때 회색 박스 개수
collectImages('assets/no', 'no', 30, NO_SRCS, (n) => { NO_COUNT = n; });

// 사진 넘길 때마다 붙는 캡션. 사진이 캡션보다 많으면 처음부터 다시 돌아가며 씀
const CAPTIONS = [
  '어 왔어?', // 첫 사진(cat1) 아래에 붙음
  '어렸을 때와 참 많이 닮은 주현아',
  '항상 활짝 웃었으면 해',
  '나랑 많이 걷자^^',
  '많이 웃는 한 해 되길',
  '그리고 추억도 많이 쌓자!',
  '태어나줘서 고마워💕',
];
const captionFor = (i) => CAPTIONS[(i - 1) % CAPTIONS.length];

// 고양이 사진: assets/cats/cat1, cat2 ... (최대 30장)
const CAT_SRCS = [];
let CAT_COUNT = 6; // 사진이 하나도 없을 때 회색 박스 개수
collectImages('assets/cats', 'cat', 30, CAT_SRCS, (n) => {
  CAT_COUNT = n;
  if (n === catIndex) showCat(); // 지금 보고 있는 장이 방금 찾아졌으면 바로 그림
  else updateCounter();
});

// 첫 화면 GIF: assets/intro.gif (jpg, png, webp도 됨). 있을 때만 보임
findImage('assets/intro', (url) => {
  if (url) { introGif.src = url; introGif.hidden = false; }
});

const STICKER_COLORS = ['#fff', '#ffe600', '#ff9ec7', '#8fe3ff'];
let celebrated = false;

function show(section, fromHistory) {
  document.querySelectorAll('section').forEach((s) => s.classList.remove('active'));
  section.classList.add('active');
  // 화면마다 브라우저 기록을 남겨서 폰 뒤로가기 버튼이 사이트 밖으로 안 나가고 이전 화면으로 가게
  if (!fromHistory) history.pushState({ screen: section.id }, '');
}

history.replaceState({ screen: 'screen-check' }, '');
window.addEventListener('popstate', (e) => {
  const id = (e.state && e.state.screen) || 'screen-check';
  show(document.getElementById(id), true);
});

function showCats() {
  show(screenCats);
  if (!celebrated) {
    celebrated = true;
    addSticker(captionFor(1), 1); // 첫 말풍선은 사진 아래쪽에 고정
    startParty();
  }
}

document.getElementById('btn-yes').addEventListener('click', showCats);

document.getElementById('btn-no').addEventListener('click', () => {
  buttons.hidden = true;
  introGif.hidden = true;
  initSound(); // 클릭 직후에 소리 준비해야 브라우저가 허용함
  for (let i = 1; i <= NO_COUNT; i++) {
    setTimeout(() => popup(i), (i - 1) * 600);
  }
  // 마지막 사진 0.8초 뒤 "왜 들어옴?", 0.6초 뒤 "누구임?", 그 1초 뒤 "돌아갈래요"
  const last = (NO_COUNT - 1) * 600;
  who.replaceChildren();
  who.hidden = false;
  setTimeout(() => bigSticker('왜 들어옴?', '#ffe600', 38, 20), last + 800);
  setTimeout(() => bigSticker('누구임?', '#ff9ec7', 62, 32), last + 1400);
  setTimeout(() => { goBack.hidden = false; }, last + 2400);
});

// 화면의 (x%, y%) 자리에 큰 말풍선 하나 붙이기
function bigSticker(text, color, x, y) {
  const slot = document.createElement('div');
  slot.className = 'who-slot';
  slot.style.left = x + '%';
  slot.style.top = y + '%';
  slot.appendChild(makeSticker(text, color));
  who.appendChild(slot);
}

// 뭉게구름 모양: 타원 둘레를 따라 동그라미를 겹쳐 그림.
// 먼저 테두리 있는 동그라미를 전부 그리고, 그 위에 테두리 없는 동그라미를 다시 그려 안쪽 선을 덮음
function cloudSvg() {
  const circles = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 20 + Math.random() * 10;
    circles.push([100 + Math.cos(a) * 82, 60 + Math.sin(a) * 38, r]);
  }
  // 왼쪽 아래로 작아지는 꼬리 (생각 풍선 느낌)
  const tail = [[40, 118, 11], [22, 136, 7], [10, 150, 4]];
  const all = circles.concat(tail);
  const draw = (stroke) => all
    .map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff"${stroke ? ' stroke="#000" stroke-width="2.5" vector-effect="non-scaling-stroke"' : ''}/>`)
    .join('');
  return `<svg viewBox="0 0 200 120" preserveAspectRatio="none">${draw(true)}<ellipse cx="100" cy="60" rx="84" ry="40" fill="#fff"/>${draw(false)}</svg>`;
}
goBack.insertAdjacentHTML('afterbegin', cloudSvg());

// 돌아갈래요 -> 사진·말풍선 치우고 처음 질문으로 복귀
goBack.addEventListener('click', () => {
  screenCheck.querySelectorAll('.popup').forEach((p) => p.remove());
  who.hidden = true;
  goBack.hidden = true;
  buttons.hidden = false;
  if (introGif.getAttribute('src')) introGif.hidden = false; // 파일 있을 때만 다시 보임
});

function popup(n) {
  const box = document.createElement('div');
  box.className = 'popup';
  const left = Math.random() * Math.max(0, window.innerWidth - 180);
  const top = Math.random() * Math.max(0, window.innerHeight - 180);
  box.style.left = left + 'px';
  box.style.top = top + 'px';
  box.style.setProperty('--r', `${Math.random() * 20 - 10}deg`);

  const src = NO_SRCS[n - 1];
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    box.appendChild(img);
  } else {
    box.classList.add('missing');
  }
  screenCheck.appendChild(box);
  punch(left + 80, top + 60);
}

// 쾅: 화면 흔들림 + 붉은 번쩍 + "쾅!" 충격 말풍선 + 진동 + 타격음
const flash = document.getElementById('flash');
function punch(x, y) {
  screenCheck.classList.remove('shake');
  flash.classList.remove('on');
  void screenCheck.offsetWidth; // 애니메이션 다시 시작시키려고 강제 리플로우
  screenCheck.classList.add('shake');
  flash.classList.add('on');

  const hit = document.createElement('div');
  hit.className = 'impact';
  hit.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="${burstPoints()}" fill="#ffe600" stroke="#000" stroke-width="3" vector-effect="non-scaling-stroke"/></svg><span>쾅!</span>`;
  hit.style.left = x + (Math.random() - 0.5) * 80 + 'px';
  hit.style.top = y + (Math.random() - 0.5) * 80 + 'px';
  hit.style.setProperty('--r', `${Math.random() * 40 - 20}deg`);
  screenCheck.appendChild(hit);
  hit.addEventListener('animationend', () => hit.remove());

  if (navigator.vibrate) navigator.vibrate(90);
  thud();
}

// 웹오디오로 만드는 둔탁한 타격음 (소리 파일 없이)
let audio = null;
function initSound() {
  if (audio) return;
  try {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
  } catch (e) { audio = null; }
}

function thud() {
  if (!audio) return;
  const t = audio.currentTime;

  // 낮은 "둥" 소리: 150Hz에서 40Hz로 뚝 떨어짐
  const osc = audio.createOscillator();
  const oscGain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
  oscGain.gain.setValueAtTime(1, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(oscGain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.3);

  // 짧은 "퍽" 잡음
  const len = Math.floor(audio.sampleRate * 0.08);
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = audio.createBufferSource();
  const noiseGain = audio.createGain();
  const lp = audio.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  noise.buffer = buf;
  noiseGain.gain.value = 0.7;
  noise.connect(lp).connect(noiseGain).connect(audio.destination);
  noise.start(t);
}

function showCat() {
  const src = CAT_SRCS[catIndex - 1];
  if (src) {
    cat.src = src;
    cat.style.visibility = 'visible';
  } else {
    cat.removeAttribute('src'); // 없으면 회색 프레임만
    cat.style.visibility = 'hidden';
  }
  updateCounter();
}

function updateCounter() {
  counter.textContent = `왼쪽 이전 / 오른쪽 다음 (${catIndex}/${CAT_COUNT})`;
}

cat.onerror = () => { cat.style.visibility = 'hidden'; };

// 사진 앞뒤로 이동. dir = +1 다음, -1 이전. 끝에서는 반대쪽 끝으로 이어짐
function moveCat(dir) {
  catIndex = ((catIndex - 1 + dir) % CAT_COUNT + CAT_COUNT) % CAT_COUNT + 1;
  showCat();
  if (catIndex === CAT_COUNT) btnLetter.hidden = false; // 마지막 장까지 넘기면 편지 버튼
  addSticker(captionFor(catIndex));
  // 사진 한가운데서 색종이 펑
  const r = frame.getBoundingClientRect();
  burstConfetti(r.left + r.width / 2, r.top + r.height / 2, 50 * DENSITY);
}

// 1) 탭: 사진 왼쪽 절반은 이전, 오른쪽 절반은 다음
frame.addEventListener('click', (e) => {
  if (swiped) { swiped = false; return; } // 밀기 직후 따라오는 클릭은 무시
  const r = frame.getBoundingClientRect();
  moveCat(e.clientX - r.left < r.width / 2 ? -1 : 1);
});

// 2) 밀기: 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전 (40px 이상 움직였을 때만)
let touchX = null;
let swiped = false;
frame.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
frame.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) < 40) return;
  swiped = true;
  setTimeout(() => { swiped = false; }, 400); // 클릭이 안 따라와도 플래그가 남지 않게
  moveCat(dx < 0 ? 1 : -1);
});

// 3) 키보드: 화살표 좌우 (PC)
document.addEventListener('keydown', (e) => {
  if (!screenCats.classList.contains('active')) return;
  if (e.key === 'ArrowRight') moveCat(1);
  else if (e.key === 'ArrowLeft') moveCat(-1);
});

// 삐죽삐죽한 번개 말풍선 모양. 매번 조금씩 다르게, 위쪽 가시 하나는 길게 뽑아 사진을 가리키는 꼬리로
function burstPoints() {
  const n = 12 + Math.floor(Math.random() * 5);
  const tail = Math.floor(n * (0.65 + Math.random() * 0.2));
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    let r = i % 2 === 0 ? 46 + Math.random() * 6 : 38 + Math.random() * 3;
    if (i === tail * 2) r = 80;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

// 번개 말풍선 요소 하나 만들기. 색을 안 주면 아무 색
function makeSticker(text, color) {
  const el = document.createElement('div');
  el.className = 'sticker';
  color = color || STICKER_COLORS[Math.floor(Math.random() * STICKER_COLORS.length)];
  el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="${burstPoints()}" fill="${color}" stroke="#000" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><span></span>`;
  el.querySelector('span').textContent = text;
  el.style.setProperty('--r', `${Math.random() * 24 - 12}deg`);
  return el;
}

// 말풍선을 사진 주변 아무 데나 비뚤게 붙임. 사진마다 하나만: 이전 말풍선은 지우고 새로 붙임
// side를 주면 그 방향에 고정 (0 위, 1 아래, 2 왼쪽, 3 오른쪽)
function addSticker(text, side) {
  stickers.replaceChildren();
  const el = makeSticker(text);
  stickers.appendChild(el);

  // 사진 테두리 위의 아무 점을 골라 그 자리에 말풍선 중심을 둠 -> 사진 가장자리에 걸쳐 붙음
  const box = stickers.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  const fx = f.left - box.left;
  const fy = f.top - box.top;
  if (side === undefined) side = pickSide();
  else lastSide = side;
  const t = 0.1 + Math.random() * 0.8;
  let cx, cy;
  if (side === 0) { cx = fx + f.width * t; cy = fy; }                 // 위
  else if (side === 1) { cx = fx + f.width * t; cy = fy + f.height; } // 아래
  else if (side === 2) { cx = fx; cy = fy + f.height * t; }           // 왼쪽
  else { cx = fx + f.width; cy = fy + f.height * t; }                 // 오른쪽
  cx += (Math.random() - 0.5) * 40;
  cy += (Math.random() - 0.5) * 40;

  const w = el.offsetWidth;
  const h = el.offsetHeight;
  el.style.left = Math.min(Math.max(0, cx - w / 2), box.width - w) + 'px';
  el.style.top = Math.min(Math.max(0, cy - h / 2), box.height - h) + 'px';

}

// 같은 쪽에 연달아 붙지 않게 방향 고르기
let lastSide = -1;
function pickSide() {
  let side;
  do { side = Math.floor(Math.random() * 4); } while (side === lastSide);
  lastSide = side;
  return side;
}

btnLetter.addEventListener('click', () => show(screenLetter));
document.getElementById('btn-back').addEventListener('click', () => show(screenCats));

showCat();

// ---------- 폭죽 + 색종이 ----------
// 캔버스 하나 위에 로켓, 불꽃, 색종이 조각을 전부 파티클로 굴림
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');
const COLORS = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6', '#ff8c00', '#ff69b4', '#00e5ff'];
// 폰·태블릿(좁은 화면이거나 터치 기기)에서는 파티클을 절반으로, "동작 줄이기" 설정이면 처음 한 번만
const MOBILE = window.matchMedia('(max-width: 600px)').matches || window.matchMedia('(pointer: coarse)').matches;
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// 갤럭시 S 같은 플래그십(코어 8개 이상)은 GPU가 넉넉하니 폰이어도 파티클을 더 씀
const FLAGSHIP = MOBILE && (navigator.hardwareConcurrency || 4) >= 8;
const DENSITY = MOBILE ? (FLAGSHIP ? 0.75 : 0.5) : 1;
const MAX_PARTICLES = MOBILE ? (FLAGSHIP ? 1000 : 600) : 1500;
// 고해상도 화면에서 흐릿하지 않게 캔버스를 배율만큼 크게 잡음 (최대 2배, 보급형 폰은 1배)
const DPR = Math.min(window.devicePixelRatio || 1, MOBILE && !FLAGSHIP ? 1 : 2);
let particles = [];
let rafId = 0;
let VW = 0; // 캔버스 논리 크기 (CSS px). 그리기 좌표는 전부 이 기준
let VH = 0;
let lastT = 0;

function resizeCanvas() {
  VW = window.innerWidth;
  VH = window.innerHeight;
  canvas.width = Math.round(VW * DPR);
  canvas.height = Math.round(VH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function push(p) {
  if (particles.length < MAX_PARTICLES) particles.push(p);
  runLoop();
}

// 색종이 조각 하나
function confettiPiece(x, y, vx, vy) {
  return {
    kind: 'confetti', x, y, vx, vy,
    w: rand(6, 12), h: rand(4, 8),
    angle: rand(0, Math.PI * 2), spin: rand(-0.15, 0.15),
    wobble: rand(0, Math.PI * 2),
    shape: Math.random() < 0.3 ? 'circle' : 'rect',
    color: pick(COLORS),
  };
}

// 화면 위에서 색종이 n개 흩뿌리기
function rainConfetti(n) {
  for (let i = 0; i < n; i++) {
    push(confettiPiece(rand(0, VW), rand(-VH * 0.4, -10), rand(-0.5, 0.5), rand(1.5, 3.5)));
  }
}

// (x, y)에서 색종이 n개 펑 터뜨리기
function burstConfetti(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(3, 11);
    push(confettiPiece(x, y, Math.cos(a) * s, Math.sin(a) * s - 4));
  }
}

// 폭죽 로켓 하나 쏘기. 꼭대기에서 터짐
function launchFirework() {
  const peak = rand(VH * 0.35, VH * 0.7); // 이 높이만큼 올라감
  push({
    kind: 'rocket',
    x: rand(VW * 0.15, VW * 0.85), y: VH,
    vx: rand(-0.6, 0.6), vy: -Math.sqrt(2 * 0.15 * peak),
    color: pick(COLORS),
  });
}

function explode(x, y, color) {
  const n = Math.floor(rand(60, 100) * DENSITY);
  const twoTone = Math.random() < 0.5 ? pick(COLORS) : color;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(1, 7.5);
    push({
      kind: 'spark', x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 1, decay: rand(0.008, 0.016),
      color: i % 2 ? color : twoTone,
    });
  }
}

function step(now) {
  // dt = 60fps 기준 몇 프레임 분량인지. 120Hz면 0.5, 탭 전환 등으로 오래 멈췄으면 최대 3으로 제한
  const dt = Math.min((now - lastT) / 16.667, 3);
  lastT = now;
  const fr = Math.pow(0.98, dt); // 공기 저항
  const W = VW;
  const H = VH;
  ctx.clearRect(0, 0, W, H);
  const alive = [];

  for (const p of particles) {
    if (p.kind === 'rocket') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.15 * dt;
      if (p.vy >= -1) { explode(p.x, p.y, p.color); continue; }
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
      ctx.stroke();
      alive.push(p);
    } else if (p.kind === 'spark') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= fr;
      p.vy = p.vy * fr + 0.06 * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) continue;
      if (Math.random() > 0.15) { // 가끔 안 그려서 반짝이는 느낌
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      alive.push(p);
    } else {
      p.wobble += 0.08 * dt;
      p.vy = Math.min(p.vy + 0.08 * dt, 4);
      p.vx *= fr;
      p.x += (p.vx + Math.sin(p.wobble) * 1.2) * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      if (p.y > H + 20) continue;
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.scale(1, Math.cos(p.wobble)); // 팔랑거리며 뒤집히는 느낌
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
      alive.push(p);
    }
  }

  particles = alive;
  ctx.globalAlpha = 1;
  if (particles.length) rafId = requestAnimationFrame(step);
  else { rafId = 0; ctx.clearRect(0, 0, W, H); }
}

function runLoop() {
  if (rafId) return;
  lastT = performance.now(); // 쉬다가 다시 시작할 때 첫 프레임이 확 튀지 않게
  rafId = requestAnimationFrame(step);
}

// 생일 페이지에 처음 들어올 때: 폭죽 연발 + 색종이 폭우, 이후로는 계속 간간이
function startParty() {
  const shots = MOBILE ? 6 : 10;
  for (let i = 0; i < shots; i++) setTimeout(launchFirework, i * 400);
  for (let i = 0; i < 8; i++) setTimeout(() => rainConfetti(60 * DENSITY), i * 400);
  if (REDUCED) return;
  setInterval(() => {
    if (document.hidden) return; // 탭 안 볼 때는 쌓아두지 않음
    launchFirework();
    if (!MOBILE && Math.random() < 0.5) launchFirework();
    rainConfetti(15 * DENSITY);
  }, MOBILE ? 3000 : 2200);
}
