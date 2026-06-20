/**
 * cart.js - Order & Item Management
 */

export class CartManager {
  constructor(storageKey = 'antinna_cart_order') {
    this.storageKey = storageKey;
    this.order = this.load();
  }

  load() {
    if (typeof localStorage === 'undefined') return { "@type": "Order", "orderedItem": [], "totalPrice": 0 };
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : { "@type": "Order", "orderedItem": [], "totalPrice": 0, "priceCurrency": "INR" };
  }

  save() {
    this.order.totalPrice = this.order.orderedItem.reduce((s, i) => s + (parseFloat(i.orderedItem.offers?.price || 0) * i.orderQuantity), 0);
    localStorage.setItem(this.storageKey, JSON.stringify(this.order));
  }

  addItem(item, seller) {
    const existing = this.order.orderedItem.find(i => i.orderedItem.name === item.name);
    if (existing) existing.orderQuantity++;
    else this.order.orderedItem.push({ "@type": "OrderItem", "orderedItem": item, "orderQuantity": 1, "seller": seller });
    this.save();
  }
}
