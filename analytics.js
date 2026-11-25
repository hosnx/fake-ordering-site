// 公開的 GA4 評估 ID；不包含帳戶密碼或報表讀取權限。
(() => {
  // 本機預覽不送統計，避免測試操作混入正式報表。
  if (location.protocol !== "https:" || location.hostname !== "hosnx.github.io") return;
  const measurementId = "G-RFP51T35EW";
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname,
    page_referrer: ""
  });
  // 僅接收固定事件與欄位，不接受備註、整張訂單或使用者身分。
  const fields = {
    menu_item_added: ["menu_item", "menu_category", "order_type"],
    demo_order_completed: ["meal_count"],
    coffee_support_click: []
  };
  window.trackUsage = (name, params = {}) => {
    if (!Object.hasOwn(fields, name)) return;
    const safe = { send_to: measurementId };
    for (const key of fields[name]) {
      if (typeof params[key] === "string" || typeof params[key] === "number") safe[key] = params[key];
    }
    window.gtag("event", name, safe);
  };
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(tag);
})();
