/**
 * src/renderers.js - Refined Pivot-based Renderers with Swatches and Carousel
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

    // Robust Pivot-based Matching Logic
    let variant = variants.find(v => Object.entries(state.selected || {}).every(([k, val]) => v[k] === val));
    if (!variant && state.lastClickedAttr) {
       variant = variants.find(v => v[state.lastClickedAttr] === state.selected[state.lastClickedAttr]) || variants[0];
       // Sync selected state to this new variant to avoid broken state
       if (p.variesBy) {
         p.variesBy.forEach(u => {
           const attr = u.split(/[\/#]/).pop();
           if (variant[attr]) state.selected[attr] = variant[attr];
         });
       }
    } else if (!variant) {
      variant = variants[0];
    }

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
        if (vals.length === 0) return;
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
            state.lastClickedAttr = a;
            this.renderProduct(p, state);
            this.checkAvailability(p, state);
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
    this.renderSpecs(variant, p);
  },

  checkAvailability(p, state) {
    if (!p || !p.hasVariant) return;
    document.querySelectorAll('.v-btn[data-attr]').forEach(btn => {
      const a = btn.dataset.attr;
      const v = btn.dataset.val || btn.textContent;
      const test = { ...state.selected, [a]: v };
      const match = p.hasVariant.find(x => Object.entries(test).every(([k, val]) => !x[k] || x[k] === val));
      const out = match && match.offers && match.offers.availability === 'https://schema.org/OutOfStock';
      btn.style.opacity = !match ? '0.3' : (out ? '0.6' : '1');
      btn.style.borderStyle = !match ? 'dashed' : 'solid';
    });
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
        t.onclick = () => { if(window.goToSlide) window.goToSlide(i) };
        tR.appendChild(t);
      }
    });
    iN.style.transform = "translateX(0)";
    state.slide = 0;
  },

  renderSeller(s) {
    const box = document.getElementById('p-seller');
    const inf = document.getElementById('seller-info');
    const maps = document.getElementById('maps-link');
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
  },

  renderSpecs(variant, p) {
    const sp = document.getElementById("p-specs");
    const sl = document.getElementById("specs-list");
    if (sp && sl) {
      const flds = {
        'Model': variant.model || p.model,
        'Material': variant.material || p.material,
        'GTIN': variant.gtin13 || variant.gtin8 || '',
        'Weight': (variant.weight || p.weight)?.value || (variant.weight || p.weight),
        'Color': variant.color || p.color
      };
      let h = '';
      for (let [l, k] of Object.entries(flds)) {
        if (k) h += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><span style="opacity:0.6;">${l}</span><span style="font-weight:700;">${k}</span></div>`;
      }
      if (h) { sp.style.display = "block"; sl.innerHTML = h } else { sp.style.display = "none" }
    }
  }
};
