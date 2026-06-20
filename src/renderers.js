/**
 * src/renderers.js - Defensive UI Renderers
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

    // Select correct variant or fallback
    const variants = p.hasVariant || [p];
    let variant = variants.find(v =>
      Object.entries(state.selected || {}).every(([k, val]) => v[k] === val)
    ) || variants[0];

    // Safe DOM element updates
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '';
    };

    setText('p-name', variant?.name || p.name);
    setText('p-desc', variant?.description || p.description);
    setText('p-sku', variant?.sku ? 'SKU: ' + variant.sku : '');

    const brand = typeof (variant?.brand || p.brand) === 'string' ? (variant?.brand || p.brand) : (variant?.brand?.name || p.brand?.name);
    setText('p-brand', brand);

    const off = variant?.offers || p.offers;
    const priceEl = document.getElementById('p-price');
    if (priceEl && off) {
      priceEl.textContent = (off.priceCurrency || 'INR') + ' ' + (off.price || '0');
      priceEl.classList.toggle('blurry', off.availability === 'https://schema.org/OutOfStock');
    }

    const stockContainer = document.getElementById('stock-badge-container');
    if (stockContainer && off) {
      const isIn = off.availability === 'https://schema.org/InStock';
      stockContainer.innerHTML = `<span class="stock-badge ${isIn ? 'in-stock' : 'out-stock'}">${isIn ? 'In Stock' : 'Out of Stock'}</span>`;
    }

    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
      addBtn.disabled = off?.availability === 'https://schema.org/OutOfStock';
      addBtn.onclick = () => {
        if (window.CartManager) window.CartManager.addItem(variant, off?.seller || p.seller || p.provider);
      };
    }

    // Carousel
    const imgs = Array.isArray(variant?.image || p.image) ? (variant?.image || p.image) : [variant?.image || p.image];
    this.renderCarousel(imgs.filter(Boolean), state);

    // Variants
    const varContainer = document.getElementById('p-variants');
    if (varContainer && p.variesBy && !varContainer.children.length) {
      p.variesBy.forEach(vUrl => {
        const attr = vUrl.split(/[\/#]/).pop();
        const values = [...new Set(p.hasVariant.map(v => v[attr]).filter(Boolean))];
        const group = document.createElement('div');
        group.className = 'v-group';
        group.innerHTML = `<span class="v-label">Select ${sanitize(attr)}</span>`;
        const opts = document.createElement('div');
        opts.className = 'v-options';
        values.forEach(val => {
          const btn = document.createElement('button');
          btn.className = 'v-btn';
          btn.dataset.attr = attr;
          btn.dataset.val = val;
          if (attr.toLowerCase() === 'color') { btn.classList.add('v-color'); btn.style.backgroundColor = val; }
          else { btn.textContent = val; }
          btn.onclick = () => {
            if (!state.selected) state.selected = {};
            state.selected[attr] = val;
            this.renderProduct(p, state, CartManager);
          };
          opts.appendChild(btn);
        });
        group.appendChild(opts);
        varContainer.appendChild(group);
        if (!state.selected[attr]) state.selected[attr] = values[0];
      });
    }

    // Highlight active variant buttons
    document.querySelectorAll('.v-btn').forEach(btn => {
      const attr = btn.dataset.attr;
      const val = btn.dataset.val || btn.textContent;
      btn.classList.toggle('active', state.selected && state.selected[attr] === val);
    });

    // Seller
    this.renderSeller(off?.seller || p.seller || p.provider);

    // Specs
    const specsList = document.getElementById('specs-list');
    if (specsList) {
      const fields = ['material', 'color', 'size', 'gtin13', 'weight', 'height', 'width', 'depth'];
      let html = '';
      fields.forEach(f => {
        const val = variant?.[f] || p[f];
        if (val) html += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;"><span style="opacity:0.6; text-transform:capitalize;">${sanitize(f)}</span><span style="font-weight:700;">${sanitize(val)}</span></div>`;
      });
      specsList.innerHTML = html;
      const specsBox = document.getElementById('p-specs');
      if (specsBox) specsBox.style.display = html ? 'block' : 'none';
    }
  },

  renderCarousel(images, state) {
    const inner = document.getElementById('carousel-inner');
    const thumbRow = document.getElementById('thumbnail-row');
    if (!inner) return;
    inner.innerHTML = ''; if (thumbRow) thumbRow.innerHTML = '';
    images.forEach((src, idx) => {
      const url = src.url || src;
      const div = document.createElement('div');
      div.className = 'carousel-item';
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
    inner.style.transform = 'translateX(0)';
    state.slide = 0;
  },

  renderSeller(s) {
    const box = document.getElementById('p-seller');
    if (!box) return;
    if (!s) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    const info = document.getElementById('seller-info');
    if (info) {
      let html = `<strong>${sanitize(s.name || 'Official Seller')}</strong><br/>`;
      if (s.telephone) html += `&#128222; ${sanitize(s.telephone)}<br/>`;
      if (s.email) html += `&#128231; <a href="mailto:${s.email}">${sanitize(s.email)}</a><br/>`;
      if (s.address) html += `&#128205; ${sanitize(s.address.streetAddress || '')}, ${sanitize(s.address.addressLocality || '')}`;
      info.innerHTML = html;
    }
    const maps = document.getElementById('maps-link');
    if (maps) {
      if (s.geo) {
        maps.style.display = 'inline-flex';
        maps.href = `https://www.google.com/maps/search/?api=1&query=${s.geo.latitude},${s.geo.longitude}`;
      } else maps.style.display = 'none';
    }
  }
};
