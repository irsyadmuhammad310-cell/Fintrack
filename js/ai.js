// === FLOATING AI ASSISTANT (V2.0.0 — Gemini Integration) ===
let aiRateLimitUntil = parseInt(safeGet('ft_ai_cooldown') || '0');
(function() {
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
        <div class="aim ast"><div class="aiav">🤖</div><div class="aib">Hey! I'm your personal finance advisor powered by AI. Ask me anything about your finances, investing, budgeting, retirement, or any money topic. I can analyze your FinTrack data and give personalized advice.</div></div>
      </div>
      <div class="ai-panel-disclaimer">AI-generated guidance. Verify important decisions with a professional.</div>
      <div class="ai-panel-inp">
        <input id="aiInp" placeholder="Ask me anything about finance..." onkeydown="if(event.key==='Enter')sendAI()">
        <button class="aisnd" onclick="sendAI()"><i data-lucide="send" width="16" height="16"></i></button>
      </div>
    </div>`;
  document.body.appendChild(fab);
  setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
  setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 500);
})();

let aiOpen = false;
let aiChatHistory = [];

function toggleAIChat() {
  if (!aiOpen && typeof ftAIAllowed === 'function' && !ftAIAllowed()) { toast('🔒 Unlock FinTrack first'); return; }
  aiOpen = !aiOpen;
  const panel = document.getElementById('aiPanel');
  const btn = document.querySelector('.ai-fab-btn');
  panel.classList.toggle('open', aiOpen);
  btn.classList.toggle('active', aiOpen);
  if (aiOpen) { setTimeout(() => { document.getElementById('aiInp').focus(); lucide.createIcons(); }, 200); }
}

// === GEMINI API CONFIG ===
function getAIKey() { return safeGet('ft_gemini_key') || ''; }
function setAIKey(key) { safeSave('ft_gemini_key', key.trim()); }
function getGroqKey() { return safeGet('ft_groq_key') || ''; }
function setGroqKey(key) { safeSave('ft_groq_key', key.trim()); }

function buildFinancialContext() {
  try {
    const year = getSelectedYear();
    const MD = computeMonthlyData(year);
    const EC = computeExpenseCategories(year);
    const ti = MD.reduce((s, m) => s + m.i, 0);
    const te = MD.reduce((s, m) => s + m.e, 0);
    const ts = MD.reduce((s, m) => s + m.s, 0);
    const active = MD.filter(m => m.i > 0).length;
    const avgI = ti / Math.max(active, 1);
    const avgE = te / Math.max(MD.filter(m => m.e > 0).length, 1);
    const savRate = ti > 0 ? (ts / ti * 100).toFixed(1) : '0';
    const nw = typeof getNetWorth === 'function' ? getNetWorth() : 0;
    const bal = typeof getCarryForwardBalance === 'function' ? getCarryForwardBalance(year, 'total') : ti - te - ts;
    const topCats = EC.slice(0, 5).map(c => c.n + ': ' + fmt(c.a)).join(', ');
    const accounts = ACCOUNTS.map(a => {
      const b = typeof getAccountBalance === 'function' ? getAccountBalance(a.id) : a.initialBalance;
      return a.name + ' (' + a.accountType + ', ' + (a.currency || 'MYR') + '): ' + fmtIn(b, a.currency || 'MYR');
    }).join('; ');
    // V2.0.5: goal fields are n/c/t (old code read name/current/target and always sent "undefined")
    const goals = typeof GOALS !== 'undefined' && GOALS.length ? GOALS.map(g => g.n + ': ' + fmt(g.c) + '/' + fmt(g.t) + ' (' + (g.t > 0 ? (g.c / g.t * 100).toFixed(0) : 0) + '%)').join('; ') : 'None set';
    const tsa = MD.reduce((s, m) => s + (m.sa || 0), 0);
    // slice() first: sorting TXN in place used to reorder the real transaction list
    const recentTxns = TXN.slice().sort((a, b) => new Date(b.d) - new Date(a.d)).slice(0, 10).map(tx => tx.d + ' | ' + tx.t + ' | ' + tx.c + (tx.s ? '/' + tx.s : '') + ' | ' + fmt(tx.a) + (tx.dt ? ' (' + tx.dt + ')' : '')).join('\n');

    return `USER FINANCIAL DATA (${year}, ${active} months recorded):
- Total Income: ${fmt(ti)} (avg ${fmt(avgI)}/mo)
- Total Expenses: ${fmt(te)} (avg ${fmt(te / Math.max(active, 1))}/mo)
- Total Savings (income - expense): ${fmt(ts)} (savings rate: ${savRate}%)
- Set aside into Savings/Investment accounts: ${fmt(tsa)} (transfers between own accounts are NOT spending)
- Balance: ${fmt(bal)}
- Net Worth: ${fmt(nw)}
- Top expense categories: ${topCats}
- Accounts: ${accounts}
- Goals: ${goals}
- Display currency: ${displayCurrency}
- Recent transactions:\n${recentTxns}`;
  } catch (e) {
    return 'Financial data temporarily unavailable.';
  }
}

const AI_SYSTEM_PROMPT = `You are FinTrack AI Advisor, a friendly and knowledgeable personal finance coach built into the FinTrack app.

PERSONALITY:
- Professional yet approachable, like a smart friend who happens to be a financial expert
- Patient, encouraging, honest, and clear
- Explain complex topics in plain language
- Give concise answers first, offer more detail if asked
- Use bullet points and bold text (<b>text</b>) for structure in HTML format
- Be opinionated when it helps: recommend actions, not just list options

CAPABILITIES:
- Analyze the user's actual financial data (provided below)
- Provide personalized advice based on their numbers
- Explain any financial concept (investing, tax, insurance, retirement, debt, etc.)
- Discuss global financial topics (markets, economy, interest rates, etc.)
- Identify spending trends, anomalies, and opportunities
- Calculate projections and scenarios

RULES:
- ALWAYS use the user's real data when relevant
- If you reference their data, cite specific numbers
- For financial/investment/tax topics, end with a brief disclaimer
- Never invent transaction data or account balances
- If you don't know something current (live market prices, today's news), say so honestly
- Distinguish between facts, historical trends, and forecasts
- Format responses in HTML (use <b>, <br>, bullet points with •)
- Keep responses focused and scannable, not walls of text
- Currency context: user works in Singapore, finances span MYR/SGD

DISCLAIMER (append ONLY for investment/tax/legal/insurance topics):
<br><br><span style="font-size:9px;color:var(--text-tertiary);border-top:1px solid var(--border-light);display:block;padding-top:6px;margin-top:8px"><b>Disclaimer:</b> AI-generated guidance. For important financial decisions, consult a qualified professional.</span>`;

async function callGemini(userMsg) {
  const key = getAIKey();
  if (!key) return null;

  const context = buildFinancialContext();
  
  // Build conversation with history (last 6 messages for context)
  const messages = [];
  const recentHistory = aiChatHistory.slice(-6);
  recentHistory.forEach(h => {
    messages.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
  });
  messages.push({ role: 'user', parts: [{ text: userMsg }] });

  const body = {
    systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT + '\n\n' + context }] },
    contents: messages,
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 1200,
      topP: 0.9
    }
  };

  // Try models in order of preference
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  
  for (const model of models) {
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err?.error?.message || '';
        const errStatus = err?.error?.status || '';
        console.warn('Gemini API error (' + model + '):', res.status, err);
        if (res.status === 400 && errMsg.includes('not found')) continue; // try next model
        if (res.status === 404) continue; // model not available, try next
        if (res.status === 400 || res.status === 403) return { code: '__INVALID_KEY__', detail: errMsg };
        if (res.status === 429) {
          // Try Groq fallback before returning rate limit
          const groqResult = await callGroq(userMsg);
          if (groqResult) return groqResult;
          return { code: '__RATE_LIMIT__', detail: errMsg, status: errStatus };
        }
        continue; // try next model
      }

      const data = await res.json();
      
      // Handle safety blocks (empty candidates)
      if (!data?.candidates?.length) {
        const blockReason = data?.promptFeedback?.blockReason;
        if (blockReason) return '__BLOCKED__';
        continue;
      }
      
      const text = data.candidates[0]?.content?.parts?.[0]?.text;
      if (text) return text;
      continue;
    } catch (e) {
      console.warn('Gemini fetch error (' + model + '):', e);
      continue;
    }
  }
  
  // All Gemini models failed: try Groq as last resort
  const groqFallback = await callGroq(userMsg);
  if (groqFallback) return groqFallback;

  return null;
}

// === GROQ FALLBACK API ===
async function callGroq(userMsg) {
  const key = getGroqKey();
  if (!key) return null;

  const context = buildFinancialContext();
  
  const recentHistory = aiChatHistory.slice(-6);
  const messages = [
    { role: 'system', content: AI_SYSTEM_PROMPT + '\n\n' + context }
  ];
  recentHistory.forEach(h => {
    messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text });
  });
  messages.push({ role: 'user', content: userMsg });

  const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  for (const model of groqModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.75,
          max_tokens: 1200
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('Groq API error (' + model + '):', res.status, err);
        if (res.status === 429) continue; // try next model
        if (res.status === 401) return null; // bad key, don't retry
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
      continue;
    } catch (e) {
      console.warn('Groq fetch error (' + model + '):', e);
      continue;
    }
  }
  return null;
}

// V2.0.5: AI replies are HTML from an outside service. Keep only simple formatting tags, drop everything else
// (scripts, images, links, onclick=...). Text is kept, so nothing the AI said is lost.
var FT_AI_TAGS = ['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'UL', 'OL', 'LI', 'SPAN', 'DIV', 'CODE', 'SMALL', 'H3', 'H4'];
function ftSafeAIHtml(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html == null ? '' : html);
  (function clean(node) {
    Array.from(node.childNodes).forEach(function(ch) {
      if (ch.nodeType === 3) return; // plain text: fine
      if (ch.nodeType !== 1 || FT_AI_TAGS.indexOf(ch.tagName) === -1) {
        // Unknown tag: keep its text only (script/style/iframe are dropped completely)
        if (ch.nodeType === 1 && ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH'].indexOf(ch.tagName) === -1) node.replaceChild(document.createTextNode(ch.textContent), ch);
        else node.removeChild(ch);
        return;
      }
      Array.from(ch.attributes).forEach(function(at) {
        const keep = at.name === 'style' && ch.tagName === 'SPAN' && !/url\s*\(|expression|javascript/i.test(at.value);
        if (!keep) ch.removeAttribute(at.name);
      });
      clean(ch);
    });
  })(tpl.content);
  const out = document.createElement('div');
  out.appendChild(tpl.content);
  return out.innerHTML;
}

// V2.0.5: AI reads your money data, so it is closed while the app is locked
function ftAIAllowed() {
  if (typeof FT_APP_LOCK === 'undefined' || !FT_APP_LOCK) return true;
  return typeof ftIsUnlocked !== 'undefined' && ftIsUnlocked === true && !(typeof _sessionLocked !== 'undefined' && _sessionLocked);
}

async function sendAI() {
  if (!ftAIAllowed()) { if (aiOpen) toggleAIChat(); toast('🔒 Unlock FinTrack first'); return; }
  const inp = document.getElementById('aiInp'), msg = inp.value.trim();
  if (!msg) return;
  const box = document.getElementById('aiMsgs');
  box.innerHTML += `<div class="aim usr"><div class="aiav">${ftEsc(getUserInitials())}</div><div class="aib">${ftEsc(msg)}</div></div>`;
  inp.value = '';
  box.scrollTop = box.scrollHeight;

  // Show typing indicator
  const typingId = 'typing_' + Date.now();
  box.innerHTML += `<div class="aim ast" id="${typingId}"><div class="aiav">🤖</div><div class="aib ai-typing"><span></span><span></span><span></span></div></div>`;
  box.scrollTop = box.scrollHeight;

  let response = '';

  // Check if API key is configured
  if (!getAIKey()) {
    // No key: prompt to configure
    setTimeout(() => {
      const el = document.getElementById(typingId);
      if (el) el.remove();
      response = `<b>Gemini AI not configured yet.</b><br><br>To enable smart AI responses:<br><br>1. Go to <b>Settings → General</b><br>2. Find the <b>AI Assistant</b> section<br>3. Paste your Gemini API key<br><br>Get a free key at <b>aistudio.google.com</b> → Get API Key → Create. It's free, no credit card needed.<br><br>Once configured, I can answer ANY financial question intelligently.`;
      box.innerHTML += `<div class="aim ast"><div class="aiav">🤖</div><div class="aib">${response}</div></div>`;
      box.scrollTop = box.scrollHeight;
    }, 500);
    return;
  }

  // Check cooldown timer
  if (Date.now() < aiRateLimitUntil) {
    const minsLeft = Math.ceil((aiRateLimitUntil - Date.now()) / 60000);
    const el = document.getElementById(typingId);
    if (el) el.remove();
    box.innerHTML += `<div class="aim ast"><div class="aiav">🤖</div><div class="aib"><b>⏳ Rate limit cooldown active.</b><br><br>Gemini API quota was exceeded. Please wait <b>${minsLeft} minute${minsLeft > 1 ? 's' : ''}</b> before trying again.<br><br>This resets automatically. If it persists for hours, generate a new API key from a fresh project at <b>aistudio.google.com</b>.</div></div>`;
    box.scrollTop = box.scrollHeight;
    return;
  }

  // Call Gemini API
  try {
    response = await callGemini(msg);

    const el = document.getElementById(typingId);
    if (el) el.remove();

    if (response && response.code === '__INVALID_KEY__') {
      response = `<b>❌ API key error.</b><br><br><b>Reason:</b> ${ftEsc(response.detail || 'Key invalid or expired')}<br><br>Go to <b>Settings → General → AI Assistant</b> to update it. Get a new key at <b>aistudio.google.com</b>.`;
    } else if (response && response.code === '__RATE_LIMIT__') {
      // Set cooldown: 5 minutes for RPM, 60 minutes for RPD
      response.detail = String(response.detail || '');
      const isDaily = response.detail.includes('per day') || response.detail.includes('RATE_LIMIT_EXCEEDED') || response.detail.includes('quota');
      const cooldownMs = isDaily ? 60 * 60 * 1000 : 5 * 60 * 1000;
      aiRateLimitUntil = Date.now() + cooldownMs;
      safeSave('ft_ai_cooldown', String(aiRateLimitUntil));
      const waitMins = Math.ceil(cooldownMs / 60000);
      response = `<b>⚠️ Rate limit exceeded.</b><br><br><b>Error:</b> ${ftEsc(response.detail || 'Too many requests')}<br><br><b>Cooldown:</b> ${waitMins} minutes (auto-resumes at ${new Date(aiRateLimitUntil).toLocaleTimeString('en-MY', {hour:'2-digit', minute:'2-digit'})})<br><br><b>Fix options:</b><br>• Wait for cooldown to pass<br>• Generate a new key from a different Google Cloud project<br>• Enable billing at <b>console.cloud.google.com</b> for higher limits<br><br><i>Free tier: 15 RPM / 1,500 RPD. Resets at 3 PM MYT (midnight Pacific).</i>`;
    } else if (response === '__BLOCKED__') {
      response = `<b>Content blocked.</b> The AI couldn't respond to that query due to safety filters. Try rephrasing your question.`;
    } else if (!response) {
      response = `Sorry, I couldn't reach the AI service right now. Check your internet connection and try again. If this persists, your API key might need refreshing in Settings → General.`;
    } else {
      // Store in history for context
      aiChatHistory.push({ role: 'user', text: msg });
      aiChatHistory.push({ role: 'assistant', text: response });
      // Keep history manageable
      if (aiChatHistory.length > 20) aiChatHistory = aiChatHistory.slice(-12);
    }

    box.innerHTML += `<div class="aim ast"><div class="aiav">🤖</div><div class="aib">${ftSafeAIHtml(response)}</div></div>`;
    box.scrollTop = box.scrollHeight;
  } catch (err) {
    const el = document.getElementById(typingId);
    if (el) el.remove();
    console.error('AI send error:', err);
    box.innerHTML += `<div class="aim ast"><div class="aiav">🤖</div><div class="aib">Something went wrong. Please try again.</div></div>`;
    box.scrollTop = box.scrollHeight;
  }
}

// Old keyword-based AI engine removed in v15.4
// All responses now powered by Gemini API
// Fallback: if no API key, user is prompted to configure in Settings → General

// Helper functions kept for other modules that may reference them
function generateAIResponse(msg) { return 'Please configure your Gemini API key in Settings → General to enable AI responses.'; }

// V2.0.5 (MONEY-13): the old keyword engine (a second generateAIResponse with wrong goal fields) was deleted.
