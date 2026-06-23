
// ===============================================
// 1. LOGIQUE GLOBALE DU PANIER (STOCKAGE)
// ===============================================

// Fonction pour récupérer le panier actuel depuis le localStorage
function getCart() {
    // Récupère la chaîne JSON, ou un tableau vide si rien n'est stocké
    const cart = localStorage.getItem('adis_cart');
    return cart ? JSON.parse(cart) : [];
}

// Fonction pour sauvegarder le panier dans le localStorage
function saveCart(cart) {
    localStorage.setItem('adis_cart', JSON.stringify(cart));
}


// ===============================================
// 2. GESTION DES ARTICLES (AJOUT, SUPPRESSION, MISE À JOUR)
// ===============================================

// Ajoute ou met à jour un article dans le panier
function addToCart(productId, name, price, imageUrl) {
    let cart = getCart();
    // Convertir l'ID en nombre pour les comparaisons futures
    const id = Number(productId);

    // Vérifie si le produit existe déjà dans le panier
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        // S'il existe, augmenter la quantité
        existingItem.quantity += 1;
    } else {
        // Sinon, ajouter le nouveau produit
        cart.push({
            id: id,
            name: name,
            price: Number(price), // Assurez-vous que le prix est un nombre
            imageUrl: imageUrl,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartIconCount(); 
}

// Supprime complètement un article du panier
function removeItemFromCart(productId) {
    let cart = getCart();
    const id = Number(productId);

    // Filtrer le panier pour exclure l'article avec l'ID donné
    cart = cart.filter(item => item.id !== id);

    saveCart(cart);
    displayCart(); // Re-afficher le panier après suppression
    updateCartIconCount();
}

// Met à jour la quantité d'un article
function updateItemQuantity(productId, newQuantity) {
    let cart = getCart();
    const id = Number(productId);
    const quantity = Number(newQuantity);

    const item = cart.find(item => item.id === id);

    if (item) {
        if (quantity > 0) {
            item.quantity = quantity;
        } else {
            // Si la quantité est zéro, supprimer l'article
            removeItemFromCart(id);
            return; // Sortir pour éviter le saveCart double
        }
    }

    saveCart(cart);
    displayCart(); // Re-afficher pour mettre à jour les totaux
    updateCartIconCount();
}


// ===============================================
// 3. GESTION DE LA PAGE PRODUITS (Écouteur d'événements)
// ===============================================

// Écoute les clics sur les boutons "Ajouter au Panier"
function setupProductPageListeners() {
    // Cibler tous les boutons "Ajouter au Panier" sur la page
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = button.dataset.id;

            // Remonter au conteneur parent pour trouver les infos
            const card = button.closest('.product-card');

            if (card) {
                const name = card.querySelector('.product-name').textContent;
                // Récupérer le prix depuis l'attribut data-price
                const price = card.querySelector('.product-price').dataset.price;
                const imageUrl = card.querySelector('img').src;

                addToCart(productId, name, price, imageUrl);

                // Modification visuelle du bouton pour confirmer l'ajout
                const originalText = button.textContent;
                button.innerHTML = "✓ Produit ajouté avec succès (+)";
                button.style.backgroundColor = "#28a745"; // Vert Bootstrap
                button.style.borderColor = "#28a745";
                button.style.color = "white";

                // Remettre à la normale après 2.5 secondes
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = ""; // Retour au CSS par défaut
                    button.style.borderColor = "";
                    button.style.color = "";
                }, 2500);
            }
        });
    });
}

// Fonction pour initialiser et gérer les filtres par catégorie
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.category-filters button');
    const productCards = document.querySelectorAll('.product-card');

    if (filterButtons.length === 0 || productCards.length === 0) return;

    // 1. Assigner des catégories aux cartes produits selon l'ID
    productCards.forEach(card => {
        const id = parseInt(card.dataset.id);
        let category = 'autre';

        if (id >= 1 && id <= 7) category = 'tshirt';
        else if (id >= 8 && id <= 11) category = 'legging';
        else if (id >= 12 && id <= 18) category = 'guipure';
        else if (id >= 19 && id <= 24) category = 'casquette';
        else if (id >= 25 && id <= 27) category = 'voile';
        else if (id >= 28 && id <= 29) category = 'sandale';

        card.setAttribute('data-category', category);
    });

    // 2. Gérer le clic sur les boutons de filtrage
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe 'active' de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Ajouter la classe 'active' au bouton cliqué
            button.classList.add('active');

            const filterValue = button.dataset.filter;

            // Filtrer les cartes produits
            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.style.display = 'block';
                    // Animation d'apparition douce
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transition = 'opacity 0.4s ease';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}


// ===============================================
// 4. GESTION DE LA PAGE PANIER (Affichage et Calculs)
// ===============================================

// Dictionnaire des coûts de livraison estimés (Tarif Yango depuis Ouakam)
const COMMUNE_SHIPPING_ESTIMATES = {
    "Ouakam": 1000,
    "Ngor": 1200,
    "Mermoz - Sacré-Cœur": 1200,
    "Fann - Point E - Amitié": 1500,
    "Yoff": 1500,
    "Médina": 1800,
    "Fass - Colobane - Gueule Tapée": 1800,
    "Dakar Plateau": 2000,
    "Grand Yoff": 2000,
    "Sicap Liberté": 2000,
    "Dieuppeul - Derklé": 2000,
    "Grand Dakar": 2000,
    "Biscuiterie": 2000,
    "HLM": 2200,
    "Hann Bel-Air": 2200,
    "Patte d'Oie": 2200,
    "Parcelles Assainies": 2200,
    "Cambérène": 2200,
    "Pikine": 2800,
    "Guédiawaye": 3000,
    "Rufisque": 4000,
    "Keur Massar": 4000,
    "Bargny": 4500,
    "Sangalkam": 4500,
    "Tivaouane Peulh": 4500,
    "Bambilor": 5000,
    "Diamniadio": 5000,
    "Sébikotane": 5000,
    "Gorée": 3000
};

// Variable globale pour suivre le coût de livraison actuel
let currentShippingCost = null;

// Fonction pour obtenir le coût de livraison basé sur la commune
function getShippingCost(communeName) {
    if (!communeName) return null;
    const cleanCommune = communeName.trim().toLowerCase();
    for (const key in COMMUNE_SHIPPING_ESTIMATES) {
        if (key.toLowerCase() === cleanCommune) {
            return COMMUNE_SHIPPING_ESTIMATES[key];
        }
    }
    return null;
}

// Fonction pour afficher le contenu du panier
function displayCart() {
    const cart = getCart();
    const cartListContainer = document.getElementById('panier-liste-articles');
    const sousTotalSpan = document.getElementById('sous-total');
    const totalFinalSpan = document.getElementById('total-final');
    const fraisLivraisonSpan = document.getElementById('frais-livraison');

    // Vider le contenu précédent
    if (cartListContainer) cartListContainer.innerHTML = '';

    let subtotal = 0;

    if (cart.length === 0) {
        // Afficher un message si le panier est vide
        if (cartListContainer) {
            cartListContainer.innerHTML =
                `<p class="message-vide" style="text-align: center; padding: 30px;">
                    Votre panier est vide. <a href="produits.html">Commencez vos achats !</a>
                </p>`;
        }
        if (sousTotalSpan) sousTotalSpan.textContent = '0.00 CFA';
        if (fraisLivraisonSpan) fraisLivraisonSpan.textContent = '0.00 CFA';
        if (totalFinalSpan) totalFinalSpan.textContent = '0.00 CFA';
        return;
    }

    // Boucler sur chaque article dans le panier
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        // Création de l'élément HTML pour l'article
        if (cartListContainer) {
            const cartItemHTML = `
                <div class="panier-article" data-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${item.name}">
                    <div class="article-details">
                        <p class="article-nom">${item.name}</p>
                        <p class="article-prix" data-prix="${item.price.toFixed(0)}">${item.price.toFixed(0)} CFA</p>
                    </div>
                    <div class="article-quantite">
                        <button class="quantite-btn" data-id="${item.id}" data-action="decrement">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantite-input" data-id="${item.id}" readonly>
                        <button class="quantite-btn" data-id="${item.id}" data-action="increment">+</button>
                    </div>
                    <div class="article-total">${itemTotal.toFixed(0)} CFA</div>
                    <button class="article-supprimer" data-id="${item.id}">Supprimer</button>
                </div>
            `;
            cartListContainer.innerHTML += cartItemHTML;
        }
    });

    if (sousTotalSpan) sousTotalSpan.textContent = subtotal.toFixed(0) + ' CFA';

    // Mettre à jour le coût de livraison et le total final
    if (fraisLivraisonSpan) {
        if (currentShippingCost !== null) {
            fraisLivraisonSpan.textContent = currentShippingCost.toFixed(0) + ' CFA';
            if (totalFinalSpan) {
                totalFinalSpan.textContent = (subtotal + currentShippingCost).toFixed(0) + ' CFA';
            }
        } else {
            fraisLivraisonSpan.textContent = 'À définir';
            if (totalFinalSpan) {
                totalFinalSpan.textContent = subtotal.toFixed(0) + ' CFA + livraison';
            }
        }
    }
}


// Écoute les événements (changement de quantité, suppression) sur la page panier
function setupCartPageListeners() {
    const cartContainer = document.getElementById('panier-liste-articles');

    if (!cartContainer) return; // Quitter si on n'est pas sur la page panier

    cartContainer.addEventListener('click', (event) => {
        const target = event.target;
        const productId = target.dataset.id;

        if (!productId) return;

        // 1. Bouton Supprimer
        if (target.classList.contains('article-supprimer')) {
            removeItemFromCart(productId);
        }

        // 2. Boutons de Quantité (+ ou -)
        if (target.classList.contains('quantite-btn')) {
            const inputElement = cartContainer.querySelector(`.quantite-input[data-id="${productId}"]`);
            let currentQuantity = Number(inputElement.value);
            const action = target.dataset.action;

            if (action === 'increment') {
                currentQuantity += 1;
            } else if (action === 'decrement') {
                currentQuantity -= 1;
            }

            // Mettre à jour la quantité (le 'updateItemQuantity' gère la suppression si la quantité arrive à zéro)
            updateItemQuantity(productId, currentQuantity);
        }
    });
}


// ===============================================
// 5. GESTION DU CHECKOUT (WHATSAPP)
// ===============================================
function setupCheckoutListener() {
    const checkoutForm = document.getElementById('checkoutForm');
    const paymentSelect = document.getElementById('clientPayment');
    const transactionField = document.getElementById('transactionField');
    const transactionCodeInput = document.getElementById('transactionCode');
    const paymentInstructions = document.getElementById('paymentInstructions');
    const clientAddressInput = document.getElementById('clientAddress');
    const shippingEstimateNote = document.getElementById('shipping-estimate-note');

    if (!checkoutForm) return;

    function updatePaymentInstructions() {
        if (!paymentSelect || !paymentInstructions) return;
        const method = paymentSelect.value;
        if (method === 'Wave' || method === 'Orange Money') {
            const cart = getCart();
            let subtotal = 0;
            cart.forEach(item => subtotal += item.price * item.quantity);
            
            if (currentShippingCost !== null) {
                const finalTotal = subtotal + currentShippingCost;
                paymentInstructions.innerHTML = `Veuillez transférer <strong>${finalTotal} CFA</strong> (produits : ${subtotal} CFA + livraison : ${currentShippingCost} CFA) au numéro <strong>77 551 20 17</strong> via ${method}. <br><span class="text-danger" style="font-size: 0.8rem; display: block; margin-top: 5px;">Note : Le coût Yango réel sera vérifié depuis Ouakam. S'il y a une différence importante, elle sera réglée avec le livreur.</span>`;
            } else {
                paymentInstructions.innerHTML = `Veuillez transférer <strong>${subtotal} CFA</strong> (coût des produits uniquement) au numéro <strong>77 551 20 17</strong> via ${method}. <br><span class="text-danger" style="font-size: 0.8rem; display: block; margin-top: 5px;">La livraison Yango sera calculée depuis Ouakam après validation et sera à régler directement au livreur.</span>`;
            }
        }
    }

    function updateTotalsWithAddress() {
        if (!clientAddressInput) return;
        const addressVal = clientAddressInput.value;
        const cost = getShippingCost(addressVal);
        
        if (cost !== null) {
            currentShippingCost = cost;
            if (shippingEstimateNote) {
                shippingEstimateNote.textContent = `Tarif Yango estimé depuis Ouakam : ${cost} CFA.`;
                shippingEstimateNote.className = "form-text text-success fw-bold";
            }
        } else {
            currentShippingCost = null;
            if (shippingEstimateNote) {
                if (addressVal.trim() !== "") {
                    shippingEstimateNote.textContent = "Commune personnalisée. Le tarif réel sera calculé via Yango depuis Ouakam.";
                    shippingEstimateNote.className = "form-text text-warning fw-bold";
                } else {
                    shippingEstimateNote.textContent = "La livraison est calculée depuis Ouakam. Saisissez votre commune pour voir une estimation.";
                    shippingEstimateNote.className = "form-text text-muted";
                }
            }
        }
        
        // Recalculer les totaux de la page panier
        displayCart();
        
        // Mettre à jour les instructions de paiement
        updatePaymentInstructions();
    }

    if (clientAddressInput) {
        clientAddressInput.addEventListener('input', updateTotalsWithAddress);
        clientAddressInput.addEventListener('change', updateTotalsWithAddress);
    }

    if (paymentSelect) {
        paymentSelect.addEventListener('change', function() {
            if (this.value === 'Wave' || this.value === 'Orange Money') {
                transactionField.classList.remove('d-none');
                transactionCodeInput.setAttribute('required', 'required');
                updatePaymentInstructions();
            } else {
                transactionField.classList.add('d-none');
                transactionCodeInput.removeAttribute('required');
                transactionCodeInput.value = '';
            }
        });
    }

    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const cart = getCart();
        if (cart.length === 0) {
            alert("Votre panier est vide !");
            return;
        }

        const name = document.getElementById('clientName').value;
        const phone = document.getElementById('clientPhone').value;
        const address = document.getElementById('clientAddress').value;
        const street = document.getElementById('clientStreet').value;
        const expectedDate = document.getElementById('clientDate').value; 
        const payment = document.getElementById('clientPayment').value;
        const transactionCode = document.getElementById('transactionCode').value;

        let subtotal = 0;
        let orderDetails = "";

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            orderDetails += `- ${item.quantity}x ${item.name} (${item.price.toFixed(0)} CFA)\n`;
        });

        const shippingText = currentShippingCost !== null ? `${currentShippingCost.toFixed(0)} CFA (estimation Yango)` : "À calculer sur Yango (tarif réel depuis Ouakam)";
        const finalTotalText = currentShippingCost !== null ? `${(subtotal + currentShippingCost).toFixed(0)} CFA` : `${subtotal.toFixed(0)} CFA + livraison Yango`;

        let transactionText = "";
        if (payment === 'Wave' || payment === 'Orange Money') {
            transactionText = `\nCode de transaction : ${transactionCode}`;
        }

        // Créer l'itinéraire Google Maps de Ouakam à l'adresse du client pour simplifier la vie au marchand
        const itineraryUrl = `https://www.google.com/maps/dir/Ouakam,+Dakar/${encodeURIComponent(address + ', ' + street + ', Dakar, Senegal')}`;

        const storePhone = "221775512017";
        
        const message = `Bonjour Adis'tyle, je souhaite valider ma commande :

🛒 PANIER :
${orderDetails}
Livraison depuis Ouakam : ${shippingText}
💰 TOTAL : ${finalTotalText}

👤 INFOS CLIENT :
Nom : ${name}
Téléphone : ${phone}
Adresse de livraison : ${address} - ${street}
🗺️ Itinéraire Google Maps : ${itineraryUrl}
Date de livraison attendue : ${expectedDate}
Paiement choisi : ${payment}${transactionText}`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${storePhone}?text=${encodedMessage}`;

        // Configurer le bouton manuel du modal de succès
        const manualBtn = document.getElementById('manual-whatsapp-btn');
        if (manualBtn) {
            manualBtn.href = whatsappUrl;
        }

        // Afficher le modal de succès
        const successModalEl = document.getElementById('successModal');
        if (successModalEl) {
            // Fermer le modal de checkout
            const checkoutModalEl = document.getElementById('checkoutModal');
            if (checkoutModalEl) {
                const checkoutModal = bootstrap.Modal.getInstance(checkoutModalEl) || new bootstrap.Modal(checkoutModalEl);
                checkoutModal.hide();
            }

            // Ouvrir le modal de succès
            const successModal = new bootstrap.Modal(successModalEl);
            successModal.show();

            // Vider le panier
            localStorage.removeItem('adis_cart');
            displayCart();

            // Redirection automatique vers WhatsApp après 3 secondes
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
            }, 3000);
        } else {
            // Repli si le modal de succès n'existe pas
            const checkoutModalEl = document.getElementById('checkoutModal');
            if (checkoutModalEl) {
                const checkoutModal = bootstrap.Modal.getInstance(checkoutModalEl) || new bootstrap.Modal(checkoutModalEl);
                checkoutModal.hide();
            }
            localStorage.removeItem('adis_cart');
            displayCart();
            window.open(whatsappUrl, '_blank');
        }
    });
}


// ===============================================
// 5.5 INTEGRATION DU PANIER FLOTTANT ET DU BADGE
// ===============================================

// Déterminer le chemin relatif correct vers la page panier
function getCartPagePath() {
    const pathname = window.location.pathname;
    // Si nous sommes dans le dossier pages/
    if (pathname.includes('/pages/')) {
        return './panier.html';
    } else {
        return 'pages/panier.html';
    }
}

// Injecter dynamiquement la structure du bouton de panier flottant
function createFloatingCart() {
    // Si nous sommes déjà sur la page panier, pas besoin de panier flottant
    if (document.getElementById('panier-liste-articles')) {
        return;
    }

    // Vérifier s'il n'existe pas déjà
    if (document.getElementById('floating-cart-btn')) {
        return;
    }

    const floatingCartHtml = `
        <a href="${getCartPagePath()}" id="floating-cart-btn" class="floating-cart-container d-none" title="Voir mon panier">
            <div class="floating-cart-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            </div>
            <span class="floating-cart-badge" id="floating-cart-count">0</span>
        </a>
    `;

    document.body.insertAdjacentHTML('beforeend', floatingCartHtml);
}

// Injecter dynamiquement le badge rouge dans la navigation
function createHeaderCartBadge() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        if (link.textContent.trim().toLowerCase().startsWith('panier')) {
            // Vérifier si le badge n'existe pas déjà
            let badge = link.querySelector('#cart-badge-count');
            if (!badge) {
                // Remplacer le contenu texte par le badge inséré
                link.innerHTML = `Panier <span class="badge bg-danger rounded-pill d-none" id="cart-badge-count">0</span>`;
            }
        }
    });
}

// Mettre à jour les compteurs du panier en temps réel
function updateCartIconCount() {
    const cart = getCart();
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // 1. Mettre à jour le badge du menu de navigation
    const cartBadge = document.getElementById('cart-badge-count');
    if (cartBadge) {
        cartBadge.textContent = totalCount;
        if (totalCount > 0) {
            cartBadge.classList.remove('d-none');
        } else {
            cartBadge.classList.add('d-none');
        }
    }

    // 2. Mettre à jour le bouton de panier flottant
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    const floatingCartCount = document.getElementById('floating-cart-count');
    
    if (floatingCartCount) {
        floatingCartCount.textContent = totalCount;
    }
    
    if (floatingCartBtn) {
        if (totalCount > 0) {
            floatingCartBtn.classList.remove('d-none');
            
            // Effet d'animation de rebond sur ajout d'un article
            floatingCartBtn.classList.add('cart-animate');
            setTimeout(() => {
                floatingCartBtn.classList.remove('cart-animate');
            }, 500);
        } else {
            floatingCartBtn.classList.add('d-none');
        }
    }
}


// ===============================================
// 6. INITIALISATION (Exécuté au chargement de la page)
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // Injecter les composants de panier dynamique
    createFloatingCart();
    createHeaderCartBadge();
    updateCartIconCount();

    // LOGIQUE DU PANIER
    const isProductPage = document.querySelector('.products-grid');
    const isCartPage = document.getElementById('panier-liste-articles');

    if (isProductPage) {
        setupProductPageListeners();
        setupCategoryFilters();
    }

    if (isCartPage) {
        displayCart(); // Affiche le contenu du panier au chargement de la page panier
        setupCartPageListeners(); // On attache l'écouteur UNE SEULE FOIS ici
        setupCheckoutListener(); // Initialiser la logique WhatsApp
    }
});