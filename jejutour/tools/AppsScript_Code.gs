/* =====================================================================
   제주 헤리티지 자율주행 택시 · 선생님 화면용 기록 저장소 (구글 Apps Script)
   - 학생 화면이 완성하기·끝내기 때 보낸 기록을 '기록' 시트에 번호별로 1줄씩 저장
   - 선생님 화면이 5초마다 읽어 감
   붙여 넣는 곳: 구글 시트 → 확장 프로그램 → Apps Script → Code.gs 내용을 모두 지우고 이 파일 내용 붙여 넣기
   ===================================================================== */
const SHEET_NAME = '기록';
const HEAD = ['번호', '기록', '완주', '시간'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEAD);
  return sh;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// 선생님 화면이 읽어 감: { ok:true, list:[{ no, path, reached, time }] }
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const list = rows.filter(r => r[0] !== '').map(r => ({
    no: Number(r[0]), path: String(r[1]), reached: r[2] === true || r[2] === 'TRUE', time: r[3]
  }));
  return json_({ ok: true, list: list });
}

// 학생 화면이 보냄: { no, path, reached }  /  선생님 초기화: { action:'clear' }
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const sh = sheet_();
    if (d.action === 'clear') {
      sh.clear(); sh.appendRow(HEAD);
      return json_({ ok: true });
    }
    const no = Number(d.no);
    if (!(no >= 1)) return json_({ ok: false, error: 'no' });
    const row = [no, String(d.path || ''), !!d.reached, new Date().toISOString()];
    const nos = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => Number(r[0]));
    const at = nos.indexOf(no);                      // 같은 번호는 새 기록으로 덮어쓰기
    if (at >= 1) sh.getRange(at + 1, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
