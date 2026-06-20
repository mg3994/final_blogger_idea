/**
 * cart.js - High-fidelity Order management
 */

export class CartManager {
  constructor() {
    this.storageKey = 'antinna_cart_order';
    this.order = this.loadOrder();
    this.renderFab();
  }

  loadOrder() {
    if (typeof localStorage === 'undefined') return { "@context": "https://schema.org", "@type": "Order", "orderedItem": [], "totalPrice": 0, "priceCurrency": "INR" };
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
      "orderedItem": [],
      "totalPrice": 0,
      "priceCurrency": "INR"
    };
  }

  add(item, seller) {
    const existing = this.order.orderedItem.find(i => i.orderedItem.name === item.name);
    if (existing) {
      existing.orderQuantity++;
    } else {
      this.order.orderedItem.push({
        "@type": "OrderItem",
        "orderedItem": {
          name: item.name,
          image: item.image,
          offers: item.offers
        },
        "orderQuantity": 1,
        "seller": seller
      });
    }
    this.save();
    this.updateUI();
    if (window.showToast) window.showToast("Added to bag", "success");
  }

  updateQty(idx, delta) {
    const item = this.order.orderedItem[idx];
    if (!item) return;
    item.orderQuantity += delta;
    if (item.orderQuantity <= 0) {
      this.order.orderedItem.splice(idx, 1);
    }
    this.save();
    this.updateUI();
    this.showModal();
  }

  save() {
    this.order.totalPrice = this.order.orderedItem.reduce((sum, item) => {
      const price = parseFloat(item.orderedItem.offers?.price || 0);
      return sum + (price * (item.orderQuantity || 1));
    }, 0);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.order));
    }
  }

  renderFab() {
    if (typeof document === 'undefined') return;
    let fab = document.getElementById('cart-fab');
    if (!fab) {
      const container = document.getElementById('cart-fab-container') || document.body;
      fab = document.createElement('div');
      fab.id = 'cart-fab';
      fab.className = 'cart-fab';
      fab.onclick = () => this.showModal();
      container.appendChild(fab);
    }
    this.updateUI();
  }

  updateUI() {
    const count = this.order.orderedItem.reduce((s, i) => s + (i.orderQuantity || 1), 0);
    const fab = document.getElementById('cart-fab');
    if (fab) {
      fab.innerHTML = `🛒 <span class="cart-count">${count}</span>`;
      fab.style.transform = count > 0 ? 'scale(1)' : 'scale(0)';
    }
  }

  showModal() {
    const m = document.getElementById('cart-modal-backdrop');
    const list = document.getElementById('cart-items-list');
    if (!m || !list) return;

    list.innerHTML = this.order.orderedItem.map((i, idx) => `
      <div style="display:flex; gap:15px; padding:15px; border-bottom:1px solid rgba(0,0,0,0.05); align-items:center;">
         <img src="${(Array.isArray(i.orderedItem.image) ? i.orderedItem.image[0] : (i.orderedItem.image?.url || i.orderedItem.image || ''))}" style="width:60px; height:60px; border-radius:10px; object-fit:cover;"/>
         <div style="flex:1;">
            <div style="font-weight:700;">${i.orderedItem.name}</div>
            <div style="color:var(--accent); font-weight:800; font-size:0.9rem; margin-top:4px;">${i.orderedItem.offers?.priceCurrency || 'INR'} ${i.orderedItem.offers?.price || '0'}</div>
            <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
               <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" onclick="window.CartManager.updateQty(${idx}, -1)">-</button>
               <span style="font-weight:800;">${i.orderQuantity}</span>
               <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" onclick="window.CartManager.updateQty(${idx}, 1)">+</button>
            </div>
         </div>
      </div>
    `).join('') || '<div style="text-align:center; padding:50px; opacity:0.5;">Your bag is empty</div>';

    const totalPriceEl = document.getElementById('cart-total-price');
    if (totalPriceEl) totalPriceEl.textContent = `${this.order.priceCurrency} ${this.order.totalPrice}`;
    m.classList.add('active');
  }

  checkout() {
    alert("Finalizing Order: " + JSON.stringify(this.order, null, 2));
  }
}

if (typeof window !== 'undefined') {
  window.CartManager = new CartManager();
}
