// === FLOATING AI ASSISTANT (v11.2) ===
(function() {
  // Inject floating AI HTML (v15.3: added fallback text + explicit display)
  const fab = document.createElement('div');
  fab.id = 'aiFab';
  fab.style.display = 'block';
  fab.innerHTML = `
    <button class="ai-fab-btn" onclick="toggleAIChat()" aria-label="AI Assistant"><i data-lucide="sparkles" width="22" height="22"></i><span style="position:absolute;font-size:0">✨</span></button>
    <div class="ai-panel" id="aiPanel">
      <div class="ai-panel-hdr">
        <div class="ai-panel-title"><span class="ai-dot"></span>FinTrack AI Advisor</div>
        <button class="ai-panel-close" onclick="toggleAIChat()"><i data-lucide="x" width="16" height="16"></i></button>
      </div>
      <div class="ai-panel-msgs" id="aiMsgs">
        <div class="aim ast"><div class="aiav">🤖</div><div class="aib">Hi! I'm your personal finance advisor. Ask me anything about budgeting, investing, saving, debt, retirement, taxes, or your FinTrack data. How can I help?</div></div>
      </div>
      <div class="ai-panel-disclaimer">AI also can make mistake. Please seek professional advice.</div>
      <div class="ai-panel-inp">
        <input id="aiInp" placeholder="Ask me anything about finance..." onkeydown="if(event.key==='Enter')sendAI()">
        <button class="aisnd" onclick="sendAI()"><i data-lucide="send" width="16" height="16"></i></button>
      </div>
    </div>`;
  document.body.appendChild(fab);
  // Ensure icon renders even if lucide was slow
  setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
  setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 500);
})();

let aiOpen = false;
function toggleAIChat() {
  aiOpen = !aiOpen;
  const panel = document.getElementById('aiPanel');
  const btn = document.querySelector('.ai-fab-btn');
  panel.classList.toggle('open', aiOpen);
  btn.classList.toggle('active', aiOpen);
  if (aiOpen) { setTimeout(() => { document.getElementById('aiInp').focus(); lucide.createIcons(); }, 200); }
}

function sendAI() {
  const inp = document.getElementById('aiInp'), msg = inp.value.trim();
  if (!msg) return;
  const box = document.getElementById('aiMsgs');
  box.innerHTML += `<div class="aim usr"><div class="aiav">MI</div><div class="aib">${msg}</div></div>`;
  inp.value = '';
  box.scrollTop = box.scrollHeight;

  // Show typing indicator
  const typingId = 'typing_' + Date.now();
  box.innerHTML += `<div class="aim ast" id="${typingId}"><div class="aiav">🤖</div><div class="aib ai-typing"><span></span><span></span><span></span></div></div>`;
  box.scrollTop = box.scrollHeight;

  setTimeout(() => {
    const el = document.getElementById(typingId);
    if (el) el.remove();

    const r = generateAIResponse(msg);
    box.innerHTML += `<div class="aim ast"><div class="aiav">🤖</div><div class="aib">${r}\n\n<span class="ai-disclaimer-inline">AI also can make mistake. Please seek professional advice.</span></div></div>`;
    box.scrollTop = box.scrollHeight;
  }, 800 + Math.random() * 600);
}

// === AI CONVERSATION ENGINE (v15.4 — Reformation) ===
let aiConversation = [];
let aiLastTopic = null;

function getFinancialSnapshot() {
  const year = getSelectedYear();
  const MD = computeMonthlyData(year);
  const EC = computeExpenseCategories(year);
  const ti = MD.reduce((s, m) => s + m.i, 0);
  const te = MD.reduce((s, m) => s + m.e, 0);
  const ts = MD.reduce((s, m) => s + m.s, 0);
  const activeMonths = MD.filter(m => m.i > 0).length;
  const avgI = ti / Math.max(activeMonths, 1);
  const avgE = te / Math.max(MD.filter(m => m.e > 0).length, 1);
  const avgS = ts / Math.max(MD.filter(m => m.s > 0).length, 1);
  const savRate = ti > 0 ? (ts / ti * 100) : 0;
  const expRate = ti > 0 ? (te / ti * 100) : 0;
  const bal = typeof getCarryForwardBalance === 'function' ? getCarryForwardBalance(year, 'total') : ti - te - ts;
  const nw = typeof getNetWorth === 'function' ? getNetWorth() : 0;
  const topCat = EC.length ? EC[0] : { n: 'None', a: 0 };
  const top3 = EC.slice(0, 3);
  const monthlyTrend = MD.map((m, i) => ({ month: MONTH_NAMES[i], income: m.i, expense: m.e, savings: m.s, net: m.i - m.e - m.s }));
  const recentMonths = monthlyTrend.filter(m => m.income > 0 || m.expense > 0);
  const lastMonth = recentMonths.length >= 2 ? recentMonths[recentMonths.length - 2] : null;
  const thisMonth = recentMonths.length >= 1 ? recentMonths[recentMonths.length - 1] : null;
  return { year, MD, EC, ti, te, ts, activeMonths, avgI, avgE, avgS, savRate, expRate, bal, nw, topCat, top3, monthlyTrend, recentMonths, lastMonth, thisMonth };
}

function detectSpendingTrends(snap) {
  const trends = [];
  const recent = snap.recentMonths.slice(-3);
  if (recent.length >= 3) {
    const expTrend = recent[2].expense - recent[0].expense;
    if (expTrend > snap.avgE * 0.2) trends.push({ type: 'rising_expense', detail: `Spending increased by ${fmt(expTrend)} over the last 3 months.` });
    if (expTrend < -snap.avgE * 0.2) trends.push({ type: 'falling_expense', detail: `Spending decreased by ${fmt(Math.abs(expTrend))} over the last 3 months. Good trend.` });
    const savTrend = recent[2].savings - recent[0].savings;
    if (savTrend > 0) trends.push({ type: 'improving_savings', detail: `Savings are trending up.` });
  }
  if (snap.thisMonth && snap.lastMonth) {
    const spike = snap.thisMonth.expense - snap.lastMonth.expense;
    if (spike > snap.avgE * 0.4) trends.push({ type: 'expense_spike', detail: `This month's spending is ${fmt(spike)} higher than last month.` });
  }
  if (snap.savRate < 10) trends.push({ type: 'low_savings', detail: `Savings rate at ${snap.savRate.toFixed(1)}% is below the recommended 20% minimum.` });
  if (snap.expRate > 80) trends.push({ type: 'high_expense_ratio', detail: `Expenses consume ${snap.expRate.toFixed(0)}% of income, leaving little room for growth.` });
  return trends;
}

function aiDisclaimer(topic) {
  const needsDisclaimer = ['invest', 'tax', 'insurance', 'retire', 'legal', 'loan', 'mortgage', 'stock', 'etf', 'bond', 'reit', 'crypto', 'property', 'fire', 'epf', 'kwsp', 'asb', 'unit trust'];
  if (needsDisclaimer.some(k => topic.includes(k))) {
    return '\n\n<b>Disclaimer:</b> <span style="font-size:10px;color:var(--text-tertiary)">This guidance is based on your FinTrack data and general financial knowledge. AI can make mistakes. For important financial, tax, or investment decisions, please consult a qualified professional.</span>';
  }
  return '';
}

function generateAIResponse(msg) {
  const l = msg.toLowerCase();
  aiConversation.push({ role: 'user', text: msg });
  const snap = getFinancialSnapshot();
  const { year, EC, ti, te, ts, activeMonths, avgI, avgE, avgS, savRate, expRate, bal, nw, topCat, top3, recentMonths, lastMonth, thisMonth } = snap;
  const trends = detectSpendingTrends(snap);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const has = (...w) => w.some(x => l.includes(x));

  // === GREETINGS ===
  if (has('hello','hi','hey','hai','assalamualaikum','good morning','good night','yo','sup')) {
    aiLastTopic = 'greeting';
    return pick([
      `Hey! I've got your ${year} data ready. Try asking specific things like "how much did I spend on food?" or "what's my savings rate?" Or we can talk investment strategy, tax, budgeting. What do you need?`,
      `What's up! I can query your transactions, analyze trends, or discuss financial strategy. What's on your mind?`,
      `Hi! Your ${year} numbers are loaded. Ask me anything: spending breakdowns, account balances, goal progress, or general finance advice.`
    ]);
  }

  // === THANKS ===
  if (has('thank','thanks','terima kasih','tq','cheers','appreciate')) {
    return pick(["Happy to help. Come back anytime.", "You're welcome! Consistency is the real secret.", "Anytime. The fact you're tracking already puts you ahead."]);
  }

  // === CAPABILITIES ===
  if (has('what can you','help me','what do you','feature','capability','apa boleh')) {
    return `<b>I can help with:</b>\n\n<b>Your Data:</b>\n• "How much did I spend on [category] in [month]?"\n• "What's my [account] balance?"\n• "Show last 10 transactions"\n• "Compare this month vs last month"\n• "What's my biggest expense?"\n\n<b>Planning:</b> Budget optimization, savings plan, emergency fund, retirement/FIRE, debt strategy\n\n<b>Education:</b> Investing (ETFs, stocks, ASB, crypto, REITs), tax, insurance, property\n\nJust ask naturally. I use your actual data whenever relevant.`;
  }

  // === SPECIFIC DATA QUERIES ===
  if (has('how much','berapa','total','jumlah') && has('spend','spent','belanja','habis','pay','paid','bayar')) {
    const range = parseRange(l); const cat = findCat(l); const txns = filterTxn(range); const period = range ? range.label : year;
    if (cat) { const ct = txns.filter(tx => tx.c.toLowerCase() === cat.name.toLowerCase() || (tx.s && tx.s.toLowerCase() === cat.name.toLowerCase())); const total = ct.reduce((s, tx) => s + tx.a, 0); if (!ct.length) return `No transactions for "${cat.name}" in ${period}.`; return `<b>${fmt(total)}</b> on ${cat.name} in ${period} (${ct.length} txns, avg ${fmt(total/ct.length)} each).${ct.length > 3 ? '\nTop: ' + ct.sort((a,b) => b.a - a.a).slice(0,3).map(tx => fmt(tx.a) + ' (' + new Date(tx.d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) + ')').join(', ') : ''}`; }
    const expTxns = txns.filter(tx => tx.t === 'Expense'); const total = expTxns.reduce((s, tx) => s + tx.a, 0); const cats = {}; expTxns.forEach(tx => { cats[tx.c] = (cats[tx.c] || 0) + tx.a; }); const sorted = Object.entries(cats).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return `<b>Total spent in ${period}: ${fmt(total)}</b>\n\n${sorted.map(([c, a]) => '• ' + c + ': ' + fmt(a) + ' (' + (total > 0 ? (a/total*100).toFixed(0) : 0) + '%)').join('\n')}`;
  }

  if (has('how much','berapa','total') && has('income','earn','earned','gaji','salary','pendapatan')) {
    const range = parseRange(l); const txns = filterTxn(range).filter(tx => tx.t === 'Income'); const period = range ? range.label : year; const total = txns.reduce((s, tx) => s + tx.a, 0);
    if (!total) return `No income recorded in ${period}.`;
    const sources = {}; txns.forEach(tx => { sources[tx.c] = (sources[tx.c] || 0) + tx.a; }); const sorted = Object.entries(sources).sort((a,b) => b[1] - a[1]);
    return `<b>Total income in ${period}: ${fmt(total)}</b>\n\n${sorted.map(([c, a]) => '• ' + c + ': ' + fmt(a)).join('\n')}`;
  }

  if (has('how much','berapa','total') && has('save','saved','savings','simpan','tabung')) {
    const range = parseRange(l); const txns = filterTxn(range).filter(tx => tx.t === 'Savings'); const period = range ? range.label : year; const total = txns.reduce((s, tx) => s + tx.a, 0);
    if (!total) return `No savings in ${period}.`;
    return `<b>Total saved in ${period}: ${fmt(total)}</b> (${txns.length} transactions, savings rate: ${savRate.toFixed(1)}%)`;
  }

  if (has('account','akaun') && has('balance','baki','how much','berapa')) {
    const acc = findAcc(l);
    if (acc) { const accBal = typeof getAccountBalance === 'function' ? getAccountBalance(acc.id) : acc.initialBalance; return `<b>${acc.name}</b> (${acc.accountType}, ${acc.currency || 'MYR'})\nCurrent: ${fmtIn(accBal, acc.currency || 'MYR')}`; }
    const assets = ACCOUNTS.filter(a => a.type === 'asset');
    return `<b>Accounts:</b>\n${assets.map(a => { const b = typeof getAccountBalance === 'function' ? getAccountBalance(a.id) : a.initialBalance; return '• ' + a.name + ': ' + fmtIn(b, a.currency || 'MYR'); }).join('\n')}\n\n<b>Net Worth: ${fmt(nw)}</b>`;
  }

  if (has('show','list','find','cari','recent','latest','last','tunjuk') && has('transaction','transaksi','txn','record')) {
    const range = parseRange(l); const cat = findCat(l); let txns = filterTxn(range);
    if (cat) txns = txns.filter(tx => tx.c.toLowerCase() === cat.name.toLowerCase() || (tx.s && tx.s.toLowerCase() === cat.name.toLowerCase()));
    const numMatch = l.match(/(\d+)/); const limit = numMatch ? Math.min(parseInt(numMatch[1]), 10) : 5;
    txns = txns.sort((a, b) => new Date(b.d) - new Date(a.d)).slice(0, limit);
    if (!txns.length) return 'No transactions found.';
    return `<b>${txns.length} recent transactions:</b>\n\n${txns.map(tx => '• ' + new Date(tx.d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) + ' | ' + tx.t + ' | ' + tx.c + ' | <b>' + fmt(tx.a) + '</b>' + (tx.dt ? ' (' + tx.dt + ')' : '')).join('\n')}`;
  }

  if (has('compare','vs','versus','banding') || (has('this month') && has('last month')) || has('month over month')) {
    const now = new Date(), cm = now.getMonth(), cy = now.getFullYear(), pm = cm === 0 ? 11 : cm - 1, py = cm === 0 ? cy - 1 : cy;
    const thisM = TXN.filter(tx => { const d = new Date(tx.d); return d.getMonth() === cm && d.getFullYear() === cy; });
    const lastM = TXN.filter(tx => { const d = new Date(tx.d); return d.getMonth() === pm && d.getFullYear() === py; });
    const tE = thisM.filter(tx => tx.t === 'Expense').reduce((s, tx) => s + tx.a, 0);
    const lE = lastM.filter(tx => tx.t === 'Expense').reduce((s, tx) => s + tx.a, 0);
    const tI = thisM.filter(tx => tx.t === 'Income').reduce((s, tx) => s + tx.a, 0);
    const lI = lastM.filter(tx => tx.t === 'Income').reduce((s, tx) => s + tx.a, 0);
    return `<b>This Month vs Last Month:</b>\n\n• Income: ${fmt(tI)} vs ${fmt(lI)} (${tI-lI>=0?'+':''}${fmt(tI-lI)})\n• Expenses: ${fmt(tE)} vs ${fmt(lE)} (${tE-lE>=0?'+':''}${fmt(tE-lE)})\n\n${tE > lE ? '⚠️ Spending up by ' + fmt(tE-lE) : tE < lE ? '✅ Cut ' + fmt(lE-tE) + ' in expenses' : 'Spending flat'}`;
  }

  if (has('biggest','largest','highest','most expensive','top expense','top spend')) {
    const range = parseRange(l); const txns = filterTxn(range).filter(tx => tx.t === 'Expense').sort((a,b) => b.a - a.a); const period = range ? range.label : year;
    if (!txns.length) return `No expenses in ${period}.`;
    return `<b>Biggest expenses (${period}):</b>\n\n${txns.slice(0,5).map((tx,i) => (i+1) + '. <b>' + fmt(tx.a) + '</b> — ' + tx.c + (tx.dt ? ' (' + tx.dt + ')' : '') + ' on ' + new Date(tx.d).toLocaleDateString('en-GB',{day:'numeric',month:'short'})).join('\n')}`;
  }

  if (has('average','purata','avg') && has('spend','expense','daily','monthly')) {
    const range = parseRange(l); const txns = filterTxn(range).filter(tx => tx.t === 'Expense'); const total = txns.reduce((s, tx) => s + tx.a, 0); const period = range ? range.label : year;
    return `<b>Spending averages (${period}):</b>\n• Daily: ${fmt(total / Math.max(active * 30, 1))}\n• Monthly: ${fmt(total / Math.max(active, 1))}\n• Total: ${fmt(total)}`;
  }

  // === SUMMARY ===
  if (has('summary','overview','how am i','ringkasan','how do i look','my finance','status','how am i doing')) {
    const health = savRate >= 25 ? '🟢 Strong' : savRate >= 15 ? '🟡 Decent' : '🔴 Needs work';
    return `<b>${year} Snapshot</b> (${active} months)\n\n• Income: ${fmt(ti)} (${fmt(avgI)}/mo)\n• Expenses: ${fmt(te)} (${fmt(avgE)}/mo)\n• Savings: ${fmt(ts)} (${savRate.toFixed(1)}%)\n• Top drain: ${topCat.n}\n• Net Worth: ${fmt(nw)}\n• Health: ${health}\n\n${savRate >= 20 ? 'Strong discipline. Is your savings invested or just parked?' : 'Priority: push savings rate toward 20%.'}` + disclaimer('invest');
  }

  // === GOALS ===
  if (has('goal','matlamat','target','progress') && typeof GOALS !== 'undefined' && GOALS.length) {
    return `<b>Goals:</b>\n\n${GOALS.slice(0,6).map(g => { const p = g.target > 0 ? Math.min(100, g.current/g.target*100).toFixed(0) : 0; return '• <b>' + g.name + '</b>: ' + fmt(g.current) + '/' + fmt(g.target) + ' (' + p + '%)'; }).join('\n')}`;
  }

  // === FORECAST ===
  if (has('forecast','predict','projection','end of year')) {
    const net = avgI - avgE; const monthsLeft = 12 - new Date().getMonth();
    return `<b>${year} Forecast:</b>\n• Monthly surplus: ${fmt(net)}\n• Projected year-end: ${fmt(bal + net * monthsLeft)}\n\n${net > 0 ? 'Positive trajectory.' : '⚠️ Spending exceeds income.'}` + disclaimer('invest');
  }

  // === INVESTMENT TOPICS ===
  if (has('asb','asnb','amanah saham')) return `<b>ASB:</b> 4-6% dividends, capital guaranteed, max RM200K, no fees. Max this out first. ASB financing works if loan rate < dividend rate.\n\n<b>Risk:</b> Dividends not fixed. Loan carries interest rate risk.` + disclaimer('asb');
  if (has('epf','kwsp','caruman')) return `<b>EPF:</b> 5-6.5% dividends (beats FD). Voluntary contributions get RM4K tax relief. Don't withdraw early: lost compounding is massive.` + disclaimer('epf');
  if (has('etf','index fund','passive','vanguard','s&p','dca')) return `<b>ETFs:</b> 90% of fund managers lose to the index. DCA monthly into S&P 500 or MSCI World. Access: Moomoo, Tiger, IBKR. Local: TradePlus S&P500 (Bursa). Keep fees <0.2%.` + disclaimer('etf');
  if (has('stock','saham','bursa','klse','trading')) return `<b>Stocks:</b> You vs PhD quants with AI. If you pick: consistent earnings, low debt, max 5% per stock. For most people: index funds win.` + disclaimer('stock');
  if (has('reit','property trust')) return `<b>REITs:</b> 5-8% yield (Pavilion, IGB, Sunway). Interest-rate sensitive. Buy during rate fears. Hold for income.` + disclaimer('reit');
  if (has('crypto','bitcoin','btc','ethereum')) return `<b>Crypto:</b> Speculation for 95%. If you play: max 5% portfolio, DCA only, licensed exchanges (Luno, Tokenize). Never leverage. Think in 4-year cycles.` + disclaimer('crypto');
  if (has('gold','emas')) return `<b>Gold:</b> Insurance, not investment. 5-10% max. Buy via Maybank Gold Account or gold ETFs. Shines during crises only.` + disclaimer('invest');
  if (has('bond','sukuk','fixed income')) return `<b>Bonds:</b> Stability anchor. MGS 3.5-4.5%. Allocation ≈ your age %. Keeps you rational during crashes.` + disclaimer('bond');
  if (has('unit trust','mutual fund','dana')) return `<b>Unit Trusts:</b> 5% sales charge + 1.5% annual fee = 30-40% of returns eaten over 30 years. Switch to low-cost ETFs. Exception: ASNB (no fees, guaranteed).` + disclaimer('unit trust');
  if (has('dividend','dividen','passive income')) { const needed = avgE * 12 / 0.05; return `<b>Dividends:</b> Need ${fmt(needed)} at 5% yield to cover ${fmt(avgE)}/mo. Sources: ASB 5%, REITs 5-8%, blue chips 4-6%. Reinvested dividends double every ~14 years.` + disclaimer('invest'); }
  if (has('debt','loan','hutang','pinjam','ptptn','car loan','personal loan','mortgage')) { const loanExp = EC.find(c => c.n === 'Loan' || c.n === 'Loans'); return `<b>Debt Framework:</b>\n${loanExp ? 'Your loans: ' + fmt(loanExp.a) + '/year\n\n' : ''}<b>Kill order:</b> Credit card (18%) → Personal loan (8%+) → Car loan → PTPTN → Mortgage (keep it)` + disclaimer('loan'); }
  if (has('tax','cukai','lhdn','relief','pelepasan')) return `<b>Tax:</b> Key reliefs: Lifestyle RM2.5K, Medical parents RM8K, SSPN RM8K, PRS RM3K. At 24% bracket, every RM1K relief = RM240 saved. Check MY-SG double-tax agreement.` + disclaimer('tax');
  if (has('retire','pencen','fire','financial freedom')) { const f = avgE * 12 * 25; return `<b>FIRE number:</b> ${fmt(f)} (25x expenses). At ${fmt(nw)} you're ${nw > 0 ? (nw/f*100).toFixed(0) + '%' : '0%'} there.` + disclaimer('fire retire'); }
  if (has('insurance','insurans','takaful','medical card')) return `<b>Insurance priority:</b> 1) Medical RM1M+ 2) Life 10x income 3) Critical illness 4) PA. Buy TERM not ILP.` + disclaimer('insurance');
  if (has('property','house','rumah','condo','down payment')) return `<b>Property:</b> Max installment 33% income = ${fmt(avgI*0.33)}/mo. Supports ~${fmt(avgI*0.33*200)} property. Need ~13% upfront.` + disclaimer('property mortgage');
  if (has('emergency','kecemasan','rainy day')) { const t = avgE * 6; return `<b>Emergency fund:</b> Target ${fmt(t)} (6mo expenses). Current: ${fmt(bal)} (${Math.floor(bal/avgE)} months). Keep in high-yield savings, not stocks.` + disclaimer('emergency'); }
  if (has('inflation','inflasi','purchasing power')) return `<b>Inflation:</b> At 3.5%, money halves in 20 years. Beat it with equities (8-10%), ASB (5%), property (4-6%). Cash at 0.1% = losing money.` + disclaimer('invest inflation');
  if (has('side hustle','side income','earn more','freelance')) return `<b>Income growth:</b> No ceiling to earning. Best ROI: freelance skills, consult, digital products. Key: invest side income, don't inflate lifestyle.` + disclaimer('invest');
  if (has('risk','risiko','volatile','crash','recession')) return `<b>Risk ≠ Volatility.</b> 30% drop + 10yr horizon = buying opportunity. Real risks: inflation on cash, concentration, panic selling. Build portfolio you can hold through 50% crash.` + disclaimer('invest risk');
  if (has('credit card','kad kredit','cashback')) return `<b>Credit cards:</b> Pay FULL balance monthly. Always. 15-18% interest destroys rewards. One cashback card for daily, decline limit increases.` + disclaimer('credit');
  if (has('budget','bajet','overspend')) { const budTotal = typeof getYearlyBudgetTotal === 'function' ? getYearlyBudgetTotal(year) : 0; return budTotal ? `Budget ${(te/budTotal*100).toFixed(0)}% used. ${EC.filter(c => c.b > 0 && c.a > c.b).length ? 'Over: ' + EC.filter(c => c.b > 0 && c.a > c.b).map(c => c.n).join(', ') : 'All categories within limits.'}` : 'No budgets set up. Configure in Goals tab.'; }
  if (has('what should','advice','nasihat','suggest','recommend','improve','apa patut')) {
    const tips = [];
    if (savRate < 20) tips.push(`Push savings from ${savRate.toFixed(0)}% to 20%`);
    if (bal < avgE * 6) tips.push(`Build emergency fund to ${fmt(avgE * 6)}`);
    if (expRate > 70) tips.push(`Cut expense ratio from ${expRate.toFixed(0)}% to <60%`);
    if (nw > avgE * 6) tips.push('Start/increase investments');
    if (!tips.length) tips.push('Stay consistent, keep investing, avoid lifestyle inflation');
    return `<b>Priorities:</b>\n${tips.map((t,i) => (i+1) + '. ' + t).join('\n')}` + disclaimer('invest');
  }

  // === CATEGORY FALLBACK ===
  const detCat = findCat(l);
  if (detCat) { const range = parseRange(l); const txns = filterTxn(range).filter(tx => tx.c.toLowerCase() === detCat.name.toLowerCase()); const period = range ? range.label : year; const total = txns.reduce((s, tx) => s + tx.a, 0); if (txns.length) return `<b>${detCat.name}</b> (${period}): ${fmt(total)} across ${txns.length} transactions.`; }

  // === TIME PERIOD FALLBACK ===
  const detRange = parseRange(l);
  if (detRange) { const txns = filterTxn(detRange); const inc = txns.filter(tx => tx.t === 'Income').reduce((s, tx) => s + tx.a, 0); const exp = txns.filter(tx => tx.t === 'Expense').reduce((s, tx) => s + tx.a, 0); if (txns.length) return `<b>${detRange.label}:</b> Income ${fmt(inc)}, Expenses ${fmt(exp)}, Net ${fmt(inc - exp)}. (${txns.length} txns)`; }

  // === ABSOLUTE FALLBACK ===
  return `I'm not sure what you're asking. Try:\n• "How much did I spend on [category]?"\n• "Show last 5 transactions"\n• "What's my savings rate?"\n• "Compare this month vs last"\n\nOr ask about investing, tax, insurance, retirement.\n\nYour ${year}: Income ${fmt(ti)}, Expenses ${fmt(te)}, Savings ${savRate.toFixed(0)}%.`;
}
