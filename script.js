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
let currentCategory="all";
let selectedMainItem=null;
let selectedSnackId=null;
let selectedDrinkId=null;
let cartSequence=1;

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

function addStandalone(item){
  const existing=cart.find(entry=>entry.type==="standalone"&&entry.item.id===item.id);
  if(existing) existing.qty+=1;
  else cart.push({key:`standalone-${item.id}`,type:"standalone",item,qty:1});
}

function addMeal(main,addons){
  cart.push({
    key:`meal-${cartSequence++}`,
    type:"meal",
    item:main,
    qty:1,
    addons:addons.map(addon=>({...addon}))
  });
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
            <span>↳ 加配 ${addon.item.name}</span>
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
  return `<button class="addon-option ${selected?"selected":""}" data-addon="${item.id}" data-category="${item.category}">
    <span class="addon-emoji"><img src="${item.image}" alt="${item.name}"></span>
    <span class="addon-info">
      <h4>${item.name}</h4>
      <span class="addon-price">
        <span class="original-price">${money(item.price)}</span>
        <strong class="promo-price">${money(promoPrice)}</strong>
      </span>
    </span>
    <span class="select-circle">✓</span>
  </button>`;
}

function renderAddonOptions(){
  snackOptions.innerHTML=menuItems.filter(item=>item.category==="snacks")
    .map(item=>addonHTML(item,12,item.id===selectedSnackId)).join("");
  drinkOptions.innerHTML=menuItems.filter(item=>item.category==="drinks")
    .map(item=>addonHTML(item,3,item.id===selectedDrinkId)).join("");
}

function updateAddonTotal(){
  let total=selectedMainItem?selectedMainItem.price:0;
  if(selectedSnackId) total+=12;
  if(selectedDrinkId) total+=3;
  addonTotal.textContent=money(total);
}

function openAddonPage(item){
  selectedMainItem=item;
  selectedSnackId=null;
  selectedDrinkId=null;
  selectedMain.innerHTML=`
    ${imageHTML(item)}
    <div><h3>${item.name}</h3><p>${item.description}</p></div>
    <strong>${money(item.price)}</strong>`;
  renderAddonOptions();
  updateAddonTotal();
  addonPage.classList.remove("hidden");
  document.body.style.overflow="hidden";
  addonPage.scrollTop=0;
}

function closeAddonPage(){
  addonPage.classList.add("hidden");
  document.body.style.overflow="";
  selectedMainItem=null;
  selectedSnackId=null;
  selectedDrinkId=null;
}

document.addEventListener("click",event=>{
  const add=event.target.closest("[data-add]");
  if(add){
    const item=menuItems.find(entry=>entry.id===Number(add.dataset.add));
    if(isMain(item)){
      press(add);
      setTimeout(()=>openAddonPage(item),170);
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
    if(category==="snacks") selectedSnackId=selectedSnackId===id?null:id;
    if(category==="drinks") selectedDrinkId=selectedDrinkId===id?null:id;
    renderAddonOptions();
    updateAddonTotal();
  }

  const quantity=event.target.closest("[data-change]");
  if(quantity){
    const entry=cart.find(item=>item.key===quantity.dataset.key);
    if(entry){
      entry.qty+=Number(quantity.dataset.change);
      if(entry.qty<=0) cart.splice(cart.indexOf(entry),1);
      updateCartUI();
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
    addons.push({item:menuItems.find(item=>item.id===selectedDrinkId),price:3,type:"drink"});
  }
  const mainName=selectedMainItem.name;
  addMeal(selectedMainItem,addons);
  closeAddonPage();
  updateCartUI();
  bumpCart();
  showFeedback(`已加入 ${mainName} 套餐`);
});

closeAddon.addEventListener("click",closeAddonPage);
cartButton.addEventListener("click",()=>{cartDrawer.classList.remove("hidden");document.body.style.overflow="hidden"});
closeCart.addEventListener("click",()=>{cartDrawer.classList.add("hidden");document.body.style.overflow=""});
cartDrawer.addEventListener("click",event=>{if(event.target===cartDrawer){cartDrawer.classList.add("hidden");document.body.style.overflow=""}});
placeOrder.addEventListener("click",()=>{
  document.querySelector("#orderNumber").textContent=`A${Math.floor(100+Math.random()*900)}`;
  cartDrawer.classList.add("hidden");
  successModal.classList.remove("hidden");
});
newOrder.addEventListener("click",()=>{
  cart.length=0;
  document.querySelector("#orderNote").value="";
  updateCartUI();
  successModal.classList.add("hidden");
  document.body.style.overflow="";
  scrollTo({top:0,behavior:"smooth"});
});

function hideLaunchAd(){
  launchAd.classList.add("hidden");
  document.body.style.overflow="";
}
closeLaunchAd.addEventListener("click",hideLaunchAd);
launchAd.addEventListener("click",event=>{if(event.target===launchAd)hideLaunchAd()});
adOrderNow.addEventListener("click",()=>{
  hideLaunchAd();
  openAddonPage(menuItems.find(item=>item.id===9));
});
document.body.style.overflow="hidden";

renderMenu();
updateCartUI();
