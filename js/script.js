document.addEventListener('DOMContentLoaded', () => {
    // 1. Récupérer les éléments par leur ID
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const body = document.body;

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            // Bascule la classe 'nav-open' sur le body
            body.classList.toggle('nav-open');
            
            // Pour l'accessibilité : change l'état du bouton
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });
        
        // Optionnel: Fermer le menu si l'utilisateur clique sur un lien (sur mobile)
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    body.classList.remove('nav-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }
});
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
    alert(`"${name}" a été ajouté au panier !`);
    // Optionnel : Mettre à jour l'icône du panier si vous en avez une
    // updateCartIconCount(); 
}

// Supprime complètement un article du panier
function removeItemFromCart(productId) {
    let cart = getCart();
    const id = Number(productId);

    // Filtrer le panier pour exclure l'article avec l'ID donné
    cart = cart.filter(item => item.id !== id);

    saveCart(cart);
    displayCart(); // Re-afficher le panier après suppression
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
            }
        });
    });
}


// ===============================================
// 4. GESTION DE LA PAGE PANIER (Affichage et Calculs)
// ===============================================

const SHIPPING_COST = 5.00; // Coût fixe de livraison

// Fonction pour afficher le contenu du panier
function displayCart() {
    const cart = getCart();
    const cartListContainer = document.getElementById('panier-liste-articles');
    const sousTotalSpan = document.getElementById('sous-total');
    const totalFinalSpan = document.getElementById('total-final');
    
    // Vider le contenu précédent
    cartListContainer.innerHTML = '';
    
    let subtotal = 0;

    if (cart.length === 0) {
        // Afficher un message si le panier est vide
        cartListContainer.innerHTML = 
            `<p class="message-vide" style="text-align: center; padding: 30px;">
                Votre panier est vide. <a href="produits.html">Commencez vos achats !</a>
            </p>`;
    } else {
        // Boucler sur chaque article dans le panier
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            // Création de l'élément HTML pour l'article
            const cartItemHTML = `
                <div class="panier-article" data-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${item.name}">
                    <div class="article-details">
                        <p class="article-nom">${item.name}</p>
                        <p class="article-prix" data-prix="${item.price.toFixed(2)}">${item.price.toFixed(2)} €</p>
                    </div>
                    <div class="article-quantite">
                        <button class="quantite-btn" data-id="${item.id}" data-action="decrement">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantite-input" data-id="${item.id}" readonly>
                        <button class="quantite-btn" data-id="${item.id}" data-action="increment">+</button>
                    </div>
                    <div class="article-total">${itemTotal.toFixed(2)} €</div>
                    <button class="article-supprimer" data-id="${item.id}">Supprimer</button>
                </div>
            `;
            cartListContainer.innerHTML += cartItemHTML;
        });
    }
    
    // Calcul et affichage des totaux
    const finalTotal = subtotal + SHIPPING_COST;

    sousTotalSpan.textContent = subtotal.toFixed(2) + ' €';
    
    // Mettre à jour le coût de livraison (seulement si le panier n'est pas vide)
    document.getElementById('frais-livraison').textContent = 
        cart.length > 0 ? SHIPPING_COST.toFixed(2) + ' €' : '0.00 €';
    
    // Afficher le total final
    totalFinalSpan.textContent = (cart.length > 0 ? finalTotal : 0.00).toFixed(2) + ' €';

    setupCartPageListeners(); // Réattacher les écouteurs après le rendu
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
// 5. INITIALISATION (Exécuté au chargement de la page)
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // LOGIQUE EXISTANTE DU MENU HAMBURGER (ASSUREZ-VOUS QU'ELLE EST TOUJOURS PRÉSENTE)
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const body = document.body;

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            body.classList.toggle('nav-open');
            menuToggle.setAttribute('aria-expanded', body.classList.contains('nav-open'));
        });

        // Fermer le menu si on clique sur un lien ou en dehors
        mainNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                 body.classList.remove('nav-open');
                 menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !menuToggle.contains(e.target) && body.classList.contains('nav-open')) {
                body.classList.remove('nav-open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // NOUVELLE LOGIQUE DU PANIER
    const isProductPage = document.querySelector('.products-grid');
    const isCartPage = document.getElementById('panier-liste-articles');

    if (isProductPage) {
        setupProductPageListeners();
    }

    if (isCartPage) {
        displayCart(); // Affiche le contenu du panier au chargement de la page panier
    }
});