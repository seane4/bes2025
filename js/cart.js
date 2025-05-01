class CartManager {
    constructor() {
        this.cart = [];
        this.CART_VERSION = '1.0.0';
    }

    loadCart() {
        try {
            const savedCart = localStorage.getItem('cart');
            this.cart = savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    updateAllDisplays() {
        const cartItemsContainer = document.querySelector('.w-commerce-commercecartlist');
        const cartSubtotalValue = document.querySelector('.w-commerce-commercecartordervalue');
        const cartQuantityElements = document.querySelectorAll('.w-commerce-commercecartopenlinkcount');
        
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = '';
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-message">No items found.</div>';
            if (cartSubtotalValue) cartSubtotalValue.textContent = '$0.00';
            if (cartQuantityElements) {
                cartQuantityElements.forEach(el => el.textContent = '0');
            }
            return;
        }

        let subtotal = 0;
        
        this.cart.forEach((item, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'w-commerce-commercecartitem cart-item';
            
            let imageUrl = item.image || 'images/placeholder.jpg';
            let itemPrice = parseFloat(item.price || 0) / 100;
            
            listItem.innerHTML = `
                <div class="cart-item-content">
                    <div class="cart-item-image-wrapper">
                        <img src="${imageUrl}" alt="${item.name}" class="cart-item-image">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${itemPrice.toFixed(2)}</div>
                        <button class="remove-item-btn" data-index="${index}">Remove</button>
                    </div>
                </div>
            `;
            
            cartItemsContainer.appendChild(listItem);
            subtotal += itemPrice;
        });

        if (cartSubtotalValue) {
            cartSubtotalValue.textContent = `$${subtotal.toFixed(2)}`;
        }
        
        if (cartQuantityElements) {
            cartQuantityElements.forEach(el => el.textContent = this.cart.length.toString());
        }

        // Add event listeners to remove buttons
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeItem(index);
            });
        });
    }

    addItem(item) {
        if (!item || !item.type || !item.name || !item.price) {
            console.error('Invalid item format');
            return false;
        }
        this.loadCart();
        this.cart.push(item);
        this.saveCart();
        this.updateAllDisplays();
        return true;
    }

    removeItem(index) {
        this.loadCart();
        this.cart.splice(index, 1);
        this.saveCart();
        this.updateAllDisplays();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }
}

// Create the global instance
const GlobalCartManager = new CartManager();

// Initialize cart display when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const cartElements = document.querySelector('.w-commerce-commercecartcontainerwrapper');
    if (cartElements) {
        console.log('Cart elements found, initializing display...');
        GlobalCartManager.loadCart();
        GlobalCartManager.updateAllDisplays();
    }
}); 