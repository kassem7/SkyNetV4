
function firebaseLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("mainApp").style.display = "block";
    })
    .catch((error) => {
      const errorText = document.getElementById("login-error");
      errorText.style.display = "block";
      errorText.textContent = "❌ " + error.message;
    });
}

function logout() {
  firebase.auth().signOut().then(() => {
    location.reload();
  });
}

function showMiniToast() {
  const toast = document.getElementById("mini-toast");
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

function generateCards() {
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  const network = "سكاي نت";
  const duration = document.getElementById("duration").value;
  const info = document.getElementById("info").value;
  const background = document.getElementById("bg-select").value;
  const prefix = document.getElementById("prefix").value;
  const pages = parseInt(document.getElementById("pages").value);
  const comment = document.getElementById("comment").value;
  const profile = document.getElementById("profile").value;
  const limit = document.getElementById("limit").value;
  const server = document.getElementById("server").value;

  window.generatedUsers = [];

  // 🧹 حذف الكروت القديمة لنفس الصفحات
  let allCards = JSON.parse(localStorage.getItem("generatedCards") || "[]");
  allCards = allCards.filter(card => card.page > pages); // نحذف الصفحات من 1 إلى عدد الصفحات الجديدة

  function generateCode() {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return prefix + rand;
  }

  for (let p = 0; p < pages; p++) {
    const page = document.createElement("div");
    page.className = "page";

    for (let i = 0; i < 56; i++) {
      const code = generateCode();
      window.generatedUsers.push(code);

      allCards.push({
        username: code,
        password: "", // كلمة المرور فارغة
        profile: profile,
        comment: comment,
        duration: duration,
        limit: limit,
        server: server,
        //background: background,
        page : p + 1, // رقم الصفحة يبدأ من 1
        createdAt: new Date().toISOString()
      });

      const card = document.createElement("div");
      card.className = "card-wrapper";
      card.innerHTML = `
        <div class="card" style="background-image: url('img/${background}')">
          <div class="duration">${duration}</div>
          <div class="network-name">${network}</div>
          <div class="code">${code}</div>
          <div class="info">${info}</div>
          <div class="username-label"> الرمز 👈</div>
        </div>
      `;
      page.appendChild(card);
    }

    container.appendChild(page);
  }

  localStorage.setItem("generatedCards", JSON.stringify(allCards));
  localStorage.setItem("savedCards", JSON.stringify(window.generatedUsers));
  showMiniToast();
}

function resetGeneratedCards() {
  const confirmReset = confirm("⚠️ هل تريد حذف الكروت وإعادة إدخال البيانات من جديد؟");
  if (confirmReset) {
    localStorage.removeItem("savedCards");
    window.location.href = window.location.origin + window.location.pathname;
  }
}

function loadSavedCards() {
  const saved = localStorage.getItem("savedCards");
  if (saved) {
    const users = JSON.parse(saved);
    alert("✅ الكروت المحفوظة:\n" + users.join("\n"));
  } else {
    alert("⚠️ لا يوجد كروت محفوظة.");
  }
}

function copyScriptToClipboard() {
  if (!window.generatedUsers || window.generatedUsers.length === 0) {
    alert("⚠️ لم يتم توليد الكروت بعد");
    return;
  }

  const usersList = window.generatedUsers.map(u => `"${u}"`).join(";");
  const profile = document.getElementById("profile").value;
  const limit = document.getElementById("limit").value;
  const server = document.getElementById("server").value;
  const comment = document.getElementById("comment").value;

  const scriptText = `:foreach user in={${usersList}} do={ /ip hotspot user add name=$user password="" profile=${profile} ${limit} server=${server} comment="${comment}" }`;
  navigator.clipboard.writeText(scriptText)
    .then(() => alert("✅ تم نسخ السكربت"))
    .catch(err => alert("❌ فشل النسخ: " + err));
}

function downloadPDF() {
  const element = document.getElementById("card-container");
  const comment = document.getElementById("comment").value.trim() || "skynet_cards";
  const now = new Date();
  const dateString = now.toISOString().slice(0, 10);
  const fileName = `${comment}_${dateString}.pdf`;

  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(element).save();
}

function downloadText() {
  if (!window.generatedUsers || window.generatedUsers.length === 0) {
    alert("⚠️ لم يتم توليد الكروت بعد");
    return;
  }

  const profile = document.getElementById("profile").value;
  const limit = document.getElementById("limit").value;
  const server = document.getElementById("server").value;
  const comment = document.getElementById("comment").value;
  let scriptText = "";
  const chunkSize = 56;

  for (let i = 0; i < window.generatedUsers.length; i += chunkSize) {
    const chunk = window.generatedUsers.slice(i, i + chunkSize);
    const usersList = chunk.map(u => `"${u}"`).join(";");
    scriptText += `:foreach user in={${usersList}} do={ /ip hotspot user add name=$user password="" profile=${profile} ${limit} server=${server} comment="${comment}" }\n\n`;
  }

  const blob = new Blob([scriptText], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = (comment.trim() || "mikrotik_script") + "_" + dateStr + ".txt";

  a.download = fileName;
  a.click();
}

function exportToExcel() {
  if (!window.generatedUsers || window.generatedUsers.length === 0) {
    alert("⚠️ لم يتم توليد الكروت بعد");
    return;
  }

  const ws_data = [["الكود", "الملف الشخصي", "الحدود", "السيرفر", "التعليق"]];
  const profile = document.getElementById("profile").value;
  const limit = document.getElementById("limit").value;
  const server = document.getElementById("server").value;
  const comment = document.getElementById("comment").value;

  window.generatedUsers.forEach(code => {
    ws_data.push([code, profile, limit, server, comment]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "الكروت");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = (comment || "mikrotik_cards") + "_" + dateStr + ".xlsx";

  XLSX.writeFile(workbook, fileName);
}

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("mainApp").style.display = "block";
    } else {
      document.getElementById("mainApp").style.display = "none";
      document.getElementById("login-container").style.display = "flex";
    }
  });

  const infoSelect = document.getElementById("info");
  if (infoSelect) {
    infoSelect.addEventListener("change", function () {
      const value = this.value;
      const map = {
        "٣٠٠٠": { bg: "card2.png", duration: "٣٠ يوم", comment: "3000", limit: "limit-bytes-total=9659M limit-uptime=30d" },
        "٥٠٠": { bg: "card16.png", duration: "٧ يوم", comment: "500", limit: "limit-bytes-total=1074M limit-uptime=7d" },
        "١٠٠٠": { bg: "card9.png", duration: "١٥ يوم", comment: "1000", limit: "limit-bytes-total=2148M limit-uptime=15d" },
        "١٦٠٠": { bg: "card3.png", duration: "٢٠ يوم", comment: "1600", limit: "limit-bytes-total=3072M limit-uptime=20d" },
        "٢٠٠٠": { bg: "card1.png", duration: "٢٥ يوم", comment: "2000", limit: "limit-bytes-total=5000M limit-uptime=25d" }
      };

      for (const key in map) {
        if (value.includes(key)) {
          const m = map[key];
          document.getElementById("bg-select").value = m.bg;
          document.getElementById("duration").value = m.duration;
          document.getElementById("comment").value = m.comment;
          document.getElementById("limit").value = m.limit;
        }
      }
    });
  }
});