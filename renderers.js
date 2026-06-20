/**
 * renderers.js - High-fidelity specialized renderers
 */

function sanitize(text) {
  if (typeof document === 'undefined') return text || '';
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

export const renderers = {
  productGroup(pg) {
    const container = document.getElementById('main-renderer');
    if (!container) return;

    container.innerHTML = `
      <div class="product-layout">
        <div>
          <div class="carousel" id="p-carousel">
            <div class="carousel-inner" id="p-carousel-inner"></div>
            <button class="carousel-btn" style="left:10px;" id="p-prev">&#10094;</button>
            <button class="carousel-btn" style="right:10px;" id="p-next">&#10095;</button>
          </div>
          <div class="h-scroll" id="p-thumbs" style="margin-top:20px;"></div>
        </div>
        <div class="details-container">
          <div id="p-sku" style="font-size:0.75rem; color:var(--text); opacity:0.6; font-weight:800; margin-bottom:5px;"></div>
          <h1 style="margin-bottom:5px; font-size:1.8rem; font-weight:900;">${sanitize(pg.name)}</h1>
          <div id="p-brand" style="color:var(--text); opacity:0.7; font-weight:700; margin-bottom:15px;">${sanitize(pg.brand?.name || pg.brand || '')}</div>
          <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px;">
            <div id="p-price" class="price">--</div>
            <div id="p-stock" class="stock-badge"></div>
          </div>
          <p style="color:var(--text); opacity:0.8; line-height:1.8; margin-bottom:30px;">${sanitize(pg.description || '')}</p>
          <div id="p-variants"></div>
          <div class="qty-controls">
            <button class="qty-btn" id="q-minus">-</button>
            <span id="q-val" style="font-weight:900; font-size:1.4rem; min-width:40px; text-align:center;">1</span>
            <button class="qty-btn" id="q-plus">+</button>
          </div>
          <button class="v-btn active" id="add-btn" style="width:100%; padding:20px; font-size:1.2rem; border-radius:15px; margin-top:10px;">Add to Bag</button>
          <div id="p-seller"></div>
          <div id="p-specs" style="margin-top:40px; border-top:2px solid rgba(0,0,0,0.05); padding-top:25px;"></div>
        </div>
      </div>
    `;

    let selected = {};
    let qty = 1;
    const vars = pg.hasVariant || [];

    const update = () => {
      const v = vars.find(v => Object.entries(selected).every(([k, val]) => v[k] === val)) || vars[0];
      if (!v) return;

      const off = v.offers || pg.offers || {};
      document.getElementById('p-price').textContent = `${off.priceCurrency || 'INR'} ${off.price || '0'}`;
      document.getElementById('p-sku').textContent = v.sku ? 'SKU: ' + v.sku : '';

      const stock = document.getElementById('p-stock');
      const isOut = off.availability === 'https://schema.org/OutOfStock';
      stock.className = 'stock-badge ' + (isOut ? 'out-stock' : 'in-stock');
      stock.textContent = isOut ? 'Out of Stock' : 'In Stock';
      document.getElementById('add-btn').disabled = isOut;

      const inner = document.getElementById('p-carousel-inner');
      const thumbs = document.getElementById('p-thumbs');
      inner.innerHTML = ''; thumbs.innerHTML = '';
      const imgs = Array.isArray(v.image || pg.image) ? (v.image || pg.image) : [v.image || pg.image];

      let slideIdx = 0;
      const count = imgs.filter(Boolean).length;

      const goToSlide = (idx) => {
        slideIdx = (idx + count) % count;
        inner.style.transform = `translateX(-${slideIdx * 100}%)`;
        thumbs.querySelectorAll('.thumb').forEach((el, i) => el.classList.toggle('active', i === slideIdx));
      };

      imgs.filter(Boolean).forEach((img, idx) => {
        const url = img.url || img;
        const item = document.createElement('div'); item.className = 'carousel-item';
        item.innerHTML = `<img src="${url}"/>`;
        inner.appendChild(item);

        const t = document.createElement('img'); t.className = 'thumb' + (idx===0?' active':'');
        t.src = url;
        t.onclick = () => goToSlide(idx);
        thumbs.appendChild(t);
      });

      document.getElementById('p-prev').onclick = () => goToSlide(slideIdx - 1);
      document.getElementById('p-next').onclick = () => goToSlide(slideIdx + 1);

      this.renderSeller(off.seller || pg.seller || pg.provider);

      const specs = document.getElementById('p-specs');
      specs.innerHTML = '<h4 style="text-transform:uppercase; font-size:0.8rem; letter-spacing:1px; margin-bottom:15px;">Product Specifications</h4>';
      ['material', 'color', 'size', 'gtin13', 'weight', 'height', 'width', 'depth'].forEach(f => {
         const val = v[f] || pg[f];
         if (val) specs.innerHTML += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.03); font-size:0.95rem;"><span style="opacity:0.6; text-transform:capitalize;">${sanitize(f)}</span><span style="font-weight:700;">${sanitize(val)}</span></div>`;
      });

      document.getElementById('add-btn').onclick = () => {
         for(let i=0; i<qty; i++) window.CartManager.add(v, off.seller || pg.seller || pg.provider);
      };
    };

    document.getElementById('q-plus').onclick = () => { qty++; document.getElementById('q-val').textContent = qty; };
    document.getElementById('q-minus').onclick = () => { if(qty > 1) { qty--; document.getElementById('q-val').textContent = qty; } };

    if (pg.variesBy) {
      pg.variesBy.forEach(url => {
        const attr = url.split(/[\/#]/).pop();
        const vals = [...new Set(vars.map(v => v[attr]).filter(Boolean))];
        const wrap = document.createElement('div'); wrap.className = 'v-group';
        wrap.innerHTML = `<span class="v-label">Choose ${sanitize(attr)}</span>`;
        const opts = document.createElement('div'); opts.className = 'v-options';
        vals.forEach(val => {
           const b = document.createElement('button'); b.className = 'v-btn';
           if (attr.toLowerCase() === 'color') { b.classList.add('v-color'); b.style.background = val; b.title = val; }
           else { b.textContent = val; }
           b.onclick = () => {
             selected[attr] = val;
             opts.querySelectorAll('.v-btn').forEach(btn => btn.classList.remove('active'));
             b.classList.add('active');
             update();
           };
           opts.appendChild(b);
        });
        wrap.appendChild(opts); document.getElementById('p-variants').appendChild(wrap);
        selected[attr] = vals[0]; if (opts.firstChild) opts.firstChild.classList.add('active');
      });
    }
    update();
  },

  renderSeller(s) {
    const wrap = document.getElementById('p-seller');
    if (!wrap) return;
    if (!s) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `
      <div class="seller-box">
        <h4 style="text-transform:uppercase; font-size:0.75rem; letter-spacing:1px; margin-bottom:10px; opacity:0.6;">Fulfilled By</h4>
        <div style="font-weight:900; font-size:1.2rem;">${sanitize(s.name || 'Antinna Official')}</div>
        ${s.address ? `<div style="margin-top:10px; opacity:0.8;">📍 ${sanitize(s.address.streetAddress || '')}, ${sanitize(s.address.addressLocality || '')}</div>` : ''}
        ${s.geo ? `<a href="https://www.google.com/maps/search/?api=1&query=${s.geo.latitude},${s.geo.longitude}" target="_blank" class="geo-badge">📍 Map Location</a>` : ''}
      </div>
    `;
  },

  product(p) {
    const container = document.getElementById('main-renderer');
    if (!container) return;
    const img = Array.isArray(p.image) ? p.image[0] : p.image;
    container.innerHTML = `
      <div class="product-layout" style="display:block; max-width:800px; margin:0 auto;">
         <div class="carousel" style="height:450px; margin-bottom:30px;"><div class="carousel-inner"><div class="carousel-item"><img src="${img?.url || img || ''}"/></div></div></div>
         <h1 style="font-size:2.5rem; font-weight:900; margin-bottom:10px;">${sanitize(p.name)}</h1>
         <div class="price" style="margin:20px 0;">${p.offers?.priceCurrency || 'INR'} ${p.offers?.price || '0'}</div>
         <p style="line-height:1.8; opacity:0.8; font-size:1.1rem; margin-bottom:40px;">${sanitize(p.description || '')}</p>
         <button class="v-btn active" id="add-btn" style="width:100%; padding:22px; font-size:1.3rem; border-radius:18px;">Order Now</button>
         <div id="p-seller"></div>
      </div>
    `;
    this.renderSeller(p.offers?.seller || p.seller || p.provider);
    document.getElementById('add-btn').onclick = () => window.CartManager.add(p, p.offers?.seller || p.seller || p.provider);
  },

  generic(data) {
    const container = document.getElementById('main-renderer');
    if (!container) return;
    container.innerHTML = `<div style="background:var(--card); padding:40px; border-radius:25px; box-shadow:var(--shadow);">
      <h1 style="font-size:2.2rem; font-weight:900; margin-bottom:20px; color:var(--accent); border-bottom:4px solid var(--accent); padding-bottom:15px; display:inline-block;">${sanitize(data.name || data['@type'])}</h1>
      <pre style="white-space:pre-wrap; font-family:'Courier New', monospace; font-size:0.9rem; background:rgba(0,0,0,0.03); padding:25px; border-radius:15px; margin-top:20px;">${JSON.stringify(data, null, 2)}</pre>
    </div>`;
  }
};
