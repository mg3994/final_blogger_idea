/**
 * cart.js - Order management and floating FAB UI
 */

export class CartManager {
  constructor() {
    this.storageKey = 'antinna_cart_order';
    this.order = this.loadOrder();
    this.createFab();
  }

  loadOrder() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cart order", e);
      }
    }
    return {
      "@context": "https://schema.org",
      "@type": "Order",
      "orderStatus": "https://schema.org/OrderPlanned",
      "orderedItem": [],
      "priceCurrency": "INR",
      "totalPrice": 0
    };
  }

  save() {
    this.order.totalPrice = this.order.orderedItem.reduce((sum, item) => {
      const price = parseFloat(item.orderedItem.offers?.price || 0);
      return sum + (price * (item.orderQuantity || 1));
    }, 0);

    localStorage.setItem(this.storageKey, JSON.stringify(this.order));
    this.updateFab();
  }

  addItem(item, seller) {
    const inv = item.offers?.inventoryLevel?.value ?? item.inventoryLevel?.value ?? Infinity;
    const existing = this.order.orderedItem.find(i => i.orderedItem.name === item.name);

    if (existing) {
      if (existing.orderQuantity + 1 > inv) {
        window.showToast?.("Inventory limit reached!", "error"); return;
      }
      existing.orderQuantity++;
    } else {
      if (inv <= 0 || item.offers?.availability === 'https://schema.org/OutOfStock') {
        window.showToast?.("Item is out of stock.", "error"); return;
      }
      this.order.orderedItem.push({
        "@type": "OrderItem",
        "orderedItem": {
          "@type": item["@type"] || "Product",
          "name": item.name,
          "image": item.image,
          "sku": item.sku,
          "offers": item.offers
        },
        "orderQuantity": 1,
        "seller": {
          "@type": seller?.["@type"] || "Organization",
          "name": seller?.name || "Official Seller",
          "url": seller?.url
        }
      });
    }
    this.save();
    window.showToast?.("Added to Shopping Cart", "success");
  }

  updateQuantity(idx, delta) {
    const item = this.order.orderedItem[idx];
    if (!item) return;
    const inv = item.orderedItem.offers?.inventoryLevel?.value ?? Infinity;
    const newVal = item.orderQuantity + delta;
    if (newVal > inv) { window.showToast?.("Cannot exceed inventory!", "error"); return; }
    if (newVal <= 0) { this.removeItem(idx); return; }
    item.orderQuantity = newVal;
    this.save();
    this.showModal();
  }

  removeItem(idx) {
    this.order.orderedItem.splice(idx, 1);
    this.save();
    this.showModal();
  }

  createFab() {
    if (typeof document === 'undefined') return;
    const fab = document.createElement('div');
    fab.id = 'cart-fab';
    fab.style.cssText = 'position:fixed; bottom:30px; right:30px; width:64px; height:64px; background:var(--color-accent); color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 8px 25px rgba(0,0,0,0.3); z-index:1000; font-size:1.5rem; transition:transform 0.2s;';
    fab.innerHTML = '🛒 <span id="cart-count" style="position:absolute; top:-5px; right:-5px; background:#ef4444; color:#fff; border-radius:50%; width:26px; height:26px; font-size:12px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; font-weight:800;">0</span>';
    fab.onclick = () => this.showModal();
    document.body.appendChild(fab);
    this.updateFab();
  }

  updateFab() {
    const count = this.order.orderedItem.reduce((s, i) => s + (i.orderQuantity || 1), 0);
    const fab = document.getElementById('cart-fab');
    if (fab) {
       document.getElementById('cart-count').textContent = count;
       fab.style.transform = count > 0 ? 'scale(1)' : 'scale(0)';
    }
  }

  showModal() {
    const m = document.getElementById('cart-modal-backdrop');
    if (!m) return;

    const list = document.getElementById('cart-items-list');
    list.innerHTML = this.order.orderedItem.map((i, idx) => `
      <div style="display:flex; gap:15px; padding:20px; border-bottom:1px solid var(--border-ui); align-items:center;">
        <img src="${(Array.isArray(i.orderedItem.image) ? i.orderedItem.image[0] : (i.orderedItem.image?.url || i.orderedItem.image || ''))}" style="width:70px; height:70px; border-radius:10px; object-fit:cover;"/>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:1rem; margin-bottom:5px;">${i.orderedItem.name}</div>
          <div style="font-size:0.9rem; color:var(--color-accent); font-weight:800;">${i.orderedItem.offers?.priceCurrency || 'INR'} ${i.orderedItem.offers?.price || '0'}</div>
          <div style="display:flex; align-items:center; gap:12px; margin-top:10px;">
             <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" onclick="window.CartManager.updateQuantity(${idx}, -1)">-</button>
             <span style="font-weight:800;">${i.orderQuantity}</span>
             <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" onclick="window.CartManager.updateQuantity(${idx}, 1)">+</button>
          </div>
        </div>
        <button onclick="window.CartManager.removeItem(${idx})" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:1.8rem; padding:5px;">×</button>
      </div>
    `).join('') || '<div style="text-align:center; padding:60px; color:var(--text-muted); font-weight:600; font-size:1.1rem;">Your cart is empty.</div>';

    document.getElementById('cart-total-price').textContent = `${this.order.priceCurrency} ${this.order.totalPrice}`;
    m.classList.add('active');
  }

  placeOrder() {
    alert("Finalizing Order Schema: " + JSON.stringify(this.order, null, 2));
  }
}

if (typeof window !== 'undefined') {
  window.CartManager = new CartManager();
}
