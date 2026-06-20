/**
 * renderers.js - UI components for specialized Schema.org types
 */

function sanitize(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

export function renderProductGroup(pg) {
  const container = document.getElementById('main-renderer');
  if (!container) return;

  container.innerHTML = `
    <div class="product-layout">
      <div>
        <div class="carousel" id="carousel-outer">
          <div class="carousel-inner" id="carousel-inner"></div>
          <button class="carousel-btn" style="left:10px;" id="prev-btn">&#10094;</button>
          <button class="carousel-btn" style="right:10px;" id="next-btn">&#10095;</button>
        </div>
        <div class="h-scroll" id="thumb-row" style="margin-top:20px; gap:10px;"></div>
      </div>
      <div class="details-container">
        <div id="p-sku" style="font-size:0.75rem; color:var(--text-muted); font-weight:700; margin-bottom:5px;"></div>
        <h1 style="margin-bottom:5px; font-size:1.8rem;">${sanitize(pg.name)}</h1>
        <div id="p-brand" style="color:var(--text-muted); margin-bottom:15px; font-weight:600;">${sanitize(pg.brand?.name || pg.brand || '')}</div>
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
           <div id="p-price" class="price">--</div>
           <div id="p-stock" class="stock-badge"></div>
        </div>
        <p style="line-height:1.7; color:var(--text-main); margin-bottom:25px; font-size:0.95rem;">${sanitize(pg.description || '')}</p>
        <div id="p-variants"></div>
        <div class="qty-controls">
          <button class="qty-btn" id="qty-minus">-</button>
          <span id="p-qty" style="font-weight:800; font-size:1.2rem; min-width:30px; text-align:center;">1</span>
          <button class="qty-btn" id="qty-plus">+</button>
        </div>
        <button class="v-btn active" id="add-to-cart-btn" style="width:100%; padding:20px; font-size:1.1rem; border-radius:12px; margin-top:25px;">Add to Cart</button>
        <div id="p-seller-info"></div>
        <div id="p-specs" style="margin-top:30px; border-top:1px solid var(--border-ui); padding-top:20px;"></div>
      </div>
    </div>
  `;

  let selected = {};
  let currentQty = 1;
  const vars = pg.hasVariant || [];

  const update = () => {
    const v = vars.find(v => Object.entries(selected).every(([k, val]) => v[k] === val)) || vars[0];
    if (!v) return;

    const off = v.offers || pg.offers || {};
    document.getElementById('p-price').textContent = `${off.priceCurrency || 'INR'} ${off.price || '0'}`;
    document.getElementById('p-sku').textContent = v.sku ? 'SKU: ' + v.sku : '';

    const stock = document.getElementById('p-stock');
    const invVal = off.inventoryLevel?.value ?? v.inventoryLevel?.value ?? Infinity;
    const isOut = off.availability === 'https://schema.org/OutOfStock' || invVal <= 0;
    stock.className = 'stock-badge ' + (isOut ? 'out-stock' : 'in-stock');
    stock.textContent = isOut ? 'Out of Stock' : 'In Stock';
    document.getElementById('add-to-cart-btn').disabled = isOut;

    const inner = document.getElementById('carousel-inner');
    const thumbRow = document.getElementById('thumb-row');
    inner.innerHTML = ''; thumbRow.innerHTML = '';
    const imgs = Array.isArray(v.image || pg.image) ? (v.image || pg.image) : [v.image || pg.image];
    imgs.filter(Boolean).forEach((img, idx) => {
      const url = img.url || img;
      const slide = document.createElement('div');
      slide.className = 'carousel-item';
      slide.innerHTML = `<img src="${url}"/>`;
      inner.appendChild(slide);

      const thumb = document.createElement('img');
      thumb.className = 'thumb' + (idx === 0 ? ' active' : '');
      thumb.src = url;
      thumb.onclick = () => {
        inner.style.transform = `translateX(-${idx * 100}%)`;
        thumbRow.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
      };
      thumbRow.appendChild(thumb);
    });

    document.getElementById('add-to-cart-btn').onclick = () => {
      for(let i=0; i<currentQty; i++) window.CartManager.addItem(v, off.seller || pg.seller || pg.provider);
    };

    renderSellerSection(off.seller || pg.seller || pg.provider);

    const specs = document.getElementById('p-specs');
    specs.innerHTML = '<h4 style="margin-bottom:10px;">Specifications</h4>';
    ['material', 'color', 'size', 'gtin13', 'weight', 'height', 'width', 'depth'].forEach(f => {
      const val = v[f] || pg[f];
      if (val) specs.innerHTML += `<div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.9rem; border-bottom:1px dashed var(--border-ui); padding-bottom:5px;">
        <span style="color:var(--text-muted); text-transform:capitalize;">${f}</span>
        <span style="font-weight:700;">${sanitize(val)}</span>
      </div>`;
    });
  };

  document.getElementById('qty-plus').onclick = () => { currentQty++; document.getElementById('p-qty').textContent = currentQty; };
  document.getElementById('qty-minus').onclick = () => { if(currentQty > 1) { currentQty--; document.getElementById('p-qty').textContent = currentQty; } };

  if (pg.variesBy) {
    pg.variesBy.forEach(vUrl => {
      const attr = vUrl.split(/[\/#]/).pop();
      const vals = [...new Set(vars.map(v => v[attr]).filter(Boolean))];
      const group = document.createElement('div'); group.className = 'v-group';
      group.innerHTML = `<span class="v-label">Select ${sanitize(attr)}</span>`;
      const opts = document.createElement('div'); opts.className = 'v-options';
      vals.forEach(val => {
        const btn = document.createElement('button'); btn.className = 'v-btn';
        if (attr.toLowerCase() === 'color') { btn.classList.add('v-color'); btn.style.background = val; btn.title = val; }
        else { btn.textContent = val; }
        btn.onclick = () => { selected[attr] = val; opts.querySelectorAll('.v-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); update(); };
        opts.appendChild(btn);
      });
      group.appendChild(opts); document.getElementById('p-variants').appendChild(group);
      selected[attr] = vals[0]; if (opts.firstChild) opts.firstChild.classList.add('active');
    });
  }
  update();
}

export function renderSellerSection(seller) {
  const wrap = document.getElementById('p-seller-info');
  if (!seller) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <div class="seller-box">
      <h4 style="margin-bottom:10px;">Seller Information</h4>
      <div style="font-weight:700; font-size:1.1rem; color:var(--primary);">${sanitize(seller.name || 'Official Seller')}</div>
      ${seller.telephone ? `<div style="margin-top:5px; font-size:0.9rem;">📞 ${seller.telephone}</div>` : ''}
      ${seller.address ? `<div style="margin-top:5px; font-size:0.9rem;">📍 ${seller.address.streetAddress || ''}, ${seller.address.addressLocality || ''}</div>` : ''}
      ${seller.geo ? `<a href="https://www.google.com/maps/search/?api=1&query=${seller.geo.latitude},${seller.geo.longitude}" target="_blank" class="geo-badge">📍 View on Maps</a>` : ''}
    </div>
  `;
}

export function renderProduct(p) {
  const container = document.getElementById('main-renderer');
  const img = Array.isArray(p.image) ? p.image[0] : p.image;
  container.innerHTML = `
    <div class="product-layout" style="display:block; max-width:850px; margin:0 auto;">
       <div class="carousel" style="height:400px; margin-bottom:30px;"><div class="carousel-inner"><div class="carousel-item"><img src="${(img?.url || img || 'https://via.placeholder.com/800x600')}"/></div></div></div>
       <h1 style="font-size:2.2rem; margin-bottom:10px;">${sanitize(p.name)}</h1>
       <div class="price" style="margin:20px 0;">${p.offers?.priceCurrency || 'INR'} ${p.offers?.price || '0'}</div>
       <p style="color:var(--text-main); line-height:1.8; font-size:1.1rem; margin-bottom:30px;">${sanitize(p.description || '')}</p>
       <div class="qty-controls" style="margin-bottom:30px;">
          <button class="qty-btn" id="p-qty-minus">-</button>
          <span id="p-qty-val" style="font-weight:800; font-size:1.4rem; min-width:40px; text-align:center;">1</span>
          <button class="qty-btn" id="p-qty-plus">+</button>
       </div>
       <button class="v-btn active" id="add-to-cart-btn" style="width:100%; padding:20px; font-size:1.3rem; border-radius:15px;">Add to Order</button>
       <div id="p-seller-info"></div>
    </div>
  `;
  let qty = 1;
  document.getElementById('p-qty-plus').onclick = () => { qty++; document.getElementById('p-qty-val').textContent = qty; };
  document.getElementById('p-qty-minus').onclick = () => { if(qty > 1) { qty--; document.getElementById('p-qty-val').textContent = qty; } };
  document.getElementById('add-to-cart-btn').onclick = () => {
    for(let i=0; i<qty; i++) window.CartManager.addItem(p, p.offers?.seller || p.seller || p.provider);
  };
  renderSellerSection(p.offers?.seller || p.seller || p.provider);
}

export function renderGeneric(data) {
  const container = document.getElementById('main-renderer');
  const div = document.createElement('div');
  div.style.background = 'var(--bg-app)'; div.style.padding = '40px'; div.style.borderRadius = '20px'; div.style.boxShadow = 'var(--shadow)';
  div.innerHTML = `<h1 style="margin-bottom:20px; border-bottom: 3px solid var(--color-accent); padding-bottom: 15px; font-size:2rem;">${sanitize(data.name || data['@type'])}</h1>`;

  const renderDeep = (val, key = '') => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (val.startsWith('http')) {
         if (val.match(/\.(jpg|jpeg|png|gif|webp)$/i) || key.toLowerCase().includes('image') || key.toLowerCase().includes('logo')) {
           return `<img src="${val}" style="max-width:100%; border-radius:12px; margin: 15px 0; display:block; border: 1px solid var(--border-ui);"/>`;
         }
         return `<a href="${val}" target="_blank" style="color:var(--color-accent); word-break: break-all; font-weight:600;">${sanitize(val)}</a>`;
      }
      return sanitize(val);
    }
    if (Array.isArray(val)) {
      return `<div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">${val.map(v => `<div style="padding:15px; background:var(--bg-surface); border-radius:12px; border-left:5px solid var(--color-accent);">${renderDeep(v)}</div>`).join('')}</div>`;
    }
    if (typeof val === 'object') {
      return `<div style="display:grid; gap:10px; margin-top:8px; padding:15px; background:rgba(0,0,0,0.03); border-radius:12px; border: 1px solid var(--border-ui);">
        ${Object.entries(val).map(([k,v]) => `<div><span style="font-weight:800; color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">${sanitize(k)}</span> <div style="margin-top:4px; font-size:0.95rem;">${renderDeep(v, k)}</div></div>`).join('')}
      </div>`;
    }
    return sanitize(String(val));
  };

  const propsGrid = document.createElement('div');
  propsGrid.style.display = 'grid'; propsGrid.style.gap = '25px'; propsGrid.style.marginTop = '20px';
  Object.entries(data).forEach(([k,v]) => {
    if (k.startsWith('@') || k === 'name' || k === 'description') return;
    const propWrap = document.createElement('div');
    propWrap.innerHTML = `<div style="font-weight:800; font-size:0.85rem; color:var(--color-accent); text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px;">${sanitize(k)}</div>
                          <div style="font-size:1.05rem; line-height:1.6;">${renderDeep(v, k)}</div>`;
    propsGrid.appendChild(propWrap);
  });
  if (data.description) {
    const desc = document.createElement('p');
    desc.style.lineHeight = '1.8'; desc.style.color = 'var(--text-muted)'; desc.style.marginTop = '25px'; desc.style.fontSize = '1.1rem';
    desc.textContent = data.description;
    div.insertBefore(desc, propsGrid);
  }
  div.appendChild(propsGrid);
  container.innerHTML = '';
  container.appendChild(div);
}
