// ═══════════════════════════════════════════════
//  campus-data.js  —  بيانات جامعة مؤتة
//  مشترك بين صفحة الطلاب وصفحة المدير
// ═══════════════════════════════════════════════

const CAMPUS_DB_DEFAULT = [
  {id:1,  name:"كلية الرياضة",             type:"sport",    x:-4,    z:-13,  w:3.0, d:2.0, h:3, rot:0, color:0xf0e6d0},
  {id:2,  name:"ملعب كرة القدم",           type:"sport",    x:-9,    z:-12,  w:4.5, d:3.2, h:0, rot:0, color:0x2e7d52, isField:true},
  {id:3,  name:"كلية الطب",                type:"medical",  x:8,     z:-13,  w:3.5, d:2.2, h:4, rot:0, color:0xd5f0e4},
  {id:4,  name:"مختبرات الطب",             type:"medical",  x:8,     z:-9.5, w:3.5, d:2.0, h:3, rot:0, color:0xdcf5ea},
  {id:5,  name:"كلية الصيدلة",             type:"medical",  x:-1,    z:-10,  w:2.8, d:1.8, h:3, rot:0, color:0xd5f0e4},
  {id:6,  name:"المكتبة المركزية",         type:"library",  x:-0.5,  z:-7,   w:3.2, d:2.2, h:4, rot:0, color:0xd5e8f0},
  {id:7,  name:"القبول والتسجيل",          type:"admin",    x:-5.5,  z:-7,   w:2.8, d:2.0, h:3, rot:0, color:0xe8dfc8},
  {id:8,  name:"الصالة الهاشمية",          type:"service",  x:-10,   z:-6.5, w:3.5, d:2.5, h:2, rot:0, color:0xe0d8c0},
  {id:9,  name:"وحدة الشؤون المالية",      type:"admin",    x:9,     z:-5,   w:3.0, d:2.2, h:3, rot:0, color:0xe8dfc8},
  {id:10, name:"مركز الحاسوب",             type:"service",  x:9,     z:-1.5, w:3.0, d:2.2, h:2, rot:0, color:0xe0d8c0},
  {id:11, name:"كلية الأعمال",             type:"academic", x:4,     z:-3,   w:3.5, d:2.2, h:4, rot:0, color:0xf0e6d0},
  {id:12, name:"كلية العلوم التربوية",     type:"academic", x:-3.5,  z:-3,   w:3.2, d:2.5, h:4, rot:0, color:0xf0e6d0},
  {id:13, name:"عمادة شؤون الطلبة",       type:"admin",    x:-9.5,  z:-3,   w:3.2, d:2.5, h:3, rot:0, color:0xe8dfc8},
  {id:14, name:"كلية طب الأسنان",          type:"medical",  x:-14.5, z:-5,   w:2.0, d:2.2, h:4, rot:0, color:0xd5f0e4},
  {id:15, name:"مجمع طب الأسنان الإداري", type:"admin",    x:-14.5, z:-2.5, w:2.0, d:1.6, h:3, rot:0, color:0xe8dfc8},
  {id:16, name:"نافورة المياه والأشجار",  type:"plaza",    x:0,     z:0.5,  w:4.0, d:4.0, h:0, rot:0, color:0x3a9060, isPlaza:true},
  {id:17, name:"كلية العلوم ٢",            type:"academic", x:-2.5,  z:6,    w:3.0, d:2.8, h:4, rot:0, color:0xf0e6d0},
  {id:18, name:"كلية العلوم ١",            type:"academic", x:3.5,   z:6,    w:3.5, d:3.0, h:4, rot:0, color:0xf0e6d0},
  {id:19, name:"الآداب والحقوق",           type:"academic", x:-11,   z:4,    w:3.5, d:5.5, h:4, rot:0, color:0xf0e6d0},
  {id:20, name:"مبنى رئاسة الجامعة",      type:"admin",    x:-1,    z:11,   w:5.0, d:3.5, h:4, rot:0, color:0xe8dfc8, isMain:true},
  {id:21, name:"الصالة الأموية",           type:"service",  x:7,     z:11,   w:4.0, d:3.5, h:2, rot:0, color:0xe0d8c0},
  {id:22, name:"البوابة الشمالية",         type:"gate",     x:0,     z:15,   w:1.8, d:1.0, h:2, rot:0, color:0xc8c0b0},
  {id:23, name:"البوابة الجنوبية",         type:"gate",     x:15.5,  z:-2,   w:1.0, d:1.8, h:2, rot:0, color:0xc8c0b0},
];

// Load saved data from localStorage (admin edits persist here)
function loadCampusDB() {
  try {
    const saved = localStorage.getItem('mutah_campus_db');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return JSON.parse(JSON.stringify(CAMPUS_DB_DEFAULT));
}

// Save data (called by admin only)
function saveCampusDB(db) {
  try {
    localStorage.setItem('mutah_campus_db', JSON.stringify(db));
  } catch(e) {}
}

const TLABELS = {academic:'أكاديمي',admin:'إداري',library:'مكتبة',medical:'طبي',sport:'رياضي',service:'خدمي',mosque:'مسجد',gate:'بوابة',plaza:'ساحة'};
const TEMOJI  = {academic:'🎓',admin:'🏛️',library:'📚',medical:'🏥',sport:'⚽',service:'🔧',mosque:'🕌',gate:'🚪',plaza:'⛲'};
const PALETTE = [
  {h:'#f0e6d0',v:0xf0e6d0},{h:'#d5e8f0',v:0xd5e8f0},{h:'#d5f0e4',v:0xd5f0e4},
  {h:'#f0dcd5',v:0xf0dcd5},{h:'#e8dfc8',v:0xe8dfc8},{h:'#e0d8c0',v:0xe0d8c0},
  {h:'#dce8d5',v:0xdce8d5},{h:'#f5f0e0',v:0xf5f0e0},{h:'#c8c0b0',v:0xc8c0b0},
  {h:'#b0c8d8',v:0xb0c8d8},{h:'#f0d8b0',v:0xf0d8b0},{h:'#d8d0f0',v:0xd8d0f0},
];