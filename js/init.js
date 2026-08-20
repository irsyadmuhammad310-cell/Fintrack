// === INIT (FinTrack Premium V2.0.1 Modular Boot) ===
document.addEventListener("DOMContentLoaded", () => lucide.createIcons());

// Populate header year dropdown
document.getElementById('yf').innerHTML = buildYearOptions(CURRENT_YEAR);

// === USER NAME & GREETING ===
function getUserName() { return safeGet('ft_username') || ''; }
function getUserTitle() { return safeGet('ft_user_title') || ''; }
function setUserName(name) { safeSave('ft_username', name); updateUserDisplay(); }
function setUserTitle(title) { safeSave('ft_user_title', title); }

function getGreeting() {
  const h = new Date().getHours();
  const name = getUserName() || '';
  const title = getUserTitle();
  const displayName = title && name ? `${title} ${name}` : title ? title : name ? name : '';
  const lang = safeGet('ft_lang') || 'en';
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const greetings = {
    en: {
      night: ['Still up?', 'Burning the midnight oil,', 'Late night grind,', 'Night owl mode,', "Can't sleep?", 'Working late,', 'Midnight hustle,', 'The quiet hours,', 'Burning candles,', 'Nocturnal mode,', 'Moonlight check,', 'After hours,', 'Night shift energy,', 'Dark mode activated,', 'Sleepless and counting,', 'The world sleeps but you don\'t,', 'Quiet hours, big moves,', '3AM thoughts,', 'Stars are out,', 'Late bloomer,'],
      morning: ['Good morning,', 'Morning,', 'Rise and shine,', 'Top of the morning,', 'Fresh start today,', 'New day, new wins,', 'Early bird,', 'Bright and early,', 'Morning sunshine,', "Let's get it,", 'Wakey wakey,', 'Dawn patrol,', 'Hello sunshine,', 'First things first,', 'A brand new day,', 'Coffee time,', 'Up and at it,', 'Seize the day,', 'Carpe diem,', 'Off to a great start,', 'Rise up,', 'Good vibes this morning,', 'Make today count,', 'Another chance to win,'],
      afternoon: ['Good afternoon,', 'Afternoon,', 'Hey,', "What's good,", 'Midday check-in,', "How's the day,", 'Back at it,', 'Afternoon vibes,', 'Hey champ,', "What's cooking,", 'Halfway there,', 'Keep pushing,', 'Power hour,', 'Still going strong,', 'Lunch break over?', 'Afternoon hustle,', 'The grind continues,', 'Cruising along,', 'Afternoon energy,', 'Second wind,', 'Post-lunch mode,', 'Staying sharp,', 'Killing it today,', 'On a roll,'],
      evening: ['Good evening,', 'Evening,', 'Hey there,', 'Welcome back,', 'Winding down?', 'End of day review,', 'Evening check-in,', 'Almost done,', 'Sunset vibes,', "Day's wrapping up,", 'Home stretch,', 'Relax mode,', 'Golden hour,', 'Well done today,', 'Evening calm,', 'Powered through,', 'Sun is setting,', 'Good day?', 'Time to unwind,', 'Another day conquered,', 'You made it,', 'Evening reflection,', 'Done for the day?', 'Closing time,'],
      latenight: ['Good evening,', 'Night shift?', 'Back again,', 'Hey,', 'Still grinding?', 'One more look?', 'Before bed?', 'Night check,', 'Burning midnight oil,', 'Last peek,', 'Night owl,', 'Can\'t stop won\'t stop,', 'One last thing,', 'Final check,', 'Sleep can wait,', 'Moonlit hustle,', 'Just one more,', 'Almost bedtime,', 'Wrapping up?', 'Night mode,']
    },
    ms: {
      night: ['Masih terjaga?', 'Kerja malam,', 'Tak boleh tidur?', 'Rajin betul,', 'Malam yang senyap,', 'Night owl mode,', 'Hustle lewat malam,', 'Burning midnight oil,', 'Tak ngantuk lagi?', 'Malam produktif,', 'Berjaga malam,', 'Senyap tapi sibuk,', 'Malam panjang,', 'Masih on fire,', 'Semangat malam,', 'Power tak habis,', 'Midnight warrior,', 'Kopi masih berkesan,', 'Malam penuh makna,', 'Sambung esok boleh tak?'],
      morning: ['Selamat pagi,', 'Pagi,', 'Assalamualaikum,', 'Semangat pagi,', 'Pagi yang cerah,', 'Bismillah,', 'Hari baru,', 'Jom hustle,', 'Fresh morning,', 'Pagi2 dah rajin,', 'Bangun awal ni,', 'Subuh productivity,', 'Ayuh mula hari ni,', 'Segar pagi ni,', 'Alhamdulillah pagi,', 'Rezeki baru menanti,', 'Pagi yang indah,', 'Peluang baru hari ni,', 'Semangat waja,', 'Dah ready?', 'Pagi cerah, hati ceria,', 'Gas pagi ni,', 'Hari baru, peluang baru,', 'Productive morning,'],
      afternoon: ['Selamat petang,', 'Petang,', 'Hey,', 'Apa khabar,', 'Tengah hari check-in,', 'Macam mana hari ni,', 'Semangat lagi,', 'Petang produktif,', 'Keep going,', 'Halfway there,', 'Jangan give up,', 'Teruskan,', 'Power petang,', 'Masih on track,', 'Lunch dah?', 'Kuat lagi,', 'Layan petang,', 'Steady lah,', 'Mood petang,', 'Santai tapi progress,', 'On fire petang ni,', 'Maintain momentum,', 'Boleh lagi ni,', 'Push sikit lagi,'],
      evening: ['Selamat malam,', 'Malam,', 'Eh dah malam,', 'Balik kerja?', 'Rehat jap,', 'Review harian,', 'Alhamdulillah,', 'Malam yang tenang,', 'Winding down,', 'Hari hampir tamat,', 'Penat tak?', 'Good job hari ni,', 'Tahniah hari ni,', 'Sunset check,', 'Malam santai,', 'Kerja siap?', 'Akhirnya malam,', 'Refleksi malam,', 'Berehat sat,', 'Hari yang penuh,', 'Bersyukur,', 'Nikmat malam,', 'Done for today?', 'Congrats survived today,'],
      latenight: ['Selamat malam,', 'Tak tidur lagi?', 'Kerja lagi?', 'Night owl ni,', 'Last check,', 'Sebelum tidur?', 'Rajinnya,', 'Hustle tak berhenti,', 'Mata masih celik,', 'Satu lagi peek,', 'Macam tak penat je,', 'Dedicated betul,', 'Terakhir hari ni,', 'Almost done,', 'Last round,', 'Esok hari baru,', 'Tido sat lagi,', 'One more check,', 'Malam masih muda,', 'Hebat lah kau,']
    },
    id: {
      night: ['Masih bangun?', 'Begadang,', 'Kerja malam,', 'Belum tidur?', 'Rajin banget,', 'Malam yang tenang,', 'Night mode,', 'Lembur ya,', 'Masih semangat,', 'Nocturnal mode,', 'Malam panjang,', 'Masih sibuk,', 'Midnight grind,', 'Tidur bisa nanti,', 'Malam produktif,', 'Kopi masih ngefek,', 'Warrior malam,', 'Semangat 45,', 'Masih on,', 'Begadang dulu,'],
      morning: ['Selamat pagi,', 'Pagi,', 'Semangat pagi,', 'Pagi yang indah,', 'Bismillah,', 'Hari baru,', 'Yuk mulai,', 'Pagi cerah,', 'Bangun pagi rejeki,', 'Fresh pagi,', 'Selamat beraktivitas,', 'Ayo produktif,', 'Pagi baru semangat baru,', 'Hari penuh peluang,', 'Rise and shine,', 'Gas pagi ini,', 'Siap tempur,', 'Pagi menawan,', 'Rezeki pagi,', 'Mulai dengan senyum,', 'Energi penuh,', 'Pagi yang segar,', 'Lets go,', 'Bismillah mulai,'],
      afternoon: ['Selamat siang,', 'Siang,', 'Hai,', 'Apa kabar,', 'Siang produktif,', 'Gimana harinya,', 'Semangat terus,', 'Midday hustle,', 'Keep going,', 'Lanjut terus,', 'Setengah jalan,', 'Gas terus,', 'Masih semangat?', 'Power siang,', 'Sudah makan?', 'On track terus,', 'Siang yang sibuk,', 'Steady,', 'Push lagi,', 'Jalan terus,', 'Maintain pace,', 'Sip siang ini,', 'Lanjut gas,', 'Keren hari ini,'],
      evening: ['Selamat malam,', 'Malam,', 'Hai,', 'Sudah malam,', 'Pulang kerja?', 'Waktunya review,', 'Alhamdulillah,', 'Malam tenang,', 'Winding down,', 'Hari hampir selesai,', 'Capek ya?', 'Istirahat dulu,', 'Good job hari ini,', 'Malam santai,', 'Refleksi malam,', 'Bersyukur,', 'Selesai sudah,', 'Malam indah,', 'Congrats,', 'Sunset vibes,', 'Relax mode on,', 'Akhirnya,', 'Tenang dulu,', 'Hari yang bermakna,'],
      latenight: ['Selamat malam,', 'Belum tidur?', 'Kerja lagi?', 'Night owl,', 'Cek terakhir,', 'Sebelum tidur?', 'Rajin ya,', 'Late night grind,', 'Masih on?', 'Satu lagi,', 'Dedicated banget,', 'Last round,', 'Besok hari baru,', 'Tidur bentar lagi,', 'Final check,', 'Malam masih muda,', 'Semangat terus,', 'Hampir selesai,', 'Satu hal lagi,', 'Istirahat soon,']
    },
    zh: {
      night: ['还没睡？', '夜猫子模式，', '深夜奋斗，', '熬夜中，', '安静的夜晚，', '午夜冲刺，', '晚上好，', '加油，', '夜深了，', '还在忙？', '月光下的努力，', '夜未央，', '深夜档，', '安静的时光，', '星星都出来了，', '不眠之夜，', '夜色正好，', '默默努力，', '夜间模式，', '最后看一眼，'],
      morning: ['早上好，', '早安，', '新的一天，', '阳光明媚，', '早起的鸟儿，', '精神抖擞，', '美好的早晨，', '开始新的一天，', '今天加油，', '早安打工人，', '元气满满，', '新的开始，', '又是充满希望的一天，', '朝气蓬勃，', '一日之计在于晨，', '满血复活，', '朝阳初升，', '美好在前方，', '今天也要努力，', '清晨的力量，', '准备好了吗，', '让我们开始吧，', '崭新的一天，', '阳光正好，'],
      afternoon: ['下午好，', '午安，', '你好，', '下午了，', '今天怎么样，', '继续加油，', '下午茶时间，', '半天过去了，', '保持节奏，', '午后时光，', '加油干，', '继续前进，', '状态还好吗，', '坚持就是胜利，', '下半场开始，', '稳步前进，', '效率时间，', '继续保持，', '午后加油，', '再接再厉，', '马力全开，', '冲刺下午，', '节奏不变，', '你很棒，'],
      evening: ['晚上好，', '晚安，', '辛苦了，', '回来了，', '一天快结束了，', '放松一下，', '晚间回顾，', '今天辛苦了，', '日落时分，', '准备休息了？', '收工了，', '晚上愉快，', '今天真棒，', '安静的夜晚，', '值得休息，', '完美的一天，', '轻松一下，', '感恩今天，', '夕阳很美，', '结束了吗，', '今天很充实，', '好好休息，', '一天圆满，', '值得庆祝，'],
      latenight: ['晚上好，', '还在忙？', '又回来了，', '夜深了，', '最后看一眼？', '睡前检查，', '辛苦了，', '夜间模式，', '快去睡吧，', '最后一次，', '明天见，', '该休息了，', '夜色深沉，', '收尾了，', '明天更好，', '放下手机，', '安心入睡，', '今晚到此，', '梦里见，', '晚安，']
    },
    ja: {
      night: ['まだ起きてる？', '夜更かし中，', '深夜の頑張り，', '眠れない？', '静かな夜，', '真夜中のハッスル，', 'お疲れ様，', '夜型モード，', 'もう寝よう，', '深夜作業，', '月明かりの中で，', '夜は長い，', '静かな時間，', '深夜のチャレンジ，', '星空の下で，', '不眠の夜，', '夜が明けるまで，', '頑張り屋さん，', 'ラストスパート，', 'あと少し，'],
      morning: ['おはようございます，', 'おはよう，', '新しい一日，', '爽やかな朝，', '今日も頑張ろう，', '朝活中，', '素敵な朝，', 'いい天気，', '早起きは三文の徳，', 'さあ始めよう，', '元気出して，', '朝のルーティン，', '希望に満ちた朝，', '気持ちのいい朝，', '今日も一日，', 'フレッシュスタート，', '朝日が眩しい，', '新しいチャンス，', 'やる気満々，', '最高の朝，', '準備はOK，', '今日のゴールは，', '朝から全力，', 'エネルギー満タン，'],
      afternoon: ['こんにちは，', '午後，', 'やあ，', '調子どう？', '午後も頑張ろう，', 'お昼のチェック，', '折り返し地点，', '午後のひととき，', 'ペース維持，', '順調？', 'あと半分，', '頑張って，', '午後のエネルギー，', 'いい感じ，', 'ランチ後の一踏ん張り，', '集中タイム，', 'まだまだ，', '午後も最高，', '絶好調？', 'リズムキープ，', '午後のパワー，', '進捗どう？', 'いいペース，', '余裕あり，'],
      evening: ['こんばんは，', '夜，', 'おかえり，', 'お疲れ様，', '一日の終わり，', 'リラックスタイム，', '振り返りの時間，', '今日もお疲れ，', '日没の頃，', 'もう少し，', 'ゆっくりして，', '今日も良い日，', '頑張った，', '素敵な夜，', '今日も最高だった，', '安らぎの時間，', '夕暮れ時，', '一日お疲れ，', '夜の静けさ，', 'ホッと一息，', '今日の成果は，', '安心して，', '穏やかな夜，', 'グッジョブ，'],
      latenight: ['こんばんは，', 'まだ頑張ってる？', 'また来たね，', '夜更けに，', '最後のチェック？', '寝る前に？', 'お疲れ様，', '深夜モード，', 'そろそろ寝よう，', 'ラストチェック，', '明日も頑張ろう，', 'おやすみ前に，', '夜も更けて，', '最後に一つ，', '今日はここまで，', '明日があるさ，', '静かな夜に，', 'もう十分，', '安らかに，', 'いい夢を，']
    },
    ko: {
      night: ['아직 안 자?', '야근 중,', '밤늦게까지,', '잠이 안 와?', '조용한 밤,', '한밤중 허슬,', '수고해,', '야행성 모드,', '아직 일해?', '밤새 작업,', '달빛 아래,', '밤은 길어,', '고요한 시간,', '야간 모드,', '별빛 아래서,', '불면의 밤,', '마지막 스퍼트,', '밤이 깊었어,', '열정적이네,', '밤의 전사,'],
      morning: ['좋은 아침,', '안녕,', '새로운 하루,', '상쾌한 아침,', '오늘도 화이팅,', '일찍 일어났네,', '좋은 하루 보내,', '아침 햇살,', '힘내자,', '시작하자,', '활기찬 아침,', '오늘의 시작,', '아침부터 열정,', '오늘도 최고,', '새로운 시작,', '에너지 충전,', '좋은 기운,', '오늘도 빛나,', '파워 모닝,', '아침이 좋다,', '오늘은 특별해,', '일어나자마자 화이팅,', '모닝 루틴,', '준비됐지?'],
      afternoon: ['안녕하세요,', '오후,', '점심 먹었어?', '오늘 어때,', '오후도 화이팅,', '반 지났다,', '계속 가자,', '오후 시간,', '잘하고 있어,', '페이스 유지,', '파이팅,', '거의 다 왔어,', '오후 에너지,', '좋은 흐름,', '계속 달려,', '집중 타임,', '아직 멀었어,', '순조로워,', '오후도 최고,', '리듬 유지,', '꾸준히,', '잘 되고 있어,', '자신감 있게,', '오후 파워,'],
      evening: ['좋은 저녁,', '저녁,', '돌아왔네,', '수고했어,', '하루 마무리,', '쉬는 시간,', '오늘 리뷰,', '퇴근 후,', '해질녘,', '거의 다 왔어,', '오늘도 고생,', '편히 쉬어,', '잘했어 오늘,', '저녁 노을,', '하루 끝,', '평화로운 밤,', '오늘 최고였어,', '쉬어가자,', '감사한 하루,', '마무리 잘,', '고요한 저녁,', '오늘의 성과,', '편안한 밤,', '굿 나잇,'],
      latenight: ['좋은 저녁,', '아직 일해?', '또 왔네,', '밤이야,', '마지막 체크?', '자기 전에?', '수고해,', '늦은 밤 모드,', '곧 자야지,', '마지막으로,', '내일 또 보자,', '자기 전 마지막,', '밤이 깊었어,', '하나만 더,', '오늘은 여기까지,', '내일이 있어,', '조용한 밤에,', '충분히 했어,', '편히 자,', '좋은 꿈,']
    },
    ru: {
      night: ['Ещё не спишь?', 'Работаешь допоздна,', 'Ночная смена,', 'Не спится?', 'Тихая ночь,', 'Полуночный хастл,', 'Добрый вечер,', 'Ночной режим,', 'Бессонница?', 'Последний взгляд,', 'Лунный свет,', 'Ночь длинная,', 'Тишина вокруг,', 'Ночной марафон,', 'Под звёздами,', 'Ночь без сна,', 'Последний рывок,', 'Глубокая ночь,', 'Мотивация 100%,', 'Ночной воин,'],
      morning: ['Доброе утро,', 'Утро,', 'С добрым утром,', 'Новый день,', 'Бодрое утро,', 'Раннее утро,', 'Отличное утро,', 'Начнём,', 'Солнечное утро,', 'Поехали,', 'Свежее утро,', 'Пора начинать,', 'Утро полно возможностей,', 'Энергия на максимуме,', 'Сегодня наш день,', 'Утренний заряд,', 'Новые горизонты,', 'Утро победителя,', 'Готов к свершениям,', 'Рассвет нового дня,', 'Утро добрых дел,', 'Вперёд к цели,', 'Продуктивное утро,', 'Энергия утра,'],
      afternoon: ['Добрый день,', 'День,', 'Привет,', 'Как дела,', 'Полдень,', 'Продолжаем,', 'Дневной чек,', 'Половина дня,', 'Держим темп,', 'Всё идёт,', 'Вперёд,', 'Не сдаёмся,', 'Дневная энергия,', 'Отлично идём,', 'После обеда,', 'Концентрация,', 'Ещё немного,', 'Всё по плану,', 'Дневной режим,', 'Ритм сохраняем,', 'Молодцом,', 'Прогресс есть,', 'Стабильно,', 'Уверенно,'],
      evening: ['Добрый вечер,', 'Вечер,', 'С возвращением,', 'Как день прошёл,', 'Конец дня,', 'Время отдыха,', 'Вечерний обзор,', 'Сегодня молодец,', 'Закат,', 'Почти всё,', 'Отдыхай,', 'Хороший день,', 'Отличный день,', 'Тихий вечер,', 'Заслуженный отдых,', 'Итоги дня,', 'Вечерний покой,', 'Спасибо себе,', 'Вечер красив,', 'Завершаем,', 'День удался,', 'Вечернее спокойствие,', 'Приятного вечера,', 'До завтра,'],
      latenight: ['Добрый вечер,', 'Ещё работаешь?', 'Снова здесь,', 'Ночь,', 'Последний взгляд?', 'Перед сном?', 'Молодец,', 'Поздний вечер,', 'Пора спать,', 'Финальный чек,', 'Завтра новый день,', 'Перед сном,', 'Уже поздно,', 'Ещё одно дело,', 'На сегодня всё,', 'Завтра будет лучше,', 'Тихая ночь,', 'Достаточно,', 'Спокойной ночи,', 'Сладких снов,']
    }
  };

  const welcomes = {
    en: ["Let's check your numbers.", 'Your finances await.', 'Ready to crush it.', 'Money moves time.', "Let's see where you stand.", 'Time to level up.', 'Your dashboard is ready.', "Numbers don't lie.", "Let's make progress.", 'Stack check time.', 'Every dollar counts.', 'Building wealth, one step at a time.', 'Your money story continues.', 'Let\'s make smart moves.', 'Financial clarity awaits.', 'Numbers are looking good.', 'Let\'s keep the streak going.', 'Growth is a daily habit.', 'Your future self thanks you.', ''],
    ms: ['Jom tengok duit.', 'Kewangan menanti.', 'Jom hustle.', 'Masa semak kewangan.', 'Dashboard siap.', 'Level up time.', 'Semak kedudukan.', 'Nombor tak tipu.', 'Jom progress.', 'Setiap sen dikira.', 'Konsisten adalah kunci.', 'Kewangan makin mantap.', 'Cerita duit anda.', 'Langkah bijak hari ni.', 'Clarity kewangan.', 'Nombor makin cantik.', 'Keep the streak.', 'Grow every day.', 'Masa depan cerah.', ''],
    id: ['Yuk cek keuangan.', 'Keuangan menunggu.', 'Siap hustle.', 'Waktunya cek.', 'Dashboard siap.', 'Level up.', 'Lihat posisi kamu.', 'Angka tidak bohong.', 'Yuk maju.', 'Setiap rupiah berarti.', 'Konsisten itu kunci.', 'Keuangan makin kuat.', 'Cerita uangmu.', 'Langkah cerdas.', 'Kejelasan keuangan.', 'Angka makin bagus.', 'Jaga momentum.', 'Tumbuh setiap hari.', 'Masa depan cerah.', ''],
    zh: ['看看你的数据。', '财务等着你。', '准备好了。', '该看看钱了。', '仪表盘就绪。', '升级时间。', '数字不会说谎。', '继续进步。', '每一分都重要。', '坚持就是胜利。', '财富在增长。', '你的故事在继续。', '聪明的决定。', '清晰的财务。', '数字越来越好。', '保持节奏。', '每天成长。', '未来可期。', '一步一个脚印。', ''],
    ja: ['数字を確認しよう。', '家計が待ってる。', '準備OK。', 'お金の時間。', 'ダッシュボード準備完了。', 'レベルアップ。', '数字は嘘つかない。', '進捗を見よう。', '一円も大切に。', '継続は力なり。', '資産成長中。', 'あなたの物語。', '賢い選択を。', '明確な家計。', '数字がいい感じ。', 'ペースを維持。', '毎日成長。', '未来は明るい。', '一歩ずつ確実に。', ''],
    ko: ['숫자를 확인하자.', '재정이 기다려.', '준비 완료.', '돈 관리 시간.', '대시보드 준비됨.', '레벨업 시간.', '숫자는 거짓말 안 해.', '진행 상황 보자.', '한 푼도 중요해.', '꾸준함이 핵심.', '자산 성장 중.', '네 이야기.', '현명한 선택.', '명확한 재정.', '숫자가 좋아지고 있어.', '페이스 유지.', '매일 성장.', '밝은 미래.', '한 걸음씩 확실히.', ''],
    ru: ['Проверим цифры.', 'Финансы ждут.', 'Готов к делу.', 'Время денег.', 'Дашборд готов.', 'Уровень вверх.', 'Цифры не врут.', 'Двигаемся дальше.', 'Каждый рубль важен.', 'Стабильность — ключ.', 'Капитал растёт.', 'Твоя история.', 'Умные решения.', 'Финансовая ясность.', 'Цифры радуют.', 'Держим темп.', 'Рост каждый день.', 'Будущее светлое.', 'Шаг за шагом.', '']
  };

  const langGreets = greetings[lang] || greetings.en;
  let timeGreets;
  if (h < 6) timeGreets = langGreets.night;
  else if (h < 12) timeGreets = langGreets.morning;
  else if (h < 17) timeGreets = langGreets.afternoon;
  else if (h < 21) timeGreets = langGreets.evening;
  else timeGreets = langGreets.latenight;

  const langWelcomes = welcomes[lang] || welcomes.en;
  const timeGreet = pick(timeGreets);
  const welcome = pick(langWelcomes);

  if (displayName) {
    return `${timeGreet} ${displayName}. ${welcome}`.trim();
  }
  return `${timeGreet.replace(',', '.')} ${welcome}`.trim();
}








function getUserInitials() {
  const name = getUserName();
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function updateUserDisplay() {
  const name = getUserName();
  const nameEl = document.querySelector('.sb-user-info div:first-child');
  const avatarEl = document.querySelector('.sb-avatar');
  if (nameEl) nameEl.textContent = name || 'User';
  if (avatarEl) avatarEl.textContent = getUserInitials();
  // v15.3: Auto-update version from single source (FINTRACK_VERSION in settings.js)
  const versionEl = document.getElementById('sb-version');
  if (versionEl && typeof FINTRACK_VERSION !== 'undefined') versionEl.textContent = 'FinTrack Premium ' + FINTRACK_VERSION;
  document.title = 'FinTrack Premium' + (typeof FINTRACK_VERSION !== 'undefined' ? ' ' + FINTRACK_VERSION : '');
  // Update greeting in header subtitle on dashboard
  if (curPage === 'dashboard') {
    const ps = document.getElementById('ps');
    if (ps) ps.textContent = getGreeting();
  }
}

function init() {
  // Check if app lock is enabled
  if (FT_APP_LOCK) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { showUnlockScreen(); });
    } else {
      showUnlockScreen();
    }
    return;
  }
  // Load IndexedDB → populate _ftStore → then boot
  ftLoadAll().then(function() {
    loadAllModuleData();
    initApp();
  }).catch(function(e) {
    console.error('[FinTrack] Boot failed:', e);
    loadAllModuleData();
    initApp();
  });
}

async function initWithPasskey(passkey) {
  if (passkey !== getPK()) return false;
  loadTXN();
  initApp();
  return true;
}

function showUnlockScreen() {
  var appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'none';
  var html = '<div id="ftUnlock" style="position:fixed;inset:0;background:var(--bg-primary);z-index:10000;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:360px;width:90%"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.2 260),oklch(0.45 0.22 280));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i data-lucide="lock" width="24" height="24" style="color:#fff"></i></div><div style="font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">FinTrack Locked</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:24px">Enter your PIN to access your data</div><div style="position:relative;margin-bottom:12px"><input id="ftUnlockInput" type="password" style="width:100%;padding:12px 44px 12px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:18px;text-align:center;outline:none;letter-spacing:4px" placeholder="PIN"><button id="ftUnlockEye" type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:none;cursor:pointer;font-size:16px;padding:4px;line-height:1">👁</button></div><button id="ftUnlockBtn" style="width:100%;padding:12px;border:none;border-radius:8px;background:oklch(0.55 0.2 260);color:#fff;font-size:14px;font-weight:600;cursor:pointer">Unlock</button><div id="ftUnlockErr" style="font-size:11px;color:oklch(0.6 0.2 15);margin-top:10px;display:none">Wrong PIN. Try again.</div><div style="margin-top:16px"><button onclick="showForgotPIN()" style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font);text-decoration:underline">Forgot PIN?</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(function() {
    var inp = document.getElementById('ftUnlockInput');
    var btn = document.getElementById('ftUnlockBtn');
    var eye = document.getElementById('ftUnlockEye');
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); ftDoUnlock(); } });
    }
    if (btn) {
      btn.addEventListener('click', function(e) { e.preventDefault(); ftDoUnlock(); });
      btn.addEventListener('touchend', function(e) { e.preventDefault(); ftDoUnlock(); });
    }
    if (eye) {
      eye.addEventListener('click', function(e) { e.preventDefault(); if (inp.type === 'password') { inp.type = 'text'; eye.textContent = '🙈'; } else { inp.type = 'password'; eye.textContent = '👁'; } });
    }
    // Try biometric auth automatically on mobile
    if ('ontouchstart' in window) { ftTryBiometric(); }
  }, 200);
}

async function ftTryBiometric() {
  // Only attempt if biometric is registered
  if (!localStorage.getItem('ft_bio_cred')) return;
  var success = await ftBiometricAuth();
  if (success) {
    ftIsUnlocked = true;
    await ftLoadAll();
    loadAllModuleData();
    initApp();
    var unlockEl = document.getElementById('ftUnlock');
    if (unlockEl) unlockEl.remove();
    var appEl = document.getElementById('app');
    if (appEl) appEl.style.display = '';
  }
}

// === BIOMETRIC AUTHENTICATION (v15.2 — WebAuthn) ===
// Uses device biometric (fingerprint/face) via Web Authentication API
// Credential stored in localStorage as base64. Works fully client-side on GitHub Pages.

function ftBiometricSupported() {
  return window.PublicKeyCredential && navigator.credentials && typeof navigator.credentials.create === 'function';
}

async function ftBiometricRegister() {
  if (!ftBiometricSupported()) { toast('❌ Biometric not supported on this device'); return false; }
  try {
    // Check if platform authenticator is available (fingerprint/face)
    var available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) { toast('❌ No biometric sensor found'); return false; }

    var userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    var credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'FinTrack Premium', id: location.hostname },
        user: { id: userId, name: getUserName() || 'user', displayName: getUserName() || 'FinTrack User' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000
      }
    });

    if (credential) {
      // Store credential ID for future authentication
      var credId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
      localStorage.setItem('ft_bio_cred', credId);
      toast('✅ Biometric registered');
      return true;
    }
  } catch (e) {
    console.warn('Biometric registration failed:', e);
    if (e.name === 'NotAllowedError') toast('❌ Biometric cancelled');
    else toast('❌ Biometric setup failed');
  }
  return false;
}

async function ftBiometricAuth() {
  if (!ftBiometricSupported()) return false;
  var credId = localStorage.getItem('ft_bio_cred');
  if (!credId) return false;

  try {
    var rawId = Uint8Array.from(atob(credId), function(c) { return c.charCodeAt(0); });
    var assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: location.hostname,
        allowCredentials: [{ id: rawId, type: 'public-key', transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    return !!assertion;
  } catch (e) {
    console.warn('Biometric auth failed:', e);
    return false;
  }
}

function ftBiometricRemove() {
  localStorage.removeItem('ft_bio_cred');
  toast('🗑 Biometric removed');
}

// === VISIBILITY LOCK (v15.2 — Banking-style re-lock) ===
// Re-locks the app when user switches away and comes back
var ftLastVisible = Date.now();
var ftIsUnlocked = false;
var FT_LOCK_TIMEOUT = 5000; // Re-lock after 5 seconds away

document.addEventListener('visibilitychange', function() {
  if (!FT_APP_LOCK || !ftIsUnlocked) return;
  if (document.hidden) {
    ftLastVisible = Date.now();
  } else {
    var away = Date.now() - ftLastVisible;
    if (away >= FT_LOCK_TIMEOUT) {
      ftIsUnlocked = false;
      showUnlockScreen();
    }
  }
});

// Also handle page freeze/resume (PWA background)
document.addEventListener('resume', function() {
  if (!FT_APP_LOCK || !ftIsUnlocked) return;
  var away = Date.now() - ftLastVisible;
  if (away >= FT_LOCK_TIMEOUT) {
    ftIsUnlocked = false;
    showUnlockScreen();
  }
});

async function ftDoUnlock() {
  var input = document.getElementById('ftUnlockInput');
  var passkey = input ? input.value : '';
  if (!passkey) return;
  var valid = await verifyPIN(passkey);
  if (valid) {
    ftIsUnlocked = true;
    await ftLoadAll();
    loadAllModuleData();
    initApp();
    var unlockEl = document.getElementById('ftUnlock');
    if (unlockEl) unlockEl.remove();
    var appEl = document.getElementById('app');
    if (appEl) appEl.style.display = '';
  } else {
    var err = document.getElementById('ftUnlockErr');
    if (err) err.style.display = 'block';
    if (input) { input.value = ''; input.focus(); }
  }
}

// Emergency PIN reset: clears PIN hash and disables lock (data preserved)
async function emergencyPINReset() {
  var input = document.getElementById('ftEmergencyInput');
  var val = input ? input.value.trim().toUpperCase() : '';
  if (val !== 'RESET') { toast('❌ Type RESET to confirm'); return; }
  // Clear all PIN-related keys
  localStorage.removeItem('ft_pk_hash');
  localStorage.removeItem('ft_pk');
  localStorage.removeItem('ft_app_lock');
  safeSave('ft_app_lock', 'false');
  safeSave('ft_pk_hash', '');
  safeSave('ft_pk', '');
  FT_APP_LOCK = false;
  ftIsUnlocked = true;
  // Boot the app
  await ftLoadAll();
  loadAllModuleData();
  initApp();
  var unlockEl = document.getElementById('ftUnlock');
  if (unlockEl) unlockEl.remove();
  var appEl = document.getElementById('app');
  if (appEl) appEl.style.display = '';
  toast('✅ PIN cleared. Set a new one in Settings → Security');
}

// === FORGOT PIN (v15.7 — Recovery Code + Security Questions) ===
function showForgotPIN() {
  var hasCode = hasRecoverySetup();
  var hasQuestions = hasSecurityQuestions();
  if (!hasCode && !hasQuestions) {
    // No recovery method: show emergency reset option instead of useless alert
    var unlockEl = document.getElementById('ftUnlock');
    if (unlockEl) unlockEl.remove();
    var html = '<div id="ftUnlock" style="position:fixed;inset:0;background:var(--bg-primary);z-index:10000;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:360px;width:90%"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.2 15),oklch(0.5 0.2 30));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i data-lucide="alert-triangle" width="24" height="24" style="color:#fff"></i></div><div style="font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">No Recovery Method</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px;line-height:1.5">No recovery code or security questions were set up. You can reset the PIN to regain access. Your financial data will NOT be deleted.</div><div style="padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:12px;text-align:left"><div style="font-size:11px;font-weight:600;margin-bottom:6px">To confirm reset, type RESET below:</div><input id="ftEmergencyInput" type="text" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);font-size:14px;text-align:center;outline:none;letter-spacing:2px;text-transform:uppercase" placeholder="Type RESET"></div><button onclick="emergencyPINReset()" style="width:100%;padding:12px;border:none;border-radius:8px;background:oklch(0.6 0.2 15);color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px">Reset PIN & Unlock</button><button onclick="showUnlockScreen()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);font-size:12px;cursor:pointer;font-family:var(--font)">Back to PIN</button></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    var inp = document.getElementById('ftEmergencyInput');
    if (inp) { inp.focus(); inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); emergencyPINReset(); } }); }
    return;
  }
  var unlockEl = document.getElementById('ftUnlock');
  if (unlockEl) unlockEl.remove();
  // Show method selection if both available
  var html = '<div id="ftUnlock" style="position:fixed;inset:0;background:var(--bg-primary);z-index:10000;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:360px;width:90%"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.18 155),oklch(0.5 0.18 180));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i data-lucide="key" width="24" height="24" style="color:#fff"></i></div><div style="font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">PIN Recovery</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:24px">Choose your recovery method</div><div id="ftRecoveryMethods" style="display:flex;flex-direction:column;gap:10px">';
  if (hasCode) {
    html += '<button onclick="showRecoveryCodeInput()" style="width:100%;padding:14px;border:1px solid var(--border);border-radius:10px;background:var(--bg-card);color:var(--text-primary);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:10px;justify-content:center"><span style="font-size:18px">🔑</span> Recovery Code</button>';
  }
  if (hasQuestions) {
    html += '<button onclick="showSecurityQuestionsInput()" style="width:100%;padding:14px;border:1px solid var(--border);border-radius:10px;background:var(--bg-card);color:var(--text-primary);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:10px;justify-content:center"><span style="font-size:18px">❓</span> Security Questions</button>';
  }
  html += '</div><div style="margin-top:16px"><button onclick="showUnlockScreen()" style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font);text-decoration:underline">Back to PIN</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  // If only one method, go directly
  if (hasCode && !hasQuestions) { showRecoveryCodeInput(); }
  else if (!hasCode && hasQuestions) { showSecurityQuestionsInput(); }
}

function showRecoveryCodeInput() {
  var unlockEl = document.getElementById('ftUnlock');
  if (unlockEl) unlockEl.remove();
  var html = '<div id="ftUnlock" style="position:fixed;inset:0;background:var(--bg-primary);z-index:10000;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:360px;width:90%"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.18 155),oklch(0.5 0.18 180));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i data-lucide="key" width="24" height="24" style="color:#fff"></i></div><div style="font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">Recovery Code</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:24px">Enter your 12-character recovery code</div><input id="ftRecoveryInput" type="text" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:16px;text-align:center;outline:none;letter-spacing:2px;font-family:monospace;text-transform:uppercase" placeholder="XXXX-XXXX-XXXX"><button onclick="verifyAndResetPIN()" style="width:100%;padding:12px;border:none;border-radius:8px;background:oklch(0.6 0.18 155);color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px">Verify & Reset PIN</button><div id="ftRecoveryErr" style="font-size:11px;color:oklch(0.6 0.2 15);margin-top:10px;display:none">Invalid recovery code.</div><div style="margin-top:16px"><button onclick="showForgotPIN()" style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font);text-decoration:underline">Try another method</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  var inp = document.getElementById('ftRecoveryInput');
  if (inp) { inp.focus(); inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); verifyAndResetPIN(); } }); }
}

function showSecurityQuestionsInput() {
  var unlockEl = document.getElementById('ftUnlock');
  if (unlockEl) unlockEl.remove();
  var indices = getSecurityQuestionIndices();
  if (!indices) { alert('Security questions not configured.'); showUnlockScreen(); return; }
  var html = '<div id="ftUnlock" style="position:fixed;inset:0;background:var(--bg-primary);z-index:10000;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:380px;width:90%"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.15 220),oklch(0.5 0.18 250));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i data-lucide="help-circle" width="24" height="24" style="color:#fff"></i></div><div style="font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">Security Questions</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">Answer both questions to reset your PIN</div><div style="text-align:left;margin-bottom:12px"><label style="font-size:11px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">' + SECURITY_QUESTIONS[indices.q1] + '</label><input id="ftSQ1" type="text" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:13px;outline:none" placeholder="Your answer"></div><div style="text-align:left;margin-bottom:16px"><label style="font-size:11px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">' + SECURITY_QUESTIONS[indices.q2] + '</label><input id="ftSQ2" type="text" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:13px;outline:none" placeholder="Your answer"></div><button onclick="verifyQuestionsAndReset()" style="width:100%;padding:12px;border:none;border-radius:8px;background:oklch(0.55 0.18 250);color:#fff;font-size:14px;font-weight:600;cursor:pointer">Verify & Reset PIN</button><div id="ftSQErr" style="font-size:11px;color:oklch(0.6 0.2 15);margin-top:10px;display:none">Incorrect answers. Try again.</div><div style="margin-top:16px"><button onclick="showForgotPIN()" style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font);text-decoration:underline">Try another method</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  var inp = document.getElementById('ftSQ1');
  if (inp) inp.focus();
}

async function verifyQuestionsAndReset() {
  var a1 = document.getElementById('ftSQ1') ? document.getElementById('ftSQ1').value : '';
  var a2 = document.getElementById('ftSQ2') ? document.getElementById('ftSQ2').value : '';
  if (!a1 || !a2) { toast('Please answer both questions'); return; }
  var valid = await verifySecurityAnswers(a1, a2);
  if (valid) {
    promptNewPINAfterRecovery();
  } else {
    var err = document.getElementById('ftSQErr');
    if (err) { err.textContent = 'Incorrect answers. Try again.'; err.style.display = 'block'; }
  }
}

async function verifyAndResetPIN() {
  var input = document.getElementById('ftRecoveryInput');
  var code = input ? input.value : '';
  if (!code) return;
  var valid = await verifyRecoveryCode(code);
  if (valid) {
    promptNewPINAfterRecovery();
  } else {
    var err = document.getElementById('ftRecoveryErr');
    if (err) err.style.display = 'block';
    if (input) { input.value = ''; input.focus(); }
  }
}

function promptNewPINAfterRecovery() {
  var unlockEl = document.getElementById('ftUnlock');
  if (unlockEl) unlockEl.remove();
  var html = '<div id="ftUnlock" style="position:fixed;inset:0;background:var(--bg-primary);z-index:10000;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:360px;width:90%"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.2 155),oklch(0.5 0.2 130));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i data-lucide="check-circle" width="24" height="24" style="color:#fff"></i></div><div style="font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">Create New PIN</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">Recovery verified. Set your new PIN below.</div><div style="margin-bottom:10px"><input id="ftNewPin" type="password" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:18px;text-align:center;outline:none;letter-spacing:4px" placeholder="New PIN (min 4)"></div><div style="margin-bottom:16px"><input id="ftConfirmPin" type="password" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:18px;text-align:center;outline:none;letter-spacing:4px" placeholder="Confirm PIN"></div><button onclick="saveNewPINAfterRecovery()" style="width:100%;padding:12px;border:none;border-radius:8px;background:oklch(0.55 0.2 155);color:#fff;font-size:14px;font-weight:600;cursor:pointer">Set New PIN</button><div id="ftNewPinErr" style="font-size:11px;color:oklch(0.6 0.2 15);margin-top:10px;display:none"></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  var inp = document.getElementById('ftNewPin');
  if (inp) inp.focus();
}

async function saveNewPINAfterRecovery() {
  var pin = document.getElementById('ftNewPin') ? document.getElementById('ftNewPin').value : '';
  var confirm = document.getElementById('ftConfirmPin') ? document.getElementById('ftConfirmPin').value : '';
  var err = document.getElementById('ftNewPinErr');
  if (!pin || pin.length < 4) { if (err) { err.textContent = 'PIN must be at least 4 characters.'; err.style.display = 'block'; } return; }
  if (pin !== confirm) { if (err) { err.textContent = 'PINs do not match.'; err.style.display = 'block'; } return; }
  await setPINSecure(pin);
  toast('✅ PIN reset successfully');
  var unlockEl = document.getElementById('ftUnlock');
  if (unlockEl) unlockEl.remove();
  ftIsUnlocked = true;
  await ftLoadAll();
  loadAllModuleData();
  initApp();
  var appEl = document.getElementById('app');
  if (appEl) appEl.style.display = '';
}

// === FIRST-TIME SECURITY SETUP (v15.7) ===
function showFirstTimeSecuritySetup() {
  var html = '<div class="mo show" id="mSecSetup" onclick="if(event.target===this){this.remove();document.body.style.overflow=\'\'}"><div class="ml" style="max-width:420px" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">🔐 Secure Your FinTrack</div><div class="mds">Set up a PIN and recovery method to protect your data</div></div><button class="mx" onclick="document.getElementById(\'mSecSetup\').remove();document.body.style.overflow=\'\'">✕</button></div><div style="padding:4px 0"><div style="margin-bottom:16px"><label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px">Create a PIN (min 4 characters)</label><input class="fi" type="password" id="setup_pin" placeholder="Enter PIN" style="font-size:14px;letter-spacing:2px;text-align:center"></div><div style="margin-bottom:16px"><label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px">Confirm PIN</label><input class="fi" type="password" id="setup_pin_confirm" placeholder="Confirm PIN" style="font-size:14px;letter-spacing:2px;text-align:center"></div><div style="padding:10px 14px;background:var(--bg-primary);border-radius:8px;margin-bottom:16px"><div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--text-secondary)">Security Question 1</div><select class="fi" id="setup_sq1" style="font-size:12px;margin-bottom:8px">' + SECURITY_QUESTIONS.map(function(q, i) { return '<option value="' + i + '">' + q + '</option>'; }).join('') + '</select><input class="fi" id="setup_sa1" placeholder="Your answer" style="font-size:12px"></div><div style="padding:10px 14px;background:var(--bg-primary);border-radius:8px;margin-bottom:16px"><div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--text-secondary)">Security Question 2</div><select class="fi" id="setup_sq2" style="font-size:12px;margin-bottom:8px">' + SECURITY_QUESTIONS.map(function(q, i) { return '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + q + '</option>'; }).join('') + '</select><input class="fi" id="setup_sa2" placeholder="Your answer" style="font-size:12px"></div></div><div class="ma"><button class="btn bs" onclick="document.getElementById(\'mSecSetup\').remove();document.body.style.overflow=\'\'">Skip for now</button><button class="btn bp" onclick="completeFirstTimeSetup()">Secure My Data</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.body.style.overflow = 'hidden';
}

function initApp() {
  const st = safeGet('theme');
  if (st) {
    document.documentElement.dataset.theme = st;
    if (st === 'dark') document.getElementById('thico').dataset.lucide = 'moon';
  }
  // Load language + currency preferences
  currentLang = safeGet('ft_lang') || 'en';
  displayCurrency = safeGet('ft_currency') || 'USD';
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
  // Set user name in sidebar
  updateUserDisplay();
  lucide.createIcons();
  // v15.3.1: Always open to Dashboard. Use navigate() so FABs are set correctly.
  navigate('dashboard');
  // Fetch fresh rates in background
  fetchExchangeRates();
  // Update notification badge
  updateNotifBadge();
  // Session idle tracking (#7)
  if (typeof initIdleTracking === 'function') initIdleTracking();
  // Backup reminder (#6)
  if (typeof checkBackupReminder === 'function') setTimeout(() => checkBackupReminder(), 2000);
  // Cloud sync init (V2.0)
  if (typeof ftCloudInit === 'function') ftCloudInit();
  // v15.5: Check budget alerts on app load
  if (typeof checkBudgetAlerts === 'function') setTimeout(() => checkBudgetAlerts(), 1000);
  // Register Service Worker for PWA with auto-update detection
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(function(reg) {
      console.log('SW registered:', reg.scope);
      // Check for updates every 30 minutes
      setInterval(function() { reg.update(); }, 30 * 60 * 1000);
      // Detect when a new SW is found
      reg.onupdatefound = function() {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.onstatechange = function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available, show update banner
            showUpdateBanner();
          }
        };
      };
    }).catch(function() {});
    // Listen for SW_UPDATED message (post-activation reload prompt)
    navigator.serviceWorker.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SW_UPDATED') {
        showUpdateBanner();
      }
    });
  }
  // Show onboarding for first-time users, greeting toast for returning users
  if (!safeGet('ft_onboarded')) { showOnboarding(); }
  else if (!safeGet('ft_quickstart_done') && safeGet('ft_onboarded')) {
    // Show quick-start navigation tips after first onboarding
    setTimeout(() => showQuickStartTips(), 800);
  }
  else if (!safeGet('ft_security_setup_done') && !getPKHash()) {
    setTimeout(() => showRecoveryReminder(), 1000);
  }
  else { setTimeout(() => toast(getGreeting()), 500); }
}

// === QUICK-START NAVIGATION TIPS (for new users after onboarding) ===
function showQuickStartTips() {
  var html = '<div class="mo show" id="mQuickStart" onclick="if(event.target===this)dismissQuickStart()"><div class="ml" style="max-width:380px;padding:20px" onclick="event.stopPropagation()">';
  html += '<div style="text-align:center;margin-bottom:16px"><div style="font-size:32px;margin-bottom:8px">🗺️</div><div style="font-size:16px;font-weight:700">Quick Navigation Guide</div><div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">Here\'s where everything lives</div></div>';
  html += '<div style="display:flex;flex-direction:column;gap:10px">';
  html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg-primary);border-radius:10px"><span style="font-size:20px">🏠</span><div><div style="font-size:12px;font-weight:600">Home</div><div style="font-size:10px;color:var(--text-tertiary)">Your financial snapshot at a glance</div></div></div>';
  html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg-primary);border-radius:10px"><span style="font-size:20px">📝</span><div><div style="font-size:12px;font-weight:600">Transactions</div><div style="font-size:10px;color:var(--text-tertiary)">Log income, expenses, savings here</div></div></div>';
  html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg-primary);border-radius:10px"><span style="font-size:20px">🎯</span><div><div style="font-size:12px;font-weight:600">Goals</div><div style="font-size:10px;color:var(--text-tertiary)">Set budgets + savings targets</div></div></div>';
  html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg-primary);border-radius:10px"><span style="font-size:20px">📊</span><div><div style="font-size:12px;font-weight:600">Insights</div><div style="font-size:10px;color:var(--text-tertiary)">Health score, trends, AI advice</div></div></div>';
  html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg-primary);border-radius:10px"><span style="font-size:20px">⚙️</span><div><div style="font-size:12px;font-weight:600">Settings</div><div style="font-size:10px;color:var(--text-tertiary)">Accounts, categories, security, backup</div></div></div>';
  html += '</div>';
  html += '<div style="margin-top:14px;padding:10px 12px;background:var(--accent-light);border-radius:8px;text-align:center"><div style="font-size:11px;font-weight:600;color:var(--accent)">💡 Start by adding your first transaction!</div><div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">Tap the purple + button at the bottom right</div></div>';
  html += '<button class="btn bp" style="width:100%;margin-top:14px;justify-content:center" onclick="dismissQuickStart()">Got it, let\'s go!</button>';
  html += '</div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.body.style.overflow = 'hidden';
}

function dismissQuickStart() {
  safeSave('ft_quickstart_done', '1');
  var el = document.getElementById('mQuickStart');
  if (el) el.remove();
  document.body.style.overflow = '';
  toast(getGreeting());
}

// === FIRST-RUN ONBOARDING (with name + title input) ===
function showOnboarding() {
  var steps = [
    { title: 'Hey there! 👋', desc: 'FinTrack keeps your money data private, offline, and always in your control. No cloud, no ads, no tracking. Let\'s get you set up in under 3 minutes.', icon: '👋', hasInput: true },
    { title: 'Pick Your Currency', desc: 'What currency do you think in? We\'ll display everything in this. You can still have accounts in other currencies, they auto-convert.\n\n→ Settings → General → Currency', icon: '💱' },
    { title: 'Where\'s Your Money?', desc: 'Add your real accounts: bank savings, current account, e-wallets, cash stash. Set the starting balance so we know where you\'re starting from.\n\n→ Settings → Categories & Accounts → Accounts', icon: '🏦' },
    { title: 'How Do You Spend?', desc: 'Create categories that match YOUR life. Salary, freelance gigs for income. Food, transport, subscriptions for expenses. Emergency fund, travel fund for savings.\n\n→ Settings → Categories & Accounts', icon: '🏷️' },
    { title: 'Set Your Limits', desc: 'Tell us how much you WANT to spend per category each month. We\'ll alert you before you overshoot. Copy one month to all 12 for instant setup.\n\n→ Goals → Budget Planner', icon: '🎯' },
    { title: 'Log Your First Transaction', desc: 'Tap the purple + button. Pick type, category, account, amount. Done. Every transaction auto-updates your dashboard, goals, and insights.\n\n→ Tap + anywhere', icon: '✍️' },
    { title: 'Dream Bigger', desc: 'Want a Japan trip? Emergency fund? New laptop? Create a goal, link it to a Savings category. Every time you save, the progress bar moves automatically.\n\n→ Goals → + New Goal', icon: '🚀' },
    { title: 'Lock It Down', desc: 'Your finances are personal. Set a PIN, enable biometric unlock, and save your recovery code. If your phone gets stolen, your data stays locked.\n\n→ Settings → Security', icon: '🔒' },
    { title: 'You\'re in control.', desc: 'Start logging transactions. In a week you\'ll see patterns. In a month you\'ll see progress. In a year you\'ll wonder how you lived without this.\n\nLet\'s go. 💪', icon: '⚡' }
  ];
  var currentStep = 0;

  function renderStep() {
    var s = steps[currentStep];
    var isLast = currentStep === steps.length - 1;
    var isFirst = currentStep === 0;
    var dots = '';
    for (var i = 0; i < steps.length; i++) {
      dots += '<span style="width:8px;height:8px;border-radius:50%;background:' + (i === currentStep ? 'var(--accent)' : 'var(--border)') + ';transition:background 200ms"></span>';
    }
    var html = '<div id="onboardOverlay" style="position:fixed;inset:0;background:oklch(0 0 0/0.6);z-index:9500;display:flex;align-items:center;justify-content:center;animation:fi 300ms ease-out">';
    html += '<div style="background:var(--bg-card);border-radius:16px;padding:36px 32px 28px;max-width:420px;width:90%;text-align:center;box-shadow:var(--shadow-lg)">';
    html += '<div style="font-size:48px;margin-bottom:16px">' + s.icon + '</div>';
    html += '<div style="font-size:18px;font-weight:700;margin-bottom:8px">' + s.title + '</div>';
    html += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:20px;max-width:320px;margin-left:auto;margin-right:auto">' + s.desc + '</div>';
    if (s.hasInput) {
      var savedName = getUserName();
      var savedTitle = getUserTitle();
      html += '<div style="text-align:left;margin-bottom:20px;max-width:280px;margin-left:auto;margin-right:auto">';
      html += '<label style="font-size:11px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">Your Name</label>';
      html += '<input id="onboardName" class="fi" placeholder="e.g. Irsyad" value="' + (savedName || '') + '" style="margin-bottom:14px;text-align:center;font-size:14px">';
      html += '<label style="font-size:11px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:6px">How should I greet you?</label>';
      html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">';
      var titles = ['sir','master','boss','bro','chief'];
      titles.forEach(function(ti) {
        var isActive = savedTitle === ti;
        html += '<button type="button" class="btn ' + (isActive ? 'bp' : 'bs') + '" style="font-size:11px;padding:5px 12px;text-transform:capitalize" onclick="onboardSelectTitle(this,\'' + ti + '\')">' + ti + '</button>';
      });
      html += '</div></div>';
    }
    html += '<div style="display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:20px">' + dots + '</div>';
    html += '<div style="display:flex;gap:8px;justify-content:center">';
    if (!isFirst) html += '<button onclick="onboardPrev()" style="border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);padding:8px 18px;border-radius:7px;font-family:var(--font);font-size:12px;font-weight:500;cursor:pointer">Back</button>';
    if (isLast) {
      html += '<button onclick="onboardDone()" style="border:none;background:var(--accent);color:#fff;padding:8px 24px;border-radius:7px;font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer">Get Started</button>';
    } else {
      html += '<button onclick="onboardNext()" style="border:none;background:var(--accent);color:#fff;padding:8px 24px;border-radius:7px;font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer">Next</button>';
    }
    html += '</div>';
    if (!isLast) html += '<div style="margin-top:12px"><button onclick="onboardDone()" style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font)">Skip tour</button></div>';
    html += '</div></div>';

    var existing = document.getElementById('onboardOverlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    var nameInput = document.getElementById('onboardName');
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
  }

  window.onboardSelectTitle = function(btn, title) {
    setUserTitle(title);
    btn.parentElement.querySelectorAll('.btn').forEach(b => { b.classList.remove('bp'); b.classList.add('bs'); });
    btn.classList.remove('bs'); btn.classList.add('bp');
  };

  window.onboardNext = function() {
    if (currentStep === 0) { saveOnboardName(); }
    if (currentStep < steps.length - 1) { currentStep++; renderStep(); }
  };
  window.onboardPrev = function() { if (currentStep > 0) { currentStep--; renderStep(); } };
  window.onboardDone = function() {
    if (currentStep === 0) { saveOnboardName(); }
    safeSave('ft_onboarded', '1');
    var el = document.getElementById('onboardOverlay');
    if (el) el.remove();
    updateUserDisplay();
    // v15.7: Show first-time security setup after onboarding
    setTimeout(function() { showFirstTimeSecuritySetup(); }, 400);
  };

  function saveOnboardName() {
    var nameInput = document.getElementById('onboardName');
    if (nameInput && nameInput.value.trim()) { setUserName(nameInput.value.trim()); }
  }

  renderStep();
}

const rdy = setInterval(() => {
  if (typeof lucide !== 'undefined' && typeof Chart !== 'undefined') {
    clearInterval(rdy);
    init();
    // Dismiss splash screen
    setTimeout(function() {
      var splash = document.getElementById('ftSplash');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        setTimeout(function() { splash.remove(); }, 400);
      }
    }, 1200);
  }
}, 50);

// === COMPLETE FIRST-TIME SETUP (v15.7) ===
async function completeFirstTimeSetup() {
  var pin = document.getElementById('setup_pin') ? document.getElementById('setup_pin').value : '';
  var confirm = document.getElementById('setup_pin_confirm') ? document.getElementById('setup_pin_confirm').value : '';
  var sq1 = document.getElementById('setup_sq1') ? parseInt(document.getElementById('setup_sq1').value) : 0;
  var sa1 = document.getElementById('setup_sa1') ? document.getElementById('setup_sa1').value.trim() : '';
  var sq2 = document.getElementById('setup_sq2') ? parseInt(document.getElementById('setup_sq2').value) : 1;
  var sa2 = document.getElementById('setup_sa2') ? document.getElementById('setup_sa2').value.trim() : '';
  if (!pin || pin.length < 4) { toast('❌ PIN must be at least 4 characters'); return; }
  if (pin !== confirm) { toast('❌ PINs do not match'); return; }
  if (!sa1 || !sa2) { toast('❌ Please answer both security questions'); return; }
  if (sq1 === sq2) { toast('❌ Choose two different questions'); return; }
  // Save PIN as hash
  await setPINSecure(pin);
  // Save security questions
  await saveSecurityAnswers(sq1, sa1, sq2, sa2);
  // Generate and show recovery code
  var code = await setupRecoveryCode();
  safeSave('ft_security_setup_done', 'true');
  // Close setup modal
  var modal = document.getElementById('mSecSetup');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
  // Show recovery code to user
  showRecoveryCodeDisplay(code);
}

function showRecoveryCodeDisplay(code) {
  var html = '<div class="mo show" id="mRecCode" onclick="event.stopPropagation()"><div class="ml" style="max-width:380px" onclick="event.stopPropagation()"><div style="text-align:center;padding:8px 0"><div style="font-size:32px;margin-bottom:12px">🔑</div><div style="font-size:16px;font-weight:700;margin-bottom:6px">Your Recovery Code</div><div style="font-size:11px;color:var(--text-secondary);margin-bottom:16px;line-height:1.5">Save this code somewhere safe. You will need it to reset your PIN if you forget it. This code will NOT be shown again.</div><div style="background:var(--bg-primary);border:2px dashed var(--accent);border-radius:10px;padding:16px;margin-bottom:16px"><div style="font-size:22px;font-weight:800;letter-spacing:3px;font-family:monospace;color:var(--accent)">' + code + '</div></div><div style="font-size:10px;color:var(--rose);font-weight:600;margin-bottom:16px">⚠️ Screenshot this or write it down. Cannot be recovered.</div><button class="btn bp" style="width:100%" onclick="document.getElementById(\'mRecCode\').remove();document.body.style.overflow=\'\';toast(\'🔐 Security setup complete\')">I\'ve Saved My Code</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.body.style.overflow = 'hidden';
}

function showRecoveryReminder() {
  if (hasRecoverySetup() && hasSecurityQuestions()) return;
  var html = '<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg-card);border:1px solid var(--amber);border-radius:12px;padding:14px 18px;box-shadow:var(--shadow-lg);z-index:8000;max-width:360px;width:90%;animation:fi 300ms ease-out" id="ftRecReminder"><div style="display:flex;align-items:flex-start;gap:10px"><span style="font-size:20px;flex-shrink:0">⚠️</span><div style="flex:1"><div style="font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-primary)">No recovery method set up</div><div style="font-size:10px;color:var(--text-secondary);margin-bottom:10px">If you forget your PIN, you may not be able to recover your data.</div><div style="display:flex;gap:6px"><button class="btn bp" style="font-size:10px;padding:5px 10px" onclick="document.getElementById(\'ftRecReminder\').remove();showFirstTimeSecuritySetup()">Set Up Now</button><button class="btn bs" style="font-size:10px;padding:5px 10px" onclick="document.getElementById(\'ftRecReminder\').remove()">Later</button></div></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

// === UPDATE BANNER (V1.0.2 — PWA User-Controlled Update) ===
// Changelog: shown to user before they decide to update
const FINTRACK_CHANGELOG = {
  'fintrack-v1.0.0': {
    version: 'V1.0.0',
    date: '6 Aug 2026',
    changes: [
      'Mobile Insights: Cash Flow, Expense Breakdown, Account Breakdown, Dynamic AI Insights',
      'Financial Health: CFP Board standard 6-ratio model (savings, housing, debt, liquidity, expenses, net worth)',
      'Transactions: Edit/Delete action sheet, daily expense totals per date header',
      'Dashboard: Overview/Insights tabs, Cash Flow Forecast follows selected period',
      'All data synchronized with selected Year and Month',
      'Multilingual financial health detection (EN, Malay, Indo, CN, JP, KO, RU)',
      'Version unified to FinTrack Premium V1.0.0'
    ]
  },
  'fintrack-v1.0.1': {
    version: 'V1.0.1',
    date: '7 Aug 2026',
    changes: [
      'Calculation audit: Cash Flow = Income - Expense (standard)',
      'Net Worth unified to getNetWorth() across all tabs',
      'Eye toggle: global hide/show amounts with MutationObserver',
      'Onboarding redesigned (9-step guided flow)',
      'getAccountBalance fixed for multi-currency',
      'Reserve ratio includes Current Account'
    ]
  },
  'fintrack-v1.0.2': {
    version: 'V1.0.2',
    date: '11 Aug 2026',
    changes: [
      'IndexedDB dual-write engine (safeGet/safeSave across all modules)',
      'PBKDF2 PIN hashing (100K iterations) + per-device salt',
      'Session idle auto-lock (5 min)',
      'XSS sanitization (escapeHTML) on all inputs',
      'Backup reminder every 50 transactions',
      'Budget progress per-category (real % shown)',
      '420+ multilingual greetings (7 langs x 5 slots x 10-12 each)',
      'Quick-start navigation guide for new users',
      'Mobile keyboard no longer covers save button',
      'Export fix: triggerDownload() for PWA compatibility'
    ]
  },
  'fintrack-v2.0.0': {
    version: 'V2.0.0',
    date: '18 Aug 2026',
    changes: [
      'Cloud Sync: Supabase integration (auth + real-time sync)',
      'Sign up / Sign in with email + password',
      'Push to Cloud: backup all local data to Supabase',
      'Pull from Cloud: restore data on any new device',
      'Incremental sync: transactions auto-push on save',
      'Offline queue: changes flush when back online',
      'Auto-pull on boot if last sync > 5 min ago',
      'Cloud Sync UI in Settings → System',
      'Browser viewport fix (dvh) for tall screens (Oppo A6)',
      'Header forced single row on narrow screens (≤400px)',
      'Safe-area padding for gesture navigation'
    ]
  },
  'fintrack-v2.0.1': {
    version: 'V2.0.1',
    date: '20 Aug 2026',
    changes: [
      'Notification page stays on notification tab after add/edit',
      'Notification badge only shows reminders within timing window',
      'Done on reminder properly clears badge count',
      'Dismiss on recurring reminders resurfaces at next cycle',
      'Desktop Mode toggle hidden on desktop (only shows on mobile)',
      'Page title removed from header for cleaner UI',
      '700+ multilingual greetings (7 langs x 5 slots x 20+ each)',
      'Recovery code flow verified for forgotten PIN scenario'
    ]
  }
};

function showUpdateBanner() {
  if (document.getElementById('ftUpdateBanner')) return;
  // Get latest changelog entry
  var latest = FINTRACK_CHANGELOG[Object.keys(FINTRACK_CHANGELOG).pop()] || {};
  var changesList = (latest.changes || []).map(function(c) { return '<div style="font-size:10px;color:var(--text-secondary);padding:2px 0">• ' + c + '</div>'; }).join('');

  var html = '<div id="ftUpdateBanner" style="position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--bg-card);border:1px solid var(--accent);border-radius:14px;padding:16px 18px;box-shadow:var(--shadow-lg);z-index:9999;max-width:360px;width:90%;animation:fi 300ms ease-out">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="font-size:13px;font-weight:700;color:var(--text-primary)">Update Available ✨</div><button onclick="document.getElementById(\'ftUpdateBanner\').remove()" style="border:none;background:none;color:var(--text-tertiary);font-size:18px;cursor:pointer;padding:0 2px;line-height:1">&times;</button></div>';
  if (latest.version) {
    html += '<div style="font-size:10px;color:var(--text-tertiary);margin-bottom:8px">' + latest.version + ' · ' + (latest.date || '') + '</div>';
    html += '<div style="max-height:120px;overflow-y:auto;margin-bottom:12px;padding:8px 10px;background:var(--bg-primary);border-radius:8px">' + changesList + '</div>';
  }
  html += '<div style="display:flex;gap:8px"><button onclick="applyUpdate()" style="flex:1;border:none;background:var(--accent);color:#fff;padding:9px 14px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Update Now</button><button onclick="document.getElementById(\'ftUpdateBanner\').remove()" style="flex:1;border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);padding:9px 14px;border-radius:8px;font-size:11px;font-weight:500;cursor:pointer;font-family:var(--font)">Later</button></div>';
  html += '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

function applyUpdate() {
  var banner = document.getElementById('ftUpdateBanner');
  if (banner) banner.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--text-secondary);text-align:center;width:100%">Updating... don\'t close the app</div>';
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(function(reg) {
      if (reg.waiting) { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }
      setTimeout(function() { window.location.reload(); }, 800);
    });
  } else {
    window.location.reload();
  }
}
