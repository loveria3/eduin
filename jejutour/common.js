/* =====================================================================
   제주 관광 자율주행 시뮬레이터 · 공통 코드 (학생·선생님 화면이 함께 사용)
   설정값은 config.js 에 있어요. 이 파일은 고치지 않아도 돼요.
   ===================================================================== */
const $ = id => document.getElementById(id);

/* ===== 바다 미션에서 가져온 그림(SVG) ===== */
const ICON_SVG = `<svg class="ico" viewBox="0 0 34 24" aria-hidden="true">
  <path d="M17 0.5 L19.6 4 H14.4 Z M17 23.5 L19.6 20 H14.4 Z" fill="#1c1c1c"/>
  <rect x="16.2" y="3" width="1.6" height="18" fill="#1c1c1c"/>
  <rect x="3.5" y="8" width="27" height="8" rx="1" fill="#1c1c1c"/>
  <rect x="8" y="11" width="18" height="2" rx="1" fill="#f6c21a"/>
  <rect x="0.8" y="4" width="2.8" height="16" rx="1" fill="#f6c21a" stroke="#8a6a00" stroke-width=".5"/>
  <rect x="30.4" y="4" width="2.8" height="16" rx="1" fill="#f6c21a" stroke="#8a6a00" stroke-width=".5"/>
</svg>`;

const HAT_SVG = `<svg class="hat" viewBox="0 0 150 74" aria-label="깃발 클릭했을 때">
  <path d="M0 22 C22 -4 72 -4 92 20 L146 20 Q150 20 150 24 L150 62 Q150 66 146 66 L44 66 L36 74 L20 74 L12 66 L4 66 Q0 66 0 62 Z" fill="#ffbf00"/>
  <g transform="translate(11 33)">
    <rect x="0" y="0" width="2.4" height="19" rx="1" fill="#4a8a1c"/>
    <path d="M2 1 C7 -1.5 11 3 17 1 L17 11 C11 13 7 8.5 2 11 Z" fill="#4cbf2a" stroke="#45993d" stroke-width="1"/>
  </g>
  <text x="36" y="49.5" font-size="15.5" font-weight="700" fill="#fff" font-family="Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif">클릭했을 때</text>
</svg>`;

/* 위에서 본 핑퐁 오토카 (앞쪽 = 위). 바퀴 끝~끝 = 92칸 = CAR_WIDTH_CM */
const CAR_SVG = `<svg viewBox="-50 -50 100 100">
  <ellipse cx="0" cy="2" rx="47" ry="28" fill="rgba(0,25,50,.3)"/>
  <!-- 앞쪽 초승달 보조바퀴 (전진 방향) -->
  <path d="M-4 -14 L-5 -22 Q-12 -27 -11 -34 Q0 -26 11 -34 Q12 -27 5 -22 L4 -14 Z" fill="#17181b" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
  <circle cx="0" cy="-24.5" r="1.8" fill="#4a4d55"/>
  <!-- 뒤쪽 둥근 보조바퀴 -->
  <rect x="-2.8" y="13" width="5.6" height="10" fill="#17181b" stroke="#fff" stroke-width="1.2"/>
  <circle cx="0" cy="24" r="6.2" fill="#17181b" stroke="#fff" stroke-width="1.2"/>
  <circle cx="0" cy="24" r="2" fill="#4a4d55"/>
  <!-- 바퀴: 검은 휠 + 노란 타이어 -->
  <g stroke="#fff" stroke-width="1.2">
    <rect x="-41" y="-25" width="12" height="50" rx="3" fill="#141518"/><rect x="29" y="-25" width="12" height="50" rx="3" fill="#141518"/>
    <rect x="-46" y="-25" width="6.5" height="50" rx="3" fill="#ffc20e"/><rect x="39.5" y="-25" width="6.5" height="50" rx="3" fill="#ffc20e"/>
  </g>
  <g fill="#d99a00">
    <path d="M-46 -20h4v2.4h-4zM-46 -13.5h4v2.4h-4zM-46 -7h4v2.4h-4zM-46 -.5h4v2.4h-4zM-46 6h4v2.4h-4zM-46 12.5h4v2.4h-4zM-46 19h4v2.4h-4z"/>
    <path d="M-43.5 -16.8h3.6v2.4h-3.6zM-43.5 -10.3h3.6v2.4h-3.6zM-43.5 -3.8h3.6v2.4h-3.6zM-43.5 2.7h3.6v2.4h-3.6zM-43.5 9.2h3.6v2.4h-3.6zM-43.5 15.7h3.6v2.4h-3.6z"/>
    <path d="M42 -20h4v2.4h-4zM42 -13.5h4v2.4h-4zM42 -7h4v2.4h-4zM42 -.5h4v2.4h-4zM42 6h4v2.4h-4zM42 12.5h4v2.4h-4zM42 19h4v2.4h-4z"/>
    <path d="M39.9 -16.8h3.6v2.4h-3.6zM39.9 -10.3h3.6v2.4h-3.6zM39.9 -3.8h3.6v2.4h-3.6zM39.9 2.7h3.6v2.4h-3.6zM39.9 9.2h3.6v2.4h-3.6zM39.9 15.7h3.6v2.4h-3.6z"/>
  </g>
  <!-- 모터 브래킷 -->
  <rect x="-31" y="-12" width="4" height="24" rx="1" fill="#0f1012"/><rect x="27" y="-12" width="4" height="24" rx="1" fill="#0f1012"/>
  <!-- 검은 큐브 두 개 -->
  <rect x="-28" y="-15" width="27.2" height="30" rx="2.2" fill="#1c1d21" stroke="#fff" stroke-width="1.2"/>
  <rect x=".8" y="-15" width="27.2" height="30" rx="2.2" fill="#1c1d21" stroke="#fff" stroke-width="1.2"/>
  <rect x="-26" y="-13" width="23.2" height="26" rx="1.5" fill="#25272c"/><rect x="2.8" y="-13" width="23.2" height="26" rx="1.5" fill="#25272c"/>
  <rect x="-.8" y="-14" width="1.6" height="28" fill="#c99a1a"/>
  <!-- 큐브 윗면 무늬 -->
  <path d="M-17 -12 l1.4 2.6 2.8 .3 -2.1 1.9 .6 2.8 -2.7 -1.5 -2.5 1.5 .6 -2.8 -2.1 -1.9 2.8 -.3z" fill="none" stroke="#3a3d44" stroke-width=".8"/>
  <rect x="5" y="-13" width="7" height="2.6" rx=".5" fill="#0c0c0e"/>
  <g fill="#9a9da5"><circle cx="6.4" cy="-11.7" r=".45"/><circle cx="8.1" cy="-11.7" r=".45"/><circle cx="9.8" cy="-11.7" r=".45"/><circle cx="11.5" cy="-11.7" r=".45"/></g>
  <rect x="17" y="-12.6" width="4.6" height="4.2" rx=".5" fill="none" stroke="#3a3d44" stroke-width=".8"/>
  <!-- 노란 막대 -->
  <rect x="-14.5" y="-3.4" width="29" height="6.8" rx="3.4" fill="#f7b500" stroke="#b07f00" stroke-width=".8"/>
  <!-- LED (왼쪽 빨강, 오른쪽 초록) -->
  <rect x="-21" y="6.5" width="11" height="4" rx="2" fill="#ff3b30" opacity=".35"/><rect x="-20" y="7.6" width="9" height="1.8" rx=".9" fill="#ff5a4f"/>
  <rect x="10" y="6.5" width="11" height="4" rx="2" fill="#2bff6a" opacity=".35"/><rect x="11" y="7.6" width="9" height="1.8" rx=".9" fill="#5dff8a"/>
  <!-- 앞 방향 표시 -->
  <path d="M0 -47 L7 -39 L-7 -39 Z" fill="#ffeb3b" stroke="#c77800" stroke-width="1.8" stroke-linejoin="round"/>
</svg>`;

/* ===== 효과음 · 폭죽 (바다 미션과 동일) ===== */
const Sound = (() => {
  let ctx = null, on = true;
  function unlock(){
    if (!ctx){ try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  function tone(freq, start, dur, type = 'sine', vol = .25, slideTo){
    if (!on || !ctx) return;
    const t = ctx.currentTime + start, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + .05);
  }
  return {
    unlock,
    toggle(){ on = !on; return on; },
    click(){ tone(1500, 0, .045, 'square', .05); tone(700, .035, .07, 'triangle', .12); },
    ding(f = 1319){ tone(f, 0, .55, 'sine', .3); tone(f * 2, 0, .3, 'sine', .08); },
    warn(){ tone(330, 0, .13, 'square', .12, 300); tone(220, .15, .22, 'square', .12, 180); },
    win(){
      if (!on || !ctx) return;
      const G4 = 392, C5 = 523, D5 = 587, E5 = 659, G5 = 784, C6 = 1047;
      // 작은북 롤 → 따-따-따-따안! → 따라라-따아안!
      for (let t = 0; t < .42; t += .035) noise(t, .03, .05 + t * .25, 2500);
      brass([G4], 0, .11); brass([G4], .14, .11); brass([G4], .28, .11);
      brass([C5, E5, G4], .42, .5); timpani(.42, 98); noise(.42, .9, .35, 7000);
      brass([E5], .98, .13); brass([D5], 1.13, .13); brass([E5], 1.28, .13);
      brass([G5, C5, E5, C6 / 2], 1.44, 1.3); timpani(1.44, 65); timpani(1.62, 98); noise(1.44, 1.4, .4, 7000);
      [C6, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, 1.7 + i * .07, .5, 'sine', .07));
    }
  };
  // 금관(트럼펫) 느낌: 톱니파 2개를 살짝 어긋나게 + 필터가 열리는 소리
  function brass(freqs, start, dur){
    const t = ctx.currentTime + start, out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(3800, t + .06);
    lp.frequency.exponentialRampToValueAtTime(1800, t + dur);
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(.16, t + .03);
    out.gain.setValueAtTime(.13, t + dur * .7); out.gain.exponentialRampToValueAtTime(0.0001, t + dur + .15);
    lp.connect(out).connect(ctx.destination);
    freqs.forEach(f => [-6, 6].forEach(cents => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
      o.connect(lp); o.start(t); o.stop(t + dur + .2);
    }));
  }
  function noise(start, dur, vol, hp){
    const t = ctx.currentTime + start, n = ctx.sampleRate * dur, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination); src.start(t);
  }
  function timpani(start, f){ tone(f * 1.6, start, .7, 'sine', .45, f); }
})();

/* ---------- 폭죽 ---------- */
const Confetti = (() => {
  const cv = $('confetti'), cx = cv.getContext('2d');
  let parts = [], raf = null;
  const COLORS = ['#ff5252','#ffd740','#69f0ae','#40c4ff','#e040fb','#ff9100','#ffffff'];
  function burst(){
    cv.width = innerWidth; cv.height = innerHeight;
    for (let side = 0; side < 3; side++){
      const ox = side === 0 ? 0 : side === 1 ? cv.width : cv.width / 2, oy = side === 2 ? cv.height * .35 : cv.height;
      for (let i = 0; i < 70; i++){
        const ang = side === 0 ? -Math.PI/2 + .2 + Math.random()*.7 : side === 1 ? -Math.PI/2 - .2 - Math.random()*.7 : Math.random()*Math.PI*2;
        const sp = (side === 2 ? 6 : 14) + Math.random() * 10;
        parts.push({ x:ox, y:oy, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, w:8+Math.random()*8, h:5+Math.random()*6,
          r:Math.random()*6, vr:(Math.random()-.5)*.4, c:COLORS[i % COLORS.length], life:0 });
      }
    }
    if (!raf) loop();
  }
  function loop(){
    cx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.vy += .32; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
      cx.fillRect(-p.w/2, -p.h/2 * Math.abs(Math.cos(p.life * .15)), p.w, p.h * Math.abs(Math.cos(p.life * .15)) + 1);
      cx.restore();
    });
    parts = parts.filter(p => p.y < cv.height + 40 && p.life < 400);
    raf = parts.length ? requestAnimationFrame(loop) : (cx.clearRect(0, 0, cv.width, cv.height), null);
  }
  return { burst };
})();

/* =====================================================================
   격자 · 지도
   ===================================================================== */
const COLS = GRID_COLS, ROWS = GRID_ROWS, IMG = IMG_SIZE;
function lineAt(lines, i, start, size, n){
  if (EVEN_GRID) return start + size * i / n;
  return start + size * (lines[i] - lines[0]) / (lines[n] - lines[0]);
}
const colLine = i => lineAt(COL_LINES, i, GRID.left, GRID.width, COLS);
const rowLine = i => lineAt(ROW_LINES, i, GRID.top, GRID.height, ROWS);
function cellRect(row, col){          // 게임판 대비 % 값
  const x0 = colLine(col - 1), x1 = colLine(col), y0 = rowLine(row - 1), y1 = rowLine(row);
  return { x:(x0+x1)/2/IMG.w*100, y:(y0+y1)/2/IMG.h*100, w:(x1-x0)/IMG.w*100, h:(y1-y0)/IMG.h*100 };
}
function cellOf(x, y){
  let col = 1, row = 1;
  while (col < COLS && x >= colLine(col)) col++;
  while (row < ROWS && y >= rowLine(row)) row++;
  return { row, col };
}
function cellSize(){ return GRID.width / COLS / IMG.w * 100; }
function place(el, row, col, scale){
  const r = cellRect(row, col), s = cellSize() * scale;
  el.style.left = r.x + '%'; el.style.top = r.y + '%';
  el.style.width = s + '%'; el.style.height = s * IMG.w / IMG.h + '%';
}
function cellType(r, c){
  if (r < 1 || r > ROWS || c < 1 || c > COLS) return 'out';
  const ch = (MAP[r - 1] || '')[c - 1];
  return ch === '~' ? 'sea' : ch === 'M' ? 'mount' : 'land';
}
const DIRS = [[-1,0],[0,1],[1,0],[0,-1]];
const BLOCK_MSG = { sea:'앗! 바다예요!', mount:'앗! 한라산이에요, 돌아서 가요!', out:'앗! 지도 밖이에요!' };

/* ---------- 위경도 → 지도 픽셀 (MAP_POINTS 기준점으로 계산: 지도 그림이 바뀌어도 기준점만 다시 찍으면 됨) ---------- */
function makeProjector(points){
  const P = (points || []).filter(p => p.x != null);
  if (P.length < 3) return null;
  // 최소제곱 직선 변환 x = a·lat + b·lng + c (3×3 정규방정식)
  function fit(key){
    const M = [[0,0,0],[0,0,0],[0,0,0]], v = [0,0,0];
    P.forEach(p => { const r = [p.lat, p.lng, 1]; for (let i = 0; i < 3; i++){ v[i] += r[i] * p[key]; for (let j = 0; j < 3; j++) M[i][j] += r[i] * r[j]; } });
    for (let i = 0; i < 3; i++){ let m = i; for (let k = i + 1; k < 3; k++) if (Math.abs(M[k][i]) > Math.abs(M[m][i])) m = k;
      [M[i], M[m]] = [M[m], M[i]]; [v[i], v[m]] = [v[m], v[i]];
      for (let k = 0; k < 3; k++) if (k !== i){ const f = M[k][i] / M[i][i]; for (let j = i; j < 3; j++) M[k][j] -= f * M[i][j]; v[k] -= f * v[i]; } }
    return v.map((x, i) => x / M[i][i]);
  }
  const cx = fit('x'), cy = fit('y');
  const aff = (la, ln) => [cx[0]*la + cx[1]*ln + cx[2], cy[0]*la + cy[1]*ln + cy[2]];
  const res = P.map(p => { const a = aff(p.lat, p.lng); return [p.x - a[0], p.y - a[1]]; });
  return (la, ln) => {                      // 손그림 지도 보정: 가까운 기준점 오차를 가중 평균
    let sw = 0, sx = 0, sy = 0;
    for (let i = 0; i < P.length; i++){
      const d2 = ((la - P[i].lat) * 111) ** 2 + ((ln - P[i].lng) * 93) ** 2;
      if (d2 < 1e-6){ const a = aff(la, ln); return [a[0] + res[i][0], a[1] + res[i][1]]; }
      sw += 1 / d2; sx += res[i][0] / d2; sy += res[i][1] / d2;
    }
    const a = aff(la, ln); return [a[0] + sx / sw, a[1] + sy / sw];
  };
}
const Project = makeProjector(window.MAP_POINTS);
function toLand(x, y){                       // 바다·한라산 칸에 떨어지면 가장 가까운 땅 칸 안으로
  const c = cellOf(x, y); if (cellType(c.row, c.col) === 'land') return [x, y];
  let best = null, bd = 1e9;
  for (let r = 1; r <= ROWS; r++) for (let k = 1; k <= COLS; k++){
    if (cellType(r, k) !== 'land') continue;
    const mx = (colLine(k - 1) + colLine(k)) / 2, my = (rowLine(r - 1) + rowLine(r)) / 2, d = (mx - x) ** 2 + (my - y) ** 2;
    if (d < bd){ bd = d; best = [r, k]; }
  }
  const x0 = colLine(best[1] - 1), x1 = colLine(best[1]), y0 = rowLine(best[0] - 1), y1 = rowLine(best[0]), m = (x1 - x0) * .2;
  return [Math.min(Math.max(x, x0 + m), x1 - m), Math.min(Math.max(y, y0 + m), y1 - m)];
}
HERITAGE.forEach(s => {
  if (Project && s.lat != null){ let [x, y] = Project(s.lat, s.lng); if (!s.island) [x, y] = toLand(x, y); s.x = Math.round(x); s.y = Math.round(y); }
  Object.assign(s, cellOf(s.x, s.y));
});
const SPOT = Object.fromEntries(HERITAGE.map(s => [s.id, s]));
const CAT_NAME = { '문화':'문화유산', '자연':'자연유산', '무형':'무형유산', '연계':'연계 명소' };
function spotsAt(r, c){ return HERITAGE.filter(s => s.row === r && s.col === c); }
const isStart = s => s.row === START.row && s.col === START.col;
function hasJong(w){ const c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c % 28 !== 0; }
function josa(w, a, b){ return w + (hasJong(w) ? a : b); }

/* ---------- 칸 사이 거리 (땅으로만) ---------- */
function bfs(from){
  const dist = {}, q = [[from.row, from.col]]; dist[from.row + ',' + from.col] = 0;
  while (q.length){
    const [r, c] = q.shift();
    for (const [dr, dc] of DIRS){
      const nr = r + dr, nc = c + dc, k = nr + ',' + nc;
      if (cellType(nr, nc) !== 'land' || k in dist) continue;
      dist[k] = dist[r + ',' + c] + 1; q.push([nr, nc]);
    }
  }
  return dist;
}
const DIST = {};
function dist(a, b){ const k = a.row + ',' + a.col; return (DIST[k] = DIST[k] || bfs(a))[b.row + ',' + b.col] ?? 99; }

/* ---------- 테마 추천: 테마 장소 중 서로 다른 칸 3곳, 이동 거리가 짧은 코스 ---------- */
function themeSpots(th){ return HERITAGE.filter(s => s.theme === th && !s.island && !isStart(s) && cellType(s.row, s.col) === 'land'); }
function bestOrder(list){
  let best = null;
  const perm = (arr, pre) => {
    if (!arr.length){
      let d = 0, p = START; pre.forEach(s => { d += dist(p, s); p = s; });
      if (!best || d < best.d) best = { d, list:pre };
      return;
    }
    arr.forEach((s, i) => perm(arr.filter((_, j) => j !== i), pre.concat(s)));
  };
  perm(list, []);
  return best;
}
const MIN_GAP = 2;                                  // 추천 장소끼리 최소 칸 간격
const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
function recommend(th, avoid){
  const pool = themeSpots(th), cands = [];
  for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) for (let k = j + 1; k < pool.length; k++){
    const t = [pool[i], pool[j], pool[k]];
    // 같은 칸·바로 옆 칸은 안 돼요: 세 곳이 서로 2칸 이상 떨어져 있어야 해요
    if (Math.min(cheb(t[0], t[1]), cheb(t[0], t[2]), cheb(t[1], t[2])) < MIN_GAP) continue;
    const b = bestOrder(t); if (b.d < 99) cands.push(b);
  }
  // 너무 쉽지도(일직선) 어렵지도 않게: 이동 거리 6칸 안팎 + 방향 바꾸기가 있는 코스를 우선
  const turns = c => { let n = 0, d = START.dir, p = START;
    autoProgram(c.list.map(s => s.id)).forEach(b => { if (b.t === 'turn') n++; }); return n; };
  cands.forEach(c => c.score = Math.abs(c.d - 6) + (turns(c) ? 0 : 4));
  cands.sort((a, b) => a.score - b.score);
  const top = cands.slice(0, 12).filter(c => !avoid || c.list.map(s => s.id).join() !== avoid);
  const pick = top[Math.floor(Math.random() * top.length)] || cands[0];
  return pick ? pick.list.map(s => s.id) : [];
}

/* =====================================================================
   블록 (핑퐁 스크래치 웹과 같은 블록만)
   프로그램 = [{t:'move',dir:1|-1,cm}, {t:'turn',dir:'L'|'R',deg}, {t:'tts',text}, {t:'say',text},
              {t:'wait',sec}, {t:'rep',n,cm}]
   ===================================================================== */
const BLOCK_KIND = {
  move: { color:'#12bd8c', line:'#0b9a6f', cat:'오토카' },
  turn: { color:'#12bd8c', line:'#0b9a6f', cat:'오토카' },
  rep:  { color:'#ffab19', line:'#cf8b17', cat:'제어' },
  wait: { color:'#ffab19', line:'#cf8b17', cat:'제어' },
  tts:  { color:'#0fa5c8', line:'#0b84a0', cat:'음성(TTS)' },
  say:  { color:'#9966ff', line:'#774dcb', cat:'말풍선' },
};
const NEW_BLOCK = {
  move: () => ({ t:'move', dir:1, cm:10 }),
  turn: () => ({ t:'turn', dir:'R', deg:90 }),
  rep:  () => ({ t:'rep', n:2, body:[] }),
  wait: () => ({ t:'wait', sec:1 }),
  tts:  () => ({ t:'tts', text:'여기는 ' }),
  say:  () => ({ t:'say', text:'여기는 ' }),
};
const CM_OPTS = [10,20,30,40,50,60], N_OPTS = [2,3,4,5,6], SEC_OPTS = [1,2,3];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sel(field, val, opts){
  return `<select data-f="${field}">${opts.map(o => `<option value="${o[0]}"${String(o[0]) === String(val) ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>`;
}
const pair = arr => arr.map(v => [v, v]);
/* 블록 HTML (바다 미션과 같은 스크래치 모양)
   edit=false 면 값만 보여줌 · path = 블록 위치("2" 또는 "2.0" — 반복 안쪽) · 편집 모드에는 오른쪽 끝 ✕ */
function blockHTML(b, edit, path){
  const k = BLOCK_KIND[b.t];
  const f = (field, val, opts) => edit ? sel(field, val, opts) : `<span class="v">${esc((opts.find(o => String(o[0]) === String(val)) || [0, val])[1])}</span>`;
  const txt = val => edit ? `<input data-f="text" value="${esc(val)}" maxlength="40" placeholder="여기는 ○○입니다">` : `<span class="v">${esc(val)}</span>`;
  const car = `${ICON_SVG}<span class="sep"></span>`;
  const x = edit ? '<button class="bx" title="이 블록 지우기">✕</button>' : '';
  const wrap = inner => `<div class="blk b-${b.t}" style="--fill:${k.color};--line:${k.line};--dd:${k.line}"><div class="shape">${inner}${x}</div></div>`;
  if (b.t === 'move') return wrap(`${car}${f('dir', b.dir, [[1,'앞쪽'],[-1,'뒤쪽']])} ${f('cm', b.cm, pair(CM_OPTS))} cm 이동하기`);
  if (b.t === 'turn') return wrap(`${car}${f('dir', b.dir, [['L','왼쪽'],['R','오른쪽']])} 으로 ${f('deg', b.deg, pair([90,180]))} 도 회전하기`);
  if (b.t === 'wait') return wrap(`⏱ ${f('sec', b.sec, pair(SEC_OPTS))} 초 기다리기`);
  if (b.t === 'tts')  return wrap(`🔊 ${txt(b.text)} 말하기`);
  if (b.t === 'say')  return wrap(`💬 ${txt(b.text)} 말풍선`);
  // 반복: C자 모양 — 안쪽(slot)에 다른 블록을 넣으면 벌어지며 채워짐
  return `<div class="blk cblk b-rep" style="--fill:${k.color};--line:${k.line};--dd:${k.line}">
    <div class="shape ctop">🔁 ${f('n', b.n, pair(N_OPTS))} 번 반복하기${x}</div>
    <div class="cmouth"><div class="slot" data-list="${path ?? ''}">${rowsHTML(b.body || [], path ?? 'x', edit)}</div></div>
    <div class="shape cbot"></div></div>`;
}
function rowsHTML(list, base, edit){
  return list.map((b, i) => { const p = base === '' ? String(i) : base + '.' + i;
    return `<div class="row" data-path="${p}">${blockHTML(b, edit, p)}</div>`; }).join('');
}
/* 위치(path)로 블록·목록 찾기 */
function listAt(prog, lp){ if (lp === '' || lp == null) return prog; const b = blockAt(prog, lp); return b ? (b.body = b.body || []) : null; }
function blockAt(prog, p){ let list = prog, b = null; for (const i of String(p).split('.')){ b = list[+i]; if (!b) return null; list = b.body || []; } return b; }
function parentOf(p){ const a = String(p).split('.'); const i = +a.pop(); return { lp:a.join('.'), i }; }
function walk(list, fn){ list.forEach(b => { fn(b); if (b.body) walk(b.body, fn); }); }
function countBlocks(list){ let n = 0; walk(list, () => n++); return n; }
/* 예전 형식(반복 안에 cm만 있던 것)도 읽을 수 있게 */
function normProg(list){ (list || []).forEach(b => { if (b.t === 'rep'){ if (!b.body) b.body = [{ t:'move', dir:1, cm:b.cm || 10 }]; delete b.cm; normProg(b.body); } }); return list || []; }
function readField(el, b){       // 편집칸 하나 → 블록 값
  const f = el.dataset.f, v = el.value;
  b[f] = f === 'text' || f === 'dir' && isNaN(+v) ? v : +v;
}

/* 프로그램 → 한 걸음씩(칸·회전·말·기다림) */
function expand(prog, base = '', steps = []){
  prog.forEach((b, i) => {
    const src = base === '' ? String(i) : base + '.' + i;
    if (b.t === 'move') for (let k = 0; k < b.cm / 10; k++) steps.push({ k:'cell', sign:b.dir, src });
    if (b.t === 'rep'){ for (let n = 0; n < b.n; n++){ steps.push({ k:'loop', src }); expand(b.body || [], src, steps); } }
    if (b.t === 'turn') steps.push({ k:'turn', d:(b.dir === 'L' ? -1 : 1) * b.deg / 90, src });
    if (b.t === 'tts' || b.t === 'say') steps.push({ k:'speak', voice:b.t === 'tts', text:b.text, src });
    if (b.t === 'wait') steps.push({ k:'wait', sec:b.sec, src });
  });
  return steps;
}
/* 말한 내용에 그 장소 이름이 들어 있나 (띄어쓰기 무시, 부르는 이름 또는 정식 이름 앞부분) */
const norm = s => String(s).replace(/[\s·ㆍ『』()\-]/g, '');
function saysName(text, s){
  const t = norm(text);
  return t.includes(norm(s.key)) || t.includes(norm(s.name).slice(0, 4));
}
function calcScore(prog, stamps, crashes){
  let r = 0; walk(prog, b => { if (b.t === 'rep' && (b.body || []).length) r++; });   // 안이 빈 반복은 점수 없음
  const reps = Math.min(SCORE.repeatMax, r);
  const few = stamps > 0 && countBlocks(prog) <= SCORE.fewBlocksLimit;
  const parts = [
    ['⭐ 스탬프', stamps, stamps * SCORE.stamp],
    ['🔁 반복 블록', reps, reps * SCORE.repeat],
    ['🧱 블록 ' + SCORE.fewBlocksLimit + '개 이하', few ? '성공' : '-', few ? SCORE.fewBlocks : 0],
    ['💥 부딪힘', crashes, crashes * SCORE.crash],
  ];
  return { total: Math.max(0, parts.reduce((a, p) => a + p[2], 0)), parts };
}

/* 정답 예시 코드 (선생님 예시 데이터·힌트용): 칸 최단 경로 → 블록 */
function autoProgram(course){
  const prog = []; let st = { row:START.row, col:START.col, dir:START.dir };
  course.forEach(id => {
    const s = SPOT[id]; const prev = {}; const q = [[st.row, st.col]]; prev[st.row + ',' + st.col] = null;
    while (q.length){ const [r, c] = q.shift(); if (r === s.row && c === s.col) break;
      for (const [dr, dc] of DIRS){ const nr = r + dr, nc = c + dc, k = nr + ',' + nc; if (cellType(nr, nc) !== 'land' || k in prev) continue; prev[k] = [r, c]; q.push([nr, nc]); } }
    const path = []; let cur = [s.row, s.col]; while (cur){ path.unshift(cur); cur = prev[cur[0] + ',' + cur[1]]; }
    let run = 0;
    const flush = () => { if (run){ prog.push(run >= 3 ? { t:'rep', n:run, body:[{ t:'move', dir:1, cm:10 }] } : { t:'move', dir:1, cm:run * 10 }); run = 0; } };
    for (let i = 1; i < path.length; i++){
      const nd = DIRS.findIndex(d => d[0] === path[i][0] - path[i-1][0] && d[1] === path[i][1] - path[i-1][1]);
      const diff = (nd - st.dir + 4) % 4;
      if (diff){ flush(); prog.push({ t:'turn', dir: diff === 3 ? 'L' : 'R', deg: diff === 2 ? 180 : 90 }); }
      st.dir = nd; run++;
    }
    flush(); st.row = s.row; st.col = s.col;
    prog.push({ t:'tts', text:`여기는 ${s.key}입니다` });
  });
  return prog;
}

/* ---------- 음성(TTS): 안 되면 말풍선만 ---------- */
const Voice = (() => {
  const ok = 'speechSynthesis' in window;
  let on = true, voice = null;
  function pick(){ const vs = speechSynthesis.getVoices(); voice = vs.find(v => /^ko/i.test(v.lang)) || null; }
  if (ok){ pick(); speechSynthesis.onvoiceschanged = pick; }
  return {
    get available(){ return ok && !!voice; },
    set(v){ on = v; if (!v && ok) speechSynthesis.cancel(); },
    stop(){ if (ok) speechSynthesis.cancel(); },
    speak(text){                     // 끝날 때까지 기다림(최대 6초)
      return new Promise(res => {
        if (!on || !ok || !voice) return setTimeout(res, 1600);
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.voice = voice;
        const t = setTimeout(res, 6000); u.onend = u.onerror = () => { clearTimeout(t); res(); };
        speechSynthesis.speak(u);
      });
    }
  };
})();

/* ---------- 보내기 형식: 구글 시트 path 칸 하나에 JSON ---------- */
function encodeRecord(o){ return 'H|' + JSON.stringify(o); }
function decodeRecord(str){ try { return String(str).startsWith('H|') ? JSON.parse(String(str).slice(2)) : null; } catch(e){ return null; } }

/* =====================================================================
   핑퐁 스크래치(.sb3) 만들기 — 웹 핑퐁 스크래치 '컴퓨터에서 불러오기'로 열기
   ===================================================================== */
const SB3 = (() => {
  const S = 360 / IMG.h, CELLPX = GRID.width / COLS * S;
  const X0 = -IMG.w * S / 2 + GRID.left * S, Y0 = 180 - GRID.top * S;
  const startXY = [Math.round(X0 + (START.col - .5) * CELLPX), Math.round(Y0 - (START.row - .5) * CELLPX)];
  const steps = cm => Math.round(cm / 10 * CELLPX);

  function project(prog, title){
    const blocks = {}; let n = 0;
    const id = p => p + (++n);
    const txt = v => [1, [10, String(v)]], num = v => [1, [4, String(v)]];
    const menu = (op, field, val, parent) => { const i = id('m'); blocks[i] = { opcode:op, next:null, parent, inputs:{}, fields:{ [field]:[val, null] }, shadow:true, topLevel:false }; return [1, i]; };
    // items: [opcode, inputsFn(i), extra]
    function chain(items, parent){
      const ids = items.map(() => id('b'));
      items.forEach(([op, inp, extra], k) => {
        const i = ids[k];
        blocks[i] = { opcode:op, next: ids[k + 1] || null, parent: k ? ids[k - 1] : parent, inputs:{}, fields:{}, shadow:false, topLevel:false };
        if (inp) blocks[i].inputs = inp(i);
        if (extra) extra(i);
      });
      return ids[0];
    }
    const carMove = (cm, dir) => ['PingPongAutoCar_moveRobot', i => ({ DIRECTION: menu('PingPongAutoCar_menu_MOVE_LENGTH_DIRECTION_MENU', 'MOVE_LENGTH_DIRECTION_MENU', dir > 0 ? '1' : '-1', i), INTERVAL: txt(cm) })];
    const scrMove = (cm, dir) => ['motion_movesteps', () => ({ STEPS: num(dir * steps(cm)) })];
    const items = [
      ['event_whenflagclicked'],
      ['text2speech_setLanguage', i => ({ LANGUAGE: menu('text2speech_menu_languages', 'languages', 'ko', i) })],
      ['motion_gotoxy', () => ({ X: num(startXY[0]), Y: num(startXY[1]) })],
      ['motion_pointindirection', () => ({ DIRECTION: [1, [8, '90']] })],
    ];
    function build(list){
      const out = [];
      list.forEach(b => {
        if (b.t === 'move') out.push(carMove(b.cm, b.dir), scrMove(b.cm, b.dir));
        if (b.t === 'turn') out.push(
          ['PingPongAutoCar_rotateRobot', i => ({ DIRECTION: menu('PingPongAutoCar_menu_MOVE_WIDTH_DIRECTION_MENU', 'MOVE_WIDTH_DIRECTION_MENU', b.dir === 'L' ? '0' : '1', i), DEGREE: txt(b.deg) })],
          [b.dir === 'L' ? 'motion_turnleft' : 'motion_turnright', () => ({ DEGREES: num(b.deg) })]);
        if (b.t === 'tts') out.push(['text2speech_speakAndWait', () => ({ WORDS: txt(b.text) })]);
        if (b.t === 'say') out.push(['looks_sayforsecs', () => ({ MESSAGE: txt(b.text), SECS: num(2) })]);
        if (b.t === 'wait') out.push(['control_wait', () => ({ DURATION: [1, [5, String(b.sec)]] })]);
        if (b.t === 'rep') out.push(['control_repeat', i => { const inner = build(b.body || []);
          return inner.length ? { TIMES: [1, [6, String(b.n)]], SUBSTACK: [2, chain(inner, i)] } : { TIMES: [1, [6, String(b.n)]] }; }]);
      });
      return out;
    }
    items.push(...build(prog));
    const first = chain(items, null);
    Object.assign(blocks[first], { topLevel:true, x:40, y:40, parent:null });
    return blocks;
  }

  // --- 작은 zip 만들기 (압축 없이 저장) ---
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files){                 // [{name, data:Uint8Array}]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    files.forEach(f => {
      const nm = enc.encode(f.name), c = crc32(f.data), sz = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint32(14, c, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, f.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, c, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + sz;
    });
    const cs = central.reduce((a, p) => a + p.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type:'application/x.scratch.sb3' });
  }
  async function md5hex(u8){        // 파일 이름용 고유값 (SHA-1 앞 32자리 — 스크래치는 이름만 맞으면 됨)
    const h = await crypto.subtle.digest('SHA-1', u8); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }
  async function backdrop(img){
    const cv = document.createElement('canvas'); cv.width = 960; cv.height = 720;
    const g = cv.getContext('2d'); g.fillStyle = '#d6eef8'; g.fillRect(0, 0, 960, 720);
    const w = Math.round(IMG.w * 720 / IMG.h); g.drawImage(img, (960 - w) / 2, 0, w, 720);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  }
  async function build(prog, title, img){
    const bg = await backdrop(img);
    const carSvg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="74" height="74" viewBox="-50 -50 100 100"><g transform="rotate(90)">' +
      CAR_SVG.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') + '</g></svg>');
    const bgId = await md5hex(bg), carId = await md5hex(carSvg);
    const pj = { targets:[
      { isStage:true, name:'Stage', variables:{}, lists:{}, broadcasts:{}, blocks:{}, comments:{}, currentCostume:0,
        costumes:[{ name:'제주 지도', bitmapResolution:2, dataFormat:'png', assetId:bgId, md5ext:bgId + '.png', rotationCenterX:480, rotationCenterY:360 }],
        sounds:[], volume:100, layerOrder:0, tempo:60, videoTransparency:50, videoState:'on', textToSpeechLanguage:'ko' },
      { isStage:false, name:'오토카', variables:{}, lists:{}, broadcasts:{}, blocks:project(prog, title), comments:{}, currentCostume:0,
        costumes:[{ name:'오토카', bitmapResolution:1, dataFormat:'svg', assetId:carId, md5ext:carId + '.svg', rotationCenterX:37, rotationCenterY:37 }],
        sounds:[], volume:100, layerOrder:1, visible:true, x:startXY[0], y:startXY[1], size:100, direction:90, draggable:true, rotationStyle:'all around' },
    ], monitors:[], extensions:['PingPongAutoCar', 'text2speech'], meta:{ semver:'3.0.0', vm:'0.2.0', agent:'jeju-heritage-planner' } };
    return zip([
      { name:'project.json', data:new TextEncoder().encode(JSON.stringify(pj)) },
      { name:bgId + '.png', data:bg },
      { name:carId + '.svg', data:carSvg },
    ]);
  }
  async function download(prog, title, img){
    const blob = await build(prog, title, img);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = (title || '제주헤리티지') + '.sb3';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  return { build, download, project };
})();

/* ---------- 화면 효과 ---------- */
function fitBlocks(){}                       // (블록 크기는 CSS가 맞춰요)
function bubble(layer, row, col, text, kind, ms){
  layer.querySelectorAll('.bubble').forEach(b => b.remove());
  const b = document.createElement('div'), r = cellRect(row, col);
  b.className = 'bubble ' + (kind || ''); b.textContent = text;
  const below = row <= 2;
  if (below) b.classList.add('below');
  b.style.top = (below ? r.y + r.h * .45 : r.y - r.h * .45) + '%';
  b.style.left = Math.min(Math.max(r.x, 22), 78) + '%';
  layer.appendChild(b);
  setTimeout(() => b.remove(), ms || 1900);
}
function bumpCar(sign, ms){
  const inner = car.querySelector('.inner');
  inner.animate([
    { transform:'translateY(0)' }, { transform:`translateY(${sign > 0 ? '-24%' : '24%'})`, offset:.25 },
    { transform:'translateY(0) rotate(-9deg)', offset:.45 }, { transform:'rotate(9deg)', offset:.6 },
    { transform:'rotate(-6deg)', offset:.75 }, { transform:'none' }
  ], { duration: ms + 100, easing:'ease-out' });
}
