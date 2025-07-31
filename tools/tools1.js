// تحميل الإعدادات من التخزين
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

// عرض الكروت
function showSavedCards() {
  const tbody = document.querySelector("#savedCardsTable tbody");
  const cards = JSON.parse(localStorage.getItem("generatedCards") || "[]");

  tbody.innerHTML = "";

  if (cards.length === 0) {
    tbody.innerHTML = "<tr><td colspan='3'>لا توجد كروت محفوظة</td></tr>";
    return;
  }

  cards.forEach((card, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${card.username}</td>
      <td>${card.profile}</td>
      <td><button onclick="sendCard(${index})">📡 إرسال</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// إرسال كرت واحد
function sendCard(index) {
  const cards = JSON.parse(localStorage.getItem("generatedCards") || "[]");
  const card = cards[index];
  const config = JSON.parse(localStorage.getItem("mikrotikConfig") || "{}");

  if (!config.ip || !config.port || !config.user || !config.pass) {
    alert("❗ يرجى ضبط إعدادات الاتصال أولًا");
    return;
  }

  const formData = new URLSearchParams();
  formData.append("username", card.username);
  formData.append("password", ""); // كلمة المرور فارغة
  formData.append("profile", config.profile);
  formData.append("ip", config.ip);
  formData.append("port", config.port);
  formData.append("user", config.user);
  formData.append("pass", config.pass);

  fetch("../add-user.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      alert(`✅ تم إرسال ${card.username}`);
      cards.splice(index, 1);
      localStorage.setItem("generatedCards", JSON.stringify(cards));
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

// رجوع للواجهة الرئيسية
function goBack() {
  window.location.href = "index.html";
}

