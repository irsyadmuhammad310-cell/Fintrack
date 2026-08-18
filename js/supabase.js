// === FinTrack Supabase Integration (V2.0) ===
// Handles auth, cloud sync, and offline-first architecture
// Sits on top of existing dual-write (localStorage + IndexedDB)

const SUPABASE_URL = 'https://eoonfztciqvyjchsinpg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3zgVsgSU4Jot7NpXl4dWKw_0Fhu19gY';

// Initialize Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // Full push: upload all local data to Supabase (first-time sync)
  async fullPush() {
    if (!ftAuth.isLoggedIn()) return;
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const uid = ftAuth.uid();

      // Push accounts
      var accounts = safeGet('accounts') || [];
      if (accounts.length) {
        var rows = accounts.map(function(a) {
          return {
            id: a.id,
            user_id: uid,
            name: a.n || a.name,
            type: a.type || 'savings',
            currency: a.cur || 'MYR',
            balance: a.b || a.balance || 0,
            icon: a.icon || '',
            color: a.color || '',
            is_active: a.active !== false,
            sort_order: a.sort || 0
          };
        });
        await _supabase.from('accounts').upsert(rows, { onConflict: 'id' });
      }

      // Push transactions
      var txns = safeGet('transactions') || [];
      if (txns.length) {
        // Batch in chunks of 500
        for (var i = 0; i < txns.length; i += 500) {
          var chunk = txns.slice(i, i + 500).map(function(tx) {
            return {
              id: tx.id,
              user_id: uid,
              account_id: tx.acc || null,
              type: tx.tp || tx.type || 'expense',
              amount: tx.a || tx.amount || 0,
              currency: tx.cur || 'MYR',
              description: tx.d || tx.desc || '',
              note: tx.note || '',
              date: tx.dt || tx.date,
              category_id: null // map later if needed
            };
          });
          await _supabase.from('transactions').upsert(chunk, { onConflict: 'id' });
        }
      }

      // Push goals
      var goals = safeGet('goals') || [];
      if (goals.length) {
        var goalRows = goals.map(function(g) {
          return {
            id: g.id,
            user_id: uid,
            name: g.n || g.name,
            icon: g.icon || '',
            target_amount: g.t || g.target || 0,
            current_amount: g.c || g.current || 0,
            currency: 'MYR',
            deadline: g.dl || g.deadline || null,
            priority: g.pri || 'medium',
            status: g.paused ? 'paused' : (g.completed ? 'completed' : 'active')
          };
        });
        await _supabase.from('goals').upsert(goalRows, { onConflict: 'id' });
      }

      // Push budgets
      var budgets = safeGet('budgetPlans') || {};
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
              savings_target: plan.s || 0
            }, { onConflict: 'user_id,year,month' });
          }
        }
      }

      this.lastSyncAt = new Date().toISOString();
      safeSave('lastCloudSync', this.lastSyncAt);
      console.log('[FinTrack] Full push complete at', this.lastSyncAt);
    } catch (e) {
      console.error('[FinTrack] Sync error:', e);
    } finally {
      this.isSyncing = false;
    }
  },

  // Pull: download all data from Supabase to local
  async fullPull() {
    if (!ftAuth.isLoggedIn()) return;
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      var uid = ftAuth.uid();

      // Pull transactions
      var { data: txns } = await _supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false });

      if (txns && txns.length) {
        var localTxns = txns.map(function(tx) {
          return {
            id: tx.id,
            tp: tx.type,
            a: parseFloat(tx.amount),
            d: tx.description,
            dt: tx.date,
            acc: tx.account_id,
            note: tx.note || '',
            cur: tx.currency
          };
        });
        safeSave('transactions', localTxns);
      }

      // Pull goals
      var { data: goals } = await _supabase
        .from('goals')
        .select('*')
        .eq('user_id', uid);

      if (goals && goals.length) {
        var localGoals = goals.map(function(g) {
          return {
            id: g.id,
            n: g.name,
            icon: g.icon,
            t: parseFloat(g.target_amount),
            c: parseFloat(g.current_amount),
            dl: g.deadline,
            pri: g.priority,
            paused: g.status === 'paused',
            completed: g.status === 'completed'
          };
        });
        safeSave('goals', localGoals);
      }

      // Pull accounts
      var { data: accounts } = await _supabase
        .from('accounts')
        .select('*')
        .eq('user_id', uid);

      if (accounts && accounts.length) {
        var localAccounts = accounts.map(function(a) {
          return {
            id: a.id,
            name: a.name,
            type: a.type,
            cur: a.currency,
            balance: parseFloat(a.balance),
            icon: a.icon,
            color: a.color,
            active: a.is_active,
            sort: a.sort_order
          };
        });
        safeSave('accounts', localAccounts);
      }

      this.lastSyncAt = new Date().toISOString();
      safeSave('lastCloudSync', this.lastSyncAt);
      console.log('[FinTrack] Full pull complete at', this.lastSyncAt);

      // Refresh UI
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
      this.pendingChanges.push({ table: 'transactions', data: tx });
      return;
    }
    try {
      await _supabase.from('transactions').upsert({
        id: tx.id,
        user_id: ftAuth.uid(),
        type: tx.tp || tx.type,
        amount: tx.a || tx.amount,
        description: tx.d || tx.desc || '',
        date: tx.dt || tx.date,
        account_id: tx.acc || null,
        note: tx.note || '',
        currency: tx.cur || 'MYR'
      }, { onConflict: 'id' });
    } catch (e) {
      // Offline: queue for later
      this.pendingChanges.push({ table: 'transactions', data: tx });
      console.warn('[FinTrack] Queued for sync:', e.message);
    }
  },

  // Incremental sync: push goal update
  async pushGoal(goal) {
    if (!ftAuth.isLoggedIn()) return;
    try {
      await _supabase.from('goals').upsert({
        id: goal.id,
        user_id: ftAuth.uid(),
        name: goal.n || goal.name,
        icon: goal.icon || '',
        target_amount: goal.t || goal.target,
        current_amount: goal.c || goal.current,
        deadline: goal.dl || goal.deadline || null,
        priority: goal.pri || 'medium',
        status: goal.paused ? 'paused' : (goal.completed ? 'completed' : 'active')
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[FinTrack] Goal sync failed:', e.message);
    }
  },

  // Delete from cloud
  async deleteTransaction(txId) {
    if (!ftAuth.isLoggedIn()) return;
    try {
      await _supabase.from('transactions').delete().eq('id', txId);
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
        this.pendingChanges.push(item); // re-queue on failure
      }
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
      // Auto-sync on load if last sync > 5 min ago
      var lastSync = safeGet('lastCloudSync');
      var fiveMin = 5 * 60 * 1000;
      if (!lastSync || (Date.now() - new Date(lastSync).getTime()) > fiveMin) {
        ftSync.fullPull();
      }
    }
  } catch (e) {
    console.warn('[FinTrack] Cloud init skipped:', e.message);
  }
}
