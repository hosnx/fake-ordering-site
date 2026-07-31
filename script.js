const menuItems = [
  {
    id: 1,
    name: "焗豬扒飯",
    description: "香煎豬扒、番茄汁、芝士焗飯",
    price: 58,
    category: "rice",
    emoji: "🍛"
  },
  {
    id: 2,
    name: "滑蛋叉燒飯",
    description: "嫩滑炒蛋配蜜汁叉燒",
    price: 52,
    category: "rice",
    emoji: "🍚"
  },
  {
    id: 3,
    name: "沙嗲牛肉公仔麵",
    description: "濃香沙嗲湯底配嫩牛肉",
    price: 46,
    category: "noodles",
    emoji: "🍜"
  },
  {
    id: 4,
    name: "餐肉煎蛋通粉",
    description: "經典茶記早餐，全日供應",
    price: 42,
    category: "noodles",
    emoji: "🥣"
  },
  {
    id: 5,
    name: "瑞士雞翼",
    description: "甜香豉油汁，六隻",
    price: 38,
    category: "snacks",
    emoji: "🍗"
  },
  {
    id: 6,
    name: "西多士",
    description: "花生醬、牛油及糖漿",
    price: 32,
    category: "snacks",
    emoji: "🍞"
  },
  {
    id: 7,
    name: "凍奶茶",
    description: "絲襪奶茶，可選少甜",
    price: 22,
    category: "drinks",
    emoji: "🧋"
  },
  {
    id: 8,
    name: "紅豆冰",
    description: "紅豆、淡奶、碎冰",
    price: 26,
    category: "drinks",
    emoji: "🥤"
  }
];

const cart = new Map();
let currentCategory = "all";

const menu = document.querySelector("#menu");
const cartButton = document.querySelector("#cartButton");
const cartDrawer = document.querySelector("#cartDrawer");
const closeCart = document.querySelector("#closeCart");
const cartItems = document.querySelector("#cartItems");
const placeOrder = document.querySelector("#placeOrder");
const successModal = document.querySelector("#successModal");
const newOrder = document.querySelector("#newOrder");

function money(value) {
  return `$${Math.round(value)}`;
}

function renderMenu() {
  const visibleItems = currentCategory === "all"
    ? menuItems
    : menuItems.filter(item => item.category === currentCategory);

  menu.innerHTML = visibleItems.map(item => `
    <article class="menu-card">
      <div class="food-image" aria-hidden="true">${item.emoji}</div>
      <div class="menu-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="menu-footer">
          <strong class="price">${money(item.price)}</strong>
          <button class="add-button" data-add="${item.id}" aria-label="加入 ${item.name}">+</button>
        </div>
      </div>
    </article>
  `).join("");
}

function addItem(id) {
  cart.set(id, (cart.get(id) || 0) + 1);
  updateCartUI();
}

function changeQuantity(id, change) {
  const next = (cart.get(id) || 0) + change;
  if (next <= 0) {
    cart.delete(id);
  } else {
    cart.set(id, next);
  }
  updateCartUI();
}

function getTotals() {
  let subtotal = 0;
  let count = 0;

  cart.forEach((qty, id) => {
    const item = menuItems.find(entry => entry.id === id);
    subtotal += item.price * qty;
    count += qty;
  });

  const serviceCharge = subtotal * 0.1;
  return {
    subtotal,
    serviceCharge,
    total: subtotal + serviceCharge,
    count
  };
}

function updateCartUI() {
  const totals = getTotals();

  document.querySelector("#cartCount").textContent = totals.count;
  document.querySelector("#cartTotal").textContent = money(totals.total);
  document.querySelector("#subtotal").textContent = money(totals.subtotal);
  document.querySelector("#serviceCharge").textContent = money(totals.serviceCharge);
  document.querySelector("#grandTotal").textContent = money(totals.total);
  placeOrder.disabled = totals.count === 0;

  if (totals.count === 0) {
    cartItems.innerHTML = `<div class="empty-cart">購物車暫時未有食物。</div>`;
    return;
  }

  cartItems.innerHTML = [...cart.entries()].map(([id, qty]) => {
    const item = menuItems.find(entry => entry.id === id);
    return `
      <div class="cart-row">
        <div>
          <h4>${item.name}</h4>
          <small>${money(item.price)} × ${qty}</small>
        </div>
        <div class="quantity-control">
          <button data-change="-1" data-id="${id}" aria-label="減少">−</button>
          <strong>${qty}</strong>
          <button data-change="1" data-id="${id}" aria-label="增加">+</button>
        </div>
      </div>
    `;
  }).join("");
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addItem(Number(addButton.dataset.add));
  }

  const quantityButton = event.target.closest("[data-change]");
  if (quantityButton) {
    changeQuantity(
      Number(quantityButton.dataset.id),
      Number(quantityButton.dataset.change)
    );
  }

  const tab = event.target.closest(".tab");
  if (tab) {
    document.querySelectorAll(".tab").forEach(button => button.classList.remove("active"));
    tab.classList.add("active");
    currentCategory = tab.dataset.category;
    renderMenu();
  }
});

cartButton.addEventListener("click", () => {
  cartDrawer.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

closeCart.addEventListener("click", closeDrawer);
cartDrawer.addEventListener("click", event => {
  if (event.target === cartDrawer) closeDrawer();
});

function closeDrawer() {
  cartDrawer.classList.add("hidden");
  document.body.style.overflow = "";
}

placeOrder.addEventListener("click", () => {
  const orderNo = `A${Math.floor(100 + Math.random() * 900)}`;
  document.querySelector("#orderNumber").textContent = orderNo;
  closeDrawer();
  successModal.classList.remove("hidden");
});

newOrder.addEventListener("click", () => {
  cart.clear();
  document.querySelector("#orderNote").value = "";
  updateCartUI();
  successModal.classList.add("hidden");
  document.body.style.overflow = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderMenu();
updateCartUI();
