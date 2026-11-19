import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
let lang="ar", user=null, auth=null, db=null, consumed=0, goal=2000, entries=[];
const translations={
 ar:{tagline:"رعايتك تبدأ بقطرة",login:"تسجيل الدخول",welcome:"أهلاً بك في",heroText:"تابع شرب الماء، واضبط تذكيراتك، واعتنِ بصحتك كل يوم.",addGlass:"＋ أضف كوب ماء",enableReminders:"تفعيل التذكيرات",today:"إنجاز اليوم",hydration:"مستوى الترطيب",goalDone:"من الهدف",ml:"مل",consumedToday:"تم شربها اليوم",dailyGoal:"الهدف اليومي",personal:"إعداداتك",dailyTarget:"هدفك اليومي",targetHint:"يمكنك تعديل هدف الترطيب اليومي وفق احتياجاتك وتوجيهات مقدم الرعاية الصحية.",goalMl:"الهدف بالملليلتر",save:"حفظ",goalNote:"الهدف المعروض إرشادي ويمكن أن يختلف حسب العمر والحالة الصحية والطقس والنشاط.",learn:"تثقّف",dehydration:"العناية بالجفاف",symptoms:"علامات قد تشير إلى الجفاف",symptomsText:"العطش، جفاف الفم، قلة التبول أو تغير لون البول إلى الداكن، والدوخة.",prevention:"الوقاية",preventionText:"اشرب السوائل بانتظام، وزد الانتباه في الحر وأثناء النشاط البدني.",urgent:"متى تطلب المساعدة؟",urgentText:"اطلب رعاية طبية عاجلة عند الارتباك أو الإغماء أو صعوبة الاستيقاظ أو تدهور الحالة.",medicalNote:"هذه المعلومات للتوعية ولا تغني عن التقييم الطبي. قد يحتاج بعض الأشخاص إلى تقييد السوائل وفق تعليمات الطبيب.",history:"سجلّك",recent:"آخر الإضافات",clear:"مسح سجل اليوم",empty:"لم تسجل أي كمية بعد. ابدأ بإضافة كوب ماء.",syncTitle:"احفظ بياناتك بأمان",syncText:"سجّل الدخول لمزامنة سجل الترطيب بين أجهزتك باستخدام Firebase.",createAccount:"إنشاء حساب / دخول",footer:"مشروع توعوي صحي — الأردن",account:"حساب HydraCare-JO",password:"كلمة المرور",register:"إنشاء حساب"},
 en:{tagline:"Your care starts with a drop",login:"Log in",welcome:"Welcome to",heroText:"Track your water intake, set reminders, and care for your health every day.",addGlass:"＋ Add water",enableReminders:"Enable reminders",today:"Today's progress",hydration:"Hydration level",goalDone:"of goal",ml:"ml",consumedToday:"consumed today",dailyGoal:"daily goal",personal:"Your settings",dailyTarget:"Your daily goal",targetHint:"Adjust your daily hydration goal according to your needs and healthcare professional's advice.",goalMl:"Goal in milliliters",save:"Save",goalNote:"This is a general guide; needs vary with age, health, weather, and activity.",learn:"Learn",dehydration:"Dehydration care",symptoms:"Possible signs of dehydration",symptomsText:"Thirst, dry mouth, less frequent urination or dark urine, and dizziness.",prevention:"Prevention",preventionText:"Drink fluids regularly and take extra care in hot weather and during physical activity.",urgent:"When to seek help",urgentText:"Seek urgent medical care for confusion, fainting, difficulty waking, or worsening condition.",medicalNote:"For education only, not a substitute for medical advice. Some people need fluid restrictions as directed by their clinician.",history:"Your log",recent:"Recent entries",clear:"Clear today's log",empty:"No water logged yet. Add your first glass.",syncTitle:"Keep your data safe",syncText:"Sign in to sync your hydration log across devices with Firebase.",createAccount:"Create account / Log in",footer:"Health education project — Jordan",account:"HydraCare-JO account",password:"Password",register:"Create account"}
};
function t(k){return translations[lang][k]||k}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
function renderText(){document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=t(e.dataset.i18n));$("#langBtn").textContent=lang==="ar"?"English":"العربية";render()}
function render(){const pct=Math.min(100,Math.round(consumed/goal*100));$("#consumed").textContent=consumed.toLocaleString();$("#goal").textContent=goal.toLocaleString();$("#percent").textContent=pct+"%";$("#progressRing").style.background=`conic-gradient(var(--blue) ${pct*3.6}deg,#e7f1f4 0deg)`;$("#goalInput").value=goal;$("#todayLabel").textContent=new Date().toLocaleDateString(lang==="ar"?"ar-JO":"en-US",{weekday:"short",month:"short",day:"numeric"});const list=$("#logList");list.innerHTML="";if(!entries.length){list.innerHTML=`<li class="empty">${t("empty")}</li>`;return}entries.slice().reverse().forEach(e=>{const li=document.createElement("li");li.innerHTML=`<span>${new Date(e.createdAt||Date.now()).toLocaleTimeString(lang==="ar"?"ar-JO":"en-US",{hour:"2-digit",minute:"2-digit"})}</span><b>+${e.amount} ml</b>`;list.append(li)})}

function storageKey() {
  return user ? `hc-local-${user.uid}` : "hc-local-guest";
}

async function persist() {
  localStorage.setItem(storageKey(), JSON.stringify({
    date: today(),
    consumed,
    goal,
    entries
  }));

  if (user && db) {
    try {
      await setDoc(doc(db, "users", user.uid), {
        goal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, "users", user.uid, "daily", today()), {
        consumed,
        goal,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
      toast("Could not sync data.");
    }
  }
}
async function addWater(amount){consumed+=amount;const entry={amount,createdAt:Date.now()};entries.push(entry);render();await persist();if(user&&db){try{await addDoc(collection(db,"users",user.uid,"entries"),{...entry,date:today(),createdAt:serverTimestamp()})}catch(e){console.error(e)}}toast(lang==="ar"?`تمت إضافة ${amount} مل من الماء`:`Added ${amount} ml of water`)}

function loadLocal() {
  const x = JSON.parse(
    localStorage.getItem(storageKey()) || "null"
  );

  if (x && x.date === today()) {
    consumed = x.consumed || 0;
    goal = x.goal || 2000;
    entries = x.entries || [];
  } else {
    consumed = 0;
    goal = 2000;
    entries = [];
  }

  render();
}

async function loadCloud() {
  if (!user || !db) return;

  // Reset before loading another user's data
  consumed = 0;
  goal = 2000;
  entries = [];
  render();

  try {
    const uid = user.uid;

    const snap = await getDoc(doc(db, "users", uid));

    if (snap.exists()) {
      goal = snap.data().goal || 2000;
    }

    const day = await getDoc(
      doc(db, "users", uid, "daily", today())
    );

    if (day.exists()) {
      consumed = day.data().consumed || 0;
      goal = day.data().goal || goal;
    }

    const q = query(
      collection(db, "users", uid, "entries"),
      where("date", "==", today()),
      orderBy("createdAt", "asc")
    );

    const rows = await getDocs(q);

    entries = rows.docs.map(d => ({
      amount: d.data().amount,
      createdAt: Date.now()
    }));

    localStorage.setItem(storageKey(), JSON.stringify({
      date: today(),
      consumed,
      goal,
      entries
    }));

    render();

  } catch (e) {
    console.error("LOAD USER DATA ERROR:", e);
    toast("Error loading your personal data.");
  }
}
function setupFirebase(){if(firebaseConfig.apiKey==="YOUR_API_KEY"){console.info("Firebase not configured yet; local mode enabled.");return}try{const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
onAuthStateChanged(auth, async u => {
  user = u;

  $("#authBtn").textContent = u
    ? (lang === "ar" ? "خروج" : "Sign out")
    : t("login");

  if (u) {
    await loadCloud();
  } else {
    consumed = 0;
    goal = 2000;
    entries = [];
    loadLocal();
  }
});
$("#langBtn").onclick=()=>{lang=lang==="ar"?"en":"ar";renderText()};
$("#quickAdd").onclick=()=>addWater(250);
document.querySelectorAll("[data-amount]").forEach(b=>b.onclick=()=>addWater(Number(b.dataset.amount)));
$("#saveGoal").onclick=async()=>{const n=Number($("#goalInput").value);if(!Number.isFinite(n)||n<250||n>6000){toast(lang==="ar"?"أدخل هدفاً بين 250 و6000 مل":"Enter a goal between 250 and 6000 ml");return}goal=n;render();await persist();toast(lang==="ar"?"تم حفظ الهدف":"Goal saved")};
$("#clearToday").onclick=async()=>{if(!confirm(lang==="ar"?"هل تريد مسح سجل اليوم؟":"Clear today's log?"))return;consumed=0;entries=[];render();await persist();toast(lang==="ar"?"تم مسح سجل اليوم":"Today's log cleared")};
$("#authBtn").onclick=()=>{if(user){signOut(auth)}else $("#authDialog").showModal()};
$("#accountAction").onclick=()=>$("#authDialog").showModal();
$("#signIn").onclick=async()=>{if(!auth){$("#authMessage").textContent="Add your Firebase config first.";return}try{await signInWithEmailAndPassword(auth,$("#email").value,$("#password").value);$("#authDialog").close();toast("Signed in")}catch(e){$("#authMessage").textContent=e.message}};

$("#signUp").onclick = async () => {
  const email = $("#email").value.trim();
  const password = $("#password").value;

  if (!auth) {
    $("#authMessage").textContent = "Firebase is not connected.";
    return;
  }

  if (!email || !password) {
    $("#authMessage").textContent = "Please enter email and password.";
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Account created:", result.user.uid);
    $("#authDialog").close();
    toast("Account created successfully!");

  } catch (e) {
    console.error("SIGNUP ERROR:", e.code, e.message);
    $("#authMessage").textContent =
      "Error code: " + e.code + " — " + e.message;
  }
};

$("#reminderToggle").onclick=async()=>{if(!("Notification"in window)){toast(lang==="ar"?"المتصفح لا يدعم الإشعارات":"Notifications are not supported");return}const p=await Notification.requestPermission();if(p==="granted"){toast(lang==="ar"?"تم تفعيل التذكير أثناء فتح التطبيق":"Reminders enabled while app is open");new Notification("HydraCare-JO",{body:lang==="ar"?"حان وقت شرب بعض الماء 💧":"Time to drink some water 💧"})}else toast(lang==="ar"?"لم يتم السماح بالإشعارات":"Notification permission not granted")};
let reminderTimer=null;function startReminders(){if(reminderTimer)clearInterval(reminderTimer);reminderTimer=setInterval(()=>{if(document.visibilityState==="visible"&&"Notification"in window&&Notification.permission==="granted")new Notification("HydraCare-JO",{body:lang==="ar"?"تذكير لطيف: خذ استراحة واشرب الماء 💧":"Gentle reminder: take a break and drink water 💧"})},60*60*1000)}
loadLocal();renderText();setupFirebase();startReminders();
if("serviceWorker"in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(console.error);
