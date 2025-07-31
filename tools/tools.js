// تحميل إعدادات الاتصال عند فتح الصفحة
document.addEventListener("DOMContentLoaded", () => {
  const config = JSON.parse(localStorage.getItem("mikrotikConfig") || "{}");
  if (config.ip) document.getElementById("mt-ip").value = config.ip;
  if (config.port) document.getElementById("mt-port").value = config.port;
  if (config.user) document.getElementById("mt-user").value = config.user;
  if (config.pass) document.getElementById("mt-pass").value = config.pass;
  if (config.profile) document.getElementById("mt-profile").value = config.profile;

  showSavedCards();
});

// حفظ إعدادات الاتصال
function saveMikrotikSettings() {
  const config = {
    ip: document.getElementById("mt-ip").value.trim(),
    port: document.getElementById("mt-port").value.trim(),
    user: document.getElementById("mt-user").value.trim(),
    pass: document.getElementById("mt-pass").value.trim(),
    profile: document.getElementById("mt-profile").value.trim()
  };

  localStorage.setItem("mikrotikConfig", JSON.stringify(config));
  alert("✅ تم حفظ إعدادات الاتصال");
}

// عرض الكروت حسب الصفحات
function showSavedCards() {
  const container = document.getElementById("savedCardsContainer");
  const tbody = document.querySelector("#savedCardsTable tbody");
  const allCards = JSON.parse(localStorage.getItem("generatedCards") || "[]");

  container.style.display = "block";
  tbody.innerHTML = "";

  if (allCards.length === 0) {
    tbody.innerHTML = "<tr><td colspan='3'>لا توجد كروت محفوظة</td></tr>";
    return;
  }

  // تجميع الكروت حسب الصفحة
  const pagesMap = {};
  allCards.forEach(card => {
    const page = card.page || 1;
    if (!pagesMap[page]) pagesMap[page] = [];
    pagesMap[page].push(card);
  });

  // عرض كل صفحة بزر إرسال + زر عرض الكروت
  Object.keys(pagesMap).sort((a, b) => a - b).forEach(pageNum => {
    const cards = pagesMap[pageNum];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="3">
        📄 الصفحة ${pageNum} - عدد الكروت: ${cards.length}
        <button onclick="sendPage(${pageNum})">📦 إرسال الصفحة</button>
        <button onclick="showPageCards(${pageNum})">📋 عرض الكروت</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// عرض كروت صفحة محددة
function showPageCards(pageNum) {
  const allCards = JSON.parse(localStorage.getItem("generatedCards") || "[]");
  const pageCards = allCards.filter(c => c.page === pageNum);

  if (!pageCards.length) {
    alert("⚠️ لا توجد كروت في هذه الصفحة");
    return;
  }

  const list = pageCards
    .map((c, i) => `${i + 1}- ${c.username}`)
    .join("\n");

  alert(`📋 كروت الصفحة ${pageNum}:\n\n${list}`);
}

// إرسال كروت صفحة واحدة
function sendPage(pageNumber) {
  const allCards = JSON.parse(localStorage.getItem("generatedCards") || "[]");
  const cardsToSend = allCards.filter(card => card.page === pageNumber);

  if (!cardsToSend.length) {
    alert("⚠️ لا توجد كروت في هذه الصفحة");
    return;
  }

  const config = JSON.parse(localStorage.getItem("mikrotikConfig") || "{}");
  if (!config.ip || !config.port || !config.user || !config.pass) {
    alert("❗ يرجى ضبط إعدادات الاتصال أولاً");
    return;
  }

  const payload = {
    ip: config.ip,
    port: config.port,
    user: config.user,
    pass: config.pass,
    profile: config.profile,
    cards: cardsToSend
  };

  fetch("../add-users-batch.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      alert(`✅ تم إرسال ${data.sent} كرت من الصفحة ${pageNumber}`);
      const remaining = allCards.filter(card => card.page !== pageNumber);
      localStorage.setItem("generatedCards", JSON.stringify(remaining));
      showSavedCards();
    } else {
      alert("❌ خطأ: " + data.message);
    }
  })
  .catch(err => {
    alert("❌ فشل الاتصال بالخادم");
    console.error(err);
  });
}

function printAllSavedCards() {
  const allCards = JSON.parse(localStorage.getItem("generatedCards") || "[]");
  if (allCards.length === 0) {
    alert("❗ لا توجد كروت محفوظة للطباعة");
    return;
  }

  const pages = [];
  for (let i = 0; i < allCards.length; i += 56) {
    pages.push(allCards.slice(i, i + 56));
  }

  const printable = document.createElement("div");
  printable.style.padding = "10px";
  printable.id = "printable-cards";

  printable.innerHTML = pages.map(cards => `
    <div class="page">
      ${cards.map(card => {
        const duration = card.duration || "";
        const network = card.server || "sky.net";
        const code = card.username || "";
        const info = card.comment || "";

        return `
          <div class="card-wrapper">
            <div class="card" style="background-image: url('img/${card.background || 'card1.png'}');">
              <div class="duration">${duration}</div>
              <div class="network-name">${network}</div>
              <div class="code">${code}</div>
              <div class="info">${info}</div>
              <div class="username-label">الرمز 👈</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `).join("");

  html2pdf().set({
    margin: 0,
    filename: `Skynet_AllCards.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }).from(printable).save();
}
// الرجوع للواجهة الرئيسية
/*function goBack() {
  window.location.href = "index.html";
}*/
function goBack() {
  // هذا سيعمل سواء تم فتح الصفحة من folder أو من سيرفر
  const basePath = window.location.href.replace(/\/[^\/]*$/, "/");
  window.location.href = basePath + "index.html";
}