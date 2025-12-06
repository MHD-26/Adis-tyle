// ...existing code...
/*
  Panier minimal pour adystore
  - Ajout via bouton .add-to-cart (data-id, data-title, data-price)
  - Suppression / changement quantité
  - Persistance dans localStorage (clé: adystore_cart)
  - Si aucune UI présente, le script injecte une UI minimale
*/

(function () {
  const STORAGE_KEY = 'adystore_cart';

  // Charge le panier depuis localStorage
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  // Sauvegarde le panier
  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // Trouve un article dans le panier
  function findItem(cart, id) {
    return cart.find((i) => i.id === id);
  }

  // Formatte le prix
  function fmt(price) {
    return Number(price).toLocaleString(undefined, { style: 'currency', currency: 'CFA' });
  }

  // Ajoute un article (ou augmente la qty)
  function addToCart(item) {
    const cart = loadCart();
    const existing = findItem(cart, item.id);
    if (existing) {
      existing.qty += item.qty;
    } else {
      cart.push(item);
    }
    saveCart(cart);
    renderCart();
  }

  // Change la quantité (peut supprimer si qty <= 0)
  function setQty(id, qty) {
    let cart = loadCart();
    cart = cart.map(i => i.id === id ? { ...i, qty } : i).filter(i => i.qty > 0);
    saveCart(cart);
    renderCart();
  }

  function removeFromCart(id) {
    const cart = loadCart().filter((i) => i.id !== id);
    saveCart(cart);
    renderCart();
  }

  // Calcule total
  function cartTotals(cart) {
    const total = cart.reduce((s, it) => s + it.qty * Number(it.price), 0);
    const count = cart.reduce((s, it) => s + it.qty, 0);
    return { total, count };
  }

  // Injecte une UI minimale si non présente
  function ensureCartUI() {
    if (document.getElementById('adystore-cart')) return;

    const style = document.createElement('style');
    style.textContent = `
#adystore-cart { position: fixed; right: 16px; bottom: 16px; width: 320px; max-height: 70vh; background: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.12); border-radius: 8px; overflow: hidden; font-family: sans-serif; z-index: 9999; }
#adystore-cart header { display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:#0d6efd; color:#fff; }
#adystore-cart .items { max-height: 46vh; overflow:auto; padding:8px 12px; }
#adystore-cart .item { display:flex; justify-content:space-between; gap:8px; padding:8px 0; border-bottom: 1px solid #eee; align-items:center; }
#adystore-cart .item .meta { flex:1; }
#adystore-cart .item .controls { display:flex; align-items:center; gap:6px; }
#adystore-cart footer { padding:10px 12px; border-top:1px solid #eee; display:flex; justify-content:space-between; align-items:center; }
#adystore-cart .btn { background:#0d6efd;color:#fff;padding:6px 10px;border-radius:6px;border:none;cursor:pointer; }
#adystore-cart .link { background:transparent;border:none;color:#0d6efd;cursor:pointer; }
#adystore-cart-toggle { position: fixed; right: 16px; bottom: calc(16px + 340px); background:#0d6efd;color:#fff;padding:10px 12px;border-radius:999px;border:none; cursor:pointer; z-index:9999; box-shadow:0 6px 18px rgba(0,0,0,.12); }
    `;
    document.head.appendChild(style);

    const toggle = document.createElement('button');
    toggle.id = 'adystore-cart-toggle';
    toggle.type = 'button';
    toggle.title = 'Afficher le panier';
    toggle.textContent = 'Panier (0)';
    document.body.appendChild(toggle);

    const panel = document.createElement('aside');
    panel.id = 'adystore-cart';
    panel.innerHTML = `
      <header>
        <strong>Mon panier</strong>
        <button class="link" id="adystore-cart-close">Fermer</button>
      </header>
      <div class="items" id="adystore-cart-items"></div>
      <footer>
        <div id="adystore-cart-total">Total: 0 €</div>
        <button class="btn" id="adystore-cart-checkout">Commander</button>
      </footer>
    `;
    panel.style.display = 'none';
    document.body.appendChild(panel);

    // Toggle handlers
    toggle.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('adystore-cart-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    // Checkout action (placeholder)
    document.getElementById('adystore-cart-checkout').addEventListener('click', () => {
      alert('Procéder au paiement (non implémenté)');
    });
  }

  // Rend le panier dans la UI
  function renderCart() {
    ensureCartUI();
    const cart = loadCart();
    const { total, count } = cartTotals(cart);

    const toggle = document.getElementById('adystore-cart-toggle');
    const itemsContainer = document.getElementById('adystore-cart-items');
    const totalEl = document.getElementById('adystore-cart-total');

    if (toggle) toggle.textContent = `Panier (${count})`;
    if (totalEl) totalEl.textContent = `Total: ${fmt(total)}`;

    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
      itemsContainer.innerHTML = '<div style="padding:12px;color:#666">Votre panier est vide.</div>';
      return;
    }

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <div class="meta">
          <div style="font-weight:600">${escapeHtml(item.title)}</div>
          <div style="color:#666;font-size:13px">${fmt(item.price)} x ${item.qty} = <strong>${fmt(item.price * item.qty)}</strong></div>
        </div>
        <div class="controls">
          <button class="link qty-btn" data-id="${item.id}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button class="link qty-btn" data-id="${item.id}" data-delta="1">+</button>
          <button class="link cart-remove" data-id="${item.id}">Suppr</button>
        </div>
      `;
      itemsContainer.appendChild(row);
    });

    // Attach delegated handlers
    itemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const delta = Number(btn.getAttribute('data-delta') || 0);
        const item = findItem(cart, id);
        if (!item) return;
        setQty(id, Math.max(0, item.qty + delta));
      };
    });
    itemsContainer.querySelectorAll('.cart-remove').forEach(btn => {
      btn.onclick = () => {
        removeFromCart(btn.getAttribute('data-id'));
      };
    });
  }

  // Simple escape for titles
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // Global listener: bouton .add-to-cart avec data attributes
  document.addEventListener('click', function (e) {
    const btn = e.target.closest && e.target.closest('.add-to-cart');
    if (!btn) return;
    e.preventDefault();

    const id = btn.getAttribute('data-id') || btn.getAttribute('data-sku') || String(Date.now());
    const title = btn.getAttribute('data-title') || btn.getAttribute('data-name') || 'Article';
    const price = Number(btn.getAttribute('data-price') || btn.getAttribute('data-amount') || 0) || 0;
    const qty = Number(btn.getAttribute('data-qty') || 1) || 1;

    addToCart({ id, title, price, qty });
  });

  // Expose helper API on window for programmatic usage
  window.adystoreCart = {
    add: (item) => addToCart(item),
    remove: (id) => removeFromCart(id),
    setQty: (id, qty) => setQty(id, qty),
    get: () => loadCart(),
    clear: () => { saveCart([]); renderCart(); }
  };

  // Initial render on load
  document.addEventListener('DOMContentLoaded', renderCart);
})();