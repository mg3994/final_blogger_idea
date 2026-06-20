/**
 * src/renderers.js - Defensive UI Renderers with Swatches and Advanced Availability
 */

function sanitize(text) {
  if (typeof document === 'undefined') return text || '';
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

export const renderers = {
  renderProduct(p, state, CartManager) {
    if (!p) return;
    const variants = p.hasVariant || [p];
    let variant = variants.find(v => Object.entries(state.selected || {}).every(([k, val]) => v[k] === val)) || variants[0];

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
    setText('p-name', variant?.name || p.name);
    setText('p-desc', variant?.description || p.description);
    setText('p-sku', variant?.sku ? 'SKU: ' + variant.sku : '');

    const off = variant?.offers || p.offers;
    const priceEl = document.getElementById('p-price');
    const stCont = document.getElementById('stock-badge-container');
    const addBtn = document.getElementById('add-to-cart-btn');

    if (off && priceEl) {
      priceEl.textContent = (off.priceCurrency || 'INR') + ' ' + (off.price || '0');
      priceEl.classList.toggle('blurry', off.availability === 'https://schema.org/OutOfStock');

      const av = off.availability;
      let label = 'Out of Stock', cls = 'out-stock', canAdd = false;
      if (av === 'https://schema.org/InStock' || av === 'https://schema.org/OnlineOnly') { label = 'In Stock'; cls = 'in-stock'; canAdd = true; }
      else if (av === 'https://schema.org/InStoreOnly') { label = 'In-Store Only'; cls = 'instore-only'; canAdd = false; }
      else if (av === 'https://schema.org/PreOrder') { label = 'Pre-Order'; cls = 'pre-order'; canAdd = true; }
      else if (av === 'https://schema.org/LimitedAvailability') { label = 'Limited Stock'; cls = 'in-stock'; canAdd = true; }

      if (stCont) stCont.innerHTML = `<span class="stock-badge ${cls}">${label}</span>`;
      if (addBtn) addBtn.disabled = !canAdd;
    }

    const imgs = Array.isArray(variant?.image || p.image) ? (variant?.image || p.image) : [variant?.image || p.image];
    this.renderCarousel(imgs.filter(Boolean), state);

    const varContainer = document.getElementById('p-variants');
    if (varContainer && p.variesBy && !varContainer.children.length) {
      p.variesBy.forEach(vUrl => {
        const attr = vUrl.split(/[\/#]/).pop();
        const values = [...new Set(p.hasVariant.map(v => v[attr]).filter(Boolean))];
        const group = document.createElement('div');
        group.className = 'v-group';
        group.innerHTML = `<span class="v-label">Select ${sanitize(attr)}</span>`;
        const opts = document.createElement('div'); opts.className = 'v-options';
        values.forEach(val => {
          const btn = document.createElement('button');
          btn.className = 'v-btn'; btn.dataset.attr = attr; btn.dataset.val = val;
          if (attr.toLowerCase() === 'color') {
            btn.classList.add('v-color');
            const vMatch = p.hasVariant.find(v => v[attr] === val);
            const vImg = vMatch && (Array.isArray(vMatch.image) ? vMatch.image[0] : vMatch.image);
            if (vImg) {
               btn.style.backgroundImage = `url('${vImg.url || vImg}')`;
            } else { btn.style.backgroundColor = val; }
            btn.title = val;
          } else { btn.textContent = val; }
          btn.onclick = () => {
            if (!state.selected) state.selected = {};
            state.selected[attr] = val;
            this.renderProduct(p, state, CartManager);
          };
          opts.appendChild(btn);
        });
        group.appendChild(opts); varContainer.appendChild(group);
        if (!state.selected[attr]) state.selected[attr] = values[0];
      });
    }

    document.querySelectorAll('.v-btn').forEach(btn => {
      const a = btn.dataset.attr; const vL = btn.dataset.val || btn.textContent;
      btn.classList.toggle('active', state.selected && state.selected[a] === vL);
    });

    this.renderSeller(off?.seller || p.seller || p.provider);
  },

  renderCarousel(images, state) {
    const inner = document.getElementById('carousel-inner');
    const thumbRow = document.getElementById('thumbnail-row');
    if (!inner) return;
    inner.innerHTML = ''; if (thumbRow) thumbRow.innerHTML = '';
    images.forEach((src, idx) => {
      const url = src.url || src;
      const div = document.createElement('div'); div.className = 'carousel-item';
      div.innerHTML = `<img src="${url}"/>`;
      inner.appendChild(div);
      if (thumbRow && images.length > 1) {
        const thumb = document.createElement('img');
        thumb.className = 'thumb' + (idx === 0 ? ' active' : '');
        thumb.src = url;
        thumb.onclick = () => {
          inner.style.transform = `translateX(-${idx * 100}%)`;
          thumbRow.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
          state.slide = idx;
        };
        thumbRow.appendChild(thumb);
      }
    });
    inner.style.transform = 'translateX(0)'; state.slide = 0;
  },

  renderSeller(s) {
    const box = document.getElementById('p-seller');
    if (!box) return; if (!s) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    const info = document.getElementById('seller-info');
    if (info) {
      info.innerHTML = `<strong>${sanitize(s.name || 'Antinna')}</strong><br/>${s.telephone ? `&#128222; ${sanitize(s.telephone)}<br/>`:''}${s.email ? `&#128231; <a href="mailto:${s.email}">${sanitize(s.email)}</a><br/>`:''}${s.address ? `📍 ${sanitize(s.address.streetAddress || '')}, ${sanitize(s.address.addressLocality || '')}`:''}`;
    }
    const maps = document.getElementById('maps-link');
    if (maps) {
      if (s.geo) { maps.style.display = 'inline-flex'; maps.href = `https://www.google.com/maps/search/?api=1&query=${s.geo.latitude},${s.geo.longitude}`; }
      else maps.style.display = 'none';
    }

    // Optional Paid Services logic
    const otherSection = document.getElementById('other-services');
    const otherList = document.getElementById('other-services-list');
    let services = [];
    if (s.hasOfferCatalog && s.hasOfferCatalog.itemListElement) services = s.hasOfferCatalog.itemListElement;
    else if (s.knowsAbout) services = Array.isArray(s.knowsAbout) ? s.knowsAbout : [s.knowsAbout];

    if (services.length > 0 && otherSection && otherList) {
      otherSection.style.display = 'block';
      otherList.innerHTML = services.map((ser, idx) => {
        const name = ser.name || ser.itemOffered?.name || ser;
        const price = ser.price || ser.itemOffered?.offers?.price || ser.itemOffered?.price || '';
        const curr = ser.priceCurrency || ser.itemOffered?.offers?.priceCurrency || ser.itemOffered?.priceCurrency || 'INR';

        const cartItem = ser.itemOffered ? { ...ser.itemOffered } : (typeof ser === 'object' ? { ...ser } : { name: ser });
        if (!cartItem.offers) cartItem.offers = { "@type": "Offer", price: price, priceCurrency: curr };

        return `
          <div class="h-card">
            <div style="font-weight:700; margin-bottom:10px; height:3em; overflow:hidden;">${name}</div>
            <div class="price" style="font-size:1.2rem; margin-bottom:15px;">${price ? curr + ' ' + price : 'Free/Included'}</div>
            <button class="v-btn" style="width:100%; padding:8px; font-size:0.85rem;" onclick="window.CartManager.addItem(${JSON.stringify(cartItem).replace(/"/g, '&quot;')}, ${JSON.stringify(s).replace(/"/g, '&quot;')})">Add Service</button>
          </div>
        `;
      }).join('');
    } else if (otherSection) {
      otherSection.style.display = 'none';
    }
  }
};
