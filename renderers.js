/**
 * renderers.js - UI components for specialized Schema.org types
 */

function sanitize(text) {
  const div = document.createElement('div');
  div.textContent = text;
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
        <div class="h-scroll" id="thumb-row" style="margin-top:15px;"></div>
      </div>
      <div class="details-container">
        <h1 style="margin-bottom:5px;">${sanitize(pg.name)}</h1>
        <div id="p-brand" style="color:var(--text-muted); margin-bottom:15px; font-weight:600;">${sanitize(pg.brand?.name || pg.brand || '')}</div>
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
           <div id="p-price" class="price">--</div>
           <div id="p-stock" class="stock-badge"></div>
        </div>
        <p style="line-height:1.7; color:var(--text-muted); margin-bottom:25px;">${sanitize(pg.description || '')}</p>
        <div id="p-variants"></div>
        <button class="v-btn active" id="add-to-cart-btn" style="width:100%; padding:18px; font-size:1.1rem; border-radius:12px; margin-top:20px;">Add to Cart</button>
        <div id="p-specs" style="margin-top:30px; border-top:1px solid var(--border-ui); padding-top:20px;"></div>
      </div>
    </div>
  `;

  let selected = {};
  const vars = pg.hasVariant || [];

  const update = () => {
    const v = vars.find(v => Object.entries(selected).every(([k, val]) => v[k] === val)) || vars[0];
    if (!v) return;

    const off = v.offers || {};
    document.getElementById('p-price').textContent = `${off.priceCurrency || ''} ${off.price || ''}`;
    const stock = document.getElementById('p-stock');
    const invVal = off.inventoryLevel?.value ?? v.inventoryLevel?.value ?? Infinity;
    const isOut = off.availability === 'https://schema.org/OutOfStock' || invVal <= 0;
    stock.className = 'stock-badge ' + (isOut ? 'out-stock' : 'in-stock');
    stock.textContent = isOut ? 'Out of Stock' : 'In Stock';
    document.getElementById('add-to-cart-btn').disabled = isOut;

    const inner = document.getElementById('carousel-inner');
    inner.innerHTML = '';
    const imgs = Array.isArray(v.image || pg.image) ? (v.image || pg.image) : [v.image || pg.image];
    imgs.filter(Boolean).forEach(img => {
      const url = img.url || img;
      const slide = document.createElement('div');
      slide.className = 'carousel-item';
      slide.innerHTML = `<img src="${url}"/>`;
      inner.appendChild(slide);
    });

    document.getElementById('add-to-cart-btn').onclick = () => window.CartManager.addItem(v, pg);

    const specs = document.getElementById('p-specs');
    specs.innerHTML = '<h4>Specifications</h4>';
    ['material', 'color', 'size', 'sku', 'gtin13'].forEach(f => {
      const val = v[f] || pg[f];
      if (val) specs.innerHTML += `<div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.9rem; border-bottom:1px dashed var(--border-ui); padding-bottom:5px;">
        <span style="color:var(--text-muted); text-transform:capitalize;">${f}</span>
        <span style="font-weight:700;">${sanitize(val)}</span>
      </div>`;
    });
  };

  if (pg.variesBy) {
    pg.variesBy.forEach(vUrl => {
      const attr = vUrl.split(/[\/#]/).pop();
      const vals = [...new Set(vars.map(v => v[attr]).filter(Boolean))];
      const group = document.createElement('div'); group.className = 'v-group';
      group.innerHTML = `<span style="font-size:0.85rem; font-weight:800; margin-bottom:10px; display:block; text-transform:uppercase; color:var(--text-muted);">Select ${sanitize(attr)}</span>`;
      const opts = document.createElement('div'); opts.className = 'v-options';
      vals.forEach(val => {
        const btn = document.createElement('button'); btn.className = 'v-btn';
        if (attr.toLowerCase() === 'color') { btn.classList.add('v-color'); btn.style.background = val; btn.title = val; }
        else { btn.textContent = val; }
        btn.onclick = () => { selected[attr] = val; opts.querySelectorAll('.v-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); update(); };
        opts.appendChild(btn);
      });
      group.appendChild(opts); document.getElementById('p-variants').appendChild(group);
      selected[attr] = vals[0]; opts.firstChild.classList.add('active');
    });
  }
  update();
}

export function renderProduct(p) {
  const container = document.getElementById('main-renderer');
  const img = Array.isArray(p.image) ? p.image[0] : p.image;
  container.innerHTML = `
    <div class="product-layout" style="display:block; max-width:800px; margin:0 auto;">
       <img src="${(img?.url || img || 'https://via.placeholder.com/600x400')}" style="width:100%; border-radius:16px; margin-bottom:30px; box-shadow:var(--shadow);"/>
       <h1 style="font-size:2rem; margin-bottom:10px;">${sanitize(p.name)}</h1>
       <div class="price" style="margin:15px 0;">${p.offers?.priceCurrency || ''} ${p.offers?.price || ''}</div>
       <p style="color:var(--text-muted); line-height:1.8; font-size:1.1rem;">${sanitize(p.description || '')}</p>
       <button class="v-btn active" id="add-to-cart-btn" style="width:100%; margin-top:40px; padding:20px; font-size:1.2rem; border-radius:12px;">Add to Order</button>
    </div>
  `;
  document.getElementById('add-to-cart-btn').onclick = () => window.CartManager.addItem(p, p.provider || p);
}

export function renderGeneric(data) {
  const container = document.getElementById('main-renderer');
  const div = document.createElement('div');
  div.style.background = 'var(--bg-app)'; div.style.padding = '40px'; div.style.borderRadius = '16px'; div.style.boxShadow = 'var(--shadow)';
  div.innerHTML = `<h1 style="margin-bottom:20px; border-bottom: 2px solid var(--color-accent); padding-bottom: 10px;">${sanitize(data.name || data['@type'])}</h1>`;

  const renderDeep = (val, key = '') => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (val.startsWith('http')) {
         if (val.match(/\.(jpg|jpeg|png|gif|webp)$/i) || key.toLowerCase().includes('image') || key.toLowerCase().includes('logo')) {
           return `<img src="${val}" style="max-width:100%; border-radius:8px; margin: 10px 0; display:block; border: 1px solid var(--border-ui);"/>`;
         }
         return `<a href="${val}" target="_blank" style="color:var(--color-accent); word-break: break-all;">${sanitize(val)}</a>`;
      }
      return sanitize(val);
    }
    if (Array.isArray(val)) {
      return `<div style="display:flex; flex-direction:column; gap:10px; margin-top:5px;">${val.map(v => `<div style="padding:10px; background:var(--bg-surface); border-radius:8px; border-left:4px solid var(--color-accent);">${renderDeep(v)}</div>`).join('')}</div>`;
    }
    if (typeof val === 'object') {
      return `<div style="display:grid; gap:8px; margin-top:5px; padding:12px; background:rgba(0,0,0,0.02); border-radius:10px; border: 1px solid var(--border-ui);">
        ${Object.entries(val).map(([k,v]) => `<div><span style="font-weight:700; color:var(--text-muted); font-size:0.8rem; text-transform:uppercase;">${sanitize(k)}:</span> <div style="margin-top:4px;">${renderDeep(v, k)}</div></div>`).join('')}
      </div>`;
    }
    return sanitize(String(val));
  };

  const propsGrid = document.createElement('div');
  propsGrid.style.display = 'grid'; propsGrid.style.gap = '20px'; propsGrid.style.marginTop = '20px';
  Object.entries(data).forEach(([k,v]) => {
    if (k.startsWith('@') || k === 'name' || k === 'description') return;
    const propWrap = document.createElement('div');
    propWrap.innerHTML = `<div style="font-weight:800; font-size:0.9rem; color:var(--color-accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">${sanitize(k)}</div>
                          <div style="font-size:1rem;">${renderDeep(v, k)}</div>`;
    propsGrid.appendChild(propWrap);
  });
  if (data.description) {
    const desc = document.createElement('p');
    desc.style.lineHeight = '1.7'; desc.style.color = 'var(--text-muted)'; desc.style.marginTop = '20px';
    desc.textContent = data.description;
    div.insertBefore(desc, propsGrid);
  }
  div.appendChild(propsGrid);
  container.innerHTML = '';
  container.appendChild(div);
}
