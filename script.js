const menuItems=[
{id:9,name:"泡椒酸菜魚飯",description:"酸辣開胃、鮮嫩魚片配白飯",price:58,category:"rice",image:"spicy_fish_rice.jpg"},
{id:1,name:"焗豬扒飯",description:"香煎豬扒、番茄汁、芝士焗飯",price:58,category:"rice",image:"pork_chop_rice.jpg"},
{id:2,name:"滑蛋叉燒飯",description:"嫩滑炒蛋配蜜汁叉燒",price:52,category:"rice",image:"char_siu_rice.jpg"},
{id:3,name:"沙嗲牛肉公仔麵",description:"濃香沙嗲湯底配嫩牛肉",price:46,category:"noodles",image:"satay_noodles.jpg"},
{id:4,name:"餐肉煎蛋通粉",description:"經典茶記早餐，全日供應",price:42,category:"noodles",image:"macaroni.jpg"},
{id:5,name:"瑞士雞翼",description:"甜香豉油汁，六隻",price:38,category:"snacks",image:"chicken_wings.jpg"},
{id:6,name:"西多士",description:"花生醬、牛油及糖漿",price:32,category:"snacks",image:"french_toast.jpg"},
{id:7,name:"凍奶茶",description:"絲襪奶茶，可選少甜",price:22,category:"drinks",image:"iced_milk_tea.jpg"},
{id:8,name:"紅豆冰",description:"紅豆、淡奶、碎冰",price:26,category:"drinks",image:"red_bean_ice.jpg"}];

const cart=[];
// 統計被阻擋或載入失敗時，點餐仍正常運作。
function recordUsage(name,params={}){
  try{if(typeof window.trackUsage==="function")window.trackUsage(name,params)}catch{}
}
// 本次頁面的記憶體紀錄；不使用 localStorage、sessionStorage 或後台。
const orderHistory=[];
let editingMealKey=null;
let currentCategory="all";
let selectedMainItem=null;
let selectedSnackId=null;
let selectedDrinkId=null;
let cartSequence=1;
const defaultDrinkOptions=()=>({sweetness:"正常甜",ice:"正常冰"});
const drinkOptionsText=options=>`${(options||defaultDrinkOptions()).sweetness}・${(options||defaultDrinkOptions()).ice}`;
let selectedDrinkOptions=defaultDrinkOptions();
let drinkDraft=null;
let drinkContext=null;

const menu=document.querySelector("#menu");
const cartButton=document.querySelector("#cartButton");
const cartDrawer=document.querySelector("#cartDrawer");
const closeCart=document.querySelector("#closeCart");
const cartItems=document.querySelector("#cartItems");
const placeOrder=document.querySelector("#placeOrder");
const successModal=document.querySelector("#successModal");
const newOrder=document.querySelector("#newOrder");
const addonPage=document.querySelector("#addonPage");
const closeAddon=document.querySelector("#closeAddon");
const selectedMain=document.querySelector("#selectedMain");
const snackOptions=document.querySelector("#snackOptions");
const drinkOptions=document.querySelector("#drinkOptions");
const addonTotal=document.querySelector("#addonTotal");
const confirmAddon=document.querySelector("#confirmAddon");
const launchAd=document.querySelector("#launchAd");
const closeLaunchAd=document.querySelector("#closeLaunchAd");
const adOrderNow=document.querySelector("#adOrderNow");
const historyButton=document.querySelector("#historyButton");
const historyDrawer=document.querySelector("#historyDrawer");
const historyItems=document.querySelector("#historyItems");
const drinkPage=document.querySelector("#drinkPage");
const networkLoading=document.querySelector("#networkLoading");
let networkPending=false;
let replayingNetworkClick=false;
function randomNetworkDelay(){
  const chance=Math.random();
  return chance<0.5?0:chance<0.9?1000:3000;
}
// 在按鈕原本的事件處理之前攔截；延遲後只重播一次，不再抽籤。
document.addEventListener("click",event=>{
  if(replayingNetworkClick)return;
  if(networkPending){event.preventDefault();event.stopImmediatePropagation();return}
  const button=event.target.closest("button");
  if(!button||button.disabled||button.closest("[inert]"))return;
  const delay=randomNetworkDelay();
  if(!delay)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  networkPending=true;
  button.setAttribute("aria-busy","true");
  if(delay===3000)networkLoading.classList.remove("hidden");
  setTimeout(()=>{
    networkPending=false;
    networkLoading.classList.add("hidden");
    button.removeAttribute("aria-busy");
    if(!button.isConnected||button.disabled||button.closest("[inert]"))return;
    button.focus({preventScroll:true});
    replayingNetworkClick=true;
    try{button.click()}finally{replayingNetworkClick=false}
  },delay);
},true);
document.addEventListener("keydown",event=>{
  if(networkPending){event.preventDefault();event.stopImmediatePropagation()}
},true);

const dialogs=[launchAd,addonPage,cartDrawer,successModal,historyDrawer,drinkPage];
let activeDialog=null;
let returnFocus=null;
const focusableSelector='button:not(:disabled), textarea:not(:disabled), [href], [tabindex="0"]';
function dialogControls(dialog){
  return [...dialog.querySelectorAll(focusableSelector)].filter(el=>el.getClientRects().length);
}
function openDialog(dialog,trigger=document.activeElement){
  if(activeDialog) activeDialog.classList.add("hidden");
  returnFocus=trigger;
  activeDialog=dialog;
  dialog.classList.remove("hidden");
  [...document.body.children].forEach(el=>{el.inert=el!==dialog&&el!==networkLoading});
  document.body.style.overflow="hidden";
  dialogControls(dialog)[0]?.focus({preventScroll:true});
}
function closeDialog(dialog){
  dialog.classList.add("hidden");
  activeDialog=null;
  [...document.body.children].forEach(el=>{el.inert=false});
  document.body.style.overflow="";
  const target=returnFocus?.isConnected&&!returnFocus.closest('.hidden')?returnFocus:document.querySelector('.tab.active');
  target?.focus({preventScroll:true});
}
document.addEventListener("keydown",event=>{
  if(!activeDialog)return;
  if(event.key==="Escape"){
    event.preventDefault();
    if(activeDialog===drinkPage) closeDrinkPage();
    else if(activeDialog===addonPage) closeAddonPage();
    else closeDialog(activeDialog);
  }else if(event.key==="Tab"){
    const controls=dialogControls(activeDialog);
    const first=controls[0],last=controls[controls.length-1];
    if(!first){event.preventDefault();return}
    if(event.shiftKey&&(document.activeElement===first||!activeDialog.contains(document.activeElement))){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&(document.activeElement===last||!activeDialog.contains(document.activeElement))){event.preventDefault();first.focus()}
  }
});

const cartFeedback=document.createElement("div");
cartFeedback.className="cart-feedback";
cartFeedback.setAttribute("role","status");
cartFeedback.setAttribute("aria-live","polite");
document.body.appendChild(cartFeedback);

const money=value=>`$${Math.round(value)}`;
const isMain=item=>item.category==="rice"||item.category==="noodles";

function imageHTML(item,className="food-image"){
  return `<div class="${className}"><img src="${item.image}" alt="${item.name}"></div>`;
}

function renderMenu(){
  const list=currentCategory==="all"?menuItems:menuItems.filter(item=>item.category===currentCategory);
  menu.innerHTML=list.map(item=>`
    <article class="menu-card">
      ${imageHTML(item)}
      <div class="menu-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="menu-footer">
          <strong>${money(item.price)}</strong>
          <button class="add-button" data-add="${item.id}" aria-label="${isMain(item)?"選擇套餐":"加入"} ${item.name}">+</button>
        </div>
      </div>
    </article>`).join("");
}

function addStandalone(item,options=null){
  const existing=cart.find(entry=>entry.type==="standalone"&&entry.item.id===item.id&&JSON.stringify(entry.drinkOptions||null)===JSON.stringify(options));
  if(existing) existing.qty+=1;
  else cart.push({key:`standalone-${cartSequence++}`,type:"standalone",item,qty:1,drinkOptions:options?{...options}:null});
  recordUsage("menu_item_added",{menu_item:item.name,menu_category:item.category,order_type:"standalone"});
}

function addMeal(main,addons){
  cart.push({
    key:`meal-${cartSequence++}`,
    type:"meal",
    item:main,
    qty:1,
    addons:addons.map(addon=>({...addon}))
  });
  recordUsage("menu_item_added",{menu_item:main.name,menu_category:main.category,order_type:"meal"});
}

function entryUnitPrice(entry){
  if(entry.type==="standalone") return entry.item.price;
  return entry.item.price+entry.addons.reduce((sum,addon)=>sum+addon.price,0);
}

function getTotals(){
  return cart.reduce((total,entry)=>{
    total.subtotal+=entryUnitPrice(entry)*entry.qty;
    total.count+=entry.qty;
    return total;
  },{subtotal:0,total:0,count:0});
}

function updateCartUI(){
  const totals=getTotals();
  totals.total=totals.subtotal;
  document.querySelector("#cartCount").textContent=totals.count;
  document.querySelector("#cartTotal").textContent=money(totals.total);
  document.querySelector("#subtotal").textContent=money(totals.subtotal);
  document.querySelector("#grandTotal").textContent=money(totals.total);
  placeOrder.disabled=!totals.count;

  if(!totals.count){
    cartItems.innerHTML='<div class="empty-cart">購物車暫時未有食物。</div>';
    return;
  }

  cartItems.innerHTML=cart.map(entry=>{
    const children=entry.type==="meal"&&entry.addons.length
      ? `<div class="cart-addon-children">${entry.addons.map(addon=>`
          <div class="cart-addon-child">
            <span>↳ 加配 ${addon.item.name}${addon.type==="drink"?`<small class="drink-spec">${drinkOptionsText(addon.drinkOptions)}</small>`:""}</span>
            <strong>${money(addon.price)}</strong>
          </div>`).join("")}</div>`
      : "";

    const mainPriceLine=entry.type==="meal"
      ? `<small>主餐 ${money(entry.item.price)} × ${entry.qty}</small>`
      : `<small>${money(entry.item.price)} × ${entry.qty}</small>`;

    const mealSubtotal=entry.type==="meal"
      ? `<div class="cart-meal-subtotal"><span>套餐小計</span><strong>${money(entryUnitPrice(entry)*entry.qty)}</strong></div>`
      : "";

    return `<div class="cart-group">
      <div class="cart-row">
        <div>
          <h4>${entry.item.name}${entry.type==="meal"?' <span class="meal-label">套餐</span>':""}</h4>
          ${mainPriceLine}
          ${entry.item.category==="drinks"?`<small class="drink-spec">${drinkOptionsText(entry.drinkOptions)}</small>`:""}
          ${entry.type==="meal"?`<button class="edit-meal" data-edit="${entry.key}" aria-label="修改${entry.item.name}套餐">修改套餐</button>`:""}
        </div>
        <div class="quantity-control">
          <button data-change="-1" data-key="${entry.key}" aria-label="減少">−</button>
          <strong>${entry.qty}</strong>
          <button data-change="1" data-key="${entry.key}" aria-label="增加">+</button>
        </div>
      </div>
      ${children}
      ${mealSubtotal}
    </div>`;
  }).join("");
}

function press(button){
  button.classList.remove("pressed","added");
  void button.offsetWidth;
  button.classList.add("pressed");
  setTimeout(()=>{button.classList.remove("pressed");button.classList.add("added");button.textContent="✓"},90);
  setTimeout(()=>{button.classList.remove("added");button.textContent="+"},620);
}

function bumpCart(){
  const count=document.querySelector("#cartCount");
  cartButton.classList.remove("cart-bump");
  count.classList.remove("count-pop");
  void cartButton.offsetWidth;
  cartButton.classList.add("cart-bump");
  count.classList.add("count-pop");
  setTimeout(()=>{cartButton.classList.remove("cart-bump");count.classList.remove("count-pop")},480);
}

function animateToCart(button,item){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){bumpCart();return}
  const start=button.getBoundingClientRect();
  const end=cartButton.getBoundingClientRect();
  const flying=document.createElement("div");
  flying.className="flying-item";
  flying.innerHTML=`<img src="${item.image}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  flying.style.left=`${start.left+start.width/2-21}px`;
  flying.style.top=`${start.top+start.height/2-21}px`;
  document.body.appendChild(flying);
  const dx=end.left+end.width/2-(start.left+start.width/2);
  const dy=end.top+end.height/2-(start.top+start.height/2);
  const animation=flying.animate([
    {transform:"translate(0,0) scale(1)",opacity:1},
    {transform:`translate(${dx*.42}px,${dy*.18-70}px) scale(1.12)`,opacity:1,offset:.42},
    {transform:`translate(${dx}px,${dy}px) scale(.32)`,opacity:.25}
  ],{duration:620,easing:"cubic-bezier(.22,.78,.31,1)",fill:"forwards"});
  animation.onfinish=()=>{flying.remove();bumpCart()};
}

function showFeedback(text){
  cartFeedback.textContent=text;
  cartFeedback.classList.remove("show");
  void cartFeedback.offsetWidth;
  cartFeedback.classList.add("show");
}

function addonHTML(item,promoPrice,selected){
  const drinkSelected=selected&&item.category==="drinks";
  return `<div class="addon-option-card ${drinkSelected?"drink-selected":""}"><button class="addon-option ${selected?"selected":""}" aria-pressed="${selected}" data-addon="${item.id}" data-category="${item.category}">
    <span class="addon-emoji"><img src="${item.image}" alt="${item.name}"></span>
    <span class="addon-info">
      <h4>${item.name}</h4>
      <span class="addon-price">
        <span class="original-price">${money(item.price)}</span>
        <strong class="promo-price">${money(promoPrice)}</strong>
      </span>
    </span>
    <span class="select-circle">✓</span>
  </button>${drinkSelected?`<div class="drink-modification"><p class="addon-hint">${drinkOptionsText(selectedDrinkOptions)}</p><button id="modifyDrink" class="edit-meal" data-modify-drink="${item.id}" aria-label="修改${item.name}的甜度及冰量">修改甜度／冰量</button></div>`:""}</div>`;
}

function renderAddonOptions(){
  const noneOption=(category,selected)=>`<button class="addon-option no-addon ${selected?"selected":""}" aria-pressed="${selected}" data-addon="0" data-category="${category}">
    <span class="addon-emoji no-addon-icon" aria-hidden="true">−</span>
    <span class="addon-info"><span class="addon-name">不用加配${category==="snacks"?"小食":"飲品"}</span><span class="addon-hint">不另收費</span></span>
    <span class="select-circle" aria-hidden="true">✓</span>
  </button>`;
  snackOptions.innerHTML=noneOption("snacks",selectedSnackId===null)+menuItems.filter(item=>item.category==="snacks")
    .map(item=>addonHTML(item,12,item.id===selectedSnackId)).join("");
  drinkOptions.innerHTML=noneOption("drinks",selectedDrinkId===null)+menuItems.filter(item=>item.category==="drinks")
    .map(item=>addonHTML(item,3,item.id===selectedDrinkId)).join("");
}

function renderDrinkSettings(){
  for(const [field,values] of Object.entries({sweetness:["正常甜","少甜","半甜","走甜"],ice:["正常冰","少冰","走冰"]})){
    document.querySelector(`#${field}Options`).innerHTML=values.map(value=>`<button class="drink-choice ${drinkDraft[field]===value?"selected":""}" aria-pressed="${drinkDraft[field]===value}" data-drink-field="${field}" data-drink-value="${value}">${value}</button>`).join("");
  }
}
function openDrinkPage(item,source,trigger=document.activeElement){
  drinkContext={item,source,trigger,parentReturnFocus:returnFocus,scrollTop:addonPage.scrollTop};
  drinkDraft={...(source==="addon"?selectedDrinkOptions:defaultDrinkOptions())};
  document.querySelector("#drinkSelectedItem").innerHTML=`${imageHTML(item)}<div><h3>${item.name}</h3><p>${item.description}</p></div><strong>${money(source==="addon"?3:item.price)}</strong>`;
  document.querySelector("#drinkConfirm").textContent=source==="addon"?"儲存並返回加配":"加入購物車";
  document.querySelector("#drinkBack").setAttribute("aria-label",source==="addon"?"取消修改，返回加配":"取消，返回餐牌");
  document.querySelector("#drinkReturnHint").textContent=source==="addon"?"儲存後返回加配頁；左上角返回會取消本次修改。":"選好後加入購物車；左上角返回會取消，不會加入。";
  renderDrinkSettings();
  openDialog(drinkPage,trigger);
  drinkPage.scrollTop=0;
}
function closeDrinkPage(){
  const context=drinkContext;
  if(!context)return;
  if(context.source==="addon"){
    openDialog(addonPage,context.parentReturnFocus);
    addonPage.scrollTop=context.scrollTop;
    document.querySelector("#modifyDrink")?.focus({preventScroll:true});
  }else closeDialog(drinkPage);
  drinkContext=null;
  drinkDraft=null;
}
document.querySelector("#drinkBack").addEventListener("click",closeDrinkPage);
document.querySelector("#drinkConfirm").addEventListener("click",()=>{
  if(!drinkContext)return;
  const {item,source}=drinkContext;
  if(source==="addon"){
    selectedDrinkOptions={...drinkDraft};
    renderAddonOptions();
  }else{
    addStandalone(item,drinkDraft);
    updateCartUI();
    bumpCart();
    showFeedback(`已單點：${item.name}`);
  }
  closeDrinkPage();
});

function updateAddonTotal(){
  let total=selectedMainItem?selectedMainItem.price:0;
  if(selectedSnackId) total+=12;
  if(selectedDrinkId) total+=3;
  const entry=cart.find(entry=>entry.key===editingMealKey);
  addonTotal.textContent=money(total*(entry?entry.qty:1));
}

function openAddonPage(item,trigger=document.activeElement,entry=null){
  editingMealKey=entry?entry.key:null;
  selectedMainItem=item;
  selectedSnackId=entry?.addons.find(addon=>addon.type==="snack")?.item.id??null;
  selectedDrinkId=entry?.addons.find(addon=>addon.type==="drink")?.item.id??null;
  selectedDrinkOptions={...(entry?.addons.find(addon=>addon.type==="drink")?.drinkOptions||defaultDrinkOptions())};
  document.querySelector("#addonTitle").textContent=entry?"修改套餐":"為主食加配";
  confirmAddon.textContent=entry?"儲存修改":"加入購物車";
  document.querySelector("#addonTotalLabel").textContent=entry?`修改後小計（${entry.qty}份）`:"本次加入";
  document.querySelector("#editMealHint").textContent=entry?`修改會套用至這組套餐的全部 ${entry.qty} 份。`:"";
  selectedMain.innerHTML=`
    ${imageHTML(item)}
    <div><h3>${item.name}</h3><p>${item.description}</p></div>
    <strong>${money(item.price)}</strong>`;
  renderAddonOptions();
  updateAddonTotal();
  openDialog(addonPage,trigger);
  addonPage.scrollTop=0;
}

function closeAddonPage(){
  const editingKey=editingMealKey;
  closeDialog(addonPage);
  selectedMainItem=null;
  selectedSnackId=null;
  selectedDrinkId=null;
  editingMealKey=null;
  if(editingKey){
    openDialog(cartDrawer,cartButton);
    cartItems.querySelector(`[data-edit="${editingKey}"]`)?.focus({preventScroll:true});
  }
}

document.addEventListener("click",event=>{
  const modify=event.target.closest("[data-modify-drink]");
  if(event.target.closest(".coffee-button"))recordUsage("coffee_support_click");
  if(modify&&selectedDrinkId)openDrinkPage(menuItems.find(item=>item.id===selectedDrinkId),"addon",modify);
  const choice=event.target.closest("[data-drink-field]");
  if(choice&&drinkDraft){
    const {drinkField,drinkValue}=choice.dataset;
    const allowed={sweetness:["正常甜","少甜","半甜","走甜"],ice:["正常冰","少冰","走冰"]};
    if(allowed[drinkField]?.includes(drinkValue)){
      drinkDraft[drinkField]=drinkValue;
      renderDrinkSettings();
      drinkPage.querySelector(`[data-drink-field="${drinkField}"][data-drink-value="${drinkValue}"]`).focus({preventScroll:true});
    }
  }
  const edit=event.target.closest("[data-edit]");
  if(edit){
    const entry=cart.find(entry=>entry.key===edit.dataset.edit);
    if(entry?.type==="meal")openAddonPage(entry.item,cartButton,entry);
  }
  const add=event.target.closest("[data-add]");
  if(add){
    const item=menuItems.find(entry=>entry.id===Number(add.dataset.add));
    if(isMain(item)){
      press(add);
      openAddonPage(item,add);
    }else if(item.category==="drinks"){
      openDrinkPage(item,"standalone",add);
    }else{
      press(add);
      animateToCart(add,item);
      addStandalone(item);
      updateCartUI();
      showFeedback(`已單點：${item.name}`);
    }
  }

  const addon=event.target.closest("[data-addon]");
  if(addon){
    const id=Number(addon.dataset.addon);
    const category=addon.dataset.category;
    if(category==="snacks") selectedSnackId=id||null;
    if(category==="drinks"){
      if(selectedDrinkId!==(id||null))selectedDrinkOptions=defaultDrinkOptions();
      selectedDrinkId=id||null;
    }
    renderAddonOptions();
    addonPage.querySelector(`[data-addon="${id}"][data-category="${category}"]`).focus({preventScroll:true});
    updateAddonTotal();
  }

  const quantity=event.target.closest("[data-change]");
  if(quantity){
    const entry=cart.find(item=>item.key===quantity.dataset.key);
    if(entry){
      entry.qty+=Number(quantity.dataset.change);
      if(entry.qty<=0) cart.splice(cart.indexOf(entry),1);
      updateCartUI();
      (cartItems.querySelector(`[data-key="${quantity.dataset.key}"][data-change="${quantity.dataset.change}"]`)||closeCart).focus({preventScroll:true});
    }
  }

  const tab=event.target.closest(".tab");
  if(tab){
    document.querySelectorAll(".tab").forEach(button=>button.classList.remove("active"));
    tab.classList.add("active");
    currentCategory=tab.dataset.category;
    renderMenu();
  }
});

confirmAddon.addEventListener("click",()=>{
  if(!selectedMainItem)return;
  const addons=[];
  if(selectedSnackId){
    addons.push({item:menuItems.find(item=>item.id===selectedSnackId),price:12,type:"snack"});
  }
  if(selectedDrinkId){
    addons.push({item:menuItems.find(item=>item.id===selectedDrinkId),price:3,type:"drink",drinkOptions:{...selectedDrinkOptions}});
  }
  const mainName=selectedMainItem.name;
  const editing=cart.find(entry=>entry.key===editingMealKey);
  if(editing) editing.addons=addons;
  else addMeal(selectedMainItem,addons);
  updateCartUI();
  closeAddonPage();
  bumpCart();
  showFeedback(editing?`已修改 ${mainName} 套餐`:`已加入 ${mainName} 套餐`);
});

closeAddon.addEventListener("click",closeAddonPage);
cartButton.addEventListener("click",()=>openDialog(cartDrawer,cartButton));
closeCart.addEventListener("click",()=>closeDialog(cartDrawer));
cartDrawer.addEventListener("click",event=>{if(event.target===cartDrawer)closeDialog(cartDrawer)});
placeOrder.addEventListener("click",()=>{
  if(!cart.length)return;
  recordUsage("demo_order_completed",{meal_count:getTotals().count});
  const order={number:`A${100+orderHistory.length+1}`,time:new Date().toLocaleTimeString('zh-HK',{hour:'2-digit',minute:'2-digit',hour12:false}),items:JSON.parse(JSON.stringify(cart)),note:document.querySelector("#orderNote").value.trim(),total:getTotals().subtotal};
  orderHistory.unshift(order);
  document.querySelector("#orderNumber").textContent=order.number;
  cart.length=0;
  document.querySelector("#orderNote").value="";
  updateCartUI();
  renderHistory();
  openDialog(successModal,cartButton);
});
newOrder.addEventListener("click",()=>{
  closeDialog(successModal);
  scrollTo({top:0,behavior:"smooth"});
});
document.querySelector("#closeSuccess").addEventListener("click",()=>closeDialog(successModal));
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function renderHistory(){
  historyButton.textContent=`已落單紀錄${orderHistory.length?`（${orderHistory.length}）`:""}`;
  historyItems.innerHTML=orderHistory.length?orderHistory.map(order=>`<article class="history-order">
    <div class="history-heading"><h3>${order.number}</h3><span>${order.time}</span></div>
    ${order.items.map(entry=>`<div class="history-item"><div class="history-heading"><strong>${entry.item.name} × ${entry.qty}</strong><strong>${money(entryUnitPrice(entry)*entry.qty)}</strong></div><small>主項 ${money(entry.item.price)} × ${entry.qty}</small>
      ${entry.item.category==="drinks"?`<div class="drink-spec">${drinkOptionsText(entry.drinkOptions)}</div>`:""}
      ${entry.type==="meal"?entry.addons.map(addon=>`<div class="history-addon">↳ ${addon.item.name}　${money(addon.price)} × ${entry.qty}${addon.type==="drink"?`<div class="drink-spec">${drinkOptionsText(addon.drinkOptions)}</div>`:""}</div>`).join(""):""}</div>`).join("")}
    ${order.note?`<p class="history-note">備註：${escapeHTML(order.note)}</p>`:""}
    <div class="history-heading history-total"><span>訂單合計</span><strong>${money(order.total)}</strong></div>
  </article>`).join(""):'<div class="empty-cart">暫時未有已落單紀錄。</div>';
}
historyButton.addEventListener("click",()=>{renderHistory();openDialog(historyDrawer,historyButton)});
document.querySelector("#viewOrderHistory").addEventListener("click",()=>{
  renderHistory();
  openDialog(historyDrawer,historyButton);
});
document.querySelector("#closeHistory").addEventListener("click",()=>closeDialog(historyDrawer));
historyDrawer.addEventListener("click",event=>{if(event.target===historyDrawer)closeDialog(historyDrawer)});

function hideLaunchAd(){
  closeDialog(launchAd);
}
closeLaunchAd.addEventListener("click",hideLaunchAd);
launchAd.addEventListener("click",event=>{if(event.target===launchAd)hideLaunchAd()});
adOrderNow.addEventListener("click",()=>{
  hideLaunchAd();
  openAddonPage(menuItems.find(item=>item.id===9));
});
renderMenu();
updateCartUI();
renderHistory();
openDialog(launchAd,document.querySelector('.tab.active'));
