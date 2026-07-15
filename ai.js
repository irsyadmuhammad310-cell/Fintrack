// === FLOATING AI ASSISTANT (v11.2) ===
(function() {
  // Inject floating AI HTML
  const fab = document.createElement('div');
  fab.id = 'aiFab';
  fab.innerHTML = `
    <button class="ai-fab-btn" onclick="toggleAIChat()"><i data-lucide="sparkles" width="22" height="22"></i></button>
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
  setTimeout(() => lucide.createIcons(), 100);
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

function generateAIResponse(msg) {
  const l = msg.toLowerCase();
  const year = getSelectedYear();
  const MD = computeMonthlyData(year);
  const EC = computeExpenseCategories(year);
  const ti = MD.reduce((s, m) => s + m.i, 0), te = MD.reduce((s, m) => s + m.e, 0), ts = MD.reduce((s, m) => s + m.s, 0);
  const topCat = EC.length ? EC[0] : { n: 'None', a: 0 };
  const savRate = ti > 0 ? (ts / ti * 100).toFixed(1) : '0';
  const avgI = ti / Math.max(MD.filter(m => m.i > 0).length, 1);
  const avgE = te / Math.max(MD.filter(m => m.e > 0).length, 1);
  const bal = typeof getCarryForwardBalance === 'function' ? getCarryForwardBalance(year, 'total') : ti - te - ts;
  const nw = typeof getNetWorth === 'function' ? getNetWorth() : 0;
  const activeMonths = MD.filter(m => m.i > 0).length;

  // Helper: pick random from array for variety
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Detect intent with weighted keyword matching
  const has = (...words) => words.some(w => l.includes(w));
  const hasAll = (...words) => words.every(w => l.includes(w));

  // === PERSONAL DATA QUERIES (uses their actual numbers) ===
  if (has('summary','overview','how am i','ringkasan','keseluruhan','how do i look','my finance','my money','status')) {
    const health = parseFloat(savRate) >= 20 ? 'solid' : parseFloat(savRate) >= 10 ? 'okay but could be better' : 'needs work';
    const topPct = te > 0 ? (topCat.a / te * 100).toFixed(0) : 0;
    return `Real talk: your ${year} health is ${health}. You've pulled in ${fmt(ti)} across ${activeMonths} months, spent ${fmt(te)}, and saved ${fmt(ts)} (${savRate}% rate). ${topCat.n} is eating ${topPct}% of your expenses. ${parseFloat(savRate) < 20 ? 'Honestly, you want that savings rate above 20%. Every percent below that is future-you getting shortchanged.' : 'That savings rate is respectable. Now the question is: is that money working for you, or just sitting there?'}`;
  }

  if (has('budget','bajet','overspend','over budget','underspend')) {
    const budTotal = typeof getYearlyBudgetTotal === 'function' ? getYearlyBudgetTotal(year) : 52740;
    const budUsed = budTotal > 0 ? (te / budTotal * 100).toFixed(0) : 0;
    const overCats = EC.filter(c => c.b > 0 && c.a > c.b);
    const underBudget = parseInt(budUsed) < 80;
    if (overCats.length) {
      return `You're at ${budUsed}% of budget. Problem areas: ${overCats.map(c => c.n + ' (over by ' + fmt(c.a - c.b) + ')').join(', ')}. Here's what I'd do: don't cut everything at once. Pick the ONE category that hurts least to reduce, and bring it under control this month. Small wins build discipline. The rest will follow.`;
    }
    return `${budUsed}% budget utilized. ${underBudget ? "You're running lean, which is great, but make sure you're not depriving yourself unnecessarily. Sustainable budgets have some breathing room for joy." : "You're close to the line. The last 20% of any budget is where discipline gets tested. Track daily for the rest of the month."}`;
  }

  if (has('forecast','predict','projection','unjuran','future','end of year','year end')) {
    const net = avgI - avgE;
    const monthsLeft = 12 - new Date().getMonth();
    const projected = ts + (net * monthsLeft);
    return `Based on your ${activeMonths}-month trend: you net about ${fmt(net)}/mo after expenses (before savings allocation). If this holds, you'll end ${year} with roughly ${fmt(projected)} in accumulated surplus. ${net > 0 ? `That's ${fmt(net * 12)} annually. The question is: where does that money go? If it's just sitting in a savings account at 0.1%, inflation is eating it alive.` : "You're spending more than you earn. This isn't sustainable. Find the leak and plug it this month."}`;
  }

  if (has('balance','baki','carry forward','how much do i have','my balance','total money')) {
    return `Your carry-forward balance is ${fmt(bal)}. That's Opening Balance + all income minus all expenses and savings allocations up to now. ${bal > avgE * 6 ? "You've got a healthy buffer there. Make sure the excess is invested, not idle." : bal > avgE * 3 ? "Decent cushion. You could handle a few months of disruption." : "That's thin. Priority one: build this up to at least " + fmt(avgE * 6) + " (6 months of expenses)."}`;
  }

  if (has('net worth','networth','total asset','berapa semua')) {
    return `Your net worth sits at ${fmt(nw)}. That's assets minus liabilities. ${nw > 0 ? "Positive is good, but the real question is: is it growing month over month? Track this number quarterly. If it's flat, your money is working for someone else, not you." : "Negative net worth means you owe more than you own. Not uncommon early in life (loans, mortgages), but the trajectory should be upward. Every month this number should move in the right direction."}`;
  }

  if (has('spend','spending','where','leak','belanja','habis','expense pattern','category')) {
    const top3 = EC.slice(0, 3);
    const top3str = top3.map((c, i) => `${i + 1}. ${c.n}: ${fmt(c.a)} (${te > 0 ? (c.a / te * 100).toFixed(0) : 0}%)`).join(', ');
    return `Your top 3 drains: ${top3str}. Total: ${fmt(te)}. My take: ${top3[0] && top3[0].n === 'Loan' ? "Loans dominating isn't necessarily bad if they're appreciating assets (property). But if it's consumer debt, that's a red flag." : top3[0] && top3[0].n === 'Food' ? "Food being #1 means lifestyle creep. Track every meal for 2 weeks. You'll find the pattern." : "Look at your #1 category and ask: is this buying me freedom or comfort? Comfort spending is fine in moderation, but it shouldn't lead."}`;
  }

  // === INVESTING (deep, opinionated advice) ===
  if (has('asb','asnb','amanah saham')) {
    return `ASB is honestly one of Malaysia's best-kept financial cheat codes. Consistent 4-5% dividends, capital guaranteed by government, and you can leverage (ASB loan) to multiply returns. My take: max out your RM200K limit before looking elsewhere. The math on ASB financing works if the loan rate < dividend rate, which it usually is. Just don't touch the principal. Let compounding do its thing over 20+ years.`;
  }
  if (has('epf','kwsp','employer','caruman')) {
    return `EPF is your retirement backbone. Current dividend rate hovers around 5-6% (way better than most fixed deposits). Few people know this: you can do voluntary contributions above the mandatory amount, and get tax relief up to RM4,000. That's free money. Also, Account 3 (flexible withdrawal) is useful for emergencies but DON'T treat it as a piggy bank. Every ringgit you withdraw today costs you 5-10x in retirement due to lost compounding.`;
  }
  if (has('etf','index fund','passive invest','vanguard','s&p','spy')) {
    return `ETFs are the smartest lazy investment. Here's the honest truth: 90% of professional fund managers can't beat the index over 10 years. So why pay them 1.5% fees? In Malaysia, you can buy US ETFs through brokers like Moomoo, Tiger, or Interactive Brokers. Start with broad market (S&P 500 or MSCI World). If you want local, TradePlus S&P 500 Tracker on Bursa. DCA monthly, never try to time it. Boring works.`;
  }
  if (has('stock','saham','bursa','klse','pick','which stock','trading')) {
    return `Honest opinion: stock picking is a game where you're competing against hedge funds with PhD quants and AI systems. Unless you genuinely enjoy research and can stomach 30-40% drawdowns without panic selling, you're better off in index funds. But if you insist: stick to companies you understand, with consistent earnings growth, low debt, and reasonable PE ratios. In Malaysia, look at dividend aristocrats. And never put more than 5% in any single stock. Diversification isn't optional.`;
  }
  if (has('reit','property trust','real estate invest')) {
    return `REITs are underrated for income investors. You get property exposure without the hassle of being a landlord, plus 90%+ of income must be distributed as dividends. Malaysian REITs yield 5-8% typically (Pavilion REIT, IGB REIT, Sunway REIT). The catch: they're interest-rate sensitive. When rates rise, REIT prices drop. Best time to buy is when everyone's scared of rate hikes. Hold for income, not capital gains.`;
  }
  if (has('dividend','dividen','passive income','income invest')) {
    return `Dividend investing is beautiful for one reason: you get paid to wait. The compounding of reinvested dividends is where real wealth comes from. In Malaysia: ASB (5%), REITs (5-8%), blue chip stocks like Maybank/Tenaga (4-6%). Build a portfolio that throws off ${fmt(avgE)} monthly in dividends and you're financially free. That requires roughly ${fmt(avgE * 12 / 0.05)} invested at 5% yield. Start now, you'll get there faster than you think.`;
  }
  if (has('gold','emas','precious metal')) {
    return `Gold is insurance, not an investment. It doesn't produce income, doesn't compound, and has long stretches of going nowhere. But it's a crisis hedge. I'd keep 5-10% max in gold (physical or gold ETFs). In Malaysia, you can buy through banks (Maybank Gold Account, Public Gold) or gold ETFs on Bursa. Don't overallocate just because prices are high. Gold shines when everything else burns.`;
  }
  if (has('bond','sukuk','fixed income','bon')) {
    return `Bonds/sukuk are your portfolio's stability anchor. They won't make you rich, but they'll keep you sane during stock market crashes. In Malaysia: government bonds (MGS) yield 3.5-4.5%, corporate bonds higher but with credit risk. For most people, bond funds (like Affin Hwang Select Bond) are easier than buying individual bonds. Rule of thumb: your bond allocation should roughly equal your age in percentage. 25 years old = 25% bonds.`;
  }
  if (has('unit trust','mutual fund','dana','fund manager')) {
    return `Hot take: most unit trusts in Malaysia charge 5% sales charge + 1.5% annual management fee. That's highway robbery. A RM10K investment loses RM500 immediately, then RM150/year in fees. Over 30 years, those fees eat 30-40% of your potential returns. Switch to low-cost ETFs or at minimum, no-load funds on platforms like FSMOne or StashAway. Your future self will thank you. The only exception: ASB/ASNB (no fees, guaranteed capital).`;
  }
  if (has('dca','dollar cost','lump sum','timing','when to invest','bila nak invest')) {
    return `Time in market beats timing the market. Period. DCA (fixed amount monthly regardless of price) removes emotion from investing. You automatically buy more when prices are low, less when high. Lump sum technically outperforms DCA 67% of the time (because markets trend up), but DCA wins on peace of mind. My advice: if you have a lump sum, invest 50% now, DCA the rest over 6 months. Best of both worlds.`;
  }
  if (has('risk','risiko','volatile','volatility','crash','drop','market down','recession')) {
    return `Risk isn't the same as volatility. A stock dropping 30% is volatility. Permanently losing money is risk. The difference? Time horizon. If you don't need the money for 10+ years, a 30% drop is a buying opportunity, not a crisis. Real risk is: inflation eroding your cash, concentrated bets on single stocks, leveraged positions you can't sustain, and panic selling at the bottom. Build a portfolio you can hold through a 50% crash without losing sleep. If you can't, you're too aggressive.`;
  }

  // === DEBT & LOANS ===
  if (has('debt','loan','hutang','pinjam','ptptn','car loan','mortgage','personal loan')) {
    const loanExp = EC.find(c => c.n === 'Loan');
    const loanAmt = loanExp ? loanExp.a : 0;
    return `${loanAmt > 0 ? `You're spending ${fmt(loanAmt)} on loans this year (${te > 0 ? (loanAmt / te * 100).toFixed(0) : 0}% of expenses).` : ''} Here's my framework: not all debt is equal. Mortgage at 3-4%? That's leverage on an appreciating asset, keep it. Car loan? Depreciating asset, pay it off faster if you can. Personal loan at 8%+? Kill it immediately. PTPTN? Low interest but the psychological weight matters. If paying it off gives you peace, do it. Math isn't everything.`;
  }

  // === TAX ===
  if (has('tax','cukai','lhdn','relief','pelepasan','pcb','ea form')) {
    return `Tax optimization isn't about cheating, it's about not paying more than you legally owe. Key reliefs most people miss: lifestyle relief (RM2.5K, books/gadgets/gym), medical (RM10K for parents), SSPN (RM8K if you have kids), PRS (RM3K). If you're paying tax in Singapore AND Malaysia, check the double-taxation agreement. You shouldn't be taxed twice on the same income. Also: every ringgit in tax relief at 24% bracket saves you RM0.24. That PRS contribution of RM3K? It effectively costs you RM2,280 after tax savings.`;
  }

  // === RETIREMENT & FIRE ===
  if (has('retire','pencen','pension','fire','early retire','financial freedom','bila boleh berhenti')) {
    const annualExp = avgE * 12;
    const fireNumber = annualExp * 25;
    return `Your FIRE number (25x annual expenses): ${fmt(fireNumber)}. That's what you need invested to live off 4% withdrawals forever. Currently at ${fmt(nw)} net worth, so ${nw > 0 ? `you're ${(nw / fireNumber * 100).toFixed(0)}% there` : "you've got work to do"}. The fastest path: maximize income, minimize lifestyle inflation, invest the gap aggressively. Every RM1,000/month invested at 8% becomes RM1.5M in 30 years or RM590K in 20 years. The earlier you start, the more time does the heavy lifting for you.`;
  }

  // === INSURANCE ===
  if (has('insurance','insurans','takaful','medical card','life insurance','critical illness')) {
    return `Insurance hierarchy (in order of priority): 1) Medical card: non-negotiable. Get RM1M+ coverage minimum. Hospitalization can bankrupt you overnight. 2) Life: only if people depend on your income. Coverage = 10x annual income. 3) Critical illness: lump sum on diagnosis lets you focus on recovery, not bills. 4) Personal accident. My strong opinion: buy TERM insurance, not investment-linked (ILP). ILPs mix insurance with mediocre investment returns. Buy term + invest the premium difference yourself. You'll come out way ahead.`;
  }

  // === PROPERTY ===
  if (has('property','house','rumah','beli rumah','mortgage','condo','apartment','down payment')) {
    return `Property math: your monthly installment should be max 33% of gross income. At ${fmt(avgI)} monthly income, that's ${fmt(avgI * 0.33)} max installment. At current rates (~4%), that supports roughly a ${fmt(avgI * 0.33 * 200)} property. Plus you need 10% down + 4-5% closing costs upfront. My honest take: property is overrated as an investment in Malaysia (yields 2-4% rental), but it's a solid lifestyle asset. Don't stretch beyond your means for "investment." Buy what you'll live in and love, at a price that doesn't kill your cash flow.`;
  }

  // === CRYPTO ===
  if (has('crypto','bitcoin','btc','ethereum','eth','blockchain','nft','web3','defi')) {
    return `I'll be direct: crypto is speculation, not investing, for 95% of people. That said, Bitcoin has a legitimate case as digital gold (capped supply, decentralized). If you're going to play: max 5% of portfolio, only money you can lose entirely, DCA don't lump sum, use licensed Malaysian exchanges (Luno, Tokenize), and hold through cycles (4-year halving cycle). Never leverage trade crypto. Never invest borrowed money. And NFTs? Almost all are worthless. The few exceptions don't justify the casino.`;
  }

  // === EMERGENCY FUND ===
  if (has('emergency','kecemasan','rainy day','backup fund','safety net')) {
    return `Your emergency fund target: ${fmt(avgE * 6)} (6 months expenses). This isn't an investment, it's insurance against life's curveballs (job loss, medical emergency, car breakdown). Keep it in a high-yield savings account (Versa, TNG GO+, or bank savings at 3-4%). NOT in stocks, NOT in fixed deposits with penalties. The whole point is instant access. Once you hit 6 months, stop adding and redirect that money to investments. More than 6 months in cash is just inflation eating your wealth.`;
  }

  // === CREDIT CARDS ===
  if (has('credit card','kad kredit','cashback','miles','reward','annual fee')) {
    return `Credit cards are a tool, not a trap (if used right). Golden rules: pay FULL balance every month, no exceptions. The moment you carry a balance, you're paying 15-18% interest and every cashback/mile you earned is meaningless. Best strategy: one cashback card for daily spending (Maybank 2, CIMB Cash Rebate), one miles card if you travel frequently. Cancel cards with annual fees unless the rewards justify it. And that credit limit increase offer? Decline it. Higher limit = higher temptation.`;
  }

  // === INFLATION ===
  if (has('inflation','inflasi','money value','purchasing power','cost of living')) {
    return `Inflation is a silent tax on your savings. At 3.5% inflation, your money loses half its value in 20 years. That RM100K in your savings account today? Worth RM50K in real terms by 2046. The only defense: invest in assets that grow faster than inflation. Equities (8-10% long term), property (4-6% appreciation), even ASB (5%) beats inflation. Cash is trash for long-term holding. Keep 6 months expenses liquid, invest everything else. Your future self is counting on you to fight this battle today.`;
  }

  // === SIDE INCOME ===
  if (has('side hustle','side income','extra money','earn more','freelance','part time','passive','gig')) {
    return `Earning more > cutting expenses (there's a floor to cutting, no ceiling to earning). Best ROI side hustles: freelance your professional skills (highest hourly rate), teach/consult (leverage expertise), build digital products (scales without your time). In Malaysia specifically: e-commerce (Shopee), content creation, freelance on Fiverr/Upwork. Key principle: invest side income into assets, not lifestyle. The goal is to build income streams that don't require your time. That's real freedom.`;
  }

  // === GENERAL ADVICE / CONVERSATIONAL ===
  if (has('what should i do','apa patut','advice','nasihat','help','tolong','suggestion','cadangan')) {
    const suggestions = [];
    if (parseFloat(savRate) < 20) suggestions.push(`Bump your savings rate from ${savRate}% to 20%. That's the single highest-impact move you can make right now.`);
    if (avgE > avgI * 0.7) suggestions.push(`Your expenses are ${(avgE / avgI * 100).toFixed(0)}% of income. Too high. Target 50-60% max.`);
    if (EC.length && EC[0].a > te * 0.4) suggestions.push(`${EC[0].n} is ${(EC[0].a / te * 100).toFixed(0)}% of spending. That's concentrated. Diversify your expenses or reduce this category.`);
    suggestions.push(`If you don't have 6 months emergency fund (${fmt(avgE * 6)}), that's priority #1 before any investing.`);
    return suggestions.length > 1 ? `Here's what I'd focus on in order: ${suggestions.slice(0, 3).join(' ')}` : suggestions[0] || `You're actually in decent shape. Keep saving 20%+, invest consistently, and don't make emotional money decisions. The boring path wins.`;
  }

  if (has('thank','thanks','terima kasih','tq','appreciate')) {
    return pick(["Anytime. That's what I'm here for. Hit me up whenever you need a finance gut-check.", "No problem. Remember: the best financial decision is usually the one you'll actually stick with.", "You got this. Consistency beats perfection in money management."]);
  }

  if (has('hello','hi','hey','hai','assalamualaikum','good morning','good night')) {
    return pick([`Hey! Your ${year} data is loaded. What's on your mind? I can talk budget, investing, debt strategy, retirement planning, or just give you a reality check on your numbers.`, `What's up! Ask me anything about your finances or general money strategy. I've got opinions and I'm not afraid to share them.`, `Hi! Whether it's "should I invest in X" or "why am I broke", I'm here. No judgment, just straight talk.`]);
  }

  // === SMART FALLBACK (uses their data contextually) ===
  const insights = [];
  if (ti > 0) insights.push(`You're earning ${fmt(avgI)}/mo with a ${savRate}% savings rate.`);
  if (topCat.n !== 'None') insights.push(`Your biggest expense category is ${topCat.n}.`);
  if (parseFloat(savRate) < 15) insights.push(`Honestly, that savings rate needs work. Even 5% more would compound significantly over time.`);
  else if (parseFloat(savRate) >= 25) insights.push(`Strong savings discipline. Make sure those savings are invested, not just parked.`);

  return `${insights.join(' ')} I can help with: investing strategy (stocks, ETFs, ASB, crypto), debt management, tax optimization, retirement planning, insurance, property, or analyze your spending patterns. What's on your mind? Ask me anything specific and I'll give you a straight answer.`;
}