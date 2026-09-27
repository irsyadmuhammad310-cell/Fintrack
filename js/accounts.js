// === INIT LUCIDE ICONS ===
document.addEventListener("DOMContentLoaded", () => lucide.createIcons());

// === i18n SYSTEM (v10.0) ===
const I18N = {
  en: {
    // Nav
    nav_overview: 'Overview', nav_dashboard: 'Dashboard', nav_transactions: 'Transactions',
    nav_wealth: 'Wealth', nav_investments: 'Investments', nav_goals: 'Goals',
    nav_insights: 'Insights', nav_analytics: 'Analytics', nav_reports: 'Reports',
    nav_ai: 'AI Assistant', nav_system: 'System', nav_settings: 'Settings',
    // Header
    hdr_total_year: 'Total Year',
    // Dashboard
    dash_subtitle: 'Financial overview',
    dash_balance: 'Balance', dash_income: 'Income', dash_expense: 'Expense',
    dash_savings: 'Savings', dash_budget: 'Budget', dash_cashflow: 'Cash Flow',
    dash_no_data: 'No financial data available for',
    dash_select_year: 'Select a year with imported data, or import transactions for',
    dash_tip: 'Tip', dash_top_category: 'Top category', dash_spike: 'spike',
    dash_keep_expenses: 'Keep expenses under 6k to grow savings.',
    dash_income_expense_savings: 'Income, Expense, Savings',
    dash_monthly_trend: 'Monthly trend with savings = income minus expense',
    dash_expense_breakdown: 'Expense Breakdown', dash_by_category: 'By category',
    dash_budget_vs_cf: 'Budget vs Cash Flow',
    dash_yearly_budget: 'Yearly budget usage compared with net cash flow',
    dash_budget_used: 'Budget used', dash_cash_flow: 'Cash flow',
    dash_on_track: 'On track?', dash_healthy: 'Healthy', dash_pressure: 'Pressure',
    dash_left: 'left', dash_over: 'Over',
    dash_bank_accounts: 'Bank Accounts', dash_balances_glance: 'Available balances at a glance',
    dash_no_change: 'No change',
    // Transactions
    txn_search: 'Search...', txn_add: 'Add', txn_export: 'Export',
    txn_exported: '📥 Exported', txn_count: 'Count', txn_net: 'Net',
    txn_date: 'Date', txn_type: 'Type', txn_category: 'Category',
    txn_sub: 'Sub', txn_details: 'Details', txn_amount: 'Amount', txn_actions: 'Actions',
    txn_no_found: 'No transactions found for',
    txn_add_title: 'Add Transaction', txn_edit_title: 'Edit Transaction',
    txn_cascade: 'Type → Category → Subcategory',
    txn_date_label: 'Date', txn_type_label: 'Type', txn_cat_label: 'Category',
    txn_sub_label: 'Subcategory', txn_amount_label: 'Amount',
    txn_desc_label: 'Description', txn_details_ph: 'Details',
    txn_select: 'Select', txn_select_type: 'Select type first', txn_select_cat: 'Select category',
    txn_cancel: 'Cancel', txn_save: 'Save', txn_update: 'Update',
    txn_added: '✅ Added', txn_updated: '✅ Updated', txn_deleted: '🗑 Deleted',
    // Auth
    auth_title: '🔒 Authentication', auth_desc: 'Enter passkey to continue',
    auth_passkey: 'Passkey', auth_enter: 'Enter passkey',
    auth_cancel: 'Cancel', auth_confirm: 'Confirm',
    auth_locked: '🔒 Locked', auth_locked_30: 'Locked 30s',
    auth_incorrect: 'Incorrect.', auth_left: 'left',
    // Delete
    del_title: '⚠️ Delete Transaction', del_desc: 'This cannot be undone.',
    del_cancel: 'Cancel', del_delete: 'Delete',
    // Investments
    inv_title: 'Investments', inv_sub: 'Portfolio allocation, ROI, and suggestions',
    inv_portfolio: 'Portfolio', inv_allocation: 'Allocation', inv_best_roi: 'Best ROI',
    inv_assets: 'assets', inv_alloc_chart: 'Allocation', inv_roi_chart: 'ROI by Asset',
    inv_ai_tip: 'Reduce FCPO exposure. Consider fixed income for stability.',
    // Goals
    goal_title: 'Goals', goal_sub: 'Track your financial milestones', goal_target: 'Target',
    // Analytics
    an_title: 'Analytics', an_sub: 'Cash flow, savings, budget utilization, and forecast',
    an_mcf: 'Monthly Cash Flow', an_sr: 'Savings Rate', an_bu: 'Budget Utilization', an_fc: 'Forecast',
    // Reports
    rpt_title: 'Reports', rpt_sub: 'Summaries with export options',
    rpt_yearly: 'Yearly', rpt_monthly: 'Monthly', rpt_quarterly: 'Quarterly',
    rpt_month: 'Month', rpt_net: 'Net', rpt_breakdown: 'Monthly Breakdown',
    // AI
    ai_title: 'AI Assistant', ai_sub: 'Ask about spending, budget, forecast, goals, or investments',
    ai_greeting: 'Hi Irsyad!', ai_ask: 'Ask me about spending habits, budget, forecasting, goals, or investments.',
    ai_placeholder: 'Ask about your finances...',
    ai_summary: 'Summary', ai_goal_tip: 'Goal tip', ai_investment: 'Investment',
    ai_sum_txt: 'Income stable. Loans dominate. Rate improving.',
    ai_goal_txt: 'Emergency Fund is your quickest win.',
    ai_inv_txt: 'Reduce FCPO, add fixed income.',
    // Settings
    set_title: 'Settings', set_sub: 'Preferences, security, accounts, import/export',
    set_general: 'General', set_security: 'Security', set_categories: 'Categories',
    set_accounts: 'Accounts', set_import: 'Import/Export', set_backup: 'Backup',
    set_currency: 'Currency', set_currency_desc: 'All monetary values will be converted using live exchange rates.',
    set_language: 'Language', set_language_desc: 'Changes apply immediately across the entire application.',
    set_dark_mode: 'Dark Mode', set_theme: 'Theme',
    set_notifications: 'Notifications', set_budget_alerts: 'Budget alerts',
    set_base_currency: 'Base currency (transactions stored in)',
    set_display_currency: 'Display currency',
    set_rate_info: 'Exchange rate updated',
    set_fetching: 'Fetching live rates...',
    set_rate_failed: 'Rate fetch failed, using cached/fallback.',
    set_sec_title: 'Security & Passkey',
    set_sec_desc: 'Default passkey: 1234. Protects edit/delete.',
    set_cur_pk: 'Current Passkey', set_new_pk: 'New Passkey', set_update: 'Update',
    set_2fa: 'Two-Factor Auth', set_2fa_desc: 'Extra security layer',
    set_cat_title: 'Categories (from spreadsheet)',
    set_acc_title: 'Accounts', set_acc_desc: 'Accounts feed the Add Transaction form dynamically.',
    set_active: 'Active',
    set_imp_title: 'Import / Export', set_imp_excel: 'Import Excel',
    set_imp_csv: 'Import CSV', set_exp_csv: 'Export CSV', set_exp_pdf: 'Export PDF',
    set_bak_title: 'Backup & Restore', set_bak_create: 'Create Backup',
    set_bak_restore: 'Restore', set_auto_bak: 'Auto Backup', set_auto_bak_desc: 'Daily snapshot',
    set_pk_wrong: '❌ Wrong current', set_pk_min: '❌ Min 4 chars', set_pk_ok: '✅ Passkey updated',
    // Misc
    misc_line: 'Line', misc_bar: 'Bar', misc_yes: 'Yes', misc_no: 'No',
    misc_light: '☀️ Light', misc_dark: '🌙 Dark',
    // Months
    mon_jan: 'Jan', mon_feb: 'Feb', mon_mar: 'Mar', mon_apr: 'Apr',
    mon_may: 'May', mon_jun: 'Jun', mon_jul: 'Jul', mon_aug: 'Aug',
    mon_sep: 'Sep', mon_oct: 'Oct', mon_nov: 'Nov', mon_dec: 'Dec'
  },
  zh: {
    nav_overview: '概览', nav_dashboard: '仪表盘', nav_transactions: '交易',
    nav_wealth: '财富', nav_investments: '投资', nav_goals: '目标',
    nav_insights: '洞察', nav_analytics: '分析', nav_reports: '报告',
    nav_ai: 'AI 助手', nav_system: '系统', nav_settings: '设置',
    hdr_total_year: '全年',
    dash_subtitle: '财务概览',
    dash_balance: '余额', dash_income: '收入', dash_expense: '支出',
    dash_savings: '储蓄', dash_budget: '预算', dash_cashflow: '现金流',
    dash_no_data: '没有可用的财务数据',
    dash_select_year: '请选择有数据的年份，或导入交易数据',
    dash_tip: '提示', dash_top_category: '最大类别', dash_spike: '激增',
    dash_keep_expenses: '保持支出低于6千以增加储蓄。',
    dash_income_expense_savings: '收入、支出、储蓄',
    dash_monthly_trend: '月度趋势，储蓄 = 收入减去支出',
    dash_expense_breakdown: '支出明细', dash_by_category: '按类别',
    dash_budget_vs_cf: '预算与现金流',
    dash_yearly_budget: '年度预算使用与净现金流对比',
    dash_budget_used: '已用预算', dash_cash_flow: '现金流',
    dash_on_track: '是否达标？', dash_healthy: '健康', dash_pressure: '压力',
    dash_left: '剩余', dash_over: '超支',
    dash_bank_accounts: '银行账户', dash_balances_glance: '余额一览',
    dash_no_change: '无变化',
    txn_search: '搜索...', txn_add: '添加', txn_export: '导出',
    txn_exported: '📥 已导出', txn_count: '数量', txn_net: '净额',
    txn_date: '日期', txn_type: '类型', txn_category: '类别',
    txn_sub: '子类', txn_details: '详情', txn_amount: '金额', txn_actions: '操作',
    txn_no_found: '未找到交易记录',
    txn_add_title: '添加交易', txn_edit_title: '编辑交易',
    txn_cascade: '类型 → 类别 → 子类别',
    txn_date_label: '日期', txn_type_label: '类型', txn_cat_label: '类别',
    txn_sub_label: '子类别', txn_amount_label: '金额',
    txn_desc_label: '描述', txn_details_ph: '详情',
    txn_select: '选择', txn_select_type: '请先选择类型', txn_select_cat: '请选择类别',
    txn_cancel: '取消', txn_save: '保存', txn_update: '更新',
    txn_added: '✅ 已添加', txn_updated: '✅ 已更新', txn_deleted: '🗑 已删除',
    auth_title: '🔒 验证', auth_desc: '输入密码以继续',
    auth_passkey: '密码', auth_enter: '输入密码',
    auth_cancel: '取消', auth_confirm: '确认',
    auth_locked: '🔒 已锁定', auth_locked_30: '锁定30秒',
    auth_incorrect: '错误。', auth_left: '次剩余',
    del_title: '⚠️ 删除交易', del_desc: '此操作无法撤销。',
    del_cancel: '取消', del_delete: '删除',
    inv_title: '投资', inv_sub: '资产配置、投资回报率和建议',
    inv_portfolio: '投资组合', inv_allocation: '配置', inv_best_roi: '最佳回报',
    inv_assets: '项资产', inv_alloc_chart: '配置', inv_roi_chart: '各资产回报率',
    inv_ai_tip: '减少FCPO敞口。考虑固定收益以增加稳定性。',
    goal_title: '目标', goal_sub: '追踪您的财务里程碑', goal_target: '目标',
    an_title: '分析', an_sub: '现金流、储蓄率、预算利用率和预测',
    an_mcf: '月度现金流', an_sr: '储蓄率', an_bu: '预算利用率', an_fc: '预测',
    rpt_title: '报告', rpt_sub: '摘要与导出选项',
    rpt_yearly: '年度', rpt_monthly: '月度', rpt_quarterly: '季度',
    rpt_month: '月份', rpt_net: '净额', rpt_breakdown: '月度明细',
    ai_title: 'AI 助手', ai_sub: '询问支出、预算、预测、目标或投资',
    ai_greeting: '你好 Irsyad！', ai_ask: '问我关于消费习惯、预算、预测、目标或投资的问题。',
    ai_placeholder: '询问您的财务状况...',
    ai_summary: '摘要', ai_goal_tip: '目标提示', ai_investment: '投资',
    ai_sum_txt: '收入稳定。贷款占主导。比率在改善。',
    ai_goal_txt: '应急基金是你最快的胜利。',
    ai_inv_txt: '减少FCPO，增加固定收益。',
    set_title: '设置', set_sub: '偏好、安全、账户、导入/导出',
    set_general: '通用', set_security: '安全', set_categories: '类别',
    set_accounts: '账户', set_import: '导入/导出', set_backup: '备份',
    set_currency: '货币', set_currency_desc: '所有货币值将使用实时汇率转换。',
    set_language: '语言', set_language_desc: '更改立即在整个应用中生效。',
    set_dark_mode: '深色模式', set_theme: '主题',
    set_notifications: '通知', set_budget_alerts: '预算提醒',
    set_base_currency: '基础货币（交易以此存储）',
    set_display_currency: '显示货币',
    set_rate_info: '汇率已更新',
    set_fetching: '正在获取实时汇率...',
    set_rate_failed: '汇率获取失败，使用缓存/默认值。',
    set_sec_title: '安全和密码',
    set_sec_desc: '默认密码：1234。保护编辑/删除操作。',
    set_cur_pk: '当前密码', set_new_pk: '新密码', set_update: '更新',
    set_2fa: '双重验证', set_2fa_desc: '额外安全层',
    set_cat_title: '类别（来自电子表格）',
    set_acc_title: '账户', set_acc_desc: '账户动态输入到添加交易表单。',
    set_active: '活跃',
    set_imp_title: '导入 / 导出', set_imp_excel: '导入Excel',
    set_imp_csv: '导入CSV', set_exp_csv: '导出CSV', set_exp_pdf: '导出PDF',
    set_bak_title: '备份与恢复', set_bak_create: '创建备份',
    set_bak_restore: '恢复', set_auto_bak: '自动备份', set_auto_bak_desc: '每日快照',
    set_pk_wrong: '❌ 当前密码错误', set_pk_min: '❌ 最少4个字符', set_pk_ok: '✅ 密码已更新',
    misc_line: '折线', misc_bar: '柱状', misc_yes: '是', misc_no: '否',
    misc_light: '☀️ 浅色', misc_dark: '🌙 深色',
    mon_jan: '1月', mon_feb: '2月', mon_mar: '3月', mon_apr: '4月',
    mon_may: '5月', mon_jun: '6月', mon_jul: '7月', mon_aug: '8月',
    mon_sep: '9月', mon_oct: '10月', mon_nov: '11月', mon_dec: '12月'
  },
  ja: {
    nav_overview: '概要', nav_dashboard: 'ダッシュボード', nav_transactions: '取引',
    nav_wealth: '資産', nav_investments: '投資', nav_goals: '目標',
    nav_insights: 'インサイト', nav_analytics: '分析', nav_reports: 'レポート',
    nav_ai: 'AIアシスタント', nav_system: 'システム', nav_settings: '設定',
    hdr_total_year: '年間合計',
    dash_subtitle: '財務概要',
    dash_balance: '残高', dash_income: '収入', dash_expense: '支出',
    dash_savings: '貯蓄', dash_budget: '予算', dash_cashflow: 'キャッシュフロー',
    dash_no_data: '利用可能な財務データがありません',
    dash_select_year: 'データのある年を選択するか、取引をインポートしてください',
    dash_tip: 'ヒント', dash_top_category: 'トップカテゴリ', dash_spike: '急増',
    dash_keep_expenses: '支出を6千以下に抑えて貯蓄を増やしましょう。',
    dash_income_expense_savings: '収入・支出・貯蓄',
    dash_monthly_trend: '月次トレンド、貯蓄 = 収入 - 支出',
    dash_expense_breakdown: '支出内訳', dash_by_category: 'カテゴリ別',
    dash_budget_vs_cf: '予算 vs キャッシュフロー',
    dash_yearly_budget: '年間予算使用状況と純キャッシュフローの比較',
    dash_budget_used: '予算使用率', dash_cash_flow: 'キャッシュフロー',
    dash_on_track: '達成見込み？', dash_healthy: '健全', dash_pressure: '圧迫',
    dash_left: '残り', dash_over: '超過',
    dash_bank_accounts: '銀行口座', dash_balances_glance: '残高一覧',
    dash_no_change: '変化なし',
    txn_search: '検索...', txn_add: '追加', txn_export: 'エクスポート',
    txn_exported: '📥 エクスポート完了', txn_count: '件数', txn_net: '純額',
    txn_date: '日付', txn_type: '種類', txn_category: 'カテゴリ',
    txn_sub: 'サブ', txn_details: '詳細', txn_amount: '金額', txn_actions: '操作',
    txn_no_found: '取引が見つかりません',
    txn_add_title: '取引を追加', txn_edit_title: '取引を編集',
    txn_cascade: '種類 → カテゴリ → サブカテゴリ',
    txn_date_label: '日付', txn_type_label: '種類', txn_cat_label: 'カテゴリ',
    txn_sub_label: 'サブカテゴリ', txn_amount_label: '金額',
    txn_desc_label: '説明', txn_details_ph: '詳細',
    txn_select: '選択', txn_select_type: '先に種類を選択', txn_select_cat: 'カテゴリを選択',
    txn_cancel: 'キャンセル', txn_save: '保存', txn_update: '更新',
    txn_added: '✅ 追加しました', txn_updated: '✅ 更新しました', txn_deleted: '🗑 削除しました',
    auth_title: '🔒 認証', auth_desc: 'パスキーを入力してください',
    auth_passkey: 'パスキー', auth_enter: 'パスキーを入力',
    auth_cancel: 'キャンセル', auth_confirm: '確認',
    auth_locked: '🔒 ロック中', auth_locked_30: '30秒ロック',
    auth_incorrect: '不正解。', auth_left: '回残り',
    del_title: '⚠️ 取引を削除', del_desc: 'この操作は取り消せません。',
    del_cancel: 'キャンセル', del_delete: '削除',
    inv_title: '投資', inv_sub: 'ポートフォリオ配分、ROI、提案',
    inv_portfolio: 'ポートフォリオ', inv_allocation: '配分', inv_best_roi: '最高ROI',
    inv_assets: '資産', inv_alloc_chart: '配分', inv_roi_chart: '資産別ROI',
    inv_ai_tip: 'FCPOの比率を減らし、安定性のため債券を検討してください。',
    goal_title: '目標', goal_sub: '財務マイルストーンを追跡', goal_target: '目標',
    an_title: '分析', an_sub: 'キャッシュフロー、貯蓄率、予算利用率、予測',
    an_mcf: '月次キャッシュフロー', an_sr: '貯蓄率', an_bu: '予算利用率', an_fc: '予測',
    rpt_title: 'レポート', rpt_sub: 'サマリーとエクスポートオプション',
    rpt_yearly: '年次', rpt_monthly: '月次', rpt_quarterly: '四半期',
    rpt_month: '月', rpt_net: '純額', rpt_breakdown: '月次内訳',
    ai_title: 'AIアシスタント', ai_sub: '支出、予算、予測、目標、投資について質問',
    ai_greeting: 'こんにちは Irsyad！', ai_ask: '支出習慣、予算、予測、目標、投資について聞いてください。',
    ai_placeholder: '財務について質問...',
    ai_summary: 'サマリー', ai_goal_tip: '目標ヒント', ai_investment: '投資',
    ai_sum_txt: '収入安定。ローンが主要。比率改善中。',
    ai_goal_txt: '緊急資金が最も達成しやすい目標です。',
    ai_inv_txt: 'FCPOを減らし、債券を追加。',
    set_title: '設定', set_sub: '環境設定、セキュリティ、口座、インポート/エクスポート',
    set_general: '一般', set_security: 'セキュリティ', set_categories: 'カテゴリ',
    set_accounts: '口座', set_import: 'インポート/エクスポート', set_backup: 'バックアップ',
    set_currency: '通貨', set_currency_desc: 'すべての金額がライブ為替レートで変換されます。',
    set_language: '言語', set_language_desc: '変更は即座にアプリ全体に適用されます。',
    set_dark_mode: 'ダークモード', set_theme: 'テーマ',
    set_notifications: '通知', set_budget_alerts: '予算アラート',
    set_base_currency: '基本通貨（取引の保存単位）',
    set_display_currency: '表示通貨',
    set_rate_info: '為替レート更新済み',
    set_fetching: 'ライブレートを取得中...',
    set_rate_failed: 'レート取得失敗。キャッシュ/デフォルト値を使用。',
    set_sec_title: 'セキュリティとパスキー',
    set_sec_desc: 'デフォルトパスキー：1234。編集/削除を保護。',
    set_cur_pk: '現在のパスキー', set_new_pk: '新しいパスキー', set_update: '更新',
    set_2fa: '二要素認証', set_2fa_desc: '追加セキュリティ層',
    set_cat_title: 'カテゴリ（スプレッドシートから）',
    set_acc_title: '口座', set_acc_desc: '口座は取引追加フォームに動的に反映されます。',
    set_active: '有効',
    set_imp_title: 'インポート / エクスポート', set_imp_excel: 'Excelインポート',
    set_imp_csv: 'CSVインポート', set_exp_csv: 'CSVエクスポート', set_exp_pdf: 'PDFエクスポート',
    set_bak_title: 'バックアップと復元', set_bak_create: 'バックアップ作成',
    set_bak_restore: '復元', set_auto_bak: '自動バックアップ', set_auto_bak_desc: '毎日スナップショット',
    set_pk_wrong: '❌ 現在のパスキーが違います', set_pk_min: '❌ 最低4文字', set_pk_ok: '✅ パスキー更新完了',
    misc_line: '折れ線', misc_bar: '棒', misc_yes: 'はい', misc_no: 'いいえ',
    misc_light: '☀️ ライト', misc_dark: '🌙 ダーク',
    mon_jan: '1月', mon_feb: '2月', mon_mar: '3月', mon_apr: '4月',
    mon_may: '5月', mon_jun: '6月', mon_jul: '7月', mon_aug: '8月',
    mon_sep: '9月', mon_oct: '10月', mon_nov: '11月', mon_dec: '12月'
  }
};

let currentLang = localStorage.getItem('ft_lang') || 'en';
function t(key) { return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key; }
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ft_lang', lang);
  updateNavLabels();
  navigate(curPage);
}
function updateNavLabels() {
  const labels = document.querySelectorAll('.nlbl');
  const keys = ['nav_dashboard','nav_transactions','nav_investments','nav_goals','nav_analytics','nav_reports','nav_ai','nav_settings'];
  labels.forEach((el, i) => { if (keys[i]) el.textContent = t(keys[i]); });
  const secs = document.querySelectorAll('.nsec');
  const secKeys = ['nav_overview','nav_wealth','nav_insights','nav_system'];
  secs.forEach((el, i) => { if (secKeys[i]) el.textContent = t(secKeys[i]); });
}
function getMonthNames() {
  return ['mon_jan','mon_feb','mon_mar','mon_apr','mon_may','mon_jun','mon_jul','mon_aug','mon_sep','mon_oct','mon_nov','mon_dec'].map(k => t(k));
}

// === CURRENCY SYSTEM (v10.0) ===
const CURRENCY_CONFIG = {
  MYR: { symbol: 'RM', locale: 'en-MY', name: 'Malaysian Ringgit' },
  SGD: { symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
  JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  CNY: { symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  THB: { symbol: '฿', locale: 'th-TH', name: 'Thai Baht' },
  IDR: { symbol: 'Rp', locale: 'id-ID', name: 'Indonesian Rupiah' }
};

const FALLBACK_RATES = { MYR: 1, SGD: 0.2857, USD: 0.2128, EUR: 0.1961, GBP: 0.1695, JPY: 31.25, CNY: 1.538, AUD: 0.3289, THB: 7.353, IDR: 3401 };

let displayCurrency = localStorage.getItem('ft_currency') || 'MYR';
let exchangeRates = JSON.parse(localStorage.getItem('ft_rates') || 'null') || FALLBACK_RATES;
let ratesLastUpdated = localStorage.getItem('ft_rates_updated') || null;

async function fetchExchangeRates() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/MYR');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    exchangeRates = data.rates;
    exchangeRates.MYR = 1;
    ratesLastUpdated = new Date().toISOString();
    localStorage.setItem('ft_rates', JSON.stringify(exchangeRates));
    localStorage.setItem('ft_rates_updated', ratesLastUpdated);
    return true;
  } catch (e) {
    console.warn('Exchange rate fetch failed, using fallback/cached rates.');
    return false;
  }
}

function convertAmount(amountInMYR) {
  if (displayCurrency === 'MYR') return amountInMYR;
  const rate = exchangeRates[displayCurrency] || FALLBACK_RATES[displayCurrency] || 1;
  return amountInMYR * rate;
}

function setCurrency(currency) {
  displayCurrency = currency;
  localStorage.setItem('ft_currency', currency);
  navigate(curPage);
}

// === YEAR OPTIONS (2024-2040) ===
const YEARS = [];
for (let y = 2024; y <= 2040; y++) YEARS.push(y);
const CURRENT_YEAR = 2026;

function buildYearOptions(selectedYear) {
  return YEARS.map(y => `<option value="${y}"${y === selectedYear ? ' selected' : ''}>${y}</option>`).join('');
}

// Populate header year dropdown
document.getElementById('yf').innerHTML = buildYearOptions(CURRENT_YEAR);

// === DATA: Computed from TXN (single source of truth) ===
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Budget allocations per category (yearly)
const CATEGORY_BUDGETS = {
  'Loan': 18840,
  'Gift': 7200,
  'Food': 3000,
  'Transportation': 10620,
  'Entertainment': 4320,
  'Housing': 4800,
  'Insurance & Taxes': 3960
};

// Compute monthly data from TXN for any year
function computeMonthlyData(year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const mTxns = TXN.filter(t => {
      const d = new Date(t.d);
      return d.getFullYear() === year && d.getMonth() === m;
    });
    months.push({
      m: MONTH_NAMES[m],
      i: mTxns.filter(t => t.t === 'Income').reduce((s, t) => s + t.a, 0),
      e: mTxns.filter(t => t.t === 'Expense').reduce((s, t) => s + t.a, 0),
      s: mTxns.filter(t => t.t === 'Savings').reduce((s, t) => s + t.a, 0)
    });
  }
  return months;
}

// Compute expense categories from TXN for any year
function computeExpenseCategories(year) {
  const cats = {};
  TXN.filter(t => {
    const d = new Date(t.d);
    return t.t === 'Expense' && d.getFullYear() === year;
  }).forEach(t => {
    if (!cats[t.c]) cats[t.c] = 0;
    cats[t.c] += t.a;
  });
  return Object.entries(cats)
    .map(([n, a]) => ({ n, a: Math.round(a * 100) / 100, b: CATEGORY_BUDGETS[n] || 0 }))
    .sort((a, b) => b.a - a.a);
}

// Check if a year has any transaction data
function yearHasData(year) {
  return TXN.some(t => new Date(t.d).getFullYear() === year);
}

const SCHEMA = {
  Income: {
    'Employment (Net)': ['Salary', 'Overtime'],
    'Cash': ['Refund', 'Others'],
    'Dividen': ['ASB', 'TH']
  },
  Expense: {
    'Housing': ['Phone', 'Wifi', 'Utilities'],
    'Entertainment': ['Shopping', 'Personels', 'Other'],
    'Transportation': ['Fuel', 'Tolls', 'Maintenance', 'Others'],
    'Food': ['Dining Out', 'Food'],
    'Loan': ['Personal', 'PTPTN', 'Motor', 'Car'],
    'Gift': ['Parents', 'Gifts', 'Charity'],
    'Insurance & Taxes': ['Sunlife', 'Income Tax', 'Other Tax']
  },
  Savings: {
    'KWSP': ['KWSP'],
    'TH': ['TH'],
    'ASBN': ['ASB', 'BSN', 'RIA'],
    'Bank': ['UOB', 'Wise', 'CIMB'],
    'Versa': ['Versa Save', 'Versa Invest'],
    'TNGO': ['T&GO Go+', 'T&GO Principal'],
    'Future': ['FCPO'],
    'Rize': ['Rize'],
    'Saham PPK': ['Saham PPK']
  }
};

let TXN = [
  { id: 1, d: '2026-01-06', t: 'Income', c: 'Employment (Net)', s: '', a: 8942, dt: 'Rate 3.16' },
  { id: 2, d: '2026-01-06', t: 'Expense', c: 'Gift', s: 'Parents', a: 300, dt: 'Bagi Ayah' },
  { id: 3, d: '2026-01-09', t: 'Expense', c: 'Housing', s: 'Phone', a: 192.9, dt: 'M1+Digi' },
  { id: 4, d: '2026-01-09', t: 'Expense', c: 'Housing', s: 'Wifi', a: 136.75, dt: '' },
  { id: 5, d: '2026-01-16', t: 'Expense', c: 'Loan', s: 'Personal', a: 719, dt: 'Kereta' },
  { id: 6, d: '2026-01-17', t: 'Expense', c: 'Food', s: 'Dining Out', a: 389, dt: '' },
  { id: 7, d: '2026-01-14', t: 'Expense', c: 'Insurance & Taxes', s: 'Sunlife', a: 100, dt: '' },
  { id: 8, d: '2026-02-05', t: 'Income', c: 'Employment (Net)', s: '', a: 8820, dt: 'Rate 3.09' },
  { id: 9, d: '2026-02-05', t: 'Expense', c: 'Gift', s: 'Parents', a: 650, dt: '' },
  { id: 10, d: '2026-02-15', t: 'Expense', c: 'Loan', s: 'Personal', a: 719, dt: 'Kereta' },
  { id: 11, d: '2026-03-06', t: 'Income', c: 'Employment (Net)', s: '', a: 8562, dt: 'Rate 3.08' },
  { id: 12, d: '2026-03-06', t: 'Expense', c: 'Loan', s: 'Motor', a: 167, dt: '' },
  { id: 13, d: '2026-03-13', t: 'Expense', c: 'Loan', s: 'Personal', a: 719, dt: 'Kereta' },
  { id: 14, d: '2026-03-08', t: 'Expense', c: 'Gift', s: 'Parents', a: 750, dt: '' },
  { id: 15, d: '2026-03-20', t: 'Expense', c: 'Gift', s: 'Gifts', a: 450, dt: 'Duit Raya' },
  { id: 16, d: '2026-04-06', t: 'Income', c: 'Employment (Net)', s: '', a: 8409.52, dt: 'Rate 3.138' },
  { id: 17, d: '2026-04-12', t: 'Expense', c: 'Loan', s: 'Personal', a: 719, dt: 'Kereta' },
  { id: 18, d: '2026-04-12', t: 'Expense', c: 'Insurance & Taxes', s: 'Income Tax', a: 524.58, dt: 'SGP' },
  { id: 19, d: '2026-04-14', t: 'Expense', c: 'Gift', s: 'Parents', a: 650, dt: '' },
  { id: 20, d: '2026-04-30', t: 'Expense', c: 'Loan', s: 'Personal', a: 15282, dt: 'Bond' },
  { id: 21, d: '2026-05-06', t: 'Income', c: 'Employment (Net)', s: '', a: 7337, dt: '' },
  { id: 22, d: '2026-05-15', t: 'Expense', c: 'Loan', s: 'Car', a: 719, dt: '' },
  { id: 23, d: '2026-05-15', t: 'Expense', c: 'Gift', s: 'Parents', a: 450, dt: '' },
  { id: 24, d: '2026-06-01', t: 'Income', c: 'Employment (Net)', s: '', a: 7960, dt: 'Rate 3.10' },
  { id: 25, d: '2026-06-05', t: 'Expense', c: 'Gift', s: 'Gifts', a: 800, dt: '' },
  { id: 26, d: '2026-06-10', t: 'Expense', c: 'Loan', s: 'Personal', a: 812, dt: 'PC' },
  { id: 27, d: '2026-06-11', t: 'Expense', c: 'Loan', s: 'Car', a: 719, dt: '' },
  { id: 28, d: '2026-06-24', t: 'Expense', c: 'Insurance & Taxes', s: 'Other Tax', a: 2099.72, dt: 'Balancing' }
];

let nxId = 100, curPage = 'dashboard', txnPg = 1, editId = null, pendAct = null, authAtt = 0, lockUntil = 0;
let txnMonthSel = null, txnYearSel = null, txnInitialized = false;

// === PERSISTENCE ===
const STORAGE_KEY = 'ft_txn_data';
function saveTXN() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(TXN));
  localStorage.setItem('ft_nxId', nxId);
}
function loadTXN() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { TXN = JSON.parse(raw); } catch(e) {}
  }
  const sid = localStorage.getItem('ft_nxId');
  if (sid) nxId = parseInt(sid);
  else nxId = TXN.length ? Math.max(...TXN.map(t => t.id)) + 1 : 100;
}

const getPK = () => localStorage.getItem('ft_pk') || '1234';
const fmt = n => {
  const cfg = CURRENCY_CONFIG[displayCurrency] || CURRENCY_CONFIG.MYR;
  const converted = convertAmount(Math.abs(n));
  return cfg.symbol + ' ' + converted.toLocaleString(cfg.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const fmtD = n => {
  const cfg = CURRENCY_CONFIG[displayCurrency] || CURRENCY_CONFIG.MYR;
  const converted = convertAmount(n);
  return cfg.symbol + ' ' + converted.toLocaleString(cfg.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function toggleTheme() {
  const h = document.documentElement, d = h.dataset.theme === 'dark';
  h.dataset.theme = d ? 'light' : 'dark';
  document.getElementById('thico').dataset.lucide = d ? 'sun' : 'moon';
  lucide.createIcons();
  localStorage.setItem('theme', h.dataset.theme);
  navigate(curPage);
  toast(d ? t('misc_light') : t('misc_dark'));
}

function toggleSB() {
  if (window.innerWidth <= 900) document.getElementById('sb').classList.toggle('open');
  else document.getElementById('app').classList.toggle('collapsed');
}

function getSelectedYear() {
  return parseInt(document.getElementById('yf').value);
}

// === NAVIGATION ===
document.querySelectorAll('.ni').forEach(el => el.addEventListener('click', () => {
  document.querySelectorAll('.ni').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  navigate(el.dataset.page);
}));

function navigate(page) {
  curPage = page;
  const titleKeys = { dashboard: 'nav_dashboard', transactions: 'nav_transactions', investments: 'nav_investments', goals: 'nav_goals', analytics: 'nav_analytics', reports: 'nav_reports', ai: 'nav_ai', settings: 'nav_settings' };
  document.getElementById('pt').textContent = t(titleKeys[page]) || page;
  document.getElementById('ps').textContent = page === 'dashboard' ? t('dash_subtitle') : '';
  render();
}

function render() {
  const c = document.getElementById('cnt');
  switch (curPage) {
    case 'dashboard': renderDashboard(c); break;
    case 'transactions': renderTransactions(c); break;
    case 'investments': renderInvestments(c); break;
    case 'goals': renderGoals(c); break;
    case 'analytics': renderAnalytics(c); break;
    case 'reports': renderReports(c); break;
    case 'ai': renderAI(c); break;
    case 'settings': renderSettings(c); break;
  }
}

function refresh() { render(); }

// === BANK ACCOUNTS DATA ===
const BANKS = [
  { name: 'Maybank Savings', type: 'Savings', balance: 12450, updated: 'Today, 9:04 AM', cls: 'maybank', tag: 'MBB' },
  { name: 'CIMB Current', type: 'Current', balance: 3820, updated: 'Today, 9:08 AM', cls: 'cimb', tag: 'CIMB' },
  { name: 'Wise Balance', type: 'Multi-currency', balance: 1675, updated: 'Today, 8:57 AM', cls: 'wise', tag: 'WISE' },
  { name: 'Cash Wallet', type: 'Cash', balance: 420, updated: 'Yesterday', cls: 'cash', tag: 'CASH' }
];

// === DASHBOARD ===
function renderDashboard(c) {
  const year = getSelectedYear();
  if (!yearHasData(year)) {
    c.innerHTML = `<div class="es" style="padding:100px 20px"><div style="font-size:40px;margin-bottom:16px">📊</div><div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:8px">No financial data available for ${year}.</div><p>Select a year with imported data, or import transactions for ${year}.</p></div>`;
    return;
  }
  const yearData = computeMonthlyData(year);
  const EC = computeExpenseCategories(year);
  const mf = document.getElementById('mf').value;
  let ti, te, ts;
  if (mf === 'total') {
    ti = yearData.reduce((s, m) => s + m.i, 0);
    te = yearData.reduce((s, m) => s + m.e, 0);
    ts = yearData.reduce((s, m) => s + m.s, 0);
  } else {
    ti = yearData[+mf].i;
    te = yearData[+mf].e;
    ts = yearData[+mf].s;
  }
  const bal = ti - te, bl = 52740 - te, cf = ti - te;
  // Sparkline data series - v8.3 dynamic per period
  const series = {
    balance: yearData.map(m => m.i - m.e),
    income: yearData.map(m => m.i),
    expense: yearData.map(m => m.e),
    savings: yearData.map(m => m.s),
    budget: yearData.map(m => 52740 / 12 - m.e),
    cashflow: yearData.map(m => m.i - m.e)
  };
  // v8.5.2 - Sparkline data per selected period (used by calcTrend)
  function getSparkData(fullSeries) {
    if (mf === 'total') return fullSeries;
    const idx = +mf;
    const prev = idx > 0 ? fullSeries[idx - 1] : 0;
    const curr = fullSeries[idx];
    return [prev, curr];
  }
  // v8.5.2 - Build sparkline chart data: yearly=12 months, monthly=daily cumulative from TXN
  function buildSparkSeries() {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (mf === 'total') {
      return { labels: monthNames, balance: yearData.map(m => m.i - m.e), income: yearData.map(m => m.i), expense: yearData.map(m => m.e), savings: yearData.map(m => m.s), budget: yearData.map(m => 52740 / 12 - m.e), cashflow: yearData.map(m => m.i - m.e) };
    }
    const mi = +mf, daysInMonth = new Date(year, mi + 1, 0).getDate();
    const lbls = [], bArr = [], iArr = [], eArr = [], sArr = [], buArr = [], cfArr = [];
    const mBud = 52740 / 12;
    let cI = 0, cE = 0, cS = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      lbls.push(d + ' ' + monthNames[mi]);
      const ds = `${year}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = TXN.filter(t => t.d === ds);
      cI += dt.filter(t => t.t === 'Income').reduce((a, t) => a + t.a, 0);
      cE += dt.filter(t => t.t === 'Expense').reduce((a, t) => a + t.a, 0);
      cS += dt.filter(t => t.t === 'Savings').reduce((a, t) => a + t.a, 0);
      iArr.push(cI); eArr.push(cE); sArr.push(cS);
      bArr.push(cI - cE); buArr.push(mBud - cE); cfArr.push(cI - cE);
    }
    return { labels: lbls, balance: bArr, income: iArr, expense: eArr, savings: sArr, budget: buArr, cashflow: cfArr };
  }
  // v8.3 - Correct trend logic with no-data handling
  function calcTrend(arr, isExpense) {
    const pts = arr.filter(v => v !== 0);
    if (pts.length < 2) return { pos: null, pct: 0, label: 'No change', noData: true };
    const curr = pts[pts.length - 1], prev = pts[pts.length - 2];
    const change = curr - prev;
    const pct = prev !== 0 ? Math.abs(change / prev * 100).toFixed(0) : 0;
    const pos = isExpense ? change <= 0 : change >= 0;
    const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '';
    return { pos, pct, label: `${arrow} ${pct}%`, noData: false };
  }
  // v8.3 - Simplified percentage per card (no labels)
  const budgetTotal = 52740;
  const usedPct = {
    bal: ti > 0 ? ((ti - te) / ti * 100).toFixed(0) : 0,
    inc: ((ti / budgetTotal) * 100).toFixed(0),
    exp: ((te / budgetTotal) * 100).toFixed(0),
    sav: ti > 0 ? Math.abs((ts / ti) * 100).toFixed(0) : 0,
    bud: ((te / budgetTotal) * 100).toFixed(0),
    cf: ti > 0 ? Math.abs((cf / ti) * 100).toFixed(0) : 0
  };
  const cards = [
    { l: 'Balance', v: fmt(bal), cl: 'em', ic: 'wallet', s: series.balance, exp: false, pct: usedPct.bal },
    { l: 'Income', v: fmt(ti), cl: 'gn', ic: 'arrow-down-left', s: series.income, exp: false, pct: usedPct.inc },
    { l: 'Expense', v: fmt(te), cl: 'rs', ic: 'arrow-up-right', s: series.expense, exp: true, pct: usedPct.exp },
    { l: 'Savings', v: (ts < 0 ? '-' : '') + fmt(ts), cl: 'pk', ic: 'piggy-bank', s: series.savings, exp: false, pct: usedPct.sav },
    { l: 'Budget', v: fmt(bl), cl: 'gd', ic: 'calculator', s: series.budget, exp: false, pct: usedPct.bud },
    { l: 'Cash Flow', v: fmt(cf), cl: 'bl', ic: 'activity', s: series.cashflow, exp: false, pct: usedPct.cf }
  ];
  c.innerHTML = `<div class="kg">${cards.map((k, i) => {
    const sparkData = getSparkData(k.s);
    const t = calcTrend(sparkData, k.exp);
    return `<div class="kc ${k.cl}"><div class="kc-top"><div class="ki"><i data-lucide="${k.ic}" width="15" height="15"></i></div><div><div class="kl">${k.l}</div><div class="kv">${k.v}</div></div></div><div class="kt ${t.noData ? 'neutral' : (t.pos ? 'pos' : 'neg')}"><span class="kt-chg">${t.label}</span></div><div class="spark-wrap"><canvas id="sp${i}" height="36"></canvas></div></div>`;
  }).join('')}</div>
<div class="ib">${(() => { const maxM = yearData.reduce((mx, m, i) => m.e > mx.e ? { e: m.e, m: m.m, i } : mx, { e: 0, m: '', i: -1 }); const topC = EC.length ? EC[0] : null; const insights = []; if (maxM.e > 10000) insights.push({ e: '⚠️', t: '<b>' + maxM.m + ' spike:</b> ' + fmt(maxM.e) }); if (topC) insights.push({ e: '📊', t: '<b>Top category:</b> ' + topC.n + ' at ' + fmt(topC.a) }); insights.push({ e: '💡', t: '<b>Tip:</b> Keep expenses under RM6k to grow savings.' }); return insights.map(i => `<div class="ic"><span class="ie">${i.e}</span><div class="ix">${i.t}</div></div>`).join(''); })()}</div>
<div class="cg"><div class="cc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div class="ct">Income, Expense, Savings</div><div class="cs">Monthly trend with savings = income minus expense</div></div><div class="seg" id="dc1tog"><button class="bm active" data-ct="line">Line</button><button class="bm" data-ct="bar">Bar</button></div></div><div style="height:260px"><canvas id="dc1"></canvas></div></div><div class="cc"><div class="ct">Expense Breakdown</div><div class="cs">By category</div><div style="height:260px"><canvas id="dc2"></canvas></div></div></div>
<div class="wg"><div class="wc"><div class="wt">Budget vs Cash Flow</div><div class="ws">Yearly budget usage compared with net cash flow</div><div style="height:220px"><canvas id="bchart"></canvas></div><div class="budget-meta"><div class="mini"><div class="mlab">Budget used</div><div class="mval">${(te / 52740 * 100).toFixed(0)}%</div><div class="mnote">${fmt(te)} of ${fmt(52740)}</div></div><div class="mini"><div class="mlab">Cash flow</div><div class="mval">${cf >= 0 ? '+' : ''}${fmt(cf)}</div><div class="mnote">${cf >= 0 ? 'Healthy' : 'Pressure'}</div></div><div class="mini"><div class="mlab">On track?</div><div class="mval">${bl >= 0 ? 'Yes' : 'No'}</div><div class="mnote">${bl >= 0 ? fmt(bl) + ' left' : 'Over ' + fmt(Math.abs(bl))}</div></div></div></div><div class="wc"><div class="wt">Bank Accounts</div><div class="ws">Available balances at a glance</div><div class="bank-grid">${BANKS.map(b => `<div class="bank-card"><div class="bank-top"><div class="bank-badge ${b.cls}">${b.tag}</div><div class="bank-info"><div class="bank-name">${b.name}</div><div class="bank-type">${b.type}</div></div></div><div class="bank-balance">${fmt(b.balance)}</div><div class="bank-updated">${b.updated}</div></div>`).join('')}</div></div></div>`;
  lucide.createIcons();
  setTimeout(() => {
    const dk = document.documentElement.dataset.theme === 'dark';
    const gc = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tc = dk ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const mns = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // Sparklines - v8.5.2 interactive with daily/monthly data synced to toggle
    const sparkColors = ['#10b981', '#10b981', '#f43f5e', '#3b82f6', '#10b981', '#10b981'];
    const sparkBgColors = ['rgba(16,185,129,0.25)', 'rgba(16,185,129,0.25)', 'rgba(244,63,94,0.25)', 'rgba(59,130,246,0.25)', 'rgba(16,185,129,0.25)', 'rgba(16,185,129,0.25)'];
    const sparkKeys = ['balance', 'income', 'expense', 'savings', 'budget', 'cashflow'];
    const spSeries = buildSparkSeries();
    cards.forEach((k, i) => {
      const sparkData = spSeries[sparkKeys[i]];
      const sparkLabels = spSeries.labels;
      const col = sparkColors[i] || '#9ca3af';
      const bgCol = sparkBgColors[i] || 'rgba(156,163,175,0.2)';
      const spCtx = document.getElementById('sp' + i).getContext('2d');
      const grad = spCtx.createLinearGradient(0, 0, 0, 36);
      grad.addColorStop(0, bgCol);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      new Chart(spCtx, { type: 'line', data: { labels: sparkLabels, datasets: [{ data: sparkData, borderColor: col, borderWidth: 1.8, tension: .4, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: col, pointHoverBorderColor: dk ? '#1e1e2e' : '#fff', pointHoverBorderWidth: 2, fill: true, backgroundColor: grad }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, callbacks: { title: ctx => String(sparkLabels[ctx[0].dataIndex]), label: c2 => fmt(c2.raw) }, bodyFont: { size: 10 }, titleFont: { size: 9, weight: '600' }, padding: 6, displayColors: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#333', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, cornerRadius: 6, caretSize: 4 } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 300, easing: 'easeOutQuart' }, interaction: { mode: 'index', intersect: false }, onHover: (evt, elements, chart) => { chart.data.datasets[0].borderWidth = elements.length ? 2.8 : 1.8; chart.update('none'); } } });
    });
    // Main chart - v8.2 with Line/Bar toggle
    const savLine = yearData.map(m => m.i - m.e);
    let mainChart = null;
    function drawMainChart(chartType) {
      if (mainChart) mainChart.destroy();
      const isFill = chartType === 'line';
      mainChart = new Chart(document.getElementById('dc1'), { type: chartType, data: { labels: mns, datasets: [{ label: 'Income', data: yearData.map(m => m.i), borderColor: '#10b981', backgroundColor: chartType === 'bar' ? 'rgba(16,185,129,0.75)' : 'rgba(16,185,129,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }, { label: 'Expense', data: yearData.map(m => m.e), borderColor: '#f43f5e', backgroundColor: chartType === 'bar' ? 'rgba(244,63,94,0.75)' : 'rgba(244,63,94,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }, { label: 'Savings', data: savLine, borderColor: '#3b82f6', backgroundColor: chartType === 'bar' ? 'rgba(59,130,246,0.75)' : 'rgba(59,130,246,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 } } }, tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.raw) } } }, scales: { x: { grid: { color: gc }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => 'RM ' + Math.round(v / 1000) + 'k' } } }, interaction: { intersect: false, mode: 'index' } } });
    }
    drawMainChart('line');
    document.querySelectorAll('#dc1tog .bm').forEach(btn => btn.onclick = () => { document.querySelectorAll('#dc1tog .bm').forEach(b => b.classList.remove('active')); btn.classList.add('active'); drawMainChart(btn.dataset.ct); });
    // Doughnut
    new Chart(document.getElementById('dc2'), { type: 'doughnut', data: { labels: EC.map(c => c.n), datasets: [{ data: EC.map(c => c.a), backgroundColor: ['#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#06b6d4'], borderWidth: 0, hoverOffset: 5 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', animation: { duration: 700 }, plugins: { legend: { position: 'right', labels: { color: tc, usePointStyle: true, font: { size: 10 } } }, tooltip: { callbacks: { label: ctx => ctx.label + ': ' + fmt(ctx.raw) } } } } });
    // Budget vs Cash Flow chart - v8.3 yearly only, cleaner
    const bSpend = yearData.map(m => m.e);
    const bLimit = yearData.map(() => 52740 / 12);
    const bNet = yearData.map(m => m.i - m.e);
    new Chart(document.getElementById('bchart'), { data: { labels: mns, datasets: [{ type: 'bar', label: 'Budget limit', data: bLimit, backgroundColor: dk ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.35)', borderWidth: 1, borderRadius: 5, barThickness: 20 }, { type: 'bar', label: 'Actual spend', data: bSpend, backgroundColor: bSpend.map((v, idx) => v > bLimit[idx] ? 'rgba(244,63,94,0.8)' : 'rgba(16,185,129,0.7)'), borderRadius: 5, barThickness: 12 }, { type: 'line', label: 'Cash flow', data: bNet, borderColor: '#6366f1', borderWidth: 2.5, tension: .4, pointRadius: 3, pointBackgroundColor: '#6366f1', pointBorderColor: dk ? '#1e1e2e' : '#fff', pointBorderWidth: 2, yAxisID: 'y1', fill: false }] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 }, padding: 14 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#1a1a2e', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 10, cornerRadius: 8, callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.raw) } } }, scales: { x: { grid: { display: false }, ticks: { color: tc, font: { size: 10 } } }, y: { grid: { color: gc, drawBorder: false }, ticks: { color: tc, font: { size: 10 }, callback: v => 'RM ' + Math.round(v / 1000) + 'k', maxTicksLimit: 5 } }, y1: { position: 'right', grid: { display: false }, ticks: { color: tc, font: { size: 10 }, callback: v => 'RM ' + Math.round(v / 1000) + 'k', maxTicksLimit: 5 } } } } });
  }, 50);
}

// === TRANSACTIONS ===
function renderTransactions(c) {
  const selYear = txnYearSel || getSelectedYear();
  c.innerHTML = `<div class="tt"><div class="tf"><select class="fsel" id="txyr" onchange="txnYearSel=parseInt(this.value);renderTxnTable()">${buildYearOptions(selYear)}</select><select class="fsel" id="txm" onchange="txnMonthSel=this.value;renderTxnTable()"><option value="total">Total Year</option><option value="0">Jan</option><option value="1">Feb</option><option value="2">Mar</option><option value="3">Apr</option><option value="4">May</option><option value="5">Jun</option><option value="6">Jul</option><option value="7">Aug</option><option value="8">Sep</option><option value="9">Oct</option><option value="10">Nov</option><option value="11">Dec</option></select><div class="sb2"><i data-lucide="search" width="14" height="14"></i><input placeholder="Search..." id="txs" oninput="renderTxnTable()"></div></div><div style="display:flex;gap:6px"><button class="btn bp" id="addbtn" onclick="editId=null;openAdd()"><i data-lucide="plus" width="12" height="12"></i> Add</button><button class="btn bs" onclick="toast('📥 Exported')"><i data-lucide="download" width="12" height="12"></i> Export</button></div></div><div class="tsg" id="txsm"></div><div class="tw"><div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Sub</th><th>Details</th><th style="text-align:right">Amount</th><th style="text-align:center;width:80px">Actions</th></tr></thead><tbody id="txbody"></tbody></table></div><div class="tp"><span id="txinfo"></span><div class="pb" id="txpg"></div></div></div>`;
  lucide.createIcons();
  // Default to current month only on first open this session
  if (!txnInitialized) {
    const now = new Date();
    txnMonthSel = now.getFullYear() === selYear ? String(now.getMonth()) : 'total';
    txnYearSel = selYear;
    txnInitialized = true;
  }
  document.getElementById('txyr').value = txnYearSel;
  document.getElementById('txm').value = txnMonthSel || 'total';
  renderTxnTable();
}

function renderTxnTable() {
  const year = txnYearSel || parseInt(document.getElementById('txyr')?.value || CURRENT_YEAR);
  const m = txnMonthSel || document.getElementById('txm')?.value || 'total';
  const s = (document.getElementById('txs')?.value || '').toLowerCase();
  const f = TXN.filter(t => {
    const dt = new Date(t.d);
    if (dt.getFullYear() !== year) return false;
    if (m !== 'total' && dt.getMonth() !== +m) return false;
    if (s && !`${t.c} ${t.s} ${t.dt} ${t.a}`.toLowerCase().includes(s)) return false;
    return true;
  }).sort((a, b) => new Date(b.d) - new Date(a.d));
  const inc = f.filter(t => t.t === 'Income').reduce((s, t) => s + t.a, 0);
  const exp = f.filter(t => t.t === 'Expense').reduce((s, t) => s + t.a, 0);
  const sav = f.filter(t => t.t === 'Savings').reduce((s, t) => s + t.a, 0);
  const net = inc - exp - sav;
  const sm = document.getElementById('txsm');
  if (sm) sm.innerHTML = `<div class="tsi"><div class="tsl">Count</div><div class="tsv">${f.length}</div></div><div class="tsi"><div class="tsl">Income</div><div class="tsv" style="color:var(--emerald)">${fmt(inc)}</div></div><div class="tsi"><div class="tsl">Expenses</div><div class="tsv" style="color:var(--rose)">${fmt(exp)}</div></div><div class="tsi"><div class="tsl">Savings</div><div class="tsv" style="color:var(--blue)">${fmt(sav)}</div></div><div class="tsi"><div class="tsl">Net</div><div class="tsv" style="color:${net >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${net < 0 ? '-' : ''}${fmt(net)}</div></div>`;
  const pp = 50, start = (txnPg - 1) * pp, pg = f.slice(start, start + pp);
  const body = document.getElementById('txbody');
  if (!pg.length) {
    body.innerHTML = `<tr><td colspan="7"><div class="es"><div style="font-size:24px">📭</div><p>No transactions found for ${year}${m !== 'total' ? ' (' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m] + ')' : ''}.</p></div></td></tr>`;
  } else {
    body.innerHTML = pg.map(t => {
      const cl = t.t === 'Income' ? 'i' : t.t === 'Expense' ? 'e' : 's';
      const acl = t.t === 'Income' ? 'ai' : t.t === 'Savings' ? 'as' : 'ae';
      return `<tr><td>${new Date(t.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td><td><span class="tb ${cl}">${t.t}</span></td><td>${t.c}</td><td>${t.s || '-'}</td><td style="color:var(--text-tertiary)">${t.dt || '-'}</td><td class="${acl}" style="text-align:right">${t.t === 'Expense' ? '-' : ''}RM ${t.a.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td><td><div class="ab"><button class="abtn" onclick="doAuth('edit',${t.id})">✏️</button><button class="abtn del" onclick="doAuth('delete',${t.id})">🗑</button></div></td></tr>`;
    }).join('');
  }
  document.getElementById('txinfo').textContent = f.length ? `${start + 1}-${Math.min(start + pp, f.length)} of ${f.length}` : '';
}

// === ADD/EDIT MODAL ===
function openAdd() {
  const isEdit = editId !== null;
  const h = `<div class="mo show" id="madd" onclick="if(event.target===this)tryClose()"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? 'Edit' : 'Add'} Transaction</div><div class="mds">Type → Category → Subcategory</div></div><button class="mx" onclick="tryClose()">✕</button></div><form id="aform" onsubmit="saveTxn(event)"><div class="fr"><div class="fg"><label class="fl">Date *</label><input class="fi" type="date" id="f_d" required value="${new Date().toISOString().split('T')[0]}"></div><div class="fg"><label class="fl">Type *</label><select class="fi" id="f_t" required onchange="cascType()"><option value="">Select</option><option value="Income">Income</option><option value="Expense">Expense</option><option value="Savings">Savings</option></select></div></div><div class="fr"><div class="fg"><label class="fl">Category *</label><select class="fi" id="f_c" required onchange="cascCat()"><option value="">Select type first</option></select></div><div class="fg"><label class="fl">Subcategory</label><select class="fi" id="f_s"><option value="">Select category</option></select></div></div><div class="fr"><div class="fg"><label class="fl">Amount (RM) *</label><input class="fi" type="number" step="0.01" id="f_a" required placeholder="0.00"></div><div class="fg"><label class="fl">Description</label><input class="fi" id="f_dt" placeholder="Details"></div></div><div class="ma"><button type="button" class="btn bs" onclick="tryClose()">Cancel</button><button type="submit" class="btn bp">${isEdit ? 'Update' : 'Save'}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function cascType() {
  const t = document.getElementById('f_t').value;
  const c = document.getElementById('f_c');
  const s = document.getElementById('f_s');
  c.innerHTML = '<option value="">Select</option>';
  s.innerHTML = '<option value="">-</option>';
  if (t && SCHEMA[t]) Object.keys(SCHEMA[t]).forEach(k => c.innerHTML += `<option>${k}</option>`);
}

function cascCat() {
  const t = document.getElementById('f_t').value;
  const cat = document.getElementById('f_c').value;
  const s = document.getElementById('f_s');
  s.innerHTML = '<option value="">-</option>';
  if (t && cat && SCHEMA[t] && SCHEMA[t][cat]) SCHEMA[t][cat].forEach(v => s.innerHTML += `<option>${v}</option>`);
}

function tryClose() {
  const el = document.getElementById('madd');
  if (el) { el.remove(); document.body.style.overflow = ''; editId = null; document.getElementById('addbtn')?.focus(); }
}

function saveTxn(e) {
  e.preventDefault();
  const data = {
    d: document.getElementById('f_d').value,
    t: document.getElementById('f_t').value,
    c: document.getElementById('f_c').value,
    s: document.getElementById('f_s').value || '',
    a: parseFloat(document.getElementById('f_a').value),
    dt: document.getElementById('f_dt').value || ''
  };
  if (editId) {
    const i = TXN.findIndex(t => t.id === editId);
    if (i >= 0) TXN[i] = { ...TXN[i], ...data };
    toast('✅ Updated');
  } else {
    data.id = nxId++;
    TXN.push(data);
    toast('✅ Added');
  }
  saveTXN();
  tryClose();
  renderTxnTable();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const m = document.getElementById('madd');
    if (m) { tryClose(); return; }
    const a = document.getElementById('mauth');
    if (a) { a.remove(); document.body.style.overflow = ''; return; }
  }
});

// === AUTH + DELETE ===
function doAuth(action, id) {
  if (Date.now() < lockUntil) { toast('🔒 Locked'); return; }
  pendAct = { action, id };
  const h = `<div class="mo show" id="mauth" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">🔒 Authentication</div><div class="mds">Enter passkey to continue</div></div></div><div class="fg"><label class="fl">Passkey</label><input class="fi" type="password" id="f_pk" placeholder="Enter passkey" autofocus></div><div class="ferr" id="pkerr"></div><div id="pklck"></div><div class="ma"><button class="btn bs" onclick="document.getElementById('mauth').remove();document.body.style.overflow=''">Cancel</button><button class="btn bp" onclick="verifyPK()">Confirm</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f_pk')?.focus(), 50);
}

function verifyPK() {
  if (Date.now() < lockUntil) return;
  const v = document.getElementById('f_pk').value;
  if (v === getPK()) {
    authAtt = 0;
    document.getElementById('mauth').remove();
    document.body.style.overflow = '';
    if (pendAct.action === 'edit') doEdit(pendAct.id);
    else doDelConfirm(pendAct.id);
  } else {
    authAtt++;
    if (authAtt >= 3) {
      lockUntil = Date.now() + 30000;
      document.getElementById('pklck').innerHTML = '<div style="color:var(--rose);font-size:12px;padding:8px;background:var(--rose-light);border-radius:6px;margin-top:8px;text-align:center">Locked 30s</div>';
      setTimeout(() => { authAtt = 0; }, 30000);
    } else {
      const e = document.getElementById('pkerr');
      e.textContent = 'Incorrect. ' + (3 - authAtt) + ' left';
      e.classList.add('show');
    }
  }
}

function doEdit(id) {
  const t = TXN.find(x => x.id === id);
  if (!t) return;
  editId = id;
  openAdd();
  setTimeout(() => {
    document.getElementById('f_d').value = t.d;
    document.getElementById('f_t').value = t.t;
    cascType();
    setTimeout(() => {
      document.getElementById('f_c').value = t.c;
      cascCat();
      setTimeout(() => { document.getElementById('f_s').value = t.s || ''; }, 20);
    }, 20);
    document.getElementById('f_a').value = t.a;
    document.getElementById('f_dt').value = t.dt || '';
    document.querySelector('.mti').textContent = 'Edit Transaction';
  }, 30);
}

function doDelConfirm(id) {
  const t = TXN.find(x => x.id === id);
  if (!t) return;
  pendAct = { action: 'delete', id };
  const h = `<div class="mo show" id="mdel" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">⚠️ Delete Transaction</div><div class="mds">This cannot be undone.</div></div></div><div style="padding:12px;background:var(--rose-light);border-radius:8px;font-size:12px;margin-bottom:16px"><b>${t.c}</b> ${t.s ? '/ ' + t.s : ''} — RM ${t.a.toLocaleString()}</div><div class="ma"><button class="btn bs" onclick="document.getElementById('mdel').remove();document.body.style.overflow=''">Cancel</button><button class="btn bd" onclick="execDel()">Delete</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function execDel() {
  TXN = TXN.filter(t => t.id !== pendAct.id);
  saveTXN();
  document.getElementById('mdel').remove();
  document.body.style.overflow = '';
  toast('🗑 Deleted');
  renderTxnTable();
}

// === INVESTMENTS ===
function renderInvestments(c) {
  const inv = [{ n: 'KWSP', t: 'EPF', v: 10489, r: 0 }, { n: 'FCPO', t: 'Futures', v: 4900, r: -14 }, { n: 'Tabung Haji', t: 'TH', v: 1452, r: 8.8 }, { n: 'ASB', t: 'ASNB', v: 294, r: 21 }, { n: 'Saham PPK', t: 'Manual', v: 1498, r: 7 }, { n: 'Wise', t: 'Cash', v: 1073, r: 0.5 }, { n: 'RIA', t: 'Unit Trust', v: 100, r: 4.1 }, { n: 'Rize', t: 'Savings', v: 4, r: -64 }];
  c.innerHTML = `<div class="stitle">Investments</div><div class="ssub">Portfolio allocation, ROI, and suggestions</div><div class="kg">${[{ l: 'Portfolio', v: 'RM 22,741', cl: 'bl', ic: 'briefcase' }, { l: 'Allocation', v: '12 assets', cl: 'gn', ic: 'pie-chart' }, { l: 'Best ROI', v: '+21% ASB', cl: 'em', ic: 'trending-up' }].map(k => `<div class="kc ${k.cl}"><div class="ki"><i data-lucide="${k.ic}" width="18" height="18"></i></div><div class="kl">${k.l}</div><div class="kv">${k.v}</div></div>`).join('')}</div><div class="cg"><div class="cc"><div class="ct">Allocation</div><div style="height:240px"><canvas id="ic1"></canvas></div></div><div class="cc"><div class="ct">ROI by Asset</div><div style="height:240px"><canvas id="ic2"></canvas></div></div></div><div class="invg">${inv.map(i => `<div class="invc"><div class="invn">${i.n}</div><div class="invp">${i.t}</div><div class="invv">${fmt(i.v)}</div><div class="invr ${i.r >= 0 ? 'pos' : 'neg'}">${i.r >= 0 ? '↑' : '↓'} ${i.r}%</div></div>`).join('')}</div><div class="ib"><div class="ic"><span class="ie">💡</span><div class="ix"><b>AI:</b> Reduce FCPO exposure. Consider fixed income for stability.</div></div></div>`;
  lucide.createIcons();
  setTimeout(() => {
    const tc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const gc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    new Chart(document.getElementById('ic1'), { type: 'pie', data: { labels: inv.map(i => i.n), datasets: [{ data: inv.map(i => i.v), backgroundColor: ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: tc, font: { size: 10 } } } } } });
    new Chart(document.getElementById('ic2'), { type: 'bar', data: { labels: inv.map(i => i.n), datasets: [{ data: inv.map(i => i.r), backgroundColor: inv.map(i => i.r >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(244,63,94,0.7)'), borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => v + '%' } } } } });
  }, 50);
}

// === GOALS ===
function renderGoals(c) {
  const goals = [{ n: 'Emergency Fund', e: '🛡️', t: 15000, c: 8251 }, { n: 'House Fund', e: '🏠', t: 50000, c: 10489 }, { n: 'Investment Goal', e: '📈', t: 28600, c: 18146 }, { n: 'Travel Fund', e: '✈️', t: 5000, c: 1200 }];
  c.innerHTML = `<div class="stitle">Goals</div><div class="ssub">Track your financial milestones</div><div class="gg">${goals.map(g => {
    const p = Math.max(0, Math.min(g.c / g.t, 1));
    return `<div class="gc"><div class="gh"><div><div class="gn">${g.n}</div><div class="gsb">Target: ${fmt(g.t)}</div></div><div class="ge">${g.e}</div></div><div class="gpb"><div class="gpf" style="width:${p * 100}%;background:${p >= .7 ? 'var(--emerald)' : p >= .4 ? 'var(--amber)' : 'var(--rose)'}"></div></div><div class="gst"><span>${fmt(g.c)}</span><b>${(p * 100).toFixed(0)}%</b></div></div>`;
  }).join('')}</div>`;
}

// === ANALYTICS ===
function renderAnalytics(c) {
  c.innerHTML = `<div class="stitle">Analytics</div><div class="ssub">Cash flow, savings, budget utilization, and forecast</div><div class="ang"><div class="cc"><div class="ct">Monthly Cash Flow</div><div style="height:220px"><canvas id="an1"></canvas></div></div><div class="cc"><div class="ct">Savings Rate</div><div style="height:220px"><canvas id="an2"></canvas></div></div><div class="cc"><div class="ct">Budget Utilization</div><div style="height:220px"><canvas id="an3"></canvas></div></div><div class="cc"><div class="ct">Forecast</div><div style="height:220px"><canvas id="an4"></canvas></div></div></div>`;
  setTimeout(() => {
    const year = getSelectedYear();
    const MD = computeMonthlyData(year);
    const EC = computeExpenseCategories(year);
    const am = MD.filter(m => m.i > 0);
    const tc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const gc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    new Chart(document.getElementById('an1'), { type: 'bar', data: { labels: am.map(m => m.m), datasets: [{ label: 'Income', data: am.map(m => m.i), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 }, { label: 'Expenses', data: am.map(m => m.e), backgroundColor: 'rgba(244,63,94,0.7)', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 } } } }, scales: { x: { grid: { display: false }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc } } } } });
    new Chart(document.getElementById('an2'), { type: 'line', data: { labels: am.map(m => m.m), datasets: [{ data: am.map(m => m.i > 0 ? (m.s / m.i * 100).toFixed(1) : 0), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: .4, pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => v + '%' } } } } });
    new Chart(document.getElementById('an3'), { type: 'bar', data: { labels: EC.map(c => c.n), datasets: [{ label: 'Actual', data: EC.map(c => c.a), backgroundColor: 'rgba(244,63,94,0.7)', borderRadius: 4 }, { label: 'Budget', data: EC.map(c => c.b), backgroundColor: 'rgba(99,102,241,0.25)', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { position: 'bottom', labels: { color: tc, font: { size: 10 } } } }, scales: { x: { grid: { color: gc }, ticks: { color: tc } }, y: { grid: { display: false }, ticks: { color: tc, font: { size: 10 } } } } } });
    new Chart(document.getElementById('an4'), { type: 'line', data: { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [{ label: 'Income', data: [8400, 8350, 8300, 8250, 8200, 8150], borderColor: '#10b981', borderDash: [5, 4], fill: false, tension: .3 }, { label: 'Expenses', data: [5400, 5350, 5300, 5250, 5200, 5150], borderColor: '#f43f5e', borderDash: [5, 4], fill: false, tension: .3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 } } } }, scales: { x: { grid: { display: false }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc } } } } });
  }, 50);
}

// === REPORTS ===
function renderReports(c) {
  const year = getSelectedYear();
  const MD = computeMonthlyData(year);
  const ti = MD.reduce((s, m) => s + m.i, 0), te = MD.reduce((s, m) => s + m.e, 0);
  c.innerHTML = `<div class="stitle">Reports</div><div class="ssub">Summaries with export options</div><div class="rc"><div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap"><select class="fsel"><option>Yearly</option><option>Monthly</option><option>Quarterly</option></select><button class="btn bs">PDF</button><button class="btn bs">Excel</button><button class="btn bs">CSV</button><button class="btn bs">Print</button></div><div class="kg">${[{ l: 'Income', v: fmt(ti), cl: 'em' }, { l: 'Expenses', v: fmt(te), cl: 'rs' }, { l: 'Net', v: fmt(ti - te), cl: 'bl' }, { l: 'Investments', v: 'RM 22,741', cl: 'gd' }].map(k => `<div class="kc ${k.cl}"><div class="kl">${k.l}</div><div class="kv">${k.v}</div></div>`).join('')}</div></div><div class="rc"><div class="ct">Monthly Breakdown</div><div style="overflow-x:auto"><table><thead><tr><th>Month</th><th style="text-align:right">Income</th><th style="text-align:right">Expenses</th><th style="text-align:right">Savings</th><th style="text-align:right">Net</th></tr></thead><tbody>${MD.filter(m => m.i > 0).map(m => `<tr><td><b>${m.m}</b></td><td class="ai" style="text-align:right">${fmtD(m.i)}</td><td class="ae" style="text-align:right">${fmtD(m.e)}</td><td style="text-align:right;color:var(--blue);font-weight:600">${fmtD(m.s)}</td><td style="text-align:right;font-weight:600">${fmtD(m.i - m.e)}</td></tr>`).join('')}</tbody></table></div></div>`;
}

// === AI ASSISTANT ===
function renderAI(c) {
  c.innerHTML = `<div class="stitle">AI Assistant</div><div class="ssub">Ask about spending, budget, forecast, goals, or investments</div><div class="ib"><div class="ic"><span class="ie">📈</span><div class="ix"><b>Summary:</b> Income stable. Loans dominate. Rate improving.</div></div><div class="ic"><span class="ie">🎯</span><div class="ix"><b>Goal tip:</b> Emergency Fund is your quickest win.</div></div><div class="ic"><span class="ie">💼</span><div class="ix"><b>Investment:</b> Reduce FCPO, add fixed income.</div></div></div><div class="aicont"><div class="aimsg" id="aimsg"><div class="aim ast"><div class="aiav">🤖</div><div class="aib"><b>Hi Irsyad!</b> Ask me about spending habits, budget, forecasting, goals, or investments.</div></div></div><div class="aiinp"><input id="aiinp" placeholder="Ask about your finances..." onkeydown="if(event.key==='Enter')sendAI()"><button class="aisnd" onclick="sendAI()"><i data-lucide="send" width="16" height="16"></i></button></div></div>`;
  lucide.createIcons();
}

function sendAI() {
  const inp = document.getElementById('aiinp'), msg = inp.value.trim();
  if (!msg) return;
  const box = document.getElementById('aimsg');
  box.innerHTML += `<div class="aim usr"><div class="aiav">MI</div><div class="aib">${msg}</div></div>`;
  inp.value = '';
  setTimeout(() => {
    const year = getSelectedYear();
    const MD = computeMonthlyData(year);
    const EC = computeExpenseCategories(year);
    const ti = MD.reduce((s, m) => s + m.i, 0), te = MD.reduce((s, m) => s + m.e, 0), ts = MD.reduce((s, m) => s + m.s, 0);
    const topCat = EC.length ? EC[0] : { n: 'None', a: 0 };
    const savRate = ti > 0 ? (ts / ti * 100).toFixed(1) : '0';
    let r = `Income ${fmt(ti)}. Expenses ${fmt(te)}. Top: ${topCat.n} (${te > 0 ? (topCat.a / te * 100).toFixed(0) : 0}%). Saving rate ${savRate}%.`;
    const l = msg.toLowerCase();
    if (l.includes('april') || l.includes('spike')) { const apr = MD[3]; r = `April expenses were ${fmt(apr.e)}. Check for any large one-off payments that month.`; }
    else if (l.includes('budget')) { const budUsed = te > 0 && 52740 > 0 ? (te / 52740 * 100).toFixed(0) : 0; r = `Budget is ${budUsed}% used. ${EC.filter(c => c.b > 0 && c.a > c.b).map(c => c.n + ' (over by ' + fmt(c.a - c.b) + ')').join(', ') || 'All categories within budget.'}`; }
    else if (l.includes('forecast') || l.includes('predict')) { const avgI = ti / Math.max(MD.filter(m => m.i > 0).length, 1); const avgE = te / Math.max(MD.filter(m => m.e > 0).length, 1); r = `Based on ${year} data: avg income ${fmt(avgI)}/mo, avg expenses ${fmt(avgE)}/mo. Net ~+${fmt(avgI - avgE)}/mo.`; }
    else if (l.includes('goal')) r = 'Emergency Fund at 55%. Fastest win. Focus contributions there before stretching further.';
    else if (l.includes('invest')) r = 'Portfolio RM22,741. FCPO is volatile (-14%). Shift new money to KWSP/ASB for stability.';
    else if (l.includes('saving')) { r = `Saving rate is ${savRate}% YTD. To hit 20%, save ~${fmt(ti * 0.2 / 12 - ts / 12)}/mo more.`; }
    box.innerHTML += `<div class="aim ast"><div class="aiav">🤖</div><div class="aib">${r}</div></div>`;
    box.scrollTop = box.scrollHeight;
  }, 600);
  box.scrollTop = box.scrollHeight;
}

// === SETTINGS (v10.0 Enhanced) ===
function renderSettings(c) {
  c.innerHTML = `<div class="stitle">${t('set_title')}</div><div class="ssub">${t('set_sub')}</div><div class="setg"><div class="setn"><div class="sni active" onclick="setTab(this,'general')"><i data-lucide="sliders" width="14" height="14"></i>${t('set_general')}</div><div class="sni" onclick="setTab(this,'security')"><i data-lucide="shield" width="14" height="14"></i>${t('set_security')}</div><div class="sni" onclick="setTab(this,'categories')"><i data-lucide="tag" width="14" height="14"></i>${t('set_categories')}</div><div class="sni" onclick="setTab(this,'accounts')"><i data-lucide="building-2" width="14" height="14"></i>${t('set_accounts')}</div><div class="sni" onclick="setTab(this,'import')"><i data-lucide="upload" width="14" height="14"></i>${t('set_import')}</div><div class="sni" onclick="setTab(this,'backup')"><i data-lucide="hard-drive" width="14" height="14"></i>${t('set_backup')}</div></div><div class="setc" id="setc"></div></div>`;
  lucide.createIcons();
  setTab(null, 'general');
}

function setTab(el, tab) {
  if (el) { document.querySelectorAll('.sni').forEach(i => i.classList.remove('active')); el.classList.add('active'); }
  const c = document.getElementById('setc');
  if (tab === 'general') {
    const currencyOptions = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => `<option value="${code}"${code === displayCurrency ? ' selected' : ''}>${code} (${cfg.symbol}) - ${cfg.name}</option>`).join('');
    const langOptions = [['en','English'],['zh','简体中文'],['ja','日本語']].map(([code, name]) => `<option value="${code}"${code === currentLang ? ' selected' : ''}>${name}</option>`).join('');
    const rateInfo = ratesLastUpdated ? `${t('set_rate_info')}: ${new Date(ratesLastUpdated).toLocaleString()}` : '';
    c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:16px">${t('set_general')}</h3><div class="fg"><label class="fl">${t('set_currency')}</label><p style="font-size:11px;color:var(--text-tertiary);margin-bottom:6px">${t('set_currency_desc')}</p><select class="fi" style="max-width:320px" id="set_currency" onchange="handleCurrencyChange(this.value)">${currencyOptions}</select><div style="margin-top:6px;font-size:10px;color:var(--text-tertiary)" id="rateStatus">${rateInfo}</div></div><div class="fg" style="margin-top:16px"><label class="fl">${t('set_language')}</label><p style="font-size:11px;color:var(--text-tertiary);margin-bottom:6px">${t('set_language_desc')}</p><select class="fi" style="max-width:320px" id="set_lang" onchange="setLang(this.value)">${langOptions}</select></div><div style="margin-top:20px"><div class="trow"><div class="tinf"><div class="tna">${t('set_dark_mode')}</div><div class="tde">${t('set_theme')}</div></div><div class="tsw ${document.documentElement.dataset.theme === 'dark' ? 'on' : ''}" onclick="toggleTheme();this.classList.toggle('on')"></div></div><div class="trow"><div class="tinf"><div class="tna">${t('set_notifications')}</div><div class="tde">${t('set_budget_alerts')}</div></div><div class="tsw on" onclick="this.classList.toggle('on')"></div></div></div>`;
  } else if (tab === 'security') {
    c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${t('set_sec_title')}</h3><p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">${t('set_sec_desc')}</p><div class="fg"><label class="fl">${t('set_cur_pk')}</label><input class="fi" type="password" id="spkc" style="max-width:200px"></div><div class="fg"><label class="fl">${t('set_new_pk')}</label><input class="fi" type="password" id="spkn" style="max-width:200px"></div><button class="btn bp" onclick="chgPK()">${t('set_update')}</button><div style="margin-top:20px"><div class="trow"><div class="tinf"><div class="tna">${t('set_2fa')}</div><div class="tde">${t('set_2fa_desc')}</div></div><div class="tsw" onclick="this.classList.toggle('on')"></div></div></div>`;
  } else if (tab === 'categories') {
    c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${t('set_cat_title')}</h3><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">${Object.entries(SCHEMA).map(([tp, cats]) => `<div><div style="font-size:10px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:6px">${tp}</div>${Object.keys(cats).map(ct => `<div style="padding:6px 10px;background:var(--bg-primary);border-radius:5px;font-size:11px;margin-bottom:3px">${ct}</div>`).join('')}</div>`).join('')}</div>`;
  } else if (tab === 'accounts') {
    c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${t('set_acc_title')}</h3><p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">${t('set_acc_desc')}</p><div style="display:flex;flex-direction:column;gap:6px">${['CIMB', 'UOB', 'Wise', 'Cash', 'TNGO', 'KWSP', 'ASB', 'Versa', 'Future'].map(a => `<div style="padding:8px 12px;background:var(--bg-primary);border-radius:6px;font-size:12px;display:flex;justify-content:space-between"><span>${a}</span><span style="color:var(--text-tertiary)">${t('set_active')}</span></div>`).join('')}</div>`;
  } else if (tab === 'import') {
    c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${t('set_imp_title')}</h3><div style="display:flex;flex-direction:column;gap:10px"><button class="btn bp">${t('set_imp_excel')}</button><button class="btn bs">${t('set_imp_csv')}</button><button class="btn bs">${t('set_exp_csv')}</button><button class="btn bs">${t('set_exp_pdf')}</button></div>`;
  } else if (tab === 'backup') {
    c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${t('set_bak_title')}</h3><button class="btn bp">${t('set_bak_create')}</button> <button class="btn bs">${t('set_bak_restore')}</button><div style="margin-top:16px"><div class="trow"><div class="tinf"><div class="tna">${t('set_auto_bak')}</div><div class="tde">${t('set_auto_bak_desc')}</div></div><div class="tsw on" onclick="this.classList.toggle('on')"></div></div></div>`;
  }
}

async function handleCurrencyChange(currency) {
  const statusEl = document.getElementById('rateStatus');
  if (statusEl) statusEl.textContent = t('set_fetching');
  const success = await fetchExchangeRates();
  if (!success && statusEl) statusEl.textContent = t('set_rate_failed');
  else if (statusEl) statusEl.textContent = `${t('set_rate_info')}: ${new Date().toLocaleString()}`;
  setCurrency(currency);
}

function chgPK() {
  const cur = document.getElementById('spkc')?.value, nw = document.getElementById('spkn')?.value;
  if (cur !== getPK()) { toast(t('set_pk_wrong')); return; }
  if (!nw || nw.length < 4) { toast(t('set_pk_min')); return; }
  localStorage.setItem('ft_pk', nw);
  toast(t('set_pk_ok'));
}

// === INIT ===
function init() {
  loadTXN();
  const st = localStorage.getItem('theme');
  if (st) {
    document.documentElement.dataset.theme = st;
    if (st === 'dark') document.getElementById('thico').dataset.lucide = 'moon';
  }
  // v10.0: Load language + currency preferences
  currentLang = localStorage.getItem('ft_lang') || 'en';
  displayCurrency = localStorage.getItem('ft_currency') || 'MYR';
  // Apply CJK font if needed
  if (currentLang === 'zh') document.body.style.fontFamily = "'Noto Sans SC', 'Inter', system-ui, sans-serif";
  else if (currentLang === 'ja') document.body.style.fontFamily = "'Noto Sans JP', 'Inter', system-ui, sans-serif";
  else document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
  updateNavLabels();
  // Update month filter with translated names
  const mf = document.getElementById('mf');
  if (mf) {
    const mNames = getMonthNames();
    mf.options[0].textContent = t('hdr_total_year');
    for (let i = 1; i <= 12; i++) mf.options[i].textContent = mNames[i - 1];
  }
  lucide.createIcons();
  render();
  // Fetch fresh rates in background
  fetchExchangeRates();
}

const rdy = setInterval(() => {
  if (typeof lucide !== 'undefined' && typeof Chart !== 'undefined') {
    clearInterval(rdy);
    init();
  }
}, 50);
