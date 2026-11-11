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
let extra = { target:'친구', line:'' };

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
  1: '🗺️ 점 하나하나가 제주 헤리티지 장소예요 (모두 100곳)',
  2: '📍 번호 핀 = 추천 코스 · 점을 누르면 장소 설명이 나와요',
  3: `🚕 ${START.name}에서 오른쪽(동쪽)을 보고 출발 · 한 칸 = 10cm`,
  4: '🏁 코스 카드를 완성하고 저장해요',
};
function go(step){
  document.body.dataset.step = step;
  $('leftTitle').textContent = ['', '🧭 테마 고르기', '📍 코스 정하기', '💻 코딩 미션', '📜 코스 카드'][step];
  $('mapHint').textContent = HINT[step];
  pickSlot = null;
  if (step === 2) drawCourse();
  if (step === 3){ drawMission(); drawStack(); requestAnimationFrame(() => fitBlocks(['palette'])); }
  if (step === 4) drawCard();
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
function drawMission(){
  $('mission').innerHTML = `<div class="mt">🎯 미션: 3곳에 도착해서 안내 방송하기<br><small>🔊 말하기 또는 💬 말풍선에 <b>"여기는 ○○입니다"</b></small></div>` +
    course.map((id, i) => { const s = SPOT[id], ok = last.stamps.includes(id);
      return `<div class="mRow${ok ? ' ok' : ''}"><span class="st">${ok ? '✓' : i + 1}</span><code>${esc(s.key)}</code><small>${s.row}행 ${s.col}열</small></div>`; }).join('');
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
function changed(){ if (last.stamps.length || last.crashes){ last = { stamps:[], crashes:0 }; drawDots(); drawMission(); } save(); drawScore(); }
function removeAt(path){ const { lp, i } = parentOf(path); const list = listAt(prog, lp); return list ? list.splice(i, 1)[0] : null; }
function drawStack(snapPath = null){
  stack.innerHTML = `<div class="hatRow">${HAT_SVG}</div>` + rowsHTML(prog, '', true) +
    `<div class="insertHint">${prog.length ? '블록을 끌어서 옮겨요 · ✕ 또는 왼쪽 칸에 놓으면 지워요' : '👈 블록을 끌어오거나 톡 눌러서 쌓아요'}</div>`;
  if (snapPath !== null) stack.querySelector(`.row[data-path="${snapPath}"]`)?.classList.add('snap');
  stack.querySelectorAll('[data-f]').forEach(f => f.oninput = f.onchange = () => {
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
  $('btnDone').disabled = !last.stamps.length;
  return sc;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(){
  if (running || !prog.length){ if (!prog.length) toast('블록을 먼저 쌓아요!', 'bad'); return; }
  Sound.unlock(); running = true; stopFlag = false;
  document.body.classList.add('running');
  drawStack();
  const rows = () => stack.querySelectorAll('.row');
  resetCar(); await sleep(250);
  const got = [], before = new Set(last.stamps); let crashes = 0;
  const steps = expand(prog);
  for (const s of steps){
    if (stopFlag) break;
    rows().forEach(r => r.classList.toggle('now', r.dataset.path === s.src));
    if (s.k === 'loop'){ await sleep(120); continue; }
    if (s.k === 'cell'){
      const [dr, dc] = DIRS[st.dir], nr = st.row + dr * s.sign, nc = st.col + dc * s.sign, t = cellType(nr, nc);
      if (t !== 'land'){
        crashes++; Sound.warn(); bumpCar(s.sign, STEP_MS);
        stack.querySelector(`.row[data-path="${s.src}"]`)?.classList.add('err');
        bubble(layer, st.row, st.col, BLOCK_MSG[t], '', 2200); break;
      }
      st.row = nr; st.col = nc; drawCar(true); Sound.ding(1319); await sleep(STEP_MS + 60);
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
      const fresh = got.filter(id => !before.has(id));
      if (fresh.length){ last = { stamps:got.slice(), crashes }; drawDots(); drawMission(); await showStamp(fresh[fresh.length - 1]); before.add(fresh[fresh.length - 1]); }
    }
  }
  rows().forEach(r => r.classList.remove('now'));
  last = { stamps:got, crashes };
  running = false; document.body.classList.remove('running');
  drawDots(); drawMission();
  const sc = drawScore();
  best = Math.max(best, sc.total); save();
  if (!stopFlag && got.length === course.length){
    Sound.win(); Confetti.burst(); setTimeout(Confetti.burst, 1300);
    toast(`🎉 스탬프 3개 완성! ${sc.total}점 · 🏁 완성하기를 눌러요`, 'ok');
    const b = $('btnDone'); b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge');
  }
}
function showStamp(id){
  const s = SPOT[id];
  Sound.win();
  $('stampCard').innerHTML = `<h1>🏅</h1><div class="stp"><small>HERITAGE</small>${esc(s.key)}<small>${new Date().getMonth() + 1}.${new Date().getDate()}</small></div>
    <div class="msg">${esc(s.name)} 스탬프 획득!</div><div class="miss">🔎 탐험 미션: ${esc(s.mission)}</div><button class="primary" id="stOk">계속 달리기 ▶</button>`;
  $('stampPop').classList.add('show');
  return new Promise(res => $('stOk').onclick = () => { $('stampPop').classList.remove('show'); res(); });
}

/* ④ 코스 카드 */
function drawCard(){
  const t = THEMES[theme], sc = calcScore(prog, last.stamps.length, last.crashes);
  $('card').innerHTML = `<div class="courseCard">
    <h3>📜 ${esc($('courseName').value.trim() || t.name + ' 코스')}</h3>
    <div><span class="cat" style="background:${t.color};color:#fff">${t.icon} ${t.name}</span> ${me.no}번</div>
    ${course.map((id, i) => `<div class="mRow${last.stamps.includes(id) ? ' ok' : ''}"><span class="st">${last.stamps.includes(id) ? '✓' : i + 1}</span>${esc(SPOT[id].name)}</div>`).join('')}
    <div class="sc"><span>스탬프 ${last.stamps.length}/3</span><span>블록 ${prog.length}개</span><span>반복 ${prog.filter(b => b.t === 'rep').length}개</span><b>${sc.total}점</b></div>
    <label class="field">누구에게 추천해요?<select id="cTarget">${['가족', '친구', '혼자', '어르신', '외국인 관광객'].map(v => `<option${v === extra.target ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="field">한 줄 소개<input id="cLine" maxlength="40" value="${esc(extra.line)}" placeholder="예) 제주의 시간을 거슬러 오르는 여행"></label>
  </div>
  <button class="primary" id="btnSb3">💾 핑퐁 스크래치 파일 저장</button>
  ${SERVER ? '<button class="primary" id="btnSend" style="background:#4c97ff;box-shadow:0 4px 0 #2f6fd0">📮 선생님께 보내기</button>' : ''}
  <button class="ghost" id="btnBack">← 코딩으로 돌아가기</button>`;
  $('cTarget').onchange = () => { extra.target = $('cTarget').value; save(); };
  $('cLine').oninput = () => { extra.line = $('cLine').value; save(); };
  $('btnBack').onclick = () => go(3);
  $('btnSb3').onclick = saveSb3;
  if (SERVER) $('btnSend').onclick = send;
}
async function saveSb3(){
  try {
    const name = `${me.no}번_${$('courseName').value.trim() || THEMES[theme].name}`.replace(/[\\/:*?"<>|\s]+/g, '_');
    await SB3.download(prog, name, $('bgImg'));
    toast('💾 저장했어요! 핑퐁 스크래치 → 파일 → 컴퓨터에서 불러오기', 'ok');
  } catch(e){ toast('저장하지 못했어요: ' + e.message, 'bad'); }
}
let sending = false;
async function send(){
  if (sending) return; sending = true;
  const sc = calcScore(prog, last.stamps.length, last.crashes);
  const rec = { th:theme, s:course, cn:$('courseName').value.trim(), tg:extra.target, ln:extra.line, p:prog, st:last.stamps, sc:sc.total };
  toast('보내는 중…');
  try {
    await fetch(SERVER, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'text/plain' },
      body:JSON.stringify({ no:me.no, path:encodeRecord(rec), reached:last.stamps.length === course.length }) });
    toast(`${me.no}번, 선생님께 보냈어요! ✓`, 'ok');
  } catch(e){ toast('보내지 못했어요. 인터넷을 확인해요', 'bad'); }
  setTimeout(() => sending = false, 1500);
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
    if (s){ theme = s.theme; course = s.course || []; prog = normProg(s.prog || []); last = s.last || last; best = s.best || 0; extra = s.extra || extra;
      $('courseName').value = s.cn || ''; go(+s.step || 2); }
    else go(1);
    if (!Voice.available) toast('🔇 이 기기는 음성이 안 나와요 → 말풍선으로 보여줘요');
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
  theme = null; course = []; prog = []; last = { stamps:[], crashes:0 }; best = 0; extra = { target:'친구', line:'' };
  $('courseName').value = ''; resetCar(); drawStack(); go(1);
  toast('처음부터 다시 시작해요 ↺');
};

/* ---------- 버튼 ---------- */
$('btnReroll').onclick = () => { course = recommend(theme, course.join()); pickSlot = null; drawCourse(); drawDots(); save(); };
$('btnToCode').onclick = () => { prog = prog || []; go(3); };
$('courseName').oninput = save;
$('btnRun').onclick = run;
$('btnStop').onclick = () => { stopFlag = true; Voice.stop(); };
$('btnDel').onclick = () => { if (running || !prog.length) return; prog.pop(); drawStack(); changed(); };
$('btnClear').onclick = () => { if (running || !prog.length) return; if (confirm('코드를 모두 지울까요?')){ prog = []; drawStack(); changed(); } };
$('btnDone').onclick = () => go(4);
$('btnSound').onclick = () => { Sound.unlock(); const on = Sound.toggle(); Voice.set(on); $('btnSound').textContent = on ? '🔊' : '🔇'; };
$('spotPop').onclick = e => { if (e.target.id === 'spotPop') $('spotPop').classList.remove('show'); };

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
