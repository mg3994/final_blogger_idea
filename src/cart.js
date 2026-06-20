/**
 * src/cart.js - Defensive Order Management with Drawer UI and Specifications
 */

export class CartManager {
  constructor(storageKey = 'antinna_cart_order') {
    this.storageKey = storageKey;
    this.order = this.load();
    this.renderFab();
  }

  load() {
    if (typeof localStorage === 'undefined') return { "@context": "https://schema.org", "@type": "Order", "orderedItem": [], "totalPrice": 0, "priceCurrency": "INR" };
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : { "@context": "https://schema.org", "@type": "Order", "orderedItem": [], "totalPrice": 0, "priceCurrency": "INR" };
    } catch(e) {
      return { "@context": "https://schema.org", "@type": "Order", "orderedItem": [], "totalPrice": 0, "priceCurrency": "INR" };
    }
  }

  save() {
    this.order.totalPrice = (this.order.orderedItem || []).reduce((sum, item) => {
      const price = parseFloat(item.orderedItem?.offers?.price || 0);
      return sum + (price * (item.orderQuantity || 1));
    }, 0);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.order));
    }
  }

  addItem(item, seller) {
    if (!item) return;
    const items = this.order.orderedItem || [];
    const existing = items.find(i => i.orderedItem?.name === item.name);

    if (existing) {
      existing.orderQuantity++;
    } else {
      const specs = {};
      ['material', 'color', 'size', 'gtin13', 'sku', 'weight', 'height', 'width', 'depth'].forEach(f => {
        if (item[f]) specs[f] = item[f];
      });

      items.push({
        "@type": "OrderItem",
        "orderedItem": {
          "@type": item["@type"] || "Product",
          "name": item.name,
          "image": item.image,
          "offers": item.offers,
          ...specs
        },
        "orderQuantity": 1,
        "seller": seller
      });
    }
    this.order.orderedItem = items;
    this.save(); this.updateUI();
    if (window.showToast) window.showToast("Added to Bag", "success");
  }

  updateQty(idx, delta) {
    const item = this.order.orderedItem?.[idx];
    if (!item) return;
    item.orderQuantity += delta;
    if (item.orderQuantity <= 0) {
      this.removeItem(idx);
      return;
    }
    this.save(); this.updateUI(); this.showModal();
  }

  removeItem(idx) {
    const item = this.order.orderedItem[idx];
    if (!item) return;

    const name = item.orderedItem.name;
    // Cascading Removal Logic
    const dependents = this.order.orderedItem
      .map((it, i) => (it.orderedItem.parentProductName === name ? i : -1))
      .filter(i => i !== -1)
      .sort((a, b) => b - a); // Remove from end to start to maintain index stability

    this.order.orderedItem.splice(idx, 1);

    // Remove dependents
    dependents.forEach(depIdx => {
      // Adjusted index if the original item was after the dependent
      const actualIdx = depIdx > idx ? depIdx - 1 : depIdx;
      this.order.orderedItem.splice(actualIdx, 1);
    });

    this.save(); this.updateUI(); this.showModal();
    if (dependents.length > 0) window.showToast?.(`Removed ${dependents.length} linked services.`, "info");
  }

  renderFab() {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('cart-fab-container');
    if (!container) {
      container = document.createElement('div'); container.id = 'cart-fab-container';
      document.body.appendChild(container);
    }
    let fab = document.getElementById('cart-fab');
    if (!fab) {
      fab = document.createElement('div'); fab.className = 'cart-fab'; fab.id = 'cart-fab';
      fab.onclick = () => this.showModal();
      container.appendChild(fab);
    }
    this.updateUI();
  }

  updateUI() {
    const count = (this.order.orderedItem || []).reduce((s,i)=>s+i.orderQuantity, 0);
    const countEl = document.getElementById('cart-count');
    const fab = document.getElementById('cart-fab');
    if (countEl) countEl.textContent = count;
    if (fab) {
      fab.innerHTML = `🛒 <span class="cart-count">${count}</span>`;
      fab.style.transform = count > 0 ? 'scale(1)' : 'scale(0)';
    }
  }

  showModal() {
    const b = document.getElementById('cart-modal-backdrop');
    const d = document.getElementById('cart-drawer');
    const list = document.getElementById('cart-items-list');
    if (!b || !d || !list) return;

    list.innerHTML = (this.order.orderedItem || []).map((i, idx) => `
      <div style="display:flex; gap:15px; padding:15px; border-bottom:1px solid #eee; align-items:center;">
         <img src="${(Array.isArray(i.orderedItem?.image) ? i.orderedItem.image[0] : (i.orderedItem?.image?.url || i.orderedItem?.image || ''))}" style="width:60px; height:60px; border-radius:10px; object-fit:cover;"/>
         <div style="flex:1;">
            <div style="font-weight:700;">${i.orderedItem?.name || 'Item'}</div>
            <div style="color:var(--accent); font-weight:800; font-size:0.9rem; margin-top:4px;">${i.orderedItem?.offers?.priceCurrency || 'INR'} ${i.orderedItem?.offers?.price || '0'}</div>
            <div style="display:flex; align-items:center; gap:12px; margin-top:10px;">
               <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" onclick="window.CartManager.updateQty(${idx}, -1)">-</button>
               <span style="font-weight:800;">${i.orderQuantity}</span>
               <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" onclick="window.CartManager.updateQty(${idx}, 1)">+</button>
            </div>
         </div>
         <button onclick="window.CartManager.updateQty(${idx}, -${i.orderQuantity})" style="background:none; border:none; color:#ff3b30; cursor:pointer; font-size:1.2rem; padding:10px;">×</button>
      </div>
    `).join('') || '<div style="text-align:center; padding:50px; opacity:0.5; font-weight:700;">Bag is empty</div>';

    const totalEl = document.getElementById('cart-total-price');
    if (totalEl) totalEl.textContent = `${this.order.priceCurrency || 'INR'} ${this.order.totalPrice || 0}`;
    b.classList.add('active'); d.classList.add('active');
  }

  hideModal() {
    document.getElementById('cart-modal-backdrop')?.classList.remove('active');
    document.getElementById('cart-drawer')?.classList.remove('active');
  }

  placeOrder() {
    alert("Confirming Order Schema: " + JSON.stringify(this.order, null, 2));
  }
}
