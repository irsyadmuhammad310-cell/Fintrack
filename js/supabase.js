// === FinTrack Supabase Integration (V2.0.1) ===
// Handles auth, cloud sync, and offline-first architecture
// Sits on top of existing dual-write (localStorage + IndexedDB)
// V2.0.1: Fixed category mapping, merge-on-pull, UUID IDs, 72h auto-sync
// V2.0.6: new cloud table ft_sync (one row per record, 3-way merge). Edits + deletes sync, auto-sync 8s after a change.

const SUPABASE_URL = 'https://eoonfztciqvyjchsinpg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3zgVsgSU4Jot7NpXl4dWKw_0Fhu19gY';

// Initialize Supabase client
// V2.0.5: if the Supabase CDN did not load (first open offline), don't crash the whole app.
// Cloud calls then fail with a friendly error and local data keeps working.
const _supabase = (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : ftNoCloud();
function ftNoCloud() {
  console.warn('[FinTrack] Supabase library not loaded: cloud sync unavailable this session.');
  var h = {
    get: function(t, k) { return k === 'then' ? undefined : new Proxy(function() {}, h); },
    apply: function() { throw new Error('Cloud unavailable (offline). Local data is safe.'); }
  };
  return new Proxy(function() {}, h);
}

// === UUID GENERATOR (replaces integer nxId for new records) ===
function ftUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// =====================================================
// AUTH MODULE
// =====================================================
const ftAuth = {
  user: null,
  session: null,

  // Initialize: check existing session
  async init() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
      this.session = session;
      this.user = session.user;
    }
    // Listen for auth changes
    _supabase.auth.onAuthStateChange((event, session) => {
      this.session = session;
      this.user = session ? session.user : null;
      if (event === 'SIGNED_IN') ftCloudClaim().then(function(ok) { if (ok) ftSync.sync({ full: !ftSync.hasSnapshot() }); });
      if (event === 'SIGNED_OUT') this.user = null;
    });
    return this.user;
  },

  // Sign up with email/password
  async signUp(email, password) {
    const { data, error } = await _supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  // Sign in with email/password
  async signIn(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    this.session = data.session;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await _supabase.auth.signOut();
    if (error) throw error;
    this.user = null;
    this.session = null;
  },

  // Check if logged in
  isLoggedIn() {
    return !!this.user;
  },

  // Get user ID
  uid() {
    return this.user ? this.user.id : null;
  }
};

// =====================================================
// AUTO SYNC TRIGGER (V2.0.6)
// Every save of synced data schedules ONE sync 8 seconds later (signed in + online only).
// No page has to remember to call the cloud: safeSave is wrapped once, below.
// =====================================================
var FT_TXN_KEY = typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'ft_txn_data';
var FT_SYNC_DELAY = 8000;
var _ftDirtyTimer = null;
// Keys with their own cloud rows, per-phone settings and sync bookkeeping never go up as "settings"
var FT_SYNC_SKIP = /^ft_(goals|budget_plans|accounts|txn_data|currency|lang|hide_amounts|base_cur|rates.*|budget_alerts.*|milestone_alerts|autocat_off|quickstart_done|security_setup_done|liab_v2_at|last_backup.*|sync_.*|reminderNxId|goalNxId)$|nxid$/i;
function ftSyncStoreKeyOk(k) {
  if (typeof k !== 'string' || k.indexOf('ft_') !== 0 || FT_SYNC_SKIP.test(k)) return false;
  if (k === 'ft_schema') return true; // categories
  return typeof ftBackupKeyAllowed === 'function' ? ftBackupKeyAllowed(k) : false; // same safety list as JSON backup
}
function ftSyncWatchKey(k) {
  return k === FT_TXN_KEY || k === 'ft_accounts' || k === 'ft_goals' || k === 'ft_budget_plans' || ftSyncStoreKeyOk(k);
}
function ftCloudDirty() {
  if (typeof ftSync === 'undefined' || !ftSync || ftSync._applying) return;
  ftSync._dirty = true;
  clearTimeout(_ftDirtyTimer);
  _ftDirtyTimer = setTimeout(function() {
    try {
      if (typeof ftAuth === 'undefined' || !ftAuth.isLoggedIn() || navigator.onLine === false) return;
      if (ftSync.isSyncing) { ftSync._again = true; return; }
      ftSync.sync({ auto: true });
    } catch (e) {}
  }, FT_SYNC_DELAY);
}
// Old name kept: data.js saveACCOUNTS() calls it
function ftCloudAccountsDirty() { ftCloudDirty(); }
(function ftWrapSafeSave() {
  if (typeof safeSave !== 'function' || safeSave._ftSync) return;
  var orig = safeSave;
  var wrapped = function(key, value) {
    var r = orig.apply(this, arguments);
    try { if (ftSyncWatchKey(key)) ftCloudDirty(); } catch (e) {}
    return r;
  };
  wrapped._ftSync = true;
  safeSave = wrapped;
})();

// === CLOUD OWNER GUARD (V2.0.5) ===
// Local data on this device belongs to ONE cloud account (ft_cloud_uid).
// Signing in with a different account must never upload the previous person's money data.
function ftCloudOwner() { return safeGet('ft_cloud_uid') || ''; }
function ftCloudAllowed() {
  if (typeof ftAuth === 'undefined' || !ftAuth.isLoggedIn()) return false;
  var uid = ftAuth.uid(), owner = ftCloudOwner();
  if (!owner) { safeSave('ft_cloud_uid', uid); return true; } // first sign-in on this device claims its data
  return owner === uid;
}
var _ftOwnerAsked = false;
// Called right after SIGNED_IN. Returns true when syncing is allowed.
async function ftCloudClaim() {
  if (ftCloudAllowed()) return true;
  if (_ftOwnerAsked) return false;
  _ftOwnerAsked = true;
  var email = (ftAuth.user && ftAuth.user.email) || 'this account';
  var ok = confirm('This device already holds FinTrack data from a DIFFERENT cloud account.\n\nLink this device\'s data to ' + email + ' and sync it there?\n\nOK = link and sync\nCancel = sign out (nothing is uploaded)');
  _ftOwnerAsked = false;
  if (ok) { safeSave('ft_cloud_uid', ftAuth.uid()); return true; }
  try { await ftAuth.signOut(); } catch (e) {}
  if (typeof toast === 'function') toast('Signed out. Nothing was uploaded.');
  return false;
}

// V2.0.5: remember deleted transaction ids so a pull never brings them back,
// and a later push deletes them in the cloud if the phone was offline at delete time
function ftGetTombstones() { try { var a = JSON.parse(safeGet('ft_deleted_txn') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function ftAddTombstone(id) {
  var a = ftGetTombstones(); var k = String(id);
  if (a.indexOf(k) < 0) { a.push(k); if (a.length > 5000) a = a.slice(-5000); safeSave('ft_deleted_txn', JSON.stringify(a)); }
}

// Throw on a failed upsert/delete instead of silently continuing
function ftCheck(res, what) {
  if (res && res.error) throw new Error(what + ' failed: ' + res.error.message);
  return res;
}

// =====================================================
// SYNC MODULE (V2.0.6): one cloud table, 3-way merge
// =====================================================
// Cloud table ft_sync = one row per record: kind (txn / acc / goal / budget / store), rid (record id),
// data (the record exactly as this app saves it, so no field is ever lost) and deleted (true = removed).
// The phone remembers a fingerprint of every record from the last sync (the "snapshot"). Per record:
//   phone = cloud -> nothing to do | only the cloud changed -> download | only the phone changed -> upload
//   both changed -> the phone wins; deleted on one side + edited on the other -> the edit wins;
//   settings lists (categories, loan links, reminders...) edited on both -> combined.
// So new entries, edits AND deletes reach every device. Old tables (transactions, accounts...) are not used.
var FT_SYNC_TABLE = 'ft_sync';
var FT_SYNC_KINDS = ['txn', 'acc', 'goal', 'budget', 'store'];
var FT_SYNC_PAGE = 1000;

// Same text for the same data, whatever order the fields were saved in
function ftStable(v) {
  if (v === null || v === undefined || typeof v !== 'object') { var s = JSON.stringify(v); return s === undefined ? 'null' : s; }
  if (Array.isArray(v)) return '[' + v.map(function(x) { return ftStable(x); }).join(',') + ']';
  var keys = Object.keys(v).filter(function(k) { return v[k] !== undefined && typeof v[k] !== 'function'; }).sort();
  return '{' + keys.map(function(k) { return JSON.stringify(k) + ':' + ftStable(v[k]); }).join(',') + '}';
}
// cyrb53 fingerprint: only answers "did this record change?" (not for security)
function ftHash(str) {
  var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (var i = 0; i < str.length; i++) { var ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) + '.' + str.length.toString(36);
}
// A linked goal's "saved" amount is recalculated from balances on every device, so it is not a real edit
function ftSyncFp(kind, s, v) {
  if (kind === 'goal' && v && typeof v === 'object' && ((Array.isArray(v.accs) && v.accs.length) || v.acc || (Array.isArray(v.linkedCats) && v.linkedCats.length) || v.linkedCat)) {
    var o = {}; Object.keys(v).forEach(function(k) { if (k !== 'c') o[k] = v[k]; });
    s = ftStable(o);
  }
  return ftHash(s);
}
// Downloaded data: drop keys that could poison objects, stop at 20 levels
function ftSyncClean(v, depth) {
  depth = depth || 0;
  if (depth > 20) return null;
  if (Array.isArray(v)) return v.map(function(x) { return ftSyncClean(x, depth + 1); });
  if (v && typeof v === 'object') {
    var o = {};
    Object.keys(v).forEach(function(k) { if (k !== '__proto__' && k !== 'prototype' && k !== 'constructor') o[k] = ftSyncClean(v[k], depth + 1); });
    return o;
  }
  return v;
}
function ftSyncHas(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

// --- snapshot = fingerprints from the last good sync (per cloud user) ---
function ftSyncSnapLoad(uid) {
  var s = null;
  try { s = JSON.parse(safeGet('ft_sync_snap') || 'null'); } catch (e) { s = null; }
  if (!s || typeof s !== 'object' || s.uid !== uid || !s.h || typeof s.h !== 'object') return { uid: uid, base: '', cursor: '', h: {} };
  return s;
}
function ftSyncSnapSize(s) { var n = 0; Object.keys(s.h || {}).forEach(function(k) { n += Object.keys(s.h[k] || {}).length; }); return n; }
function ftSyncRecCount(map) { var n = 0; ['txn', 'acc', 'goal', 'budget'].forEach(function(k) { n += Object.keys((map && map[k]) || {}).length; }); return n; }
// Big delete = at least 5 records and over a quarter of everything, or literally everything
function ftSyncSuspicious(n, total) { return n > 0 && ((n >= 5 && n > total * 0.25) || (total >= 2 && n >= total)); }
// Downloads start 5 min before the newest change already seen (covers saves still in flight).
// Once a download ran 60s+ after that change was first seen, nothing older can still arrive:
// then only rows newer than it are fetched (so big uploads are not downloaded again and again).
function ftSyncSince(snap) {
  var t = new Date(String(snap.cursor).replace(/(\.\d{3})\d+/, '$1')).getTime();
  if (!isFinite(t)) return null;
  return new Date(snap.safe ? t : t - 5 * 60 * 1000).toISOString();
}

function ftSyncStoreKeys() {
  var keys = {};
  try { Object.keys(_ftStore).forEach(function(k) { keys[k] = 1; }); } catch (e) {}
  try { for (var i = 0; i < localStorage.length; i++) keys[localStorage.key(i)] = 1; } catch (e) {}
  return Object.keys(keys).filter(ftSyncStoreKeyOk).sort();
}

// Everything this phone syncs: {kind: {rid: {v: value, h: fingerprint}}}
// Fingerprints are cached per session, so a sync after one small edit stays fast with 20,000+ records.
var _ftFpCache = {};
function ftSyncText(it) { if (it.s === undefined) it.s = ftStable(it.v); return it.s; }
function ftSyncLocal() {
  var L = {}, next = {}; FT_SYNC_KINDS.forEach(function(k) { L[k] = {}; });
  var add = function(kind, rid, v) {
    var key = kind + '|' + JSON.stringify(v);
    var h = ftSyncHas(_ftFpCache, key) ? _ftFpCache[key] : ftSyncFp(kind, ftStable(v), v);
    next[key] = h;
    L[kind][rid] = { v: v, h: h };
  };
  var raw = function(rid, v) { L.store[rid] = { v: v, s: v, h: ftSyncFp('store', v, v) }; };
  var list = function(key, kind) {
    var arr = []; try { arr = JSON.parse(safeGet(key) || '[]'); } catch (e) { arr = []; }
    if (!Array.isArray(arr)) return [];
    arr.forEach(function(x) { if (x && typeof x === 'object' && !Array.isArray(x) && x.id !== undefined && x.id !== null && x.id !== '') add(kind, String(x.id), x); });
    return arr;
  };
  list(FT_TXN_KEY, 'txn');
  var accs = list('ft_accounts', 'acc');
  list('ft_goals', 'goal');
  var plans = {}; try { plans = JSON.parse(safeGet('ft_budget_plans') || '{}') || {}; } catch (e) { plans = {}; }
  if (plans && typeof plans === 'object' && !Array.isArray(plans)) Object.keys(plans).forEach(function(y) {
    var ym = plans[y]; if (!ym || typeof ym !== 'object' || Array.isArray(ym)) return;
    Object.keys(ym).forEach(function(m) { if (ym[m] && typeof ym[m] === 'object') add('budget', y + '-' + m, ym[m]); });
  });
  ftSyncStoreKeys().forEach(function(k) { var v = safeGet(k); if (v !== null && v !== undefined) raw(k, String(v)); });
  var ids = accs.filter(function(a) { return a && typeof a === 'object' && a.id !== undefined; }).map(function(a) { return String(a.id); });
  if (ids.length) raw('_accOrder', JSON.stringify(ids)); // account order (drag reorder) syncs too
  _ftFpCache = next;
  return L;
}

// Two records with one id would overwrite each other in the cloud: the later one gets a new id
function ftSyncFixDupIds() {
  var fix = function(key, newId) {
    var arr; try { arr = JSON.parse(safeGet(key) || '[]'); } catch (e) { return 0; }
    if (!Array.isArray(arr)) return 0;
    var seen = {}, n = 0;
    arr.forEach(function(x) {
      if (!x || typeof x !== 'object' || Array.isArray(x)) return;
      if (x.id === undefined || x.id === null || x.id === '' || seen[String(x.id)]) { x.id = newId(); n++; }
      seen[String(x.id)] = 1;
    });
    if (n) safeSave(key, JSON.stringify(arr));
    return n;
  };
  return fix(FT_TXN_KEY, function() { return generateTxnId(); }) +
    fix('ft_goals', function() { return typeof ftNewGoalId === 'function' ? ftNewGoalId() : 'g_' + ftUUID(); });
}

// Decide every record. L = phone, C = cloud rows downloaded, S = snapshot, opts.full = C is the whole cloud.
// Pure: reads nothing, writes nothing.
function ftSyncPlan(L, C, S, opts) {
  var first = !!opts.first, tomb = opts.tomb || {};
  var P = { down: [], up: [], upDel: [], downDel: [], conflicts: [], snap: {}, needFull: false };
  FT_SYNC_KINDS.forEach(function(kind) {
    var l = L[kind] || {}, c = C[kind] || {}, s = S[kind] || {}, ns = P.snap[kind] = {}, ids = {};
    [l, c, s].forEach(function(m) { Object.keys(m).forEach(function(k) { ids[k] = 1; }); });
    Object.keys(ids).forEach(function(rid) {
      if (kind === 'store' && rid === '_base') return;
      var lo = ftSyncHas(l, rid) ? l[rid] : null, co = ftSyncHas(c, rid) ? c[rid] : null;
      var lh = lo ? lo.h : null, sh = ftSyncHas(s, rid) ? s[rid] : null;
      var ch = co ? (co.del ? null : co.h) : (opts.full ? null : sh); // not downloaded = unchanged since last sync
      var it = { kind: kind, rid: rid, l: lo, c: co };
      if (lh === ch) { if (lh) ns[rid] = lh; return; }
      if (first && kind !== 'store' && lo && co && co.del) { P.downDel.push(it); return; } // deleted on another device earlier
      if (first && kind === 'txn' && !lo && ch && tomb[rid]) { P.upDel.push(it); return; } // deleted here before the first sync
      if (lh === sh) { // only the cloud changed
        if (ch) P.down.push(it); else if (kind === 'store') P.up.push(it); else P.downDel.push(it);
        return;
      }
      if (ch === sh) { // only this phone changed
        if (lh) P.up.push(it);
        else if (kind !== 'store') P.upDel.push(it);
        else if (co && !co.del) P.down.push(it); // settings are never deleted: bring the key back
        else P.needFull = true;
        return;
      }
      if (!lh) { P.down.push(it); return; } // deleted here, edited in the cloud: keep the edit
      if (!ch) { P.up.push(it); return; }   // deleted in the cloud, edited here: keep the edit
      if (kind === 'store') { it.merge = true; P.up.push(it); return; }
      if (first) { P.conflicts.push(it); return; }
      P.up.push(it); // both edited: this phone wins
    });
  });
  return P;
}

// Settings edited on two devices: keep everything from both (this phone wins on the same item)
function ftSyncUnion(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    var out = a.slice(), seen = {};
    var key = function(x) { return x && typeof x === 'object' && !Array.isArray(x) && x.id !== undefined ? 'id:' + String(x.id) : ftStable(x); };
    out.forEach(function(x) { seen[key(x)] = 1; });
    b.forEach(function(x) { var k = key(x); if (!seen[k]) { out.push(x); seen[k] = 1; } });
    return out;
  }
  var isObj = function(x) { return x && typeof x === 'object' && !Array.isArray(x); };
  if (isObj(a) && isObj(b)) {
    var o = {};
    Object.keys(a).forEach(function(k) { o[k] = a[k]; });
    Object.keys(b).forEach(function(k) { o[k] = ftSyncHas(o, k) ? ftSyncUnion(o[k], b[k]) : b[k]; });
    return o;
  }
  return a;
}
function ftSyncMergeRaw(localRaw, cloudRaw) {
  var a, b;
  try { a = JSON.parse(localRaw); b = ftSyncClean(JSON.parse(cloudRaw)); } catch (e) { return localRaw; }
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return localRaw;
  return JSON.stringify(ftSyncUnion(a, b));
}

// Write downloaded changes into this phone's storage, all in one go
function ftSyncWrite(sets, dels) {
  var list = function(key, kind) {
    var s = sets[kind] || {}, d = dels[kind] || {};
    if (!Object.keys(s).length && !Object.keys(d).length) return;
    var arr = []; try { arr = JSON.parse(safeGet(key) || '[]'); } catch (e) { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    var idx = {};
    arr.forEach(function(x, i) { if (x && typeof x === 'object') idx[String(x.id)] = i; });
    Object.keys(s).forEach(function(rid) { if (ftSyncHas(idx, rid)) arr[idx[rid]] = s[rid]; else { idx[rid] = arr.length; arr.push(s[rid]); } });
    if (Object.keys(d).length) arr = arr.filter(function(x) { return !(x && typeof x === 'object' && d[String(x.id)]); });
    safeSave(key, JSON.stringify(arr));
  };
  list(FT_TXN_KEY, 'txn');
  list('ft_accounts', 'acc');
  list('ft_goals', 'goal');
  var bs = sets.budget || {}, bd = dels.budget || {};
  if (Object.keys(bs).length || Object.keys(bd).length) {
    var plans = {}; try { plans = JSON.parse(safeGet('ft_budget_plans') || '{}') || {}; } catch (e) { plans = {}; }
    if (typeof plans !== 'object' || Array.isArray(plans)) plans = {};
    var ym = function(rid) { var i = rid.indexOf('-'); return i > 0 ? [rid.slice(0, i), rid.slice(i + 1)] : null; };
    Object.keys(bs).forEach(function(rid) { var p = ym(rid); if (!p) return; if (!plans[p[0]] || typeof plans[p[0]] !== 'object') plans[p[0]] = {}; plans[p[0]][p[1]] = bs[rid]; });
    Object.keys(bd).forEach(function(rid) { var p = ym(rid); if (p && plans[p[0]]) delete plans[p[0]][p[1]]; });
    safeSave('ft_budget_plans', JSON.stringify(plans));
  }
  var ss = sets.store || {};
  Object.keys(ss).forEach(function(k) {
    if (k === '_accOrder' || !ftSyncStoreKeyOk(k)) return;
    var v = String(ss[k]), n;
    try { n = JSON.parse(v); } catch (e) { n = v; }
    if (typeof ftBackupValueOk === 'function' && !ftBackupValueOk(k, n)) { console.warn('[FinTrack] Cloud key skipped (wrong shape):', k); return; }
    safeSave(k, v);
  });
  if (ss._accOrder !== undefined) {
    var order = []; try { order = JSON.parse(ss._accOrder); } catch (e) { order = []; }
    var accs = []; try { accs = JSON.parse(safeGet('ft_accounts') || '[]'); } catch (e) { accs = []; }
    if (Array.isArray(order) && Array.isArray(accs) && accs.length) {
      var pos = {}; order.forEach(function(id, i) { pos[String(id)] = i; });
      var rows = accs.map(function(a, i) { return { a: a, k: a && ftSyncHas(pos, String(a.id)) ? pos[String(a.id)] : 1e6 + i }; });
      rows.sort(function(x, y) { return x.k - y.k; });
      safeSave('ft_accounts', JSON.stringify(rows.map(function(x) { return x.a; })));
    }
  }
}

// After a download: next new id is always higher than any id that arrived
function ftSyncBumpCounters() {
  try {
    var top = function(list, re) {
      var m = -1;
      (list || []).forEach(function(x) {
        if (!x) return;
        var n = typeof x.id === 'number' ? x.id : NaN, hit = re.exec(String(x.id));
        if (!isFinite(n) && hit) n = parseInt(hit[1], 10);
        if (isFinite(n) && n > m) m = n;
      });
      return m;
    };
    if (typeof TXN !== 'undefined' && typeof nxId !== 'undefined') { var t = top(TXN, /^(\d+)$/); if (t + 1 > nxId) { nxId = t + 1; safeSave('ft_nxId', String(nxId)); } }
    if (typeof ACCOUNTS !== 'undefined' && typeof accNxId !== 'undefined') { var a = top(ACCOUNTS, /^acc_(\d+)$/); if (a + 1 > accNxId) { accNxId = a + 1; safeSave('ft_accNxId', String(accNxId)); } }
    if (typeof REMINDERS !== 'undefined' && typeof reminderNxId !== 'undefined') { var r = top(REMINDERS, /^(\d+)$/); if (r + 1 > reminderNxId) { reminderNxId = r + 1; safeSave('ft_reminderNxId', String(reminderNxId)); } }
  } catch (e) {}
}

function ftSyncTableErr(err, what) {
  var m = (err && err.message) || String(err);
  if (/ft_sync/.test(m) && /(does not exist|could not find|schema cache)/i.test(m)) m = 'the cloud table is not set up yet';
  return new Error(what + ' failed: ' + m);
}
function ftSyncErrText(e) {
  var m = (e && e.message) || String(e);
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'No internet connection. Your data is safe on this phone.';
  return m;
}

// Download rows (all, or only rows changed since `since`), 1,000 per request until an empty page
async function ftSyncFetch(uid, since) {
  var all = [];
  for (var from = 0; ; ) {
    var q = _supabase.from(FT_SYNC_TABLE).select('kind,rid,data,deleted,updated_at').eq('user_id', uid);
    if (since) q = q.gt('updated_at', since);
    var res = await q.order('kind', { ascending: true }).order('rid', { ascending: true }).range(from, from + FT_SYNC_PAGE - 1);
    if (res.error) throw ftSyncTableErr(res.error, 'Download');
    var rows = res.data || [];
    if (!rows.length) break;
    for (var i = 0; i < rows.length; i++) all.push(rows[i]);
    from += rows.length;
    if (from > 3000000) throw new Error('Download stopped: too many rows');
  }
  return all;
}
// Upload in chunks (max 500 rows / ~900 KB per request)
async function ftSyncPush(uid, items) {
  var chunk = [], size = 0;
  var send = async function() {
    if (!chunk.length) return;
    var res = await _supabase.from(FT_SYNC_TABLE).upsert(chunk, { onConflict: 'user_id,kind,rid' });
    if (res && res.error) throw ftSyncTableErr(res.error, 'Upload');
    chunk = []; size = 0;
  };
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var row = { user_id: uid, kind: it.kind, rid: it.rid, data: it.deleted ? null : it.data, deleted: !!it.deleted };
    var len = (row.data ? row.data.length : 0) + 120;
    if (chunk.length && (chunk.length >= 500 || size + len > 900000)) await send();
    chunk.push(row); size += len;
  }
  await send();
}

var ftSync = {
  isSyncing: false,
  lastSyncAt: null,
  lastPullAdded: 0,
  lastError: '',
  pendingChanges: [],
  _applying: false,
  _dirty: false,
  _again: false,

  hasSnapshot() { var uid = ftAuth.uid(); return !!uid && ftSyncSnapSize(ftSyncSnapLoad(uid)) > 0; },

  // opts.full: download everything (sign-in, Sync now button). opts.throwOnError: button shows the error.
  // Returns { down, up } = records changed on this phone / sent to the cloud.
  async sync(opts) {
    opts = opts || {};
    var no = function(msg) { if (opts.throwOnError) throw new Error(msg); return null; };
    if (typeof ftAuth === 'undefined' || !ftAuth.isLoggedIn()) return no('Not signed in');
    if (!ftCloudAllowed()) return no('This device holds data from another cloud account. Sign in again to choose.');
    if (this.isSyncing) { this._again = true; return no('Sync already running, try again in a moment'); }
    this.isSyncing = true;
    this._dirty = false;
    try {
      var r = await this._run(!!opts.full);
      if (r && r.needFull) r = await this._run(true);
      this.lastError = '';
      safeSave('ft_sync_err', '');
      this.lastSyncAt = new Date().toISOString();
      safeSave('lastCloudSync', this.lastSyncAt);
      this.lastPullAdded = r ? r.down : 0;
      if (r && (r.down || r.up)) console.log('[FinTrack] Synced: ' + r.down + ' in, ' + r.up + ' out');
      return r;
    } catch (e) {
      var msg = ftSyncErrText(e);
      this.lastError = msg;
      safeSave('ft_sync_err', msg + ' · ' + new Date().toLocaleString());
      console.error('[FinTrack] Sync error:', e);
      if (opts.throwOnError) throw new Error(msg);
      return null;
    } finally {
      this.isSyncing = false;
      this._applying = false;
      if (this._again || this._dirty) { this._again = false; ftCloudDirty(); } // changes made during the sync go next
    }
  },

  async _run(full) {
    var uid = ftAuth.uid();
    if (ftSyncFixDupIds() && typeof loadAllModuleData === 'function') loadAllModuleData();
    var snap = ftSyncSnapLoad(uid);
    var first = ftSyncSnapSize(snap) === 0;
    if (first || !snap.cursor) full = true;
    var since = full ? null : ftSyncSince(snap);
    if (!full && !since) full = true;
    var rows = await ftSyncFetch(uid, since);
    if (full && !rows.length && !first) { snap = { uid: uid, base: '', cursor: '', h: {} }; first = true; } // cloud emptied: upload again, delete nothing

    // --- cloud rows -> {kind: {rid: {v, s, h} | {del: true}}}; nothing is written before everything is downloaded ---
    var C = {}; FT_SYNC_KINDS.forEach(function(k) { C[k] = {}; });
    var cursor = snap.cursor || '', cloudBase = '';
    rows.forEach(function(r) {
      if (r.updated_at && String(r.updated_at) > cursor) cursor = String(r.updated_at);
      if (!C[r.kind] || typeof r.rid !== 'string') return;
      if (r.kind === 'store' && r.rid === '_base') { if (!r.deleted && r.data) cloudBase = String(r.data); return; }
      if (r.deleted || r.data === null || r.data === undefined) { C[r.kind][r.rid] = { del: true }; return; }
      var v, s;
      if (r.kind === 'store') { v = s = String(r.data); }
      else {
        try { v = ftSyncClean(JSON.parse(r.data)); } catch (e) { return; }
        if (!v || typeof v !== 'object' || Array.isArray(v)) return;
        if (r.kind !== 'budget' && (v.id === undefined || v.id === null || String(v.id) !== r.rid)) return;
        s = ftStable(v);
      }
      C[r.kind][r.rid] = { v: v, s: s, h: ftSyncFp(r.kind, s, v) };
    });

    // --- base currency: amounts are saved in it, so two different bases never mix ---
    if (cloudBase && cloudBase !== FT_BASE) {
      var empty = !(typeof TXN !== 'undefined' && TXN.length) && !(typeof ACCOUNTS !== 'undefined' && ACCOUNTS.length);
      if (empty && typeof CURRENCY_CONFIG !== 'undefined' && CURRENCY_CONFIG[cloudBase] && typeof ftSetBase === 'function') ftSetBase(cloudBase, true);
      else throw new Error('Your cloud data is saved in ' + cloudBase + ' but this phone uses ' + FT_BASE + '. Nothing was synced, your data is safe.');
    }
    var pushBase = full ? !cloudBase : !snap.base;

    // --- decide ---
    var tomb = {}; ftGetTombstones().forEach(function(k) { tomb[String(k)] = 1; });
    var L = ftSyncLocal();
    var P = ftSyncPlan(L, C, snap.h, { full: full, first: first, tomb: tomb });
    if (P.needFull && !full) return { needFull: true };
    var total = Math.max(ftSyncRecCount(snap.h), ftSyncRecCount(L));
    if (ftSyncSuspicious(P.upDel.length, total)) {
      if (!full) return { needFull: true }; // double-check against the whole cloud before asking
      if (!confirm('This phone is missing ' + P.upDel.length + ' records that are still in the cloud.\n\nOK = delete them from the cloud too\nCancel = bring them back to this phone')) {
        P.upDel.forEach(function(it) { if (it.c && !it.c.del) P.down.push(it); });
        P.upDel = [];
      }
    }
    if (ftSyncSuspicious(P.downDel.length, total)) {
      if (!confirm('The cloud says ' + P.downDel.length + ' records were deleted on another device.\n\nOK = delete them on this phone too\nCancel = keep them (they go back to the cloud)')) {
        P.downDel.forEach(function(it) { if (it.l) P.up.push(it); });
        P.downDel = [];
      }
    }
    if (P.conflicts.length) {
      var useCloud = confirm(P.conflicts.length + ' records are different on this phone and in the cloud.\n\nOK = use the CLOUD version\nCancel = keep this PHONE\'s version');
      P.conflicts.forEach(function(it) { (useCloud ? P.down : P.up).push(it); });
      P.conflicts = [];
    }

    // --- build the work (snapshot = what both sides hold once this sync finishes) ---
    var sets = {}, dels = {}, ups = [], ns = P.snap, down = 0;
    FT_SYNC_KINDS.forEach(function(k) { sets[k] = {}; dels[k] = {}; });
    P.down.forEach(function(it) { sets[it.kind][it.rid] = it.c.v; ns[it.kind][it.rid] = it.c.h; down++; });
    P.downDel.forEach(function(it) { dels[it.kind][it.rid] = 1; delete ns[it.kind][it.rid]; down++; });
    P.up.forEach(function(it) {
      if (it.merge) {
        var m = ftSyncMergeRaw(ftSyncText(it.l), it.c.s);
        if (m !== ftSyncText(it.l)) { sets.store[it.rid] = m; down++; }
        ups.push({ kind: 'store', rid: it.rid, data: m });
        ns.store[it.rid] = ftSyncFp('store', m, m);
      } else {
        ups.push({ kind: it.kind, rid: it.rid, data: ftSyncText(it.l) });
        ns[it.kind][it.rid] = it.l.h;
      }
    });
    P.upDel.forEach(function(it) { ups.push({ kind: it.kind, rid: it.rid, deleted: true }); delete ns[it.kind][it.rid]; });
    var upN = ups.length;
    if (pushBase) ups.push({ kind: 'store', rid: '_base', data: FT_BASE });

    // --- apply downloads here (no waiting in between), then upload ---
    if (down) {
      this._applying = true;
      try { ftSyncWrite(sets, dels); } finally { this._applying = false; }
      if (typeof loadAllModuleData === 'function') loadAllModuleData();
      ftSyncBumpCounters();
      try { if (typeof refresh === 'function') refresh(); } catch (e) {}
    }
    if (ups.length) await ftSyncPush(uid, ups);
    // Snapshot + cursor are saved only after the upload worked, so a failed sync simply runs again
    var moved = cursor !== (snap.cursor || '');
    var seen = moved ? Date.now() : (snap.seen || Date.now());
    var safe = !moved && (!!snap.safe || Date.now() - seen >= 60000);
    safeSave('ft_sync_snap', JSON.stringify({ uid: uid, base: FT_BASE, cursor: cursor, seen: seen, safe: safe, h: ns }));
    return { down: down, up: upN };
  },

  // --- old names kept so every page keeps working ---
  fullPush(opts) { return this.sync(Object.assign({}, opts || {}, { full: true })); },
  fullPull(opts) { return this.sync(Object.assign({}, opts || {}, { full: true })); },
  markAccountsDirty() { ftCloudDirty(); },
  pushTransaction() { ftCloudDirty(); return Promise.resolve(); },
  pushGoal() { ftCloudDirty(); return Promise.resolve(); },
  deleteTransaction(txId) { ftAddTombstone(txId); ftCloudDirty(); return Promise.resolve(); },
  flushPending() { ftCloudDirty(); return Promise.resolve(); },
  // Safety net: sync if the last one was over 6 hours ago
  checkAutoSync() {
    if (typeof ftAuth === 'undefined' || !ftAuth.isLoggedIn()) return;
    var last = safeGet('lastCloudSync');
    if (!last || (Date.now() - new Date(last).getTime()) > 6 * 60 * 60 * 1000) this.sync({ auto: true });
  }
};

// =====================================================
// ONLINE / BACK TO THE APP
// =====================================================
window.addEventListener('online', function() { ftCloudDirty(); });
// Opening the app again (phone unlocked, tab switched back) pulls changes made on other devices
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState !== 'visible' || typeof ftAuth === 'undefined' || !ftAuth.isLoggedIn()) return;
  var last = safeGet('lastCloudSync');
  if (!last || (Date.now() - new Date(last).getTime()) > 2 * 60 * 1000) ftSync.sync({ auto: true });
});

// =====================================================
// INIT: Call after ftLoadAll() in init.js
// =====================================================
var _ftCloudInited = false;
async function ftCloudInit() {
  // initApp runs again after every unlock; start the auth listener + hourly timer only once
  if (_ftCloudInited) return;
  _ftCloudInited = true;
  try {
    await ftAuth.init();
    if (ftAuth.isLoggedIn() && !(await ftCloudClaim())) return;
    if (ftAuth.isLoggedIn()) {
      console.log('[FinTrack] Cloud connected as:', ftAuth.user.email);
      var last = safeGet('lastCloudSync');
      if (!last || (Date.now() - new Date(last).getTime()) > 5 * 60 * 1000) ftSync.sync({ auto: true });
    }
    setInterval(function() { ftSync.checkAutoSync(); }, 60 * 60 * 1000);
  } catch (e) {
    console.warn('[FinTrack] Cloud init skipped:', e.message);
  }
}
