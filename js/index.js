// Custom JavaScript for Banff Energy Summit 2025 website
document.addEventListener('DOMContentLoaded', function() {
  console.log('Banff Energy Summit 2025 website loaded');
  
  // Add cart styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .cart-item {
      padding: 16px;
      border-bottom: 1px solid #e6e6e6;
    }
    
    .cart-item-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      position: relative;
    }
    
    .cart-item-image-wrapper {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
      overflow: hidden;
      border-radius: 4px;
    }
    
    .cart-item-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .cart-item-details {
      flex: 1;
      min-width: 0;
      position: relative;
    }
    
    .cart-item-title {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 8px;
      color: #333;
    }
    
    .cart-item-info {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .cart-item-price {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    
    .cart-item-total {
      font-weight: 600;
      font-size: 16px;
      color: #333;
      margin-top: 8px;
      margin-bottom: 12px;
    }
    
    .remove-item-btn {
      background: none;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .remove-item-btn:hover {
      background-color: #f5f5f5;
      border-color: #d9d9d9;
      color: #333;
    }
    
    .w-commerce-commercecartlist {
      padding: 16px;
    }

    .w-commerce-commercecartcontainerwrapper {
      min-width: 300px;
    }

    .w-commerce-commercecartcontainer {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100%;
    }

    .w-commerce-commercecartformwrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .w-commerce-commercecartform {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .w-commerce-commercecartlist {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      max-height: calc(100vh - 250px);
    }

    .w-commerce-commercecartfooter {
      padding: 16px;
      border-top: 1px solid #e6e6e6;
      background: #fff;
      margin-top: auto;
    }

    .w-commerce-commercecartapplepaybutton {
      display: none !important;
    }

    .w-commerce-commercecartquickcheckoutbutton {
      display: none !important;
    }

    .cart-subtotal {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e6e6e6;
    }

    .cart-subtotal-label {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .cart-subtotal-value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .w-commerce-commercecartemptystate {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 32px 16px;
      flex: 1;
      width: 100%;
      min-width: 300px;
      min-height: 200px;
      text-align: center;
    }

    .w-commerce-commercecartemptystate div {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    /* Activities Grid Styles */
    .activities-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-top: 40px;
    }

    .activity-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .activity-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .activity-image {
      height: 200px;
      overflow: hidden;
    }

    .activity-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .activity-card:hover .activity-image img {
      transform: scale(1.1);
    }

    .activity-content {
      padding: 24px;
    }

    .activity-title {
      font-family: var(--heading);
      font-size: 20px;
      font-weight: 600;
      color: var(--tracts-blue);
      margin-bottom: 12px;
    }

    .activity-description {
      font-family: var(--body);
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      margin-bottom: 20px;
      min-height: 63px;
    }

    .activity-variants {
      margin-bottom: 20px;
    }

    .variant-selection {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .variant-selection label {
      font-family: var(--body);
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .variant-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-family: var(--body);
      font-size: 14px;
      color: #333;
      background-color: #fff;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }

    .variant-select:hover {
      border-color: var(--tracts-green);
    }

    .variant-select:focus {
      outline: none;
      border-color: var(--tracts-green);
      box-shadow: 0 0 0 2px rgba(0, 174, 107, 0.1);
    }

    .variant-description {
      font-family: var(--body);
      font-size: 13px;
      color: #666;
      line-height: 1.4;
      margin-top: 4px;
      font-style: italic;
    }

    .activity-options {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .selection-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .selection-group label {
      font-family: var(--body);
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .selection-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-family: var(--body);
      font-size: 14px;
      color: #333;
      background-color: #fff;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }

    .selection-group select:hover {
      border-color: var(--tracts-green);
    }

    .selection-group select:focus {
      outline: none;
      border-color: var(--tracts-green);
      box-shadow: 0 0 0 2px rgba(0, 174, 107, 0.1);
    }

    .guest-selection {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .guest-selection label {
      font-family: var(--body);
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .activity-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-family: var(--body);
      font-size: 14px;
      color: #333;
      background-color: #fff;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }

    .activity-select:hover {
      border-color: var(--tracts-green);
    }

    .activity-select:focus {
      outline: none;
      border-color: var(--tracts-green);
      box-shadow: 0 0 0 2px rgba(0, 174, 107, 0.1);
    }

    .activity-add-btn {
      width: 100%;
      padding: 12px;
      background-color: var(--tracts-green);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-family: var(--heading);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.2s ease;
    }

    .activity-add-btn:hover {
      background-color: #009a5f;
      transform: translateY(-2px);
    }

    .activity-add-btn.added {
      background-color: #28a745;
    }

    @media screen and (max-width: 991px) {
      .activities-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 25px;
      }
    }

    @media screen and (max-width: 767px) {
      .activities-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .activity-description {
        min-height: auto;
      }
    }

    .booking-form-container {
      padding: 24px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      margin-top: 24px;
    }

    @media screen and (max-width: 991px) {
      .booking-form-container {
        padding: 20px;
        margin-top: 20px;
      }
    }

    @media screen and (max-width: 767px) {
      .booking-form-container {
        padding: 16px;
        margin-top: 16px;
      }

      .booking-form-row {
        flex-direction: column;
        gap: 12px;
      }

      .date-input-group, .guest-options {
        width: 100%;
      }

      .booking-summary-floating {
        margin-top: 16px;
        padding: 16px;
      }
    }

    @media screen and (max-width: 479px) {
      .booking-form-container {
        padding: 12px;
        margin-top: 12px;
        border-radius: 6px;
      }

      .booking-form-row {
        gap: 8px;
      }

      .booking-summary-floating {
        padding: 12px;
        margin-top: 12px;
      }

      .summary-row {
        margin-bottom: 8px;
      }
    }

    .support-top-details-text {
      text-align: center;
      font-size: 16px;
      line-height: 1.5;
      color: #666;
      
    }

    @media screen and (max-width: 767px) {
      .support-top-details-text {
        text-align: center;
        font-size: 14px;
        margin-bottom: 20px;
        padding: 0 16px;
      }
    }

    @media screen and (max-width: 479px) {
      .support-top-details-text {
        text-align: center;
        font-size: 14px;
        margin-bottom: 16px;
        padding: 0 12px;
      }
    }

    /* Customer Info Section Styles */
    .customer-info-section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e6e6e6;
    }

    .customer-info-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .section-subheading {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 20px;
    }

    .w-commerce-commercecheckoutlabel {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .w-commerce-commercecheckoutemailinput,
    .w-commerce-commercecheckoutshippingfullname,
    .w-commerce-commercecheckoutshippingstreetaddress,
    .w-commerce-commercecheckoutshippingstreetaddressoptional,
    .w-commerce-commercecheckoutshippingcity,
    .w-commerce-commercecheckoutshippingstateprovince,
    .w-commerce-commercecheckoutshippingzippostalcode,
    .w-commerce-commercecheckoutshippingcountryselector,
    textarea.input {
      width: 100%;
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      font-size: 14px;
    }

    textarea.input {
      min-height: 100px;
      resize: vertical;
    }

    .w-commerce-commercecheckoutrow {
      display: flex;
      margin: 0 -8px 16px;
    }

    .w-commerce-commercecheckoutcolumn {
      padding: 0 8px;
      flex: 1;
    }

    @media screen and (max-width: 767px) {
      .w-commerce-commercecheckoutrow {
        flex-direction: column;
        margin: 0;
      }

      .w-commerce-commercecheckoutcolumn {
        padding: 0;
        margin-bottom: 16px;
      }

      .w-commerce-commercecheckoutcolumn:last-child {
        margin-bottom: 0;
      }
    }

    /* Hide Apple Pay and Quick Checkout buttons */
    .w-commerce-commercecartapplepaybutton,
    .w-commerce-commercecartquickcheckoutbutton,
    .apple-pay,
    .pay-with-browser {
      display: none !important;
    }

    /* Empty cart message styles */
    .empty-cart-message {
      padding: 30px;
      text-align: center;
    }
    
    .empty-cart-message p {
      font-size: 16px;
      margin-bottom: 20px;
      color: #666;
    }
    
    .empty-cart-message .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #00ae6b;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
    
    .empty-cart-message .btn:hover {
      background-color: #009a5f;
    }

    /* Message system styles */
    .message-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }

    .message {
      padding: 12px 24px;
      margin-bottom: 10px;
      border-radius: 4px;
      color: white;
      animation: slideIn 0.3s ease-out;
    }

    .message-success { background-color: #4CAF50; }
    .message-error { background-color: #f44336; }
    .message-info { background-color: #2196F3; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);
  
  // Initialize the booking form if on the appropriate page
  if (document.getElementById('check-in-date') && document.getElementById('check-out-date')) {
    initBookingForm();
  }
  
  // Initialize the room type selector if on the appropriate page
  if (document.querySelector('.room-type-tab')) {
    initRoomTypeSelector();
  }
  
  // Initialize the image carousel if on the appropriate page
  if (document.querySelector('.carousel-container')) {
    initImageCarousel();
  }
  
  // Enhance date pickers if on the appropriate page
  if (document.querySelector('.date-input-wrapper')) {
    enhanceDatePickers();
  }
  
  // Initialize cart functionality - this should work on all pages
  initCartFunctionality();
  
  // Update cart display on page load - this should work on all pages
  updateCartDisplay();
  
  // Initialize activity selection if on the appropriate page
  const isSponsorPage = window.location.pathname.includes('sponsor.html'); // Check if it's the sponsor page
  if (document.querySelector('.activity-card') && !isSponsorPage) {
    console.log("Activity cards found on non-sponsor page, initializing handleActivitySelection...");
    handleActivitySelection(); // Initialize activity selection logic
  } else if (isSponsorPage) {
    console.log("Sponsor page detected. Skipping handleActivitySelection. Using onclick attributes instead.");
  } else {
    console.log("No activity cards found on this page, or it's the sponsor page.");
  }
  
  // Initialize complete registration button if on the appropriate page
  if (document.querySelector('.hero-section.contact-hero.compeltecta')) {
    initCompleteRegistrationButton();
  }

  // Initialize checkout page functionality if on the checkout page
  if (window.location.pathname.includes('checkout.html')) {
    initCheckoutPage();
  }
  
  // Update navigation - this should work on all pages
  updateNavigation();

  // Add at the top of your file
  const CART_VERSION = '1.0.0'; // Increment when cart structure changes

  class CartManager {
    static initialize() {
      // Check if cart version has changed
      const storedVersion = localStorage.getItem('cart_version');
      if (storedVersion !== CART_VERSION) {
        console.log(`Cart version changed from ${storedVersion} to ${CART_VERSION}. Clearing cart.`);
        this.debugClearAll();
        localStorage.setItem('cart_version', CART_VERSION);
      }
    }

    static getCart() {
      return JSON.parse(localStorage.getItem('cart')) || '[]';
    }

    static saveCart(cart) {
      localStorage.setItem('cart', JSON.stringify(cart));
      this.updateAllDisplays();
    }

    static addItem(item) {
      try {
        validateCartItem(item);
        const cart = this.getCart();
        
        switch (item.type) {
          case 'accommodation':
            // Ensure required fields exist
            if (!item.name || !item.unit_price_cents || !item.metadata) {
              throw new Error('Invalid accommodation data');
            }
            // Replace existing accommodation
            const existingAccomIndex = cart.findIndex(i => i.type === 'accommodation');
            if (existingAccomIndex >= 0) {
              cart[existingAccomIndex] = item;
            } else {
              cart.push(item);
            }
            break;
          case 'activity':
            // Check for same activity + participant type
            const existingActivityIndex = cart.findIndex(i => 
              i.id === item.id && 
              i.metadata.participant_type === item.metadata.participant_type
            );
            if (existingActivityIndex >= 0) {
              throw new Error('This activity is already in your cart');
            }
            cart.push(item);
            break;

          case 'sponsorship':
            // Check for existing sponsorship
            const hasSponsorshipTier = cart.some(i => 
              i.type === 'sponsorship' && 
              i.metadata.tier === item.metadata.tier
            );
            if (hasSponsorshipTier) {
              throw new Error('This sponsorship tier is already in your cart');
            }
            cart.push(item);
            break;
        }

        this.saveCart(cart);
        return true;
      } catch (error) {
        console.error('Error adding to cart:', error);
        return false;
      }
    }

    static removeItem(index) {
      const cart = this.getCart();
      if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        this.saveCart(cart);
        return true;
      }
      return false;
    }

    static clearCart() {
      localStorage.removeItem('cart');
      this.updateAllDisplays();
    }

    static updateAllDisplays() {
      // Update cart display
      updateCartDisplay();
      // Update checkout if on checkout page
      if (typeof updateCheckoutSummary === 'function') {
        updateCheckoutSummary();
      }
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { cart: this.getCart() }
      }));
    }

    static getSubtotalCents() {
      return this.getCart().reduce((sum, item) => sum + item.total_cents, 0);
    }

    static getItemDisplay(item) {
      const unitPrice = formatPrice(item.unit_price_cents);
      const totalPrice = formatPrice(item.total_cents);

      switch (item.type) {
        case 'accommodation':
          return `
            <div class="cart-item-content">
              <div class="cart-item-image-wrapper">
                <img src="${getRoomImage(item.metadata.room_type)}" alt="${item.name}" class="cart-item-image">
              </div>
              <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="booking-dates">
                  ${formatDate(item.metadata.check_in_date)} - ${formatDate(item.metadata.check_out_date)}
                </div>
                <div class="booking-details">
                  ${item.metadata.nights} night${item.metadata.nights > 1 ? 's' : ''} • 
                  ${item.metadata.guests} guest${item.metadata.guests > 1 ? 's' : ''}
                </div>
                <div class="price-breakdown">
                  <div class="per-night">$${unitPrice} per night</div>
                  <div class="total-price">Total: $${totalPrice}</div>
                </div>
              </div>
            </div>`;

        case 'activity':
          return `
            <div class="cart-item-content">
              <div class="cart-item-image-wrapper">
                <img src="${getActivityImage(item.name)}" alt="${item.name}" class="cart-item-image">
              </div>
              <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="participant-info">For: ${item.metadata.participant_type}</div>
                <div class="price-details">
                  ${item.quantity > 1 ? 
                    `<div class="quantity">${item.quantity}x $${unitPrice}</div>` : 
                    `<div class="unit-price">$${unitPrice}</div>`
                  }
                  <div class="total-price">Total: $${totalPrice}</div>
                </div>
              </div>
            </div>`;
      }
    }

    static debugClearAll() {
      localStorage.clear();
      sessionStorage.clear();
      this.updateAllDisplays();
      console.log('Cart and storage cleared');
    }

    // Add a debug method to inspect cart contents
    static debugInspectCart() {
      const cart = this.getCart();
      console.log('Current Cart Contents:', cart);
      cart.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          type: item.type,
          name: item.name,
          price: item.unit_price_cents / 100,
          total: item.total_cents / 100,
          metadata: item.metadata
        });

      });
    }

    static validateCart() {
      const cart = this.getCart();
      const validCart = cart.filter(item => {
        try {
          validateCartItem(item);
          return true;
        } catch (error) {
          console.warn('Removing invalid cart item:', error, item);
          return false;
        }
      });

      if (validCart.length !== cart.length) {
        console.log('Cart was cleaned of invalid items');
        this.saveCart(validCart);
      }
    }
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    CartManager.initialize();
    // ... rest of your initialization code
  });
});

// Initialize the booking form
function initBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomId = form.querySelector('[name="room_type"]').value;
    const checkIn = form.querySelector('[name="check_in"]').value;
    const checkOut = form.querySelector('[name="check_out"]').value;
    const guests = parseInt(form.querySelector('[name="guests"]').value);

    try {
      // Fetch room data from Supabase
      const { data: room, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;

      // Calculate nights
      const nights = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
      );

      // Create standardized cart item
      const cartItem = createCartItem('accommodation', {
        id: room.id,
        roomType: room.room_type,
        price_per_night_cents: room.price_per_night_cents,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights: nights,
        guestCount: guests
      });

      // Add to cart
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      
      // Check for existing accommodation
      const existingIndex = cart.findIndex(item => item.type === 'accommodation');
      if (existingIndex >= 0) {
        cart[existingIndex] = cartItem;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartDisplay();

      // Show success message
      showMessage('Room added to cart!', 'success');

    } catch (error) {
      console.error('Error adding room to cart:', error);
      showMessage('Error adding room to cart', 'error');
    }
  });
}

// Enhance date pickers to be more intuitive
function enhanceDatePickers() {
  const dateInputWrappers = document.querySelectorAll('.date-input-wrapper');
  
  dateInputWrappers.forEach(wrapper => {
    const dateInput = wrapper.querySelector('.date-input');
    const dateSelectButton = wrapper.querySelector('.date-select-button');
    
    if (!dateInput) return;
    
    // The select button already has an onclick handler in the HTML
    // This is just additional functionality for the wrapper
    
    // Make the wrapper clickable to open the date picker (excluding the button which has its own handlers)
    wrapper.addEventListener('click', function(e) {
      // Don't trigger if clicking directly on the input or the button (they have their own handlers)
      if (e.target !== dateInput && !e.target.closest('.date-select-button')) {
        dateInput.focus();
        dateInput.click();
      }
    });
    
    // Add visual feedback when focusing the input
    dateInput.addEventListener('focus', function() {
      wrapper.classList.add('focused');
    });
    
    dateInput.addEventListener('blur', function() {
      wrapper.classList.remove('focused');
    });
    
    // Add placeholder text if not already present
    if (!dateInput.placeholder) {
      if (dateInput.id === 'check-in-date') {
        dateInput.placeholder = 'Select check-in date';
      } else if (dateInput.id === 'check-out-date') {
        dateInput.placeholder = 'Select check-out date';
      }
    }
  });
}

// Initialize the room type selector
function initRoomTypeSelector() {
  const roomTypeTabs = document.querySelectorAll('.room-type-tab');
  const suiteInfos = document.querySelectorAll('.suite-info');
  const carouselContainers = document.querySelectorAll('.carousel-container');
  const summaryRoomType = document.getElementById('summary-room-type');
  const summaryPricePerNight = document.getElementById('summary-price-per-night');
  
  if (!roomTypeTabs.length) return;
  
  roomTypeTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const roomType = this.getAttribute('data-room-type');
      const roomPrice = this.getAttribute('data-price');
      
      // Update active tab
      roomTypeTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Update carousel - always reset to first slide when changing room type
      carouselContainers.forEach(container => {
        container.classList.remove('active');
        
        // Reset all slides in this container to inactive
        const slides = container.querySelectorAll('.carousel-slide');
        const indicators = container.querySelectorAll('.carousel-indicator');
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // If this is the selected room type, activate it and set first slide as active
        if (container.getAttribute('data-room-type') === roomType) {
          container.classList.add('active');
          
          // Always start with the first slide when switching room types
          if (slides.length > 0) {
            slides[0].classList.add('active');
          }
          
          if (indicators.length > 0) {
            indicators[0].classList.add('active');
          }
        }
      });
      
      // Update suite info
      suiteInfos.forEach(info => {
        info.classList.remove('active');
        if (info.getAttribute('data-room-type') === roomType) {
          info.classList.add('active');
        }
      });
      
      // Update booking summary
      if (summaryRoomType) {
        summaryRoomType.textContent = this.querySelector('.room-type-name').textContent;
      }
      
      if (summaryPricePerNight) {
        summaryPricePerNight.textContent = roomPrice;
      }
      
      updateTotalPrice();
    });
  });
}

// Initialize the image carousel
function initImageCarousel() {
  const carouselContainers = document.querySelectorAll('.carousel-container');
  
  if (!carouselContainers.length) return;
  
  // Store all slide intervals to manage them
  const slideIntervals = {};
  
  carouselContainers.forEach(container => {
    const roomType = container.getAttribute('data-room-type');
    const slides = container.querySelectorAll('.carousel-slide');
    const indicators = container.querySelectorAll('.carousel-indicator');
    const prevArrow = container.querySelector('.prev-arrow');
    const nextArrow = container.querySelector('.next-arrow');
    
    // Initialize with first slide active
    if (slides.length > 0) {
      slides[0].classList.add('active');
    }
    
    if (indicators.length > 0) {
      indicators[0].classList.add('active');
    }
    
    // Function to show a specific slide
    function showSlide(index) {
      // Hide all slides
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));
      
      // Show the selected slide
      slides[index].classList.add('active');
      indicators[index].classList.add('active');
    }
    
    // Previous slide button
    if (prevArrow) {
      prevArrow.addEventListener('click', function() {
        let activeIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
        let newIndex = activeIndex - 1;
        if (newIndex < 0) newIndex = slides.length - 1;
        
        showSlide(newIndex);
      });
    }
    
    // Next slide button
    if (nextArrow) {
      nextArrow.addEventListener('click', function() {
        let activeIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
        let newIndex = activeIndex + 1;
        if (newIndex >= slides.length) newIndex = 0;
        
        showSlide(newIndex);
      });
    }
    
    // Indicator buttons
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', function() {
        showSlide(index);
      });
    });
    
    // No autoplay by default - we'll only enable it for the active carousel
    slideIntervals[roomType] = null;
  });
  
  // Function to manage autoplay for the active carousel only
  function manageAutoplay() {
    const activeContainer = document.querySelector('.carousel-container.active');
    if (!activeContainer) return;
    
    const roomType = activeContainer.getAttribute('data-room-type');
    const slides = activeContainer.querySelectorAll('.carousel-slide');
    const indicators = activeContainer.querySelectorAll('.carousel-indicator');
    
    // Clear all existing intervals
    Object.values(slideIntervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    
    // Set all intervals to null
    Object.keys(slideIntervals).forEach(key => {
      slideIntervals[key] = null;
    });
    
    // Only set autoplay for the active carousel
    slideIntervals[roomType] = setInterval(() => {
      let activeIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
      let newIndex = activeIndex + 1;
      if (newIndex >= slides.length) newIndex = 0;
      
      // Update slide
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));
      
      slides[newIndex].classList.add('active');
      indicators[newIndex].classList.add('active');
    }, 5000);
    
    // Pause autoplay when hovering over active carousel
    activeContainer.addEventListener('mouseenter', () => {
      if (slideIntervals[roomType]) {
        clearInterval(slideIntervals[roomType]);
        slideIntervals[roomType] = null;
      }
    });
    
    // Resume autoplay when mouse leaves active carousel
    activeContainer.addEventListener('mouseleave', () => {
      if (!slideIntervals[roomType]) {
        slideIntervals[roomType] = setInterval(() => {
          let activeIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
          let newIndex = activeIndex + 1;
          if (newIndex >= slides.length) newIndex = 0;
          
          // Update slide
          slides.forEach(slide => slide.classList.remove('active'));
          indicators.forEach(indicator => indicator.classList.remove('active'));
          
          slides[newIndex].classList.add('active');
          indicators[newIndex].classList.add('active');
        }, 5000);
      }
    });
  }
  
  // Initialize autoplay for the initially active carousel
  manageAutoplay();
  
  // Update autoplay when room type changes
  const roomTypeTabs = document.querySelectorAll('.room-type-tab');
  roomTypeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Small delay to ensure the DOM has updated
      setTimeout(manageAutoplay, 100);
    });
  });
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate total price based on selected dates and room type
function updateTotalPrice() {
  const checkInDate = document.getElementById('check-in-date');
  const checkOutDate = document.getElementById('check-out-date');
  const summaryNights = document.getElementById('summary-nights');
  const summaryTotal = document.getElementById('summary-total');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  
  if (checkInDate && checkOutDate && checkInDate.value && checkOutDate.value) {
    const startDate = new Date(checkInDate.value);
    const endDate = new Date(checkOutDate.value);
    
    // Calculate number of nights
    const timeDiff = endDate.getTime() - startDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (summaryNights) {
      summaryNights.textContent = nights;
    }
    
    // Get current room price
    const activeTab = document.querySelector('.room-type-tab.active');
    const pricePerNight = activeTab ? parseInt(activeTab.getAttribute('data-price')) : 0;
    
    // Calculate total
    const total = nights * pricePerNight;
    
    if (summaryTotal) {
      summaryTotal.textContent = total;
    }
    
    // Enable/disable add to cart button
    if (addToCartBtn) {
      addToCartBtn.disabled = !(nights > 0);
    }
  } else {
    if (summaryNights) {
      summaryNights.textContent = '0';
    }
    
    if (summaryTotal) {
      summaryTotal.textContent = '0';
    }
    
    if (addToCartBtn) {
      addToCartBtn.disabled = true;
    }
  }
}

// Standardize cart item structure for all types
/* // Comment out this helper if CartManager handles item creation internally
function createCartItem(type, data) {
    // Validate required data
    if (!data.id) {
        throw new Error('Missing product ID');
    }
    switch (type) {
        case 'accommodation':
            if (!data.price_per_night_cents || !data.checkInDate || !data.checkOutDate || !data.nights) {
                console.error('Invalid accommodation data:', data);
                throw new Error('Missing required accommodation data');
            }
            return {
                id: data.id,
                type: 'accommodation',
                name: data.name || data.roomType, // Handle both name formats
                unit_price_cents: data.price_per_night_cents,
                total_cents: data.price_per_night_cents * data.nights,
                quantity: 1, // Accommodation quantity is typically 1 booking
                metadata: {
                    check_in_date: data.checkInDate,
                    check_out_date: data.checkOutDate,
                    nights: data.nights,
                    guests: data.guestCount || 1,
                    room_type: data.name || data.roomType // Store room type in metadata
                }
            };
        case 'activity':
             if (!data.price_cents) {
                 console.error('Invalid activity data:', data);
                 throw new Error('Missing required activity data');
             }
            return {
                id: data.id,
                type: 'activity',
                name: data.name,
                unit_price_cents: data.price_cents,
                total_cents: data.price_cents * (data.quantity || 1), // Calculate total based on quantity
                quantity: data.quantity || 1,
                metadata: {
                    participant_type: data.participantType || 'single'
                }
            };
        case 'sponsorship':
             if (!data.price_cents) {
                 console.error('Invalid sponsorship data:', data);
                 throw new Error('Missing required sponsorship data');
             }
            return {
                id: data.id,
                type: 'sponsorship',
                name: data.name,
                unit_price_cents: data.price_cents,
                total_cents: data.price_cents, // Sponsorship quantity is typically 1
                quantity: 1,
                metadata: {
                    tier: data.tier
                }
            };
        default:
            console.error(`Unknown item type attempted: ${type}`);
            throw new Error(`Unknown item type: ${type}`);
    }
}
*/

// Activity cart functionality
/* // Comment out this function as event listeners are added elsewhere (e.g., register-now.html)
function handleActivitySelection() {
  const activityCards = document.querySelectorAll('.activity-card');

  activityCards.forEach(card => {
    const addButton = card.querySelector('.activity-add-btn');
    const guestSelect = card.querySelector('.guest-select');

    if (addButton) {
      addButton.addEventListener('click', () => {
        const productId = addButton.dataset.productId;
        const productName = addButton.dataset.productName;
        const priceCents = parseInt(addButton.dataset.productPrice, 10);
        const participantType = guestSelect ? guestSelect.value : 'single';
        const quantity = (participantType === 'Both' || participantType === 'both') ? 2 : 1; // Handle case variations

        // Use the potentially commented-out createCartItem or structure directly
        const cartItem = { // Assuming direct structure if createCartItem is removed
          id: productId,
          type: 'activity',
          name: productName,
          unit_price_cents: priceCents,
          total_cents: priceCents * quantity,
          quantity: quantity,
          metadata: { participant_type: participantType }
        };
        // createCartItem('activity', {
        //   id: productId,
        //   name: productName,
        //   price_cents: priceCents,
        //   participantType: participantType,
        //   quantity: quantity
        // });

        // Attempt to use GlobalCartManager - this function shouldn't be doing this directly anymore
        if (typeof GlobalCartManager !== 'undefined' && GlobalCartManager.addItem(cartItem)) {
          showAddedFeedback(addButton); // Assuming showAddedFeedback is a general utility function
        } else {
            console.warn("Attempted to add activity via handleActivitySelection, but GlobalCartManager was not found or addItem failed.");
        }
      });
    }
  });
}
*/

// Cart display update
/* // Comment out this function as CartManager.updateAllDisplays should handle UI updates
function updateCartDisplay() {
    // This function likely reads from localStorage and manipulates the DOM directly,
    // conflicting with CartManager's responsibilities.
    const cart = CartManager.getCart(); // Or maybe JSON.parse(localStorage.getItem('cart'))
    const cartItemsContainer = document.getElementById('cart-items-container'); // Or Webflow selectors
    if (!cartItemsContainer) return;

    // Clear existing content
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
        // updateCartCount(0); // Calls another potentially redundant function
        // updateCartTotal(0); // Calls another potentially redundant function
        // Update Webflow elements directly?
        const cartQuantityElements = document.querySelectorAll('.w-commerce-commercecartopenlinkcount');
        const cartSubtotalValue = document.querySelector('.w-commerce-commercecartordervalue');
        if(cartQuantityElements) cartQuantityElements.forEach(el => el.textContent = '0');
        if(cartSubtotalValue) cartSubtotalValue.textContent = '$0.00'; // Or use formatPrice

        return;
    }

    // Add each item (using createCartItemElement or similar)
    cart.forEach((item, index) => {
        // const itemElement = createCartItemElement(item, index); // Assumes another helper function
        // cartItemsContainer.appendChild(itemElement);
    });

    // Update counts and totals (using other helpers or direct DOM manipulation)
    // updateCartCount(cart.length);
    // updateCartTotal(CartManager.getSubtotalCents()); // Might call CartManager method, but structure is redundant
     const cartQuantityElements = document.querySelectorAll('.w-commerce-commercecartopenlinkcount');
     const cartSubtotalValue = document.querySelector('.w-commerce-commercecartordervalue');
     const subtotalCents = cart.reduce((sum, item) => sum + (item.total_cents || item.price || 0), 0); // Example calculation, might be wrong structure

     if(cartQuantityElements) cartQuantityElements.forEach(el => el.textContent = cart.length.toString()); // Update count
     if(cartSubtotalValue) cartSubtotalValue.textContent = formatPrice(subtotalCents); // Update subtotal (assumes formatPrice exists)

}
*/

// Initialize complete registration button
function initCompleteRegistrationButton() {
  const completeRegButton = document.querySelector('.hero-section.contact-hero.compeltecta .w-commerce-commercecartopenlink');
  const cartPanel = document.querySelector('.w-commerce-commercecartcontainerwrapper');
  
  if (completeRegButton) {
    completeRegButton.addEventListener('click', function(e) {
      e.preventDefault();
      if (cartPanel) {
        cartPanel.style.display = 'flex';
      }
    });
  }
}

// Initialize checkout page functionality
function initCheckoutPage() {
  console.log('%cInitializing checkout page...', 'color: green; font-weight: bold;');
  const cartItemsList = document.getElementById('checkout-items-list');
  const orderSummaryList = document.getElementById('order-summary-list');
  const subtotalAmount = document.getElementById('subtotal-amount');
  const taxAmount = document.getElementById('tax-amount');
  const totalAmount = document.getElementById('total-amount');
  
  console.log('Cart items list element:', cartItemsList);
  console.log('Order summary list element:', orderSummaryList);

  // Get cart data
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  console.log('Cart data:', cart);

  // Clear existing items
  if (cartItemsList) {
    cartItemsList.innerHTML = '';
  }
  
  if (orderSummaryList) {
    orderSummaryList.innerHTML = '';
  }

  // If the cart is empty, show a message and link to the registration page
  if (cart.length === 0) {
    if (cartItemsList) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-cart-message';
      emptyMessage.innerHTML = `
        <p>Your cart is empty.</p>
        <a href="register-now.html" class="btn">Return to Registration</a>
      `;
      cartItemsList.appendChild(emptyMessage);
    }
    
    // Update summary amounts to zero
    if (subtotalAmount) subtotalAmount.textContent = '$0.00';
    if (taxAmount) taxAmount.textContent = '$0.00';
    if (totalAmount) totalAmount.textContent = '$0.00';
    
    // Disable the checkout button
    const checkoutButton = document.querySelector('.w-commerce-commercecheckoutplaceorderbutton');
    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.style.opacity = '0.5';
      checkoutButton.style.cursor = 'not-allowed';
    }
    
    return;
  }

  let subtotal = 0;

  // Display cart items
  cart.forEach((item, index) => {
    let itemPrice = 0;
    let itemImage = '';
    let itemDetails = '';
    
    if (item.type === 'activity') {
      itemPrice = parseFloat(item.price);
      itemImage = item.image || 'images/activity-placeholder.jpg';
      itemDetails = `
        <div class="checkout-item-details">
          <div class="checkout-item-info">
            <h4>${item.title}</h4>
            <p>Price: $${item.price}</p>
          </div>
        </div>
      `;
    } else {
      // Accommodation item
      itemPrice = parseFloat(item.total);
      const roomImages = {
        'Standard Room': 'images/deluxeimg-p-500.webp',
        'Deluxe Room': 'images/goatcreekimg-comp.jpg',
        'Junior Suite': 'images/hotelimg5.jpg',
        'Executive Suite': 'images/reduced-imgbes.jpg'
      };
      itemImage = roomImages[item.roomType] || 'images/deluxeimg-p-500.webpjpg';
      itemDetails = `
        <div class="checkout-item-details">
          <div class="checkout-item-info">
            <h4>${item.roomType}</h4>
            <p>Check-in: ${item.checkInDate}</p>
            <p>Check-out: ${item.checkOutDate}</p>
            <p>Guests: ${item.guestCount}</p>
            <p>Nights: ${item.nights}</p>
            <p>Price per night: $${item.pricePerNight}</p>
            <p>Total: $${item.total}</p>
          </div>
        </div>
      `;
    }
    
    // Add to cart items list if it exists
    if (cartItemsList) {
      const itemElement = document.createElement('div');
      itemElement.className = 'w-commerce-commercecheckoutorderitem checkout-item';
      itemElement.innerHTML = `
        <div class="checkout-item-content">
          <div class="checkout-item-image-wrapper">
            <img src="${itemImage}" alt="${item.type === 'activity' ? item.title : item.roomType}" class="checkout-item-image">
          </div>
          ${itemDetails}
          <button class="checkout-remove-btn" data-index="${index}">Remove</button>
        </div>
      `;
      cartItemsList.appendChild(itemElement);
    }

    // Add to order summary if it exists
    if (orderSummaryList) {
      const summaryItem = document.createElement('div');
      summaryItem.className = 'w-commerce-commercecheckoutsummarylineitem';
      summaryItem.innerHTML = `
        <div class="text-block-4">${item.type === 'activity' ? item.title : item.roomType}</div>
        <div class="text-block-7">$${itemPrice.toFixed(2)}</div>
      `;
      orderSummaryList.appendChild(summaryItem);
    }

    subtotal += itemPrice;
  });

  // Calculate tax and total
  const taxRate = 0.05; // 5% tax rate
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Update summary amounts
  if (subtotalAmount) subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
  if (taxAmount) taxAmount.textContent = `$${tax.toFixed(2)}`;
  if (totalAmount) totalAmount.textContent = `$${total.toFixed(2)}`;

  // Add event listeners to remove buttons in checkout page
  const checkoutRemoveButtons = document.querySelectorAll('.checkout-remove-btn');
  checkoutRemoveButtons.forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      removeCartItemFromCheckout(index);
    });

  });
  
  // Initialize the discount code button
  const applyDiscountBtn = document.getElementById('apply-discount-btn');
  if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener('click', function() {
      handleDiscountCode();
    });
  }
}

// Initialize cart functionality
function initCartFunctionality() {
  const cartButton = document.querySelector('.w-commerce-commercecartopenlink');
  const cartContainer = document.querySelector('.w-commerce-commercecartcontainerwrapper');
  const cartCloseButton = document.querySelector('.w-commerce-commercecartcloselink');
  
  if (cartButton && cartContainer) {
    cartButton.addEventListener('click', function(event) {
      event.preventDefault();
      cartContainer.style.display = 'block';
    });
  }
  
  if (cartCloseButton && cartContainer) {
    cartCloseButton.addEventListener('click', function(event) {
      event.preventDefault();
      cartContainer.style.display = 'none';
    });
  }
}

// Update navigation to show all active pages
function updateNavigation() {
  // Update the "Coming Soon" button to "Register Now"
  const comingSoonBtn = document.querySelector('.btn.outline.w-button');
  if (comingSoonBtn) {
    comingSoonBtn.textContent = 'Register Now';
    comingSoonBtn.href = 'register-now.html';
    comingSoonBtn.classList.remove('outline');
  }
  
  // Make sure all navigation links are visible
  const navLinks = document.querySelectorAll('.nav-link.hide');
  navLinks.forEach(link => {
    link.classList.remove('hide');
  });
}

// Function to check for payment status after redirect
function checkForPaymentStatus() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment_status');
  
  if (paymentStatus === 'success') {
    // Handle successful payment
    const orderId = urlParams.get('order_id') || 'BES-' + Date.now().toString().substring(5);
    
    // Show success message
    showPaymentSuccessMessage(orderId);
    
    // Clear the cart
    localStorage.removeItem('cart');
    
    // Update cart display
    updateCartDisplay();
    
    // Clean the URL parameters
    if (window.history && window.history.replaceState) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  } else if (paymentStatus === 'error') {
    // Handle payment error
    const errorMessage = urlParams.get('error_message') || 'There was an error processing your payment. Please try again.';
    
    // Show error message
    const errorElement = document.querySelector('.w-commerce-commercecheckouterrorstate');
    const errorMessageElement = document.querySelector('.w-checkout-error-msg');
    
    if (errorElement && errorMessageElement) {
      errorMessageElement.textContent = decodeURIComponent(errorMessage);
      errorElement.style.display = 'flex';
    }
    
    // Clean the URL parameters
    if (window.history && window.history.replaceState) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }
}

// Function to show payment success message
function showPaymentSuccessMessage(orderId) {
  const successDiv = document.createElement('div');
  successDiv.className = 'payment-success-message';
  successDiv.innerHTML = `
    <div class="payment-success-content">
      <h2>Thank You for Your Registration!</h2>
      <p>Your payment has been successfully processed.</p>
      <p>You will receive a confirmation email shortly with the details of your registration.</p>
      <p>Order Reference: ${orderId}</p>
      <div class="payment-success-buttons">
        <a href="index.html" class="btn">Return to Home</a>
      </div>
    </div>
  `;
  
  // Replace the checkout form with the success message
  const checkoutForm = document.querySelector('.w-commerce-commercecheckoutformcontainer');
  if (checkoutForm) {
    checkoutForm.innerHTML = '';
    checkoutForm.appendChild(successDiv);
    checkoutForm.style.padding = '40px';
    checkoutForm.style.textAlign = 'center';
  }
}

// Function to handle discount code application
function handleDiscountCode() {
  const discountInput = document.getElementById('wf-ecom-discounts');
  
  if (!discountInput || !discountInput.value) {
    alert('Please enter a discount code.');
    return;
  }
  
  const discountCode = discountInput.value.trim().toUpperCase();
  
  // Define valid discount codes
  const validDiscounts = {
    'EARLY25': 0.25, // 25% off
    'BES2025': 0.15, // 15% off
    'WELCOME10': 0.10, // 10% off
  };
  
  if (validDiscounts[discountCode] !== undefined) {
    // Valid discount code
    applyDiscount(discountCode, validDiscounts[discountCode]);
  } else {
    // Invalid discount code
    const errorElement = document.querySelector('.w-commerce-commercecheckouterrorstate');
    const errorMessageElement = document.querySelector('.w-checkout-error-msg');
    
    if (errorElement && errorMessageElement) {
      errorMessageElement.textContent = 'Invalid discount code. Please try again.';
      errorElement.style.display = 'flex';
    }
  }
}

// Function to apply discount
function applyDiscount(code, discountPercentage) {
  // Get the subtotal and update with discount
  const subtotalAmount = document.getElementById('subtotal-amount');
  const taxAmount = document.getElementById('tax-amount');
  const totalAmount = document.getElementById('total-amount');
  
  if (!subtotalAmount || !taxAmount || !totalAmount) return;
  
  // Get the current subtotal
  const subtotal = parseFloat(subtotalAmount.textContent.replace('$', ''));
  
  // Calculate the discount amount
  const discountAmount = subtotal * discountPercentage;
  const discountedSubtotal = subtotal - discountAmount;
  
  // Calculate tax and total
  const taxRate = 0.05; // 5% tax rate
  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;
  
  // Update the summary with discount
  const orderSummaryList = document.getElementById('order-summary-list');
  
  if (orderSummaryList) {
    // Add the discount line if it doesn't exist
    let discountLine = document.createElement('div');
    discountLine.className = 'w-commerce-commercecheckoutsummarylineitem discount-line';
    orderSummaryList.appendChild(discountLine);
    
    discountLine.innerHTML = `
      <div class="text-block-4">Discount (${code})</div>
      <div class="text-block-7">-$${discountAmount.toFixed(2)}</div>
    `;
  }
  
  // Update the amounts
  subtotalAmount.textContent = `$${discountedSubtotal.toFixed(2)}`;
  taxAmount.textContent = `$${tax.toFixed(2)}`;
  totalAmount.textContent = `$${total.toFixed(2)}`;
  
  // Show success message
  alert(`Discount code ${code} applied successfully!`);
  
  // Disable the discount input and button
  const discountInput = document.getElementById('wf-ecom-discounts');
  const applyButton = document.getElementById('apply-discount-btn');
  
  if (discountInput && applyButton) {
    discountInput.disabled = true;
    applyButton.disabled = true;
    applyButton.textContent = 'Applied';
  }
}

// Function to remove an item from the cart in checkout page
function removeCartItemFromCheckout(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  if (index >= 0 && index < cart.length) {
    // Remove the item from cart
    cart.splice(index, 1);
    // Update localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // If cart is now empty, show empty cart message
    if (cart.length === 0) {
      const cartItemsList = document.getElementById('checkout-items-list');
      const orderSummaryList = document.getElementById('order-summary-list');
      const subtotalAmount = document.getElementById('subtotal-amount');
      const taxAmount = document.getElementById('tax-amount');
      const totalAmount = document.getElementById('total-amount');
      
      if (cartItemsList) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-cart-message';
        emptyMessage.innerHTML = `
          <p>Your cart is now empty.</p>
          <a href="register-now.html" class="btn">Return to Registration</a>
        `;
        
        // Clear the cart items list and add the empty message
        cartItemsList.innerHTML = '';
        cartItemsList.appendChild(emptyMessage);
      }
      
      // Clear the order summary
      if (orderSummaryList) {
        orderSummaryList.innerHTML = '';
      }
      
      // Update summary amounts to zero
      if (subtotalAmount) subtotalAmount.textContent = '$0.00';
      if (taxAmount) taxAmount.textContent = '$0.00';
      if (totalAmount) totalAmount.textContent = '$0.00';
      
      // Disable the checkout button
      const checkoutButton = document.querySelector('.w-commerce-commercecheckoutplaceorderbutton');
      if (checkoutButton) {
        checkoutButton.disabled = true;
        checkoutButton.style.opacity = '0.5';
        checkoutButton.style.cursor = 'not-allowed';
      }
    } else {
      // Refresh the checkout page to reflect changes
      initCheckoutPage();
    }
  }
}

// Checkout JS Bridge Script
console.log('Checkout JS bridge script loaded from js/index.js');

// This script ensures cart data consistency between the main index.js script
// and other JS files loaded on the checkout page

// This ensures cart data is available to all scripts
function ensureCartDataConsistency() {
  // Access cart data from localStorage
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  console.log('Checkout bridge - Cart data retrieved. Number of items:', cart.length);
  
  if (cart.length > 0) {
    console.log('Checkout bridge - Cart contains items:');
    cart.forEach((item, index) => {
      console.log(`Item ${index}:`, item);
    });
  } else {
    console.log('Checkout bridge - Cart is empty');
  }
  
  return cart;
}

// Execute immediately to make cart data available
const checkoutCart = ensureCartDataConsistency();
console.log('Checkout bridge - Cart data made available to other scripts');

// Expose necessary functions to global scope if needed, but defer to main index.js
if (window.initCheckoutPage) {
  console.log('Checkout bridge - initCheckoutPage function already exists, using that');
} else {
  console.log('Checkout bridge - Main initCheckoutPage not found, waiting for it to load');
  // Wait for the main index.js to load
  document.addEventListener('DOMContentLoaded', function() {
    if (window.initCheckoutPage) {
      console.log('Checkout bridge - Main initCheckoutPage now found, calling it');
      window.initCheckoutPage();
    } else {
      console.error('Checkout bridge - Main initCheckoutPage still not found after page load');
    }
  });
}

// Activity handling class
class ActivityManager {
    constructor() {
        this.initializeActivities();
    }

    initializeActivities() {
        const activityCards = document.querySelectorAll('.activity-card');
        activityCards.forEach(card => {
            const addButton = card.querySelector('.activity-add-btn');
            const guestSelect = card.querySelector('.guest-select');
            
            if (addButton) {
                addButton.addEventListener('click', () => this.handleActivityAdd(card, addButton, guestSelect));
            }
        });
    }

    handleActivityAdd(card, button, guestSelect) {
        try {
            const productId = button.dataset.productId;
            const productName = button.dataset.productName;
            const priceCents = parseInt(button.dataset.productPrice, 10);
            const participantType = this.getParticipantType(guestSelect?.value);

            const cartItem = createCartItem('activity', {
                id: productId,
                name: productName,
                price_cents: priceCents,
                participantType: participantType,
                quantity: participantType === 'Both' ? 2 : 1
            });

            if (CartManager.addItem(cartItem)) {
                this.showAddedFeedback(button);
            }
        } catch (error) {
            console.error('Error adding activity:', error);
            showMessage(error.message, 'error');
        }
    }

    getParticipantType(value) {
        switch (value) {
            case 'single': return 'Me';
            case 'spouse': return 'Spouse';
            case 'both': return 'Both';
            default: return 'Me';
        }
    }

    showAddedFeedback(button) {
        const originalText = button.textContent;
        button.textContent = 'Added!';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }
}

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart display
    CartManager.updateAllDisplays();

    // Initialize booking form if on register page
    if (document.getElementById('booking-form')) {
        new BookingForm();
    }

    // Initialize activities if they exist
    if (document.querySelector('.activity-card')) {
        new ActivityManager();
    }

    // Initialize checkout if on checkout page
    if (document.getElementById('checkout-form')) {
        initializeCheckout();
    }
});

// Message system for user feedback
const MessageSystem = {
    show(message, type = 'info') {
        const messageContainer = document.getElementById('message-container') || 
            this.createMessageContainer();

        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);
        setTimeout(() => messageElement.remove(), 3000);
    },

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'message-container';
        container.className = 'message-container';
        document.body.appendChild(container);
        return container;
    }
};

// Add debug buttons during development
if (process.env.NODE_ENV === 'development') {
    document.addEventListener('DOMContentLoaded', () => {
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '10px';
        debugDiv.style.right = '10px';
        debugDiv.style.zIndex = '9999';
        debugDiv.innerHTML = `
            <button onclick="CartManager.debugClearAll()">Clear All</button>
            <button onclick="CartManager.debugInspectCart()">Inspect Cart</button>
        `;
        document.body.appendChild(debugDiv);
    });
}
