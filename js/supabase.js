// === FinTrack Supabase Integration (V2.0.1) ===
// Handles auth, cloud sync, and offline-first architecture
// Sits on top of existing dual-write (localStorage + IndexedDB)
// V2.0.1: Fixed category mapping, merge-on-pull, UUID IDs, 72h auto-sync

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
      if (event === 'SIGNED_IN') ftCloudClaim().then(function(ok) { if (ok) ftSync.fullPush(); });
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
// PAGED FETCH (V2.0.4)
// Supabase returns max 1,000 rows per request (project "Max Rows" setting).
// Fetch 1,000 at a time with .range() until a short page comes back.
// A stable order (date + id) keeps rows from shifting between pages.
// Any error throws, so a half-finished pull never looks complete.
// =====================================================
var FT_PAGE_SIZE = 1000;
async function ftFetchAll(table, uid, orderCol) {
  var all = [];
  for (var from = 0; ; from += FT_PAGE_SIZE) {
    var q = _supabase.from(table).select('*').eq('user_id', uid);
    if (orderCol) q = q.order(orderCol, { ascending: false });
    q = q.order('id', { ascending: true }).range(from, from + FT_PAGE_SIZE - 1);
    var res = await q;
    if (res.error) throw new Error(table + ' pull failed: ' + res.error.message);
    var rows = res.data || [];
    all = all.concat(rows);
    if (rows.length < FT_PAGE_SIZE) break;
    if (from > 5000000) throw new Error(table + ' pull stopped: too many pages');
  }
  return all;
}

// V2.0.4: saveACCOUNTS() (data.js) calls this so reorders/edits reach the cloud.
// Cheap debounce: pushes 3s after the last change, only when online and signed in.
var _ftAccSyncTimer = null;
function ftCloudAccountsDirty() {
  if (typeof ftSync === 'undefined') return;
  ftSync.markAccountsDirty();
  clearTimeout(_ftAccSyncTimer);
  _ftAccSyncTimer = setTimeout(function() {
    try {
      if (!ftSync._accountsDirty) return;
      if (typeof ftAuth === 'undefined' || !ftAuth.isLoggedIn()) return;
      if (navigator.onLine === false) return;
      ftSync._accountsDirty = false;
      ftSync.fullPush({ throwOnError: false }).catch(function() { ftSync._accountsDirty = true; });
    } catch (e) {}
  }, 3000);
}

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
// SYNC MODULE (Offline-first, sync when online)
// =====================================================
// V2.0.4: the cloud "note" column carries every link the table has no column for
// (transfer destination, loan link, fee link, original currency). Old rows only had c/s: still readable.
var FT_NOTE_EXTRA = ['toAcc', 'liab', 'fee', 'feeLinkedTo', 'cur', 'origAmt', 'fx']; // V2.0.5: fx = key-in rates
function ftTxNote(tx) {
  var n = { c: tx.c || '', s: tx.s || '' };
  FT_NOTE_EXTRA.forEach(function(k) { if (tx[k] !== undefined && tx[k] !== null && tx[k] !== '') n[k] = tx[k]; });
  return JSON.stringify(n);
}

const ftSync = {
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: [],

  // V2.0.4: called by data.js saveACCOUNTS() so account order changes sync on the next push
  _accountsDirty: false,
  markAccountsDirty() { this._accountsDirty = true; },

  // Helper: map local tx to cloud format
  _mapTxForCloud(tx) {
    return {
      id: String(tx.id),
      user_id: ftAuth.uid(),
      type: tx.t || 'Expense',
      amount: tx.a || 0,
      description: tx.dt || '',
      date: tx.d || new Date().toISOString().split('T')[0],
      account_id: tx.acc || null,
      note: ftTxNote(tx),
      currency: FT_BASE,
      category_id: null
    };
  },

  // Full push: upload all local data to Supabase
  // opts.throwOnError: manual Push button passes true so the UI shows the real error
  async fullPush(opts) {
    if (!ftAuth.isLoggedIn()) return;
    if (!ftCloudAllowed()) { if (opts && opts.throwOnError) throw new Error('This device holds data from another cloud account. Sign in again to choose.'); return; }
    if (this.isSyncing) { if (opts && opts.throwOnError) throw new Error('Sync already running, try again in a moment'); return; }
    this.isSyncing = true;

    try {
      const uid = ftAuth.uid();

      // Push accounts (V2.0.4: sort_order = array position, so drag reorder reaches other devices)
      var accounts = JSON.parse(safeGet('ft_accounts') || '[]');
      if (accounts.length) {
        var rows = accounts.map(function(a, aIdx) {
          return {
            id: String(a.id),
            user_id: uid,
            name: a.name,
            type: a.type || 'asset',
            currency: a.currency || FT_BASE,
            balance: a.initialBalance || 0,
            icon: a.icon || '',
            color: a.color || '',
            is_active: a.active !== false,
            sort_order: aIdx,
            note: JSON.stringify({ accountType: a.accountType, notes: a.notes || '', liabV2: a.liabV2 || undefined, createdAt: a.createdAt || undefined })
          };
        });
        ftCheck(await _supabase.from('accounts').upsert(rows, { onConflict: 'id' }), 'Accounts push');
      }

      // Push transactions (category + subcategory packed in note as JSON)
      var txns = JSON.parse(safeGet(STORAGE_KEY) || '[]');
      if (txns.length) {
        for (var i = 0; i < txns.length; i += 500) {
          var chunk = txns.slice(i, i + 500).map(function(tx) {
            return {
              id: String(tx.id),
              user_id: uid,
              account_id: tx.acc || null,
              type: tx.t || 'Expense',
              amount: tx.a || 0,
              currency: FT_BASE,
              description: tx.dt || '',
              note: ftTxNote(tx),
              date: tx.d || new Date().toISOString().split('T')[0],
              category_id: null
            };
          });
          ftCheck(await _supabase.from('transactions').upsert(chunk, { onConflict: 'id' }), 'Transactions push (rows ' + (i + 1) + '+)');
        }
      }

      // Push goals (handle both field name formats)
      var goals = typeof GOALS !== 'undefined' ? GOALS : JSON.parse(safeGet('ft_goals') || '[]');
      if (goals.length) {
        var goalRows = goals.map(function(g) {
          return {
            id: String(g.id),
            user_id: uid,
            name: g.name || g.n || '',
            icon: g.icon || g.e || g.emoji || '',
            target_amount: g.target || g.t || 0,
            current_amount: g.current || g.c || 0,
            currency: FT_BASE,
            deadline: g.due || g.deadline || g.dl || null, // V2.0.5: app stores the deadline as g.due
            priority: g.priority || g.pri || 'medium',
            status: g.paused ? 'paused' : (g.completed ? 'completed' : 'active'),
            note: JSON.stringify({ linkedCats: g.linkedCats || [], linkedCat: g.linkedCat || '', notes: g.notes || '', acc: g.acc || '', accs: g.accs || [], base: g.base || 0, created: g.created || '' })
          };
        });
        ftCheck(await _supabase.from('goals').upsert(goalRows, { onConflict: 'id' }), 'Goals push');
      }

      // Push budgets (with per-category data)
      var budgets = JSON.parse(safeGet('ft_budget_plans') || '{}');
      for (var year in budgets) {
        var yearPlans = budgets[year];
        for (var month in yearPlans) {
          var plan = yearPlans[month];
          if (plan) {
            var bRes = await _supabase.from('budgets').upsert({
              user_id: uid,
              year: parseInt(year),
              month: parseInt(month),
              income_target: plan.i || 0,
              expense_target: plan.e || 0,
              savings_target: plan.s || 0,
              note: JSON.stringify({ incCats: plan.incCats, expCats: plan.expCats, savCats: plan.savCats })
            }, { onConflict: 'user_id,year,month' });
            ftCheck(bRes, 'Budget push ' + year + '/' + month);
          }
        }
      }

      // V2.0.5: deletes made while offline reach the cloud now
      var tomb = ftGetTombstones();
      for (var ti = 0; ti < tomb.length; ti += 200) {
        ftCheck(await _supabase.from('transactions').delete().eq('user_id', uid).in('id', tomb.slice(ti, ti + 200)), 'Deleted rows push');
      }

      this.lastSyncAt = new Date().toISOString();
      safeSave('lastCloudSync', this.lastSyncAt);
      console.log('[FinTrack] Full push complete at', this.lastSyncAt);
    } catch (e) {
      // lastCloudSync is NOT updated on failure, so auto-sync retries later
      console.error('[FinTrack] Push error:', e);
      if (opts && opts.throwOnError) throw e;
    } finally {
      this.isSyncing = false;
    }
  },

  // Full pull: download from Supabase and MERGE with local (no overwrite)
  // V2.0.4: pages through ALL rows (1,000 per request). Everything is downloaded first,
  // then merged, so a dropped connection mid-pull changes nothing locally.
  async fullPull(opts) {
    if (!ftAuth.isLoggedIn()) return;
    if (!ftCloudAllowed()) { if (opts && opts.throwOnError) throw new Error('This device holds data from another cloud account. Sign in again to choose.'); return; }
    if (this.isSyncing) { if (opts && opts.throwOnError) throw new Error('Sync already running, try again in a moment'); return; }
    this.isSyncing = true;

    try {
      var uid = ftAuth.uid();

      // --- Download everything first (paged) ---
      var cloudTxns = await ftFetchAll('transactions', uid, 'date');
      var cloudAccounts = await ftFetchAll('accounts', uid, null);
      var cloudGoals = await ftFetchAll('goals', uid, null);
      console.log('[FinTrack] Pulled ' + cloudTxns.length + ' transactions, ' + cloudAccounts.length + ' accounts, ' + cloudGoals.length + ' goals.');

      // --- MERGE transactions ---
      if (cloudTxns.length) {
        var localTxns = JSON.parse(safeGet(STORAGE_KEY) || '[]');
        var localMap = {};
        localTxns.forEach(function(tx) { localMap[String(tx.id)] = true; });
        // V2.0.4 base currency: a new/empty phone adopts the cloud's base (rows saved before this are MYR).
        // A phone that already has data converts any cloud row saved in a different base.
        if (!localTxns.length) {
          var cloudBase = cloudTxns[0].currency || 'MYR';
          if (CURRENCY_CONFIG[cloudBase]) ftSetBase(cloudBase, true);
        }

        var added = 0;
        var tombSet = {}; ftGetTombstones().forEach(function(k) { tombSet[k] = true; });
        cloudTxns.forEach(function(ctx) {
          // Skip if local already has this ID, or it was deleted on this device
          if (localMap[String(ctx.id)] || tombSet[String(ctx.id)]) return;

          // Parse category from note JSON
          var category = 'Uncategorized', subcategory = '', noteData = {};
          try {
            noteData = JSON.parse(ctx.note || '{}') || {};
            if (noteData.c) { category = noteData.c; subcategory = noteData.s || ''; }
            else if (ctx.note && ctx.note.length < 100) { category = ctx.note; }
          } catch(e) {
            noteData = {};
            if (ctx.note) category = ctx.note;
          }

          var row = {
            id: isNaN(Number(ctx.id)) ? ctx.id : Number(ctx.id),
            t: ctx.type === 'Transfer' ? 'Savings' : (ctx.type || 'Expense'),
            c: category,
            s: subcategory,
            a: (function(v, cur) { return cur && cur !== FT_BASE && CURRENCY_CONFIG[cur] ? Math.round(convertFromTo(v, cur, FT_BASE) * 100) / 100 : v; })(parseFloat(ctx.amount) || 0, ctx.currency),
            d: ctx.date || '',
            dt: ctx.description || '',
            acc: ctx.account_id || undefined
          };
          // V2.0.4: restore transfer / loan / fee links saved in the note
          FT_NOTE_EXTRA.forEach(function(k) { if (noteData[k] !== undefined) row[k] = noteData[k]; });
          localTxns.push(row);
          localMap[String(ctx.id)] = true; // same id twice in cloud = add once
          added++;
        });

        if (added > 0) {
          // safeSave keeps big keys in IndexedDB only (V2.0.4 storage engine)
          safeSave(STORAGE_KEY, JSON.stringify(localTxns));
          console.log('[FinTrack] Merged', added, 'new transactions from cloud.');
        }
        this.lastPullAdded = added;
      }

      // --- MERGE accounts ---
      if (cloudAccounts.length) {
        var localAccounts = JSON.parse(safeGet('ft_accounts') || '[]');
        var localAccMap = {};
        localAccounts.forEach(function(a) { localAccMap[String(a.id)] = true; });

        cloudAccounts.forEach(function(ca) {
          if (localAccMap[String(ca.id)]) return;
          var meta = {};
          try { meta = JSON.parse(ca.note || '{}'); } catch(e) {}
          localAccounts.push({
            id: ca.id,
            name: ca.name,
            type: ca.type || 'asset',
            accountType: meta.accountType || ca.type || 'Savings Account',
            currency: ca.currency || FT_BASE,
            initialBalance: parseFloat(ca.balance) || 0,
            notes: meta.notes || '',
            active: ca.is_active !== false,
            liabV2: meta.liabV2 || undefined,
            createdAt: meta.createdAt || undefined
          });
        });
        // V2.0.4: order = cloud sort_order (set by drag reorder). New accounts with no order go last.
        var orderOf = {};
        cloudAccounts.forEach(function(ca) { orderOf[String(ca.id)] = (ca.sort_order === 0 || ca.sort_order) ? ca.sort_order : 1e9; });
        localAccounts.sort(function(a, b) {
          var oa = orderOf[String(a.id)] !== undefined ? orderOf[String(a.id)] : 1e9;
          var ob = orderOf[String(b.id)] !== undefined ? orderOf[String(b.id)] : 1e9;
          if (oa !== ob) return oa - ob;
          return 0;
        });
        safeSave('ft_accounts', JSON.stringify(localAccounts));
      }

      // --- MERGE goals ---
      if (cloudGoals.length) {
        var localGoals = JSON.parse(safeGet('ft_goals') || '[]');
        var localGoalMap = {};
        localGoals.forEach(function(g) { localGoalMap[String(g.id)] = true; });

        cloudGoals.forEach(function(cg) {
          if (localGoalMap[String(cg.id)]) return;
          var meta = {};
          try { meta = JSON.parse(cg.note || '{}'); } catch(e) {}
          // V2.0.5: rebuild in the app's own field names (n/t/c/due/e). Old code used name/target/current,
          // which goals.js never reads, so pulled goals showed blank.
          localGoals.push({
            id: isNaN(Number(cg.id)) ? cg.id : Number(cg.id),
            n: cg.name || '',
            e: cg.icon || '🎯',
            t: parseFloat(cg.target_amount) || 0,
            c: parseFloat(cg.current_amount) || 0,
            due: cg.deadline || '',
            priority: cg.priority || 'medium',
            paused: cg.status === 'paused',
            completed: cg.status === 'completed',
            linkedCats: meta.linkedCats || [],
            linkedCat: meta.linkedCat || '',
            notes: meta.notes || '',
            acc: meta.acc || '',
            accs: meta.accs || [],
            base: meta.base || 0,
            created: meta.created || ''
          });
        });
        safeSave('ft_goals', JSON.stringify(localGoals));
      }

      // --- MERGE budgets (V2.0.5: budgets were pushed but never pulled). Local months always win. ---
      try {
        var bRes = await _supabase.from('budgets').select('*').eq('user_id', uid).limit(5000);
        if (bRes.error) throw new Error(bRes.error.message);
        var cloudBudgets = bRes.data || [];
        if (cloudBudgets.length) {
          var localPlans = {};
          try { localPlans = JSON.parse(safeGet('ft_budget_plans') || '{}') || {}; } catch (e) { localPlans = {}; }
          if (typeof localPlans !== 'object' || Array.isArray(localPlans)) localPlans = {};
          var bAdded = 0;
          cloudBudgets.forEach(function(b) {
            var y = String(b.year), m = String(b.month);
            if (!b.year && b.year !== 0) return;
            if (!localPlans[y] || typeof localPlans[y] !== 'object') localPlans[y] = {};
            if (localPlans[y][m]) return;
            var bm = {}; try { bm = JSON.parse(b.note || '{}') || {}; } catch (e) {}
            localPlans[y][m] = { i: parseFloat(b.income_target) || 0, e: parseFloat(b.expense_target) || 0, s: parseFloat(b.savings_target) || 0, incCats: bm.incCats || {}, expCats: bm.expCats || {}, savCats: bm.savCats || {} };
            bAdded++;
          });
          if (bAdded) safeSave('ft_budget_plans', JSON.stringify(localPlans));
        }
      } catch (e) { console.warn('[FinTrack] Budget pull skipped:', e.message); }

      this.lastSyncAt = new Date().toISOString();
      safeSave('lastCloudSync', this.lastSyncAt);
      console.log('[FinTrack] Pull (merge) complete at', this.lastSyncAt);

      // Reload all in-memory data from updated storage
      loadAllModuleData();
      if (typeof refresh === 'function') refresh();
    } catch (e) {
      // Nothing merged and lastCloudSync not updated, so the next auto-pull retries
      console.error('[FinTrack] Pull error:', e);
      if (opts && opts.throwOnError) throw e;
    } finally {
      this.isSyncing = false;
    }
  },

  // Incremental sync: push single transaction after save
  async pushTransaction(tx) {
    if (!ftCloudAllowed()) return; // not signed in (fullPush covers it later) or another account's device
    try {
      // V2.0.5: Supabase returns {error} instead of throwing, so check it
      ftCheck(await _supabase.from('transactions').upsert(this._mapTxForCloud(tx), { onConflict: 'id' }), 'Transaction push');
    } catch (e) {
      this.pendingChanges.push({ table: 'transactions', data: this._mapTxForCloud(tx) });
      console.warn('[FinTrack] Queued for sync:', e.message);
    }
  },

  // Incremental sync: push goal update
  async pushGoal(goal) {
    if (!ftCloudAllowed()) return;
    try {
      ftCheck(await _supabase.from('goals').upsert({
        id: String(goal.id),
        user_id: ftAuth.uid(),
        name: goal.name || goal.n || '',
        icon: goal.icon || goal.e || goal.emoji || '',
        target_amount: goal.target || goal.t || 0,
        current_amount: goal.current || goal.c || 0,
        deadline: goal.due || goal.deadline || goal.dl || null,
        priority: goal.priority || goal.pri || 'medium',
        status: goal.paused ? 'paused' : (goal.completed ? 'completed' : 'active'),
        note: JSON.stringify({ linkedCats: goal.linkedCats || [], linkedCat: goal.linkedCat || '', notes: goal.notes || '', acc: goal.acc || '', accs: goal.accs || [], base: goal.base || 0, created: goal.created || '' })
      }, { onConflict: 'id' }), 'Goal push');
    } catch (e) {
      console.warn('[FinTrack] Goal sync failed (next full push retries):', e.message);
    }
  },

  // Delete from cloud (V2.0.5: always remembered locally, so it can't come back on pull)
  async deleteTransaction(txId) {
    ftAddTombstone(txId);
    if (!ftCloudAllowed()) return;
    try {
      ftCheck(await _supabase.from('transactions').delete().eq('id', String(txId)).eq('user_id', ftAuth.uid()), 'Delete');
    } catch (e) {
      console.warn('[FinTrack] Delete sync failed (next full push retries):', e.message);
    }
  },

  // Flush pending changes (call when back online)
  async flushPending() {
    if (!ftCloudAllowed() || !this.pendingChanges.length) return;
    var pending = this.pendingChanges.splice(0);
    for (var i = 0; i < pending.length; i++) {
      var item = pending[i];
      try {
        ftCheck(await _supabase.from(item.table).upsert(item.data, { onConflict: 'id' }), 'Pending push');
      } catch (e) {
        this.pendingChanges.push(item);
      }
    }
  },

  // Auto-sync: push every 72 hours
  checkAutoSync() {
    if (!ftAuth.isLoggedIn()) return;
    var lastSync = safeGet('lastCloudSync');
    var interval = 72 * 60 * 60 * 1000; // 72 hours
    if (!lastSync || (Date.now() - new Date(lastSync).getTime()) > interval) {
      console.log('[FinTrack] Auto-sync triggered (72h interval)');
      this.fullPush();
    }
  }
};

// =====================================================
// ONLINE/OFFLINE DETECTION
// =====================================================
window.addEventListener('online', function() {
  console.log('[FinTrack] Back online, flushing pending sync...');
  ftSync.flushPending();
});

// =====================================================
// INIT: Call after ftLoadAll() in init.js
// =====================================================
var _ftCloudInited = false;
async function ftCloudInit() {
  // V2.0.5: initApp runs again after every unlock; start auth listener + hourly timer only once
  if (_ftCloudInited) return;
  _ftCloudInited = true;
  try {
    await ftAuth.init();
    if (ftAuth.isLoggedIn() && !(await ftCloudClaim())) return;
    if (ftAuth.isLoggedIn()) {
      console.log('[FinTrack] Cloud connected as:', ftAuth.user.email);
      // Auto-pull if last sync > 5 min ago
      var lastSync = safeGet('lastCloudSync');
      var fiveMin = 5 * 60 * 1000;
      if (!lastSync || (Date.now() - new Date(lastSync).getTime()) > fiveMin) {
        ftSync.fullPull();
      }
      // Auto-push every 72 hours
      ftSync.checkAutoSync();
      // Check again every hour (in case app stays open long)
      setInterval(function() { ftSync.checkAutoSync(); }, 60 * 60 * 1000);
    }
  } catch (e) {
    console.warn('[FinTrack] Cloud init skipped:', e.message);
  }
}
