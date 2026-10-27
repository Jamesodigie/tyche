/**
 * Tyche → Google (Sheets, Photos, Drive)
 *
 * Tyche's server POSTs here whenever:
 *   - someone signs up            → a row in the Sign-ups sheet
 *   - someone pays for community  → a row in the Community sheet
 *   - a photo / file is uploaded  → Google Photos (album "Tyche uploads"); anything Photos
 *                                   can't take goes to the Drive folder "Tyche uploads".
 *
 * Setup: paste this file, set SECRET below (the same value as GOOGLE_SCRIPT_SECRET in Vercel),
 * then Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 */

const SECRET = 'PASTE-YOUR-SECRET-HERE';
const SIGNUPS_SHEET_ID = '1MQ-eEEodKvRZKYXU4urGxU6DVe8drrKLwnSG0BNTfdA';
const COMMUNITY_SHEET_ID = '15Grz__NqkkL3zVuJ9JjvgUH8Kfq5VhQAeaCtJnUaZFE';
const UPLOADS_NAME = 'Tyche uploads';
const USE_GOOGLE_PHOTOS = true; // needs the Photos Library API turned on (see setup guide); falls back to Drive

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!SECRET || SECRET === 'PASTE-YOUR-SECRET-HERE' || body.secret !== SECRET) return reply({ ok: false, error: 'bad secret' });
    const d = body.data || {};
    if (body.kind === 'signup') {
      addRow(SIGNUPS_SHEET_ID, ['Date', 'Name', 'Email', 'Phone', 'Signed up as'], [when(d.date), d.name, d.email, d.phone, d.role]);
    } else if (body.kind === 'community') {
      addRow(COMMUNITY_SHEET_ID, ['Date paid', 'Name', 'WhatsApp', 'Email', 'Based in', 'Heard about us', 'Payment ref', 'Member until'],
        [when(d.date), d.name, d.phone, d.email, d.state, d.heard, d.reference, when(d.expires)]);
    } else if (body.kind === 'file') {
      return reply({ ok: true, savedTo: saveFile(d) });
    } else if (body.kind === 'ping') {
      // used by Tyche's admin "Test connection" button
    } else {
      return reply({ ok: false, error: 'unknown kind' });
    }
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err) });
  }
}

function doGet() {
  return reply({ ok: true, app: 'Tyche → Google' });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function when(iso) {
  return iso ? Utilities.formatDate(new Date(iso), 'Africa/Lagos', 'yyyy-MM-dd HH:mm') : '';
}

function addRow(sheetId, headers, row) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row.map((v) => (v === undefined || v === null ? '' : v)));
  } finally {
    lock.releaseLock();
  }
}

/** d = { name, mime, base64, folder, description } */
function saveFile(d) {
  const blob = Utilities.newBlob(Utilities.base64Decode(d.base64), d.mime || 'application/octet-stream', d.name || 'upload');
  const media = /^(image|video)\//.test(blob.getContentType());
  if (USE_GOOGLE_PHOTOS && media) {
    try {
      uploadToPhotos(blob, d.description || '');
      return 'photos';
    } catch (err) {
      console.warn('Google Photos upload failed, saving to Drive instead: ' + err);
    }
  }
  const file = driveFolder(d.folder).createFile(blob);
  if (d.description) file.setDescription(String(d.description).slice(0, 1000));
  return 'drive';
}

function driveFolder(sub) {
  const top = findOrMake(DriveApp.getRootFolder(), UPLOADS_NAME);
  return sub ? findOrMake(top, sub) : top;
}

function findOrMake(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function photosAlbumId(token) {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('albumId');
  if (id) return id;
  const r = UrlFetchApp.fetch('https://photoslibrary.googleapis.com/v1/albums', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ album: { title: UPLOADS_NAME } }),
  });
  if (r.getResponseCode() !== 200) throw new Error('album: ' + r.getContentText());
  id = JSON.parse(r.getContentText()).id;
  props.setProperty('albumId', id);
  return id;
}

function uploadToPhotos(blob, description) {
  const token = ScriptApp.getOAuthToken();
  const up = UrlFetchApp.fetch('https://photoslibrary.googleapis.com/v1/uploads', {
    method: 'post', contentType: 'application/octet-stream', muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + token,
      'X-Goog-Upload-Content-Type': blob.getContentType(),
      'X-Goog-Upload-Protocol': 'raw',
      'X-Goog-Upload-File-Name': blob.getName(),
    },
    payload: blob.getBytes(),
  });
  if (up.getResponseCode() !== 200) throw new Error('upload: ' + up.getContentText());
  const made = UrlFetchApp.fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      albumId: photosAlbumId(token),
      newMediaItems: [{ description: String(description).slice(0, 1000), simpleMediaItem: { uploadToken: up.getContentText(), fileName: blob.getName() } }],
    }),
  });
  const res = JSON.parse(made.getContentText() || '{}');
  const status = res.newMediaItemResults && res.newMediaItemResults[0] && res.newMediaItemResults[0].status;
  if (made.getResponseCode() !== 200 || (status && status.code && status.code !== 0)) throw new Error('create: ' + made.getContentText());
}
