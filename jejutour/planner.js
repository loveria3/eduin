/* =====================================================================
   제주 헤리티지 자율주행 택시 — 학생 화면
   ① 테마 → ② 추천 3곳 → ③ 블록 코딩·실행(도착 안내로 스탬프) → ④ 코스 카드·저장·보내기
   ===================================================================== */
const board = $('board'), layer = $('layer'), stack = $('stack');
function updateCellVar(){ board.style.setProperty('--cell', board.clientWidth * cellSize() / 100 + 'px'); }
const SERVER = (window.SERVER_URL || '').trim();

/* ---------- 상태 ---------- */
let me = { no:null, name:'' };
let theme = null, course = [], prog = [], pickSlot = null;
let st, running = false, stopFlag = false;
let last = { stamps:[], crashes:0 };              // 마지막 실행 결과
let best = 0;
let extra = { target:'친구', line:'', season:'', why:'', tip:'', style:[], av:'' };

document.addEventListener('input', e => { if (e.target.id === 'courseName') updateGuide(); });
function save(){
  try { localStorage.setItem('jejuHeritage', JSON.stringify({ me, theme, course, prog, cn:$('courseName').value, extra, last, best,
    step:document.body.dataset.step })); } catch(e){}
}
function load(){
  try { return JSON.parse(localStorage.getItem('jejuHeritage') || 'null'); } catch(e){ return null; }
}

/* ---------- 지도 ---------- */
let car, pins = {};
function buildBoard(){
  layer.innerHTML = '';
  board.style.aspectRatio = `${IMG.w} / ${IMG.h}`;
  const sm = document.createElement('div');
  sm.className = 'startMark'; sm.innerHTML = '<span>✈️ 출발</span>';
  const r = cellRect(START.row, START.col);
  Object.assign(sm.style, { left:r.x+'%', top:r.y+'%', width:r.w*.94+'%', height:r.h*.94+'%' });
  layer.appendChild(sm);
  HERITAGE.forEach(s => {
    const d = document.createElement('div');
    d.className = 'hs' + (s.island ? ' island' : '');
    d.style.left = s.x / IMG.w * 100 + '%'; d.style.top = s.y / IMG.h * 100 + '%';
    d.style.setProperty('--tc', THEMES[s.theme].color);
    d.title = s.name; d.onclick = () => openSpot(s.id);
    s.el = d; layer.appendChild(d);
  });
  car = document.createElement('div');
  car.id = 'car'; car.className = 'cellObj';
  car.innerHTML = `<div class="inner">${CAR_SVG}</div>`;
  layer.appendChild(car);
}
function drawDots(){
  const step = +document.body.dataset.step;
  HERITAGE.forEach(s => {
    const show = step === 1 || (step === 2 && (s.theme === theme || pickSlot !== null));
    s.el.classList.toggle('show', show && !course.includes(s.id));
    s.el.classList.toggle('pickable', pickSlot !== null && !s.island);
    s.el.style.opacity = step === 1 ? .55 : (s.theme === theme ? 1 : .45);
  });
  Object.values(pins).forEach(p => p.remove()); pins = {};
  course.forEach((id, i) => {
    const s = SPOT[id], p = document.createElement('div');
    p.className = 'pin' + (last.stamps.includes(id) ? ' ok' : '');
    p.style.left = s.x / IMG.w * 100 + '%'; p.style.top = s.y / IMG.h * 100 + '%';
    p.innerHTML = `<div class="pn"><span>${last.stamps.includes(id) ? '✓' : i + 1}</span></div><div class="pl">${esc(s.key)}</div>`;
    p.onclick = () => openSpot(id);
    pins[id] = p; layer.appendChild(p);
  });
}
function drawCar(animate){
  car.style.setProperty('--mv', animate ? STEP_MS + 'ms' : '0ms');
  place(car, st.row, st.col, CAR_WIDTH_CM / 10 / 0.92);
  car.style.transform = `translate(-50%,-50%) rotate(${st.rot}deg)`;
}
function resetCar(){ st = { row:START.row, col:START.col, dir:START.dir, rot:START.dir * 90 }; drawCar(false); }

/* ---------- 단계 ---------- */
const HINT = {
  1: '지도 위 점은 제주 헤리티지 장소예요 (모두 100곳)',
  2: '번호 핀이 추천 코스예요 · 점을 누르면 장소 설명을 볼 수 있어요',
  3: `${START.name}에서 ${['위(북쪽)', '오른쪽(동쪽)', '아래(남쪽·서귀포 쪽)', '왼쪽(서쪽)'][START.dir]}를 보고 출발 · 한 칸 = 10cm`,
  4: '여행 계획을 채우고 저장해요',
};
function go(step){
  document.body.dataset.step = step;
  $('leftTitle').textContent = ['', '테마 고르기', '코스 정하기', '코딩 미션', '여행 계획'][step];
  $('mapHint').textContent = HINT[step];
  pickSlot = null;
  if (step === 2) drawCourse();
  if (step === 3){ drawMission(); drawStack(); requestAnimationFrame(() => fitBlocks(['palette']));
    if (!prog.length && introSeen !== course.join()) showIntro(); }
  if (step !== 3) hideIntro();
  if (step === 4){ drawCard(); drawStack(); }            // 새로고침 뒤 ④에서도 오른쪽 내 코드가 보이게
  drawDots(); drawScore(); save();
}

/* ① 테마 */
function drawThemes(){
  $('themes').innerHTML = Object.entries(THEMES).map(([k, t]) =>
    `<button class="theme" data-k="${k}" style="--tc:${t.color}"><span class="ti">${t.icon}</span><span><b>${t.name}</b><small>${t.desc}</small></span></button>`).join('');
  $('themes').querySelectorAll('.theme').forEach(b => b.onclick = () => {
    Sound.unlock(); theme = b.dataset.k; course = recommend(theme); prog = []; last = { stamps:[], crashes:0 };
    $('courseName').value = ''; go(2);
  });
}

/* ② 추천 코스 */
function drawCourse(){
  const t = THEMES[theme];
  $('thBadge').innerHTML = `<span style="color:${t.color}">${t.icon} ${t.name}</span>`;
  $('courseList').innerHTML = course.map((id, i) => {
    const s = SPOT[id];
    return `<div class="cItem${pickSlot === i ? ' picking' : ''}"><div class="cNum">${i + 1}</div><div class="cBody">
      <b>${esc(s.name)}</b><small><span class="cat">${CAT_NAME[s.cat]}</span>${esc(s.intro)}</small></div>
      <button class="mini" data-i="${i}">${pickSlot === i ? '취소' : '바꾸기'}</button></div>`;
  }).join('');
  $('courseList').querySelectorAll('button').forEach(b => b.onclick = () => {
    const i = +b.dataset.i; pickSlot = pickSlot === i ? null : i;
    $('mapHint').textContent = pickSlot === null ? HINT[2] : `👉 지도에서 ${pickSlot + 1}번 대신 갈 곳(점)을 눌러요`;
    drawCourse(); drawDots();
  });
  $('btnToCode').disabled = course.length < COURSE_SIZE;
}

/* 장소 카드 */
function openSpot(id){
  const s = SPOT[id], t = THEMES[s.theme], step = +document.body.dataset.step;
  const canPick = step === 2 && pickSlot !== null && !s.island && !course.includes(id);
  $('spotCard').innerHTML = `
    <div><span class="cat" style="background:${t.color};color:#fff">${t.icon} ${t.name}</span><span class="cat">${CAT_NAME[s.cat]}</span>${s.island ? '<span class="cat">⛴ 섬 (오토카로 못 가요)</span>' : ''}</div>
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.intro)}</p>
    <p class="miss">🔎 탐험 미션: ${esc(s.mission)}</p>
    <p>📍 ${esc(s.area)} · 지도 ${s.row}행 ${s.col}열</p>
    ${step >= 3 && course.includes(id) ? `<p>🔊 도착하면: <b>"여기는 ${esc(s.key)}입니다"</b></p>` : ''}
    <div class="btns">${canPick ? `<button class="primary" id="spPick">${pickSlot + 1}번을 여기로 바꾸기</button>` : ''}<button class="ghost" id="spClose">닫기</button></div>
    <div class="src">출처: 2026 제주 국가유산 방문의 해 (jejuheritage.kr)</div>`;
  $('spotPop').classList.add('show');
  $('spClose').onclick = () => $('spotPop').classList.remove('show');
  if (canPick) $('spPick').onclick = () => {
    course[pickSlot] = id; course = bestOrder(course.map(i => SPOT[i])).list.map(s => s.id);
    pickSlot = null; $('spotPop').classList.remove('show'); drawCourse(); drawDots(); save();
    $('mapHint').textContent = HINT[2];
  };
}

/* ③ 코딩 */
/* 코딩 시작 전: 지도 위에 미션 규칙을 크게 */
let introSeen = '';
function showIntro(){
  const dirs = ['위(북쪽)', '오른쪽(동쪽)', '아래(남쪽)', '왼쪽(서쪽)'];
  $('intro').innerHTML = `<div class="introCard">
    <div class="iHead">코딩 미션 <small>자율주행 택시로 3곳을 안내해요</small></div>
    <div class="iFlow">
      <div><i>1</i><b>이동</b><small>오토카 블록으로<br>장소 칸까지</small></div><span>→</span>
      <div><i>2</i><b>말하기</b><small>도착한 바로 다음에<br>"여기는 ○○입니다"</small></div><span>→</span>
      <div class="g"><i>🏅</i><b>스탬프</b><small>둘 다 해야 받아요</small></div>
    </div>
    <div class="iSpots">${course.map((id, i) => { const t = SPOT[id]; return `<span><i>${i + 1}</i>${esc(t.key)} <small>${t.row}행 ${t.col}열</small></span>`; }).join('')}</div>
    <div class="iStart">출발: ${START.name}(${START.row}행 ${START.col}열) · ${dirs[START.dir]}를 보고 출발 · 한 칸 = 10cm</div>
    <button class="primary" id="introGo">확인했어요 · 코딩 시작</button>
  </div>`;
  $('intro').classList.add('show');
  $('introGo').onclick = () => { introSeen = course.join(); hideIntro(); updateGuide(); };
  updateGuide();
}
function hideIntro(){ $('intro') && $('intro').classList.remove('show'); }
function drawMission(){
  $('mission').innerHTML = `<div class="mt">미션: 3곳에서 스탬프 받기 <button class="mini" id="btnIntro">크게 보기</button></div>
    <div class="rule">
      <div><i>1</i><b>이동</b><small>오토카 블록으로 장소 칸까지</small></div>
      <div><i>2</i><b>말하기</b><small>도착한 바로 다음에 "여기는 ○○입니다"</small></div>
      <div class="r3"><i>🏅</i><b>스탬프</b><small>둘 다 해야 받아요 · 도착만 하면 없어요</small></div>
    </div>` +
    course.map((id, i) => { const s = SPOT[id], ok = last.stamps.includes(id);
      return `<div class="mRow${ok ? ' ok' : ''}"><span class="st">${ok ? '✓' : i + 1}</span><code>${esc(s.key)}</code><small>${s.row}행 ${s.col}열</small></div>`; }).join('');
  $('btnIntro').onclick = showIntro;
}
function drawPalette(){
  const groups = [['오토카', ['move', 'turn']], ['안내 방송', ['tts', 'say']], ['제어', ['wait', 'rep']]];
  $('palette').innerHTML = groups.map(([g, ks]) => `<div class="cat">${g}</div>` +
    ks.map(k => `<div data-k="${k}">${blockHTML(NEW_BLOCK[k](), false)}</div>`).join('')).join('');
  $('palette').querySelectorAll('[data-k]').forEach(d => Drag.bindPalette(d.querySelector('.blk'), d.dataset.k));
}
function addBlock(k){                         // 팔레트 블록을 '톡' 누르면 맨 아래에 붙음
  if (running) return;
  Sound.unlock(); Sound.click();
  prog.push(NEW_BLOCK[k]());
  drawStack(String(prog.length - 1)); changed();
  stack.scrollTop = stack.scrollHeight;
}
/* 코드가 바뀌면 스탬프는 다시 실행해서 받아요 */
function changed(){ if (paused){ paused = null; runButtons(); } if (last.stamps.length || last.crashes){ last = { stamps:[], crashes:0 }; drawDots(); drawMission(); } save(); drawScore(); }
function removeAt(path){ const { lp, i } = parentOf(path); const list = listAt(prog, lp); return list ? list.splice(i, 1)[0] : null; }
function drawStack(snapPath = null){
  stack.innerHTML = `<div class="hatRow">${HAT_SVG}</div>` + rowsHTML(prog, '', true) +
    `<div class="insertHint">${prog.length ? '블록을 끌어서 옮겨요 · ✕ 또는 왼쪽 칸에 놓으면 지워져요' : '왼쪽 블록을 끌어오거나 눌러서 추가해요'}</div>`;
  if (snapPath !== null) stack.querySelector(`.row[data-path="${snapPath}"]`)?.classList.add('snap');
  stack.querySelectorAll('[data-f]').forEach(f => f.oninput = f.onchange = f.oncompositionend = () => {
    const b = blockAt(prog, f.closest('.row').dataset.path); if (b){ readField(f, b); changed(); } });
  stack.querySelectorAll('.bx').forEach(x => x.onclick = e => {
    if (running) return; e.stopPropagation();
    const r = x.closest('.row'), rect = r.getBoundingClientRect();
    removeAt(r.dataset.path); Drag.poof(rect.right - 20, rect.top + 10); Sound.warn();
    drawStack(); changed();
  });
  $('count').textContent = countBlocks(prog) + '개';
  drawScore();
}

/* =====================================================================
   끌어 놓기 — 스크래치처럼
   · 누르면 살짝 들림(선택 느낌) · 6px 넘게 움직이면 끌기 시작
   · 코드 칸 근처에 오면 회색 자리가 열리고 블록이 그쪽으로 끌려감(자석)
   · 반복 블록 안쪽에 가져가면 ㄷ자가 벌어지며 그 자리가 열림
   · 놓으면 '딸깍' 붙음 · 블록을 떼면 그 블록 하나만 분리 (반복 블록은 안쪽까지 함께)
   · 왼쪽 블록 칸에 놓으면 버리기 · 엉뚱한 곳에 놓으면 제자리로
   ===================================================================== */
const Drag = (() => {
  let d = null;
  const SNAP_X = 90, SNAP_Y = 70;                // 자석이 당기는 거리(px)
  function begin(e, el, src){
    if (running || d || e.button > 0 || e.target.closest('select,input,.bx')) return;
    el.classList.add('press');
    d = { src, el, x0:e.clientX, y0:e.clientY, started:false };
    Sound.unlock();
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
  }
  function bindPalette(el, k){ el.addEventListener('pointerdown', e => begin(e, el, { palette:k })); }
  // 코드 칸은 한 번만 연결(위임): 누른 곳에서 가장 안쪽 블록을 집음
  stack.addEventListener('pointerdown', e => {
    const row = e.target.closest('.row'); if (!row || !stack.contains(row)) return;
    begin(e, row, { path:row.dataset.path });
  });
  function start(){
    d.started = true;
    const r = d.el.getBoundingClientRect();
    d.offX = d.x0 - r.left; d.offY = d.y0 - r.top;
    if (d.src.palette){ d.item = NEW_BLOCK[d.src.palette](); d.from = 'palette'; }
    else {                                        // 그 블록 하나만 떼어 냄
      const { lp, i } = parentOf(d.src.path);
      d.orig = { list:listAt(prog, lp), i }; d.item = d.orig.list.splice(i, 1)[0]; d.from = 'stack';
      drawStack();
    }
    const g = document.createElement('div'); g.id = 'ghost';
    g.style.setProperty('--gbf', getComputedStyle(stack).getPropertyValue('--bf'));
    g.innerHTML = `<div class="gin">${blockHTML(d.item, false)}</div>`;
    document.body.appendChild(g); d.ghost = g;
    document.body.classList.add('dragging');
    if (d.from === 'stack') document.body.classList.add('dragFromStack');
    Sound.click();
  }
  function move(e){
    if (!d) return;
    if (!d.started){ if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return; d.el.classList.remove('press'); start(); }
    let x = e.clientX - d.offX, y = e.clientY - d.offY;
    d.at = target(e.clientX, x, y);
    placeholder(d.at);
    if (d.at){                                    // 자석: 회색 자리 쪽으로 당김
      const pr = stack.querySelector('.ph')?.getBoundingClientRect();
      if (pr){ x += (pr.left - x) * .45; y += (pr.top - y) * .45; }
    }
    d.ghost.classList.toggle('near', !!d.at);
    d.ghost.style.transform = `translate(${x}px, ${y}px)`;
    const pal = $('palette').getBoundingClientRect();
    d.trash = d.from === 'stack' && e.clientX > pal.left && e.clientX < pal.right && e.clientY > pal.top && e.clientY < pal.bottom;
    document.body.classList.toggle('overTrash', !!d.trash);
  }
  /* 놓을 곳: { lp:'' 또는 반복 블록 위치, idx } */
  function target(px, gx, gy){
    const sr = stack.getBoundingClientRect();
    if (px < sr.left - SNAP_X || px > sr.right + SNAP_X || gy < sr.top - SNAP_Y || gy > sr.bottom + SNAP_Y) return null;
    // 반복 블록 안쪽(slot) 중 가장 깊은 곳 먼저
    let box = stack, lp = '';
    stack.querySelectorAll('.slot').forEach(sl => {
      const r = sl.getBoundingClientRect(), cx = gx + 14, cy = gy + 10;
      if (cx > r.left - 10 && cx < r.right + 40 && cy > r.top - 12 && cy < r.bottom + 4){
        const p = sl.dataset.list; if (lp === '' || p.split('.').length > lp.split('.').length){ box = sl; lp = p; }
      }
    });
    let idx = 0;
    box.querySelectorAll(':scope > .row').forEach((r, k) => { const rr = r.getBoundingClientRect(); if (gy > rr.top + Math.min(rr.height, 44) * .5) idx = k + 1; });
    return { lp, idx, box };
  }
  function placeholder(at){
    let ph = stack.querySelector('.ph');
    if (!at){ if (ph) ph.remove(); return; }
    if (!ph){ ph = document.createElement('div'); ph.className = 'ph'; ph.innerHTML = blockHTML(d.item, false); }
    const rows = at.box.querySelectorAll(':scope > .row');
    const before = rows[at.idx] || (at.box === stack ? stack.querySelector('.insertHint') : null);
    if (ph.parentNode !== at.box || ph.nextSibling !== before) at.box.insertBefore(ph, before);
  }
  function up(e){
    if (!d) return;
    d.el.classList.remove('press');
    off();
    if (!d.started){ const k = d.src.palette; d = null; if (k) addBlock(k); return; }   // 톡 누름
    const { from, item, at, trash, orig } = d;
    let snap = null;
    if (trash){ poof(e.clientX, e.clientY); Sound.warn(); }
    else if (at){ listAt(prog, at.lp).splice(at.idx, 0, item); snap = at.lp === '' ? String(at.idx) : at.lp + '.' + at.idx; Sound.click(); }
    else if (from === 'stack'){ orig.list.splice(orig.i, 0, item); }               // 제자리로
    finish();
    drawStack(snap); changed();
  }
  function cancel(){
    if (!d) return; off();
    if (d.started && d.from === 'stack') d.orig.list.splice(d.orig.i, 0, d.item);
    d.el.classList.remove('press'); finish(); drawStack();
  }
  function off(){ removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel); }
  function finish(){
    if (d && d.ghost) d.ghost.remove();
    stack.querySelector('.ph')?.remove();
    document.body.classList.remove('dragging', 'dragFromStack', 'overTrash');
    d = null;
  }
  function poof(x, y){ const p = document.createElement('div'); p.className = 'poof'; p.textContent = '💨'; p.style.left = x + 'px'; p.style.top = y + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 600); }
  return { bindPalette, poof };
})();
function drawScore(){
  const sc = calcScore(prog, last.stamps.length, last.crashes);
  $('score').innerHTML = sc.parts.map(p => `<span title="${p[0]}">${p[0].split(' ')[0]} ${p[1]}</span>`).join('') + `<span class="tot">${sc.total}점</span>`;
  $('btnDone').classList.toggle('locked', !last.stamps.length);
  updateGuide();
  return sc;
}
/* 다음에 할 일 표시: 지금 눌러야 할 곳 하나만 은은하게 깜빡임 */
function updateGuide(){
  document.querySelectorAll('.guide').forEach(el => el.classList.remove('guide'));
  if ($('donePop').classList.contains('show') && !$('planPop').classList.contains('show')){   // 결과 화면: 다음 단추
    const d = wiz.done, g = wiz.step === 1 ? $('wzNext') : !d.img ? $('wzImg') : !d.sb3 ? $('wzSb3') : $('wzNext');
    g && g.classList.add('guide'); return;
  }
  if (running || $('start').classList.contains('show') || document.querySelector('.overlay.show')) return;
  if ($('intro').classList.contains('show')){ $('introGo').classList.add('guide'); return; }
  const step = +document.body.dataset.step;
  let el = null;
  if (step === 1) el = $('themes');
  if (step === 2) el = $('courseName').value.trim() ? $('btnToCode') : $('courseName');
  if (step === 3){
    if (!prog.length) el = document.querySelector('#palette .blk');
    else if (last.stamps.length >= course.length) el = $('btnDone');
    else el = $('btnRun');
  }
  if (el){ el.classList.add('guide');
    const pane = el.closest('.pane');                              // 왼쪽 칸에서 안 보이면 보이게 스크롤
    if (el !== lastGuide && pane){ const er = el.getBoundingClientRect(), pr = pane.getBoundingClientRect();
      if (er.bottom > pr.bottom) pane.scrollTop += er.bottom - pr.bottom + 16; else if (er.top < pr.top) pane.scrollTop -= pr.top - er.top + 16; }
  }
  lastGuide = el;
}
let lastGuide = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));
/* 멈춤 → 이어서 실행: 코드를 안 고쳤으면 멈춘 자리에서 계속 */
let paused = null;
function runButtons(){
  $('btnRun').innerHTML = paused ? '<span class="big">▶</span> 이어서 실행' : '<span class="big">▶</span> 실행';
  $('btnStop').innerHTML = !running && paused ? '↺ 처음부터' : '■ 멈춤';
  $('btnStop').classList.toggle('restart', !running && !!paused);
}
async function run(){
  if (running || !prog.length){ if (!prog.length) toast('블록을 먼저 쌓아요!', 'bad'); return; }
  hideIntro();
  Sound.unlock();
  // 한글 입력이 끝나기 전에 ▶를 눌러도, 칸에 보이는 글자를 그대로 코드에 넣고 시작
  if (document.activeElement && stack.contains(document.activeElement)) document.activeElement.blur();
  stack.querySelectorAll('[data-f]').forEach(f => { const b = blockAt(prog, f.closest('.row').dataset.path); if (b) readField(f, b); });
  save();
  running = true; stopFlag = false;
  document.body.classList.add('running'); updateGuide();
  drawStack();
  const rows = () => stack.querySelectorAll('.row');
  const key = JSON.stringify(prog);
  const steps = expand(prog);
  let got = [], crashes = 0, from = 0, finishNow = false; const hinted = new Set();
  if (paused && paused.key === key){            // 이어서
    ({ got, crashes } = paused); from = paused.idx; st = { ...paused.st }; drawCar(false);
    toast('멈춘 자리에서 이어서 달려요');
  } else { resetCar(); await sleep(250); }
  paused = null; runButtons();
  const before = new Set(got);
  for (let si = from; si < steps.length; si++){
    const s = steps[si];
    if (stopFlag){ paused = { idx:si, st:{ ...st }, got:got.slice(), crashes, key }; break; }
    rows().forEach(r => r.classList.toggle('now', r.dataset.path === s.src));
    if (s.k === 'loop'){ await sleep(120); continue; }
    if (s.k === 'cell'){
      const [dr, dc] = DIRS[st.dir], nr = st.row + dr * s.sign, nc = st.col + dc * s.sign, t = cellType(nr, nc);
      if (t !== 'land'){
        crashes++; Sound.warn(); bumpCar(s.sign, STEP_MS);
        last = { stamps:got.slice(), crashes }; bumpScore(SCORE.crash);
        stack.querySelector(`.row[data-path="${s.src}"]`)?.classList.add('err');
        bubble(layer, st.row, st.col, BLOCK_MSG[t], '', 2200); break;
      }
      st.row = nr; st.col = nc; drawCar(true); Sound.ding(1319); await sleep(STEP_MS + 60);
      const arrived = spotsAt(st.row, st.col).filter(h => course.includes(h.id) && !got.includes(h.id));
      const nxt = steps.slice(si + 1).find(x => x.k !== 'loop');
      if (arrived.length && !(nxt && nxt.k === 'speak') && !hinted.has(arrived[0].id)){
        hinted.add(arrived[0].id);
        bubble(layer, st.row, st.col, `${arrived[0].key} 도착! 여기서 말하기 블록을 넣어요`, '', 2600);
        toast(`${arrived[0].key} 칸에 왔어요 · 이 다음에 말하기 블록으로 "여기는 ${arrived[0].key}입니다"를 넣어야 스탬프를 받아요`, 'bad');
      }
    }
    if (s.k === 'turn'){ st.dir = (st.dir + s.d + 8) % 4; st.rot += s.d * 90; drawCar(true); Sound.ding(1175); await sleep(STEP_MS); }
    if (s.k === 'wait') await sleep(Math.min(3, s.sec) * 1000);
    if (s.k === 'speak'){
      bubble(layer, st.row, st.col, (s.voice ? '🔊 ' : '💬 ') + s.text, 'talk', 2600);
      await (s.voice ? Voice.speak(s.text) : sleep(1600));
      const here = spotsAt(st.row, st.col).filter(h => course.includes(h.id));
      here.forEach(h => { if (saysName(s.text, h) && !got.includes(h.id)) got.push(h.id); });
      if (here.length && !here.some(h => saysName(s.text, h)))
        toast(`여기는 ${here.map(h => h.key).join('·')}! 이름을 넣어 안내해요`, 'bad');
      else if (!here.length){                                       // 장소 칸이 아닌 곳에서 말함
        const want = course.map(id => SPOT[id]).find(h => saysName(s.text, h));
        if (want) toast(`아직 ${want.key} 칸이 아니에요 · ${want.key}는 ${want.row}행 ${want.col}열이에요 (지금 ${st.row}행 ${st.col}열)`, 'bad');
      }
      const fresh = got.filter(id => !before.has(id));
      if (fresh.length){
        const prevT = calcScore(prog, last.stamps.length, last.crashes).total;
        last = { stamps:got.slice(), crashes }; drawDots(); drawMission();
        const total = bumpScore(SCORE.stamp);                       // 스탬프마다 점수가 바로 쌓임
        const all = course.every(id => got.includes(id));        // 세 번째 미션까지 끝 → '결과 보기' 버튼
        await showStamp(fresh[fresh.length - 1], all, got.length, total, total - prevT); before.add(fresh[fresh.length - 1]);
        if (all){ finishNow = true; break; }
      }
    }
  }
  if (paused) stack.querySelector(`.row[data-path="${steps[paused.idx].src}"]`)?.classList.add('next');
  rows().forEach(r => r.classList.remove('now'));
  last = { stamps:got, crashes };
  running = false; document.body.classList.remove('running'); runButtons();
  drawDots(); drawMission();
  const sc = drawScore();
  best = Math.max(best, sc.total); save();
  if (finishNow){ Voice.stop(); go(4); showDone(); return; }
  if (!stopFlag && got.length === course.length){
    Sound.win(); Confetti.burst(); setTimeout(Confetti.burst, 1300);
    toast(`스탬프 3개 완성 · ${sc.total}점 · 완성하기를 눌러요`, 'ok');
    const b = $('btnDone'); b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge');
  }
}
/* 점수판 숫자가 톡 튀며 바뀜 */
function bumpScore(delta){
  const sc = drawScore(), t = $('score').querySelector('.tot');
  if (t){ t.classList.remove('bump', 'minus'); void t.offsetWidth; t.classList.add(delta < 0 ? 'minus' : 'bump'); }
  return sc.total;
}
function showStamp(id, final, n, total, gain){
  const s = SPOT[id];
  Sound.win();
  const dots = course.map((c, i) => `<i class="${i < n ? 'on' : ''}">${i < n ? '🏅' : i + 1}</i>`).join('');
  $('stampCard').innerHTML = `<div class="stStage">${dots}</div><div class="stp"><small>HERITAGE</small>${esc(s.key)}<small>${new Date().getMonth() + 1}.${new Date().getDate()}</small></div>
    <div class="msg">${n}단계 성공! ${esc(s.name)} 스탬프 획득</div>
    <div class="stGain">⭐ +${gain}점 <span>→ 지금 <b>${total}점</b></span></div>${gain > SCORE.stamp
      ? `<div class="stBonus">스탬프 +${SCORE.stamp} · 🧱 블록 ${SCORE.fewBlocksLimit}개 이하 보너스 +${gain - SCORE.stamp}</div>` : ''}
    <div class="miss">🔎 탐험 미션: ${esc(s.mission)}</div>${final
      ? '<div class="msg">미션 3곳을 모두 완료했어요</div><button class="primary" id="stOk">📊 결과 보기 ▶</button>'
      : `<button class="primary" id="stOk">계속 달리기 ▶ <small>(${n + 1}단계로)</small></button>`}`;
  $('stampPop').classList.add('show');
  return new Promise(res => $('stOk').onclick = () => { $('stampPop').classList.remove('show'); res(); });
}

/* ④ 코스 카드 → 여행 계획서 */
function myRec(){
  const sc = calcScore(prog, last.stamps.length, last.crashes);
  return { no:me.no, th:theme, s:course, cn:$('courseName').value.trim(), tg:extra.target, ln:extra.line,
    se:extra.season, why:extra.why, tip:extra.tip, sy:extra.style, av:extra.av, p:prog, st:last.stamps, sc:sc.total };
}
function drawCard(){
  const t = THEMES[theme], sc = calcScore(prog, last.stamps.length, last.crashes);
  $('card').innerHTML = `<div class="courseCard">
    <h3>📜 ${esc($('courseName').value.trim() || t.name + ' 코스')}</h3>
    <div><span class="cat" style="background:${t.color};color:#fff">${t.icon} ${t.name}</span> ${me.no}번 · <b>${sc.total}점</b> · 스탬프 ${last.stamps.length}/3</div>
    <p class="cardTip">아래 칸을 채우면 <b>여행 계획서</b>가 완성돼요</p>
    ${fieldsHTML('c')}
  </div>
  <button class="primary" id="btnPlan">👀 여행 계획서 보기 · 🖼 이미지 저장</button>
  <button class="primary" id="btnSb3" style="background:#ffab19;box-shadow:0 4px 0 #d98b00">💾 핑퐁 스크래치 파일 저장</button>
  ${SERVER ? '<button class="primary" id="btnSend" style="background:#4c97ff;box-shadow:0 4px 0 #2f6fd0">📮 선생님께 보내기</button>' : ''}
  <button class="ghost" id="btnBack">← 코딩으로 돌아가기</button>`;
  bindFields('c');
  $('btnBack').onclick = () => go(3);
  $('btnPlan').onclick = showPlan;
  $('btnSb3').onclick = saveSb3;
  if (SERVER) $('btnSend').onclick = () => send();
}
/* 계획서 입력 칸: 왼쪽 코스 카드(c)와 결과 화면 ①단계(w)가 같은 값을 씀 */
function fieldsHTML(px){
  const opt = (list, v) => list.map(x => `<option${x === v ? ' selected' : ''}>${x}</option>`).join('');
  return `<label class="field">누구에게 추천해요?<select id="${px}Target">${opt(['가족', '친구', '혼자', '어르신', '외국인 관광객', '어린이와 함께'], extra.target)}</select></label>
    <label class="field">언제 가면 좋아요?<select id="${px}Season"><option value="">고르기</option>${opt(['봄', '여름', '가을', '겨울', '사계절 언제나'], extra.season)}</select></label>
    <div class="field wide"><span>여행 스타일 <small>최대 2개</small></span><div class="chips" id="${px}Style">${STYLE_OPTS.map(o =>
      `<button type="button" class="chip${(extra.style || []).includes(o) ? ' on' : ''}" data-v="${o}">${o}</button>`).join('')}</div></div>
    <div class="field wide"><span>자율주행 택시가 필요한 이유 <small>1개</small></span><div class="chips" id="${px}Av">${Object.keys(AV_OPTS).map(o =>
      `<button type="button" class="chip${extra.av === o ? ' on' : ''}" data-v="${o}">${o}</button>`).join('')}</div></div>
    <label class="field wide">한 줄 소개<input id="${px}Line" maxlength="40" value="${esc(extra.line)}" placeholder="예) 제주의 시간을 거슬러 오르는 여행"></label>
    <label class="field wide">이 코스를 추천하는 이유<textarea id="${px}Why" maxlength="120" rows="2" placeholder="예) 화산이 만든 오름과 바위를 하루에 다 볼 수 있어요">${esc(extra.why)}</textarea></label>
    <label class="field wide">준비물 · 여행 팁<input id="${px}Tip" maxlength="60" value="${esc(extra.tip)}" placeholder="예) 편한 운동화, 물, 오름은 바람이 세요"></label>`;
}
function bindFields(px, after){
  [['Target', 'target'], ['Season', 'season'], ['Line', 'line'], ['Why', 'why'], ['Tip', 'tip']].forEach(([id, k]) => {
    const el = $(px + id); el.oninput = el.onchange = () => { extra[k] = el.value; save(); after && after(); };
  });
  $(px + 'Style').querySelectorAll('.chip').forEach(b => b.onclick = () => {      // 스타일: 최대 2개
    const v = b.dataset.v, list = extra.style || (extra.style = []), i = list.indexOf(v);
    if (i >= 0) list.splice(i, 1); else if (list.length >= 2){ toast('여행 스타일은 2개까지 고를 수 있어요', 'bad'); return; } else list.push(v);
    b.classList.toggle('on', list.includes(v)); save(); after && after();
  });
  $(px + 'Av').querySelectorAll('.chip').forEach(b => b.onclick = () => {        // 자율주행 이유: 1개
    extra.av = extra.av === b.dataset.v ? '' : b.dataset.v;
    $(px + 'Av').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.v === extra.av)); save(); after && after();
  });
}
function planFile(){ return `${me.no}번_${$('courseName').value.trim() || THEMES[theme].name}_여행계획서`.replace(/[\\/:*?"<>|\s]+/g, '_'); }
async function savePlan(){
  toast('이미지를 만드는 중…');
  try { await savePlanImage(myRec(), planFile()); toast('계획서 이미지를 저장했어요 · 패들렛에 올려요', 'ok'); }
  catch(e){ toast('이미지를 저장하지 못했어요: ' + e.message, 'bad'); }
}
function showPlan(){
  $('planCard').innerHTML = planSheetHTML(myRec()) + `<div class="pbtns"><button class="primary" id="plSave">🖼 이미지로 저장 (패들렛용)</button><button class="ghost" id="plClose">닫기</button></div>`;
  $('planPop').classList.add('show');
  $('plSave').onclick = savePlan; $('plClose').onclick = () => $('planPop').classList.remove('show');
}
async function saveSb3(){
  try {
    const name = `${me.no}번_${$('courseName').value.trim() || THEMES[theme].name}`.replace(/[\\/:*?"<>|\s]+/g, '_');
    await SB3.download(prog, name, $('bgImg'));
    toast('저장했어요 · 핑퐁 스크래치 → 파일 → 컴퓨터에서 불러오기', 'ok');
  } catch(e){ toast('저장하지 못했어요: ' + e.message, 'bad'); }
}
let sending = false;
async function send(quiet){
  if (!SERVER) return false;
  if (sending) return false; sending = true;
  const sc = calcScore(prog, last.stamps.length, last.crashes);
  const rec = myRec(); delete rec.no;
  if (!quiet) toast('보내는 중…');
  let ok = true;
  try {
    await fetch(SERVER, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'text/plain' },
      body:JSON.stringify({ no:me.no, path:encodeRecord(rec), reached:last.stamps.length === course.length }) });
    if (!quiet) toast(`${me.no}번 · 선생님께 보냈어요`, 'ok');
  } catch(e){ ok = false; if (!quiet) toast('보내지 못했어요. 인터넷을 확인해요', 'bad'); }
  setTimeout(() => sending = false, 1500);
  return ok;
}

/* ---------- 알림 ---------- */
let toastTimer;
function toast(msg, kind){
  const t = $('toast'); t.textContent = msg; t.className = 'show ' + (kind || '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = '', 3000);
}

/* ---------- 시작 화면 (번호 1~30 + 이름) ---------- */
function setupStart(saved){
  const n = window.CLASS_SIZE || 30;
  $('numGrid').innerHTML = Array.from({ length:n }, (_, i) => `<button data-n="${i + 1}">${i + 1}</button>`).join('');
  const pick = no => { me.no = no; $('numGrid').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.n === no)); $('btnStart').disabled = false; };
  $('numGrid').querySelectorAll('button').forEach(b => b.onclick = () => pick(+b.dataset.n));
  if (saved && saved.me && saved.me.no) pick(saved.me.no);
  $('btnStart').onclick = () => {
    Sound.unlock();

    $('who').hidden = false; $('who').textContent = `${me.no}번 ✎`;
    $('start').classList.remove('show');
    const s = saved && saved.theme && saved.me && saved.me.no === me.no ? saved : null;
    if (s){ theme = s.theme; course = s.course || []; prog = normProg(s.prog || []); last = s.last || last; best = s.best || 0; extra = Object.assign({ target:'친구', line:'', season:'', why:'', tip:'', style:[], av:'' }, s.extra || {});
      $('courseName').value = s.cn || ''; go(+s.step || 2); }
    else go(1);
    if (!Voice.available) toast('이 기기는 음성이 나오지 않아 말풍선으로 보여 줘요');
  };
  $('who').onclick = () => $('start').classList.add('show');
}

/* ---------- 단계 탭: 누르면 이전 단계로 돌아가기 ---------- */
function canGo(step){
  if (step === 1) return true;
  if (step === 2) return !!theme && course.length > 0;
  if (step === 3) return course.length === COURSE_SIZE;
  if (step === 4) return last.stamps.length > 0;
}
document.querySelectorAll('.steps span').forEach(sp => sp.onclick = () => {
  const n = +sp.dataset.s;
  if (running) return;
  if (canGo(n)) go(n); else toast(n === 4 ? '스탬프를 1개 이상 받으면 갈 수 있어요' : '앞 단계를 먼저 해요', 'bad');
});
/* ---------- 초기화: 번호만 남기고 처음부터 ---------- */
$('btnInit').onclick = () => {
  if (running) return;
  if (!confirm('테마·코스·코드를 모두 지우고 처음부터 할까요?')) return;
  theme = null; course = []; prog = []; last = { stamps:[], crashes:0 }; best = 0; extra = { target:'친구', line:'', season:'', why:'', tip:'', style:[], av:'' };
  $('courseName').value = ''; resetCar(); drawStack(); go(1);
  toast('처음부터 다시 시작해요');
};

/* ---------- 버튼 ---------- */
$('btnReroll').onclick = () => { course = recommend(theme, course.join()); pickSlot = null; drawCourse(); drawDots(); save(); };
$('btnToCode').onclick = () => { prog = prog || []; go(3); };
$('courseName').oninput = save;
$('btnRun').onclick = run;
$('btnStop').onclick = () => {
  if (running){ stopFlag = true; Voice.stop(); return; }        // ■ 멈춤
  if (paused){ paused = null; resetCar(); drawStack(); runButtons(); toast('출발 자리(공항)로 돌아왔어요'); }
};
/* 🚕 오토카 초기화: 시뮬레이션의 오토카를 출발 칸(공항, 남쪽 보기)으로 */
$('btnCar').onclick = async () => {
  if (running){ stopFlag = true; Voice.stop(); while (running) await sleep(50); }
  paused = null; resetCar(); drawStack(); runButtons();
  layer.querySelectorAll('.bubble').forEach(b => b.remove());
  toast(`오토카를 ${START.name}으로 옮겼어요 · 남쪽(서귀포 쪽)을 보고 있어요`);
};
$('btnDel').onclick = () => { if (running || !prog.length) return; prog.pop(); drawStack(); changed(); };
$('btnClear').onclick = () => { if (running || !prog.length) return; if (confirm('코드를 모두 지울까요?')){ prog = []; drawStack(); changed(); } };
$('btnDone').onclick = () => {
  if (running) return;
  Sound.unlock();
  if (!last.stamps.length){ Sound.warn(); toast('스탬프를 1개 이상 받아야 완성할 수 있어요', 'bad'); return; }
  go(4); showDone();
};
/* 결과 화면: ① 계획 채우기 → ② 저장하고 끝내기 (계획서 이미지 · 핑퐁 파일 · 보내기) */
const WIZ = [
  { n:1, icon:'✏️', name:'계획 채우기' },
  { n:2, icon:'💾', name:'저장하고 끝내기' },
];
let wiz = { step:1, done:{} };
function showDone(){
  Sound.win(); Confetti.burst();
  wiz = { step:1, done:{} };
  if (SERVER) send(true);                 // 결과를 열면 선생님께 먼저 한 번 자동으로 보냄
  drawWiz();
  $('donePop').classList.add('show');
}
function finishWiz(){
  $('donePop').classList.remove('show'); drawCard();
  const l = $('left'); l.classList.remove('flash'); void l.offsetWidth; l.classList.add('flash');
  toast('여행 플래너 미션 완료 · 수고했어요', 'ok');
}
function drawWiz(){
  const sc = calcScore(prog, last.stamps.length, last.crashes), k = wiz.step, d = wiz.done;
  const rail = WIZ.map((w, i) => `${i ? '<b class="wzLine' + (d[1] ? ' on' : '') + '"></b>' : ''}
    <button class="wzStep${w.n === k ? ' cur' : ''}${d[w.n] ? ' ok' : ''}" data-n="${w.n}"><span>${d[w.n] ? '✓' : w.n}</span>${w.icon} ${w.name}</button>`).join('');
  const parts = sc.parts.map(p => `<span>${p[0]} <b>${p[1]}</b> <em>${p[2] > 0 ? '+' : ''}${p[2]}</em></span>`).join('');
  const chk = on => on ? '<i class="wzChk">✓ 저장됨</i>' : '';
  let body = '', nav = '';
  if (k === 1){
    body = `<p class="wzHow"><b>1단계</b> · 내 여행 계획을 채워요. 다 쓰면 <b>다음</b>을 눌러요.</p>
      <div class="wzFields">${fieldsHTML('w')}</div>`;
    nav = `<button class="ghost" id="wzCode">← 코딩으로</button><button class="primary" id="wzNext">다음: 2단계 저장하고 끝내기 ▶</button>`;
  } else {
    body = `<p class="wzHow"><b>2단계</b> · 두 가지를 저장하면 끝! <b>계획서 그림</b>은 패들렛에, <b>핑퐁 파일</b>은 오토카 주행에 써요.</p>
      <div class="wzSave">
        <div class="wzBox"><b>🖼 여행 계획서 이미지</b><small>패들렛에 올려요</small>
          <button class="primary" id="wzImg">🖼 이미지 저장</button><button class="ghost" id="wzSee">👀 크게 보기</button>${chk(d.img)}</div>
        <div class="wzBox"><b>💾 핑퐁 스크래치 파일</b><small>웹 핑퐁 스크래치에서 불러와요</small>
          <button class="primary" id="wzSb3" style="background:#ffab19;box-shadow:0 4px 0 #d98b00">💾 핑퐁 파일 저장</button>${chk(d.sb3)}</div>
      </div>
      ${SERVER ? `<button class="primary wzSend" id="wzSend" style="background:#4c97ff;box-shadow:0 4px 0 #2f6fd0">📮 선생님께 보내기</button>${d.sent ? '<i class="wzChk">✓ 보냈어요</i>' : ''}` : ''}`;
    nav = `<button class="ghost" id="wzPrev">◀ 이전</button><button class="primary" id="wzNext">${d.img && d.sb3 ? '✅ 끝내기' : '끝내기'}</button>`;
  }
  $('doneCard').innerHTML = `<h1>코스 완성</h1>
    <div class="wzScore"><span class="wzTot">${sc.total}점</span><div>${parts}</div></div>
    <div class="wzRail">${rail}</div>
    <div class="wzBody">${body}</div>
    <div class="wzNav">${nav}</div>`;
  $('doneCard').querySelectorAll('.wzStep').forEach(b => b.onclick = () => { if (+b.dataset.n === 2) d[1] = true; wiz.step = +b.dataset.n; drawWiz(); });
  if (k === 1){
    bindFields('w');
    $('wzCode').onclick = () => { $('donePop').classList.remove('show'); go(3); };
    $('wzNext').onclick = () => { d[1] = true; wiz.step = 2; drawWiz(); };
    updateGuide(); return;
  }
  const after = () => { if (d.img && d.sb3) d[2] = true; drawWiz(); };
  $('wzSee').onclick = showPlan;
  $('wzImg').onclick = async () => { await savePlan(); d.img = true; after(); };
  $('wzSb3').onclick = async () => { await saveSb3(); d.sb3 = true; after(); };
  if (SERVER) $('wzSend').onclick = async () => { if (await send()){ d.sent = true; drawWiz(); } };
  $('wzPrev').onclick = () => { wiz.step = 1; drawWiz(); };
  $('wzNext').onclick = () => {
    if (!(d.img && d.sb3) && !confirm('아직 저장하지 않은 것이 있어요. 그래도 끝낼까요?')) return;
    finishWiz();
  };
  updateGuide();
}
$('btnSound').onclick = () => { Sound.unlock(); const on = Sound.toggle(); Voice.set(on); $('btnSound').textContent = on ? '🔊' : '🔇'; };
$('spotPop').onclick = e => { if (e.target.id === 'spotPop') $('spotPop').classList.remove('show'); };
$('planPop').onclick = e => { if (e.target.id === 'planPop') $('planPop').classList.remove('show'); };

/* ---------- 코딩 칸 크기 조절: 크게 하면 가운데 지도가 줄어요 ---------- */
const Layout = (() => {
  const LV = [ { n:'작게', w:20, z:.9 }, { n:'보통', w:24, z:1 }, { n:'크게', w:29, z:1.15 }, { n:'아주 크게', w:34, z:1.3 } ];
  let lv = 1, lw = 24, rw = 24;
  try { const j = JSON.parse(localStorage.getItem('jejuLayout') || 'null'); if (j){ lv = j.lv; lw = j.lw; rw = j.rw; } } catch(e){}
  const root = document.documentElement;
  function apply(){
    root.style.setProperty('--lw', lw + 'vw'); root.style.setProperty('--rw', rw + 'vw'); root.style.setProperty('--zoom', LV[lv].z);
    $('zLvl').textContent = LV[lv].n;
    try { localStorage.setItem('jejuLayout', JSON.stringify({ lv, lw, rw })); } catch(e){}
    requestAnimationFrame(updateCellVar);
  }
  function setLevel(d){ lv = Math.max(0, Math.min(LV.length - 1, lv + d)); lw = rw = LV[lv].w; apply(); }
  function drag(handle, side){
    handle.addEventListener('pointerdown', e => {
      e.preventDefault(); handle.setPointerCapture(e.pointerId); handle.classList.add('drag');
      const move = ev => {
        const vw = ev.clientX / innerWidth * 100;
        if (side === 'l') lw = Math.max(16, Math.min(40, vw)); else rw = Math.max(16, Math.min(40, 100 - vw));
        if (lw + rw > 70){ if (side === 'l') lw = 70 - rw; else rw = 70 - lw; }   // 지도는 화면의 30% 이상 남기기
        apply();
      };
      const up = () => { handle.classList.remove('drag'); handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); };
      handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up);
    });
  }
  $('zIn').onclick = () => setLevel(1); $('zOut').onclick = () => setLevel(-1);
  drag($('h1'), 'l'); drag($('h2'), 'r');
  return { apply };
})();

/* ---------- 시작 ---------- */
const bg = $('bgImg');
function init(){
  buildBoard(); resetCar(); drawThemes(); drawPalette(); updateCellVar();
  Layout.apply(); setupStart(load());
  document.body.dataset.step = 1; drawDots();
}
bg.onload = init; bg.onerror = init; bg.src = BG_IMAGE;
addEventListener('resize', () => { updateCellVar(); fitBlocks(['palette']); });
document.querySelectorAll('.overlay').forEach(o => new MutationObserver(() => updateGuide()).observe(o, { attributes:true, attributeFilter:['class'] }));
