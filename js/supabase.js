// === FinTrack Supabase Integration (V2.0.1) ===
// Handles auth, cloud sync, and offline-first architecture
// Sits on top of existing dual-write (localStorage + IndexedDB)
// V2.0.1: Fixed category mapping, merge-on-pull, UUID IDs, 72h auto-sync

const SUPABASE_URL = 'https://eoonfztciqvyjchsinpg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3zgVsgSU4Jot7NpXl4dWKw_0Fhu19gY';

// Initialize Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
      if (event === 'SIGNED_IN') ftSync.fullPush();
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
// SYNC MODULE (Offline-first, sync when online)
// =====================================================
const ftSync = {
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: [],

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
      note: JSON.stringify({ c: tx.c || '', s: tx.s || '' }),
      currency: 'MYR',
      category_id: null
    };
  },

  // Full push: upload all local data to Supabase
  async fullPush() {
    if (!ftAuth.isLoggedIn()) return;
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const uid = ftAuth.uid();

      // Push accounts
      var accounts = JSON.parse(safeGet('ft_accounts') || '[]');
      if (accounts.length) {
        var rows = accounts.map(function(a) {
          return {
            id: String(a.id),
            user_id: uid,
            name: a.name,
            type: a.type || 'asset',
            currency: a.currency || 'MYR',
            balance: a.initialBalance || 0,
            icon: a.icon || '',
            color: a.color || '',
            is_active: a.active !== false,
            sort_order: a.sort || 0,
            note: JSON.stringify({ accountType: a.accountType, notes: a.notes || '' })
          };
        });
        await _supabase.from('accounts').upsert(rows, { onConflict: 'id' });
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
              currency: 'MYR',
              description: tx.dt || '',
              note: JSON.stringify({ c: tx.c || '', s: tx.s || '' }),
              date: tx.d || new Date().toISOString().split('T')[0],
              category_id: null
            };
          });
          await _supabase.from('transactions').upsert(chunk, { onConflict: 'id' });
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
            icon: g.icon || g.emoji || '',
            target_amount: g.target || g.t || 0,
            current_amount: g.current || g.c || 0,
            currency: 'MYR',
            deadline: g.deadline || g.dl || null,
            priority: g.priority || g.pri || 'medium',
            status: g.paused ? 'paused' : (g.completed ? 'completed' : 'active'),
            note: JSON.stringify({ linkedCats: g.linkedCats || [], linkedCat: g.linkedCat || '', notes: g.notes || '' })
          };
        });
        await _supabase.from('goals').upsert(goalRows, { onConflict: 'id' });
      }

      // Push budgets (with per-category data)
      var budgets = JSON.parse(safeGet('ft_budget_plans') || '{}');
      for (var year in budgets) {
        var yearPlans = budgets[year];
        for (var month in yearPlans) {
          var plan = yearPlans[month];
          if (plan) {
            await _supabase.from('budgets').upsert({
              user_id: uid,
              year: parseInt(year),
              month: parseInt(month),
              income_target: plan.i || 0,
              expense_target: plan.e || 0,
              savings_target: plan.s || 0,
              note: JSON.stringify({ incCats: plan.incCats, expCats: plan.expCats, savCats: plan.savCats })
            }, { onConflict: 'user_id,year,month' });
          }
        }
      }

      this.lastSyncAt = new Date().toISOString();
      safeSave('lastCloudSync', this.lastSyncAt);
      console.log('[FinTrack] Full push complete at', this.lastSyncAt);
    } catch (e) {
      console.error('[FinTrack] Push error:', e);
    } finally {
      this.isSyncing = false;
    }
  },

  // Full pull: download from Supabase and MERGE with local (no overwrite)
  async fullPull() {
    if (!ftAuth.isLoggedIn()) return;
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      var uid = ftAuth.uid();

      // --- Pull and MERGE transactions ---
      var { data: cloudTxns } = await _supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false });

      if (cloudTxns && cloudTxns.length) {
        var localTxns = JSON.parse(safeGet(STORAGE_KEY) || '[]');
        var localMap = {};
        localTxns.forEach(function(tx) { localMap[String(tx.id)] = true; });

        var added = 0;
        cloudTxns.forEach(function(ctx) {
          // Skip if local already has this ID
          if (localMap[String(ctx.id)]) return;

          // Parse category from note JSON
          var category = 'Uncategorized', subcategory = '';
          try {
            var noteData = JSON.parse(ctx.note || '{}');
            if (noteData.c) { category = noteData.c; subcategory = noteData.s || ''; }
            else if (ctx.note && ctx.note.length < 100) { category = ctx.note; }
          } catch(e) {
            if (ctx.note) category = ctx.note;
          }

          localTxns.push({
            id: isNaN(Number(ctx.id)) ? ctx.id : Number(ctx.id),
            t: ctx.type || 'Expense',
            c: category,
            s: subcategory,
            a: parseFloat(ctx.amount) || 0,
            d: ctx.date || '',
            dt: ctx.description || '',
            acc: ctx.account_id || undefined
          });
          added++;
        });

        if (added > 0) {
          var txnJson = JSON.stringify(localTxns);
          if (txnJson.length < 4 * 1024 * 1024) {
            safeSave(STORAGE_KEY, txnJson);
          } else {
            // Too large for localStorage, write IDB only
            _ftStore[STORAGE_KEY] = txnJson;
            if (_ftDBReady) ftDB.set(STORAGE_KEY, txnJson).catch(function(){});
            console.warn('[FinTrack] TXN too large for localStorage, IDB only.');
          }
          console.log('[FinTrack] Merged', added, 'new transactions from cloud.');
        }
      }

      // --- Pull and MERGE accounts ---
      var { data: cloudAccounts } = await _supabase
        .from('accounts')
        .select('*')
        .eq('user_id', uid);

      if (cloudAccounts && cloudAccounts.length) {
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
            currency: ca.currency || 'MYR',
            initialBalance: parseFloat(ca.balance) || 0,
            notes: meta.notes || '',
            active: ca.is_active !== false
          });
        });
        safeSave('ft_accounts', JSON.stringify(localAccounts));
      }

      // --- Pull and MERGE goals ---
      var { data: cloudGoals } = await _supabase
        .from('goals')
        .select('*')
        .eq('user_id', uid);

      if (cloudGoals && cloudGoals.length) {
        var localGoals = JSON.parse(safeGet('ft_goals') || '[]');
        var localGoalMap = {};
        localGoals.forEach(function(g) { localGoalMap[String(g.id)] = true; });

        cloudGoals.forEach(function(cg) {
          if (localGoalMap[String(cg.id)]) return;
          var meta = {};
          try { meta = JSON.parse(cg.note || '{}'); } catch(e) {}
          localGoals.push({
            id: isNaN(Number(cg.id)) ? cg.id : Number(cg.id),
            name: cg.name || '',
            icon: cg.icon || '',
            target: parseFloat(cg.target_amount) || 0,
            current: parseFloat(cg.current_amount) || 0,
            deadline: cg.deadline || '',
            priority: cg.priority || 'medium',
            paused: cg.status === 'paused',
            completed: cg.status === 'completed',
            linkedCats: meta.linkedCats || [],
            linkedCat: meta.linkedCat || '',
            notes: meta.notes || ''
          });
        });
        safeSave('ft_goals', JSON.stringify(localGoals));
      }

      this.lastSyncAt = new Date().toISOString();
      safeSave('lastCloudSync', this.lastSyncAt);
      console.log('[FinTrack] Pull (merge) complete at', this.lastSyncAt);

      // Reload all in-memory data from updated storage
      loadAllModuleData();
      if (typeof refresh === 'function') refresh();
    } catch (e) {
      console.error('[FinTrack] Pull error:', e);
    } finally {
      this.isSyncing = false;
    }
  },

  // Incremental sync: push single transaction after save
  async pushTransaction(tx) {
    if (!ftAuth.isLoggedIn()) {
      this.pendingChanges.push({ table: 'transactions', data: this._mapTxForCloud(tx) });
      return;
    }
    try {
      await _supabase.from('transactions').upsert(this._mapTxForCloud(tx), { onConflict: 'id' });
    } catch (e) {
      this.pendingChanges.push({ table: 'transactions', data: this._mapTxForCloud(tx) });
      console.warn('[FinTrack] Queued for sync:', e.message);
    }
  },

  // Incremental sync: push goal update
  async pushGoal(goal) {
    if (!ftAuth.isLoggedIn()) return;
    try {
      await _supabase.from('goals').upsert({
        id: String(goal.id),
        user_id: ftAuth.uid(),
        name: goal.name || goal.n || '',
        icon: goal.icon || goal.emoji || '',
        target_amount: goal.target || goal.t || 0,
        current_amount: goal.current || goal.c || 0,
        deadline: goal.deadline || goal.dl || null,
        priority: goal.priority || goal.pri || 'medium',
        status: goal.paused ? 'paused' : (goal.completed ? 'completed' : 'active'),
        note: JSON.stringify({ linkedCats: goal.linkedCats || [], linkedCat: goal.linkedCat || '', notes: goal.notes || '' })
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[FinTrack] Goal sync failed:', e.message);
    }
  },

  // Delete from cloud
  async deleteTransaction(txId) {
    if (!ftAuth.isLoggedIn()) return;
    try {
      await _supabase.from('transactions').delete().eq('id', String(txId));
    } catch (e) {
      console.warn('[FinTrack] Delete sync failed:', e.message);
    }
  },

  // Flush pending changes (call when back online)
  async flushPending() {
    if (!ftAuth.isLoggedIn() || !this.pendingChanges.length) return;
    var pending = this.pendingChanges.splice(0);
    for (var i = 0; i < pending.length; i++) {
      var item = pending[i];
      try {
        await _supabase.from(item.table).upsert(item.data, { onConflict: 'id' });
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
async function ftCloudInit() {
  try {
    await ftAuth.init();
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
