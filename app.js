/*
  الكود التالي يقوم بجلب بيانات البثوث الحية من منصة Kick باستخدام نقطة نهاية محدثة،
  ويدعم البحث باللغتين الإنجليزية والعربية.
*/

let liveData = []; // ستملأ البيانات من API مباشرة

// إعداد Fuse.js للبحث الذكي باستخدام الحقول "streamer" و "title"
let fuse;
function updateFuseCollection() {
  fuse = new Fuse(liveData, {
    keys: ["streamer", "title"],
    threshold: 0.4  // يمكنك تعديل قيمة العتبة حسب الدقة المطلوبة
  });
}

// دالة لجلب بيانات البثوث الحية من منصة Kick باستخدام نقطة النهاية المحدثة
async function fetchKickLives() {
  try {
    // استخدام Proxy لتجاوز مشاكل CORS إذا لزم الأمر
    const proxy = "https://corsproxy.io/?";
    // نقطة النهاية المُحدثة؛ يرجى التأكد من صحة الرابط أو تعديله حسب التوثيق
    const apiUrl = "https://api.kick.com/api/v2/lives";
    const response = await fetch(proxy + apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("بيانات Kick المسترجعة:", data);

    // نتوقع أن يكون تنسيق البيانات كما يلي:
    // {
    //   data: [
    //     {
    //       id: 123,
    //       user: { username: "StreamerOne", ... },
    //       title: "Live Stream Title",
    //       streamUrl: "https://kick.com/stream/123",
    //       ... خصائص أخرى ...
    //     },
    //     ...
    //   ]
    // }
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error("تنسيق البيانات غير مطابق للتوقعات!");
    }

    // تحويل البيانات إلى الهيكل المطلوب:
    // استخراج id، اسم الاستريمر من داخل user، العنوان، ورابط البث
    return data.data.map(item => ({
      id: item.id,
      streamer: item.user?.username || "Unknown",
      title: item.title,
      url: item.streamUrl
    }));
  } catch (error) {
    console.error("خطأ أثناء جلب بيانات Kick:", error);
    return [];
  }
}

// دالة لتحديث بيانات البث وإعادة عرضها
async function updateLives() {
  const kickLives = await fetchKickLives();
  if (kickLives.length > 0) {
    liveData = kickLives;
    updateFuseCollection();
    performSearch(); // إعادة عرض النتائج بناءً على البحث الحالي
  } else {
    // إذا لم تُسترجع بيانات حقيقية، يحتفظ بالبيانات القديمة ويستمر العرض
    performSearch();
  }
}

// تحديث البيانات بشكل دوري كل 30 ثانية (30000 مللي ثانية)
setInterval(updateLives, 30000);

// التعامل مع واجهة البحث والنتائج
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsDiv = document.getElementById('results');

// دالة تنفيذ البحث وعرض النتائج
function performSearch() {
  const query = searchInput.value.trim();
  resultsDiv.innerHTML = '';
  let results = [];
  if (query === "") {
    results = liveData;
  } else {
    results = fuse.search(query).map(result => result.item);
  }
  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>لم يتم العثور على نتائج.</p>";
    return;
  }
  results.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'result-item';
    itemDiv.innerHTML = `<h3>${item.title}</h3>
                         <p>الاستريمر: ${item.streamer}</p>
                         <button class="download-button" onclick="downloadLive('${item.url}')">Download/تحميل</button>`;
    resultsDiv.appendChild(itemDiv);
  });
}

// دالة تحميل البث (يفتح الرابط في نافذة جديدة)
function downloadLive(url) {
  window.open(url, '_blank');
}

// إضافة أحداث البحث عند الضغط على زر البحث أو عند الضغط على Enter
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    performSearch();
  }
});

// التحديث الأول للبيانات عند تحميل الصفحة
updateLives();
