/**
 * src/renderers.js - High-fidelity Renderers with Swatches and Carousel
 */

function sanitize(text) {
  if (typeof document === 'undefined') return text || '';
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

export const renderers = {
  renderProduct(p, state) {
    if (!p) return;
    const variants = p.hasVariant || [p];
    const variant = variants.find(x => Object.entries(state.selected || {}).every(([k, v]) => x[k] === v)) || variants[0];

    const el = (id) => document.getElementById(id);
    const setText = (id, v) => { const e = el(id); if (e) e.textContent = v || "" };

    setText("p-name", variant.name || p.name);
    setText("p-desc", variant.description || p.description);
    setText("p-sku", variant.sku ? "SKU: " + variant.sku : "");

    const brand = typeof (variant.brand || p.brand) === "string" ? (variant.brand || p.brand) : (variant.brand?.name || p.brand?.name);
    setText("p-brand", brand);

    const off = variant.offers || p.offers;
    const priceEl = el("p-price");
    if (priceEl && off) {
      priceEl.textContent = (off.priceCurrency || "INR") + " " + (off.price || "0");
      priceEl.classList.toggle("blurry", off.availability === "https://schema.org/OutOfStock");
    }

    const stCont = el("stock-badge-container");
    if (stCont && off) {
      const av = off.availability;
      let l = 'Out of Stock', c = 'out-stock', a = false;
      if (av === 'https://schema.org/InStock' || av === 'https://schema.org/OnlineOnly') { l = 'In Stock'; c = 'in-stock'; a = true }
      else if (av === 'https://schema.org/InStoreOnly') { l = 'In-Store Only'; c = 'instore-only'; a = false }
      else if (av === 'https://schema.org/PreOrder') { l = 'Pre-Order'; c = 'pre-order'; a = true }
      stCont.innerHTML = `<span class="stock-badge ${c}">${l}</span>`;
      const ad = el("add-to-cart-btn"); if (ad) ad.disabled = !a;
    }

    const imgs = Array.isArray(variant.image || p.image) ? (variant.image || p.image) : [variant.image || p.image];
    this.renderCarousel(imgs.filter(Boolean), state);

    const vc = el("p-variants");
    if (vc && p.variesBy && !vc.children.length) {
      p.variesBy.forEach(u => {
        const a = u.split(/[\/#]/).pop();
        const vals = [...new Set(p.hasVariant.map(x => x[a]).filter(Boolean))];
        const g = document.createElement("div");
        g.className = "v-group";
        g.innerHTML = `<span class="v-label">Select ${sanitize(a)}</span>`;
        const os = document.createElement("div");
        os.className = "v-options";
        vals.forEach(vl => {
          const btn = document.createElement("button");
          btn.className = "v-btn";
          btn.dataset.attr = a;
          btn.dataset.val = vl;
          if (a.toLowerCase() === "color") {
            btn.classList.add("v-color");
            const vm = p.hasVariant.find(x => x[a] === vl);
            const vi = vm && (Array.isArray(vm.image) ? vm.image[0] : vm.image);
            if (vi) { btn.style.backgroundImage = `url('${vi.url || vi}')` }
            else { btn.style.backgroundColor = vl }
            btn.title = vl;
          } else {
            btn.textContent = vl;
          }
          btn.onclick = () => {
            state.selected[a] = vl;
            this.renderProduct(p, state);
          };
          os.appendChild(btn);
        });
        g.appendChild(os);
        vc.appendChild(g);
        if (!state.selected[a]) state.selected[a] = vals[0];
      });
    }

    document.querySelectorAll(".v-btn[data-attr]").forEach(btn => {
      const a = btn.dataset.attr;
      const vL = btn.dataset.val || btn.textContent;
      btn.classList.toggle("active", state.selected[a] === vL);
    });

    this.renderSeller(off?.seller || p.seller || p.provider);
  },

  renderCarousel(imgs, state) {
    const iN = document.getElementById("carousel-inner");
    const tR = document.getElementById("thumbnail-row");
    if (!iN) return;
    iN.innerHTML = "";
    if (tR) tR.innerHTML = "";
    imgs.forEach((s, i) => {
      const url = s.url || s;
      const d = document.createElement("div");
      d.className = "carousel-item";
      d.innerHTML = `<img src="${url}"/>`;
      iN.appendChild(d);
      if (tR && imgs.length > 1) {
        const t = document.createElement("img");
        t.className = "thumb" + (i === 0 ? " active" : "");
        t.src = url;
        t.onclick = () => { window.goToSlide(i) };
        tR.appendChild(t);
      }
    });
    iN.style.transform = "translateX(0)";
    state.slide = 0;
  },

  renderSeller(s) {
    const box = document.getElementById('p-seller');
    const inf = document.getElementById('seller-info');
    const maps = el('maps-link');
    if (!box || !inf) return;
    if (!s) { box.style.display = "none"; return }
    box.style.display = "block";
    inf.innerHTML = `<strong>${sanitize(s.name || "Antinna")}</strong><br/>${s.telephone ? `&#128222; ${sanitize(s.telephone)}<br/>` : ""}${s.email ? `&#128231; <a href="mailto:${s.email}">${sanitize(s.email)}</a><br/>` : ""}${s.address ? `📍 ${sanitize(s.address.streetAddress || "")}, ${sanitize(s.address.addressLocality || "")}` : ""}`;
    if (maps) {
      if (s.hasMap || s.geo) {
        maps.style.display = "inline-flex";
        maps.href = s.hasMap || `https://www.google.com/maps/search/?api=1&query=${s.geo.latitude},${s.geo.longitude}`;
      } else maps.style.display = "none";
    }
  }
};
