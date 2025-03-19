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
      margin-bottom: 24px;
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
  `;
  document.head.appendChild(styleSheet);
  
  // Initialize the booking form
  initBookingForm();
  
  // Initialize the room type selector
  initRoomTypeSelector();
  
  // Initialize the image carousel
  initImageCarousel();
  
  // Enhance date picker functionality
  enhanceDatePickers();
  
  // Add event listener for cart button and close button
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
  
  // Update cart display on page load
  updateCartDisplay();
  
  handleActivitySelection();
  
  // Initialize complete registration button
  initCompleteRegistrationButton();

  // Initialize checkout page functionality
  initCheckoutPage();
});

// Initialize the booking form
function initBookingForm() {
  const checkInDateInput = document.getElementById('check-in-date');
  const checkOutDateInput = document.getElementById('check-out-date');
  const guestCountSelect = document.getElementById('guest-count');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const summaryNights = document.getElementById('summary-nights');
  const summaryTotal = document.getElementById('summary-total');
  
  if (!checkInDateInput || !checkOutDateInput) return;
  
  // Set default dates (if on register page)
  const today = new Date();
  const summitStartDate = new Date('2025-08-23');
  const summitEndDate = new Date('2025-08-28');
  
  // Set min/max dates for the date inputs
  checkInDateInput.min = formatDate(summitStartDate);
  checkInDateInput.max = formatDate(new Date('2025-08-26')); // Allow check-in until 2 days before summit end
  checkOutDateInput.min = formatDate(new Date('2025-08-24')); // At least 1 day stay
  checkOutDateInput.max = formatDate(summitEndDate);
  
  // Update checkout min date when checkin changes
  checkInDateInput.addEventListener('change', function() {
    if (this.value) {
      const nextDay = new Date(this.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOutDateInput.min = formatDate(nextDay);
      
      // If checkout date is now invalid (before new min), update it
      if (checkOutDateInput.value && new Date(checkOutDateInput.value) < nextDay) {
        checkOutDateInput.value = formatDate(nextDay);
      }
      
      updateBookingSummary();
    }
  });
  
  // Update booking summary when checkout date changes
  checkOutDateInput.addEventListener('change', function() {
    updateBookingSummary();
  });
  
  // Update booking summary when guest count changes
  guestCountSelect.addEventListener('change', function() {
    updateBookingSummary();
  });
  
  // Add to cart button functionality
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      const roomType = document.getElementById('summary-room-type').textContent;
      const pricePerNight = document.getElementById('summary-price-per-night').textContent;
      const nights = document.getElementById('summary-nights').textContent;
      const total = document.getElementById('summary-total').textContent;
      const checkInDate = checkInDateInput.value;
      const checkOutDate = checkOutDateInput.value;
      const guestCount = guestCountSelect.value;
      
      // Create a booking object
      const booking = {
        roomType,
        pricePerNight,
        nights,
        total,
        checkInDate,
        checkOutDate,
        guestCount
      };
      
      // Store booking in local storage
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart.push(booking);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Update cart display
      updateCartDisplay();
      
      // Change button text and style
      const originalText = this.textContent;
      this.textContent = 'Added to Cart';
      this.classList.add('added');
      
      // Disable the button temporarily
      this.disabled = true;
      
      // Reset button after 3 seconds
      setTimeout(() => {
        this.textContent = originalText;
        this.classList.remove('added');
        this.disabled = false;
      }, 3000);
    });
  }
  
  // Helper function to update booking summary
  function updateBookingSummary() {
    const checkInDate = new Date(checkInDateInput.value);
    const checkOutDate = new Date(checkOutDateInput.value);
    
    if (checkInDateInput.value && checkOutDateInput.value) {
      // Calculate number of nights
      const timeDiff = checkOutDate - checkInDate;
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Update summary
      summaryNights.textContent = nights;
      
      // Calculate total
      const pricePerNight = parseInt(document.getElementById('summary-price-per-night').textContent);
      const total = nights * pricePerNight;
      summaryTotal.textContent = total;
      
      // Enable/disable add to cart button
      addToCartBtn.disabled = nights <= 0;
    } else {
      // Reset summary if dates are not selected
      summaryNights.textContent = '0';
      summaryTotal.textContent = '0';
      addToCartBtn.disabled = true;
    }
  }
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
    
    // Make the wrapper clickable to open the date picker (excluding the button which has its own handler)
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

// Function to update cart display
function updateCartDisplay() {
  const cartItemsContainer = document.querySelector('.w-commerce-commercecartlist');
  const cartEmptyState = document.querySelector('.w-commerce-commercecartemptystate');
  const cartForm = document.querySelector('.w-commerce-commercecartformwrapper form');
  const cartQuantityElements = document.querySelectorAll('.w-commerce-commercecartopenlinkcount');
  const cartSubtotalValue = document.querySelector('.w-commerce-commercecartordervalue');
  
  // Get cart data from localStorage
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Clear existing items
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = '';
  }
  
  if (cart.length === 0) {
    if (cartEmptyState) cartEmptyState.style.display = 'flex';
    if (cartForm) cartForm.style.display = 'none';
    if (cartQuantityElements) {
      cartQuantityElements.forEach(el => el.textContent = '0');
    }
    return;
  }
  
  // Hide empty state and show form
  if (cartEmptyState) cartEmptyState.style.display = 'none';
  if (cartForm) cartForm.style.display = 'flex';
  
  // Update cart count
  if (cartQuantityElements) {
    cartQuantityElements.forEach(el => el.textContent = cart.length.toString());
  }
  
  // Calculate subtotal
  let subtotal = 0;
  
  // Display each item
  cart.forEach((item, index) => {
    const listItem = document.createElement('div');
    listItem.className = 'w-commerce-commercecartitem cart-item';
    
    let imageUrl;
    let itemDetails = '';
    let itemPrice = 0;
    
    if (item.type === 'activity') {
      imageUrl = item.image;
      itemPrice = parseFloat(item.price);
      itemDetails = `
        <div class="cart-item-info">${item.title}</div>
        <div class="cart-item-price">$${item.price}</div>
      `;
    } else {
      // Accommodation item
      const roomImages = {
        'Standard Room': 'images/Layer-6.jpg',
        'Deluxe Room': 'images/goatcreekimg-comp.jpg',
        'Junior Suite': 'images/hotelimg5.jpg',
        'Executive Suite': 'images/reduced-imgbes.jpg'
      };
      imageUrl = roomImages[item.roomType] || 'images/Layer-6.jpg';
      itemPrice = parseFloat(item.total);
      itemDetails = `
        <div class="cart-item-info">Check-in: ${item.checkInDate}</div>
        <div class="cart-item-info">Check-out: ${item.checkOutDate}</div>
        <div class="cart-item-info">Guests: ${item.guestCount}</div>
        <div class="cart-item-info">Nights: ${item.nights}</div>
        <div class="cart-item-price">$${item.pricePerNight} per night</div>
        <div class="cart-item-total">Total: $${item.total}</div>
      `;
    }
    
    // Add to subtotal
    subtotal += itemPrice;
    
    listItem.innerHTML = `
      <div class="cart-item-content">
        <div class="cart-item-image-wrapper">
          <img src="${imageUrl}" alt="${item.type === 'activity' ? item.title : item.roomType}" class="cart-item-image">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.type === 'activity' ? item.title : item.roomType}</div>
          ${itemDetails}
          <button class="remove-item-btn" data-index="${index}">Remove</button>
        </div>
      </div>
    `;
    
    if (cartItemsContainer) {
      cartItemsContainer.appendChild(listItem);
    }
  });
  
  // Update subtotal display
  if (cartSubtotalValue) {
    cartSubtotalValue.textContent = `$${subtotal.toFixed(2)}`;
  }
  
  // Add event listeners to remove buttons
  const removeButtons = document.querySelectorAll('.remove-item-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      removeCartItem(index);
    });
  });
}

// Function to remove an item from the cart
function removeCartItem(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  }
}

// Activity cart functionality
function handleActivitySelection() {
  const activityCards = document.querySelectorAll('.activity-card');
  
  activityCards.forEach(card => {
    const addButton = card.querySelector('.activity-add-btn');
    const variantSelect = card.querySelector('.variant-select');
    const guestSelect = card.querySelector('.guest-select');
    const title = card.querySelector('.activity-title').textContent;
    const basePrice = parseFloat(card.getAttribute('data-price'));
    
    // Update variant description when variant changes
    if (variantSelect) {
      variantSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const variantDescription = card.querySelector('.variant-description');
        if (variantDescription && selectedOption.dataset.description) {
          variantDescription.textContent = selectedOption.dataset.description;
        }
      });
    }
    
    addButton.addEventListener('click', () => {
      const selectedOption = guestSelect.value;
      let finalPrice = basePrice;
      let itemTitle = title;
      
      // Add variant to title if selected
      if (variantSelect && variantSelect.value) {
        const selectedVariant = variantSelect.options[variantSelect.selectedIndex].text;
        itemTitle += ` - ${selectedVariant}`;
      }
      
      if (selectedOption === 'both') {
        finalPrice *= 2;
        itemTitle += ' (For Both)';
      } else if (selectedOption === 'spouse') {
        itemTitle += ' (For Spouse)';
      } else {
        itemTitle += ' (For Me)';
      }
      
      const cartItem = {
        type: 'activity',
        title: itemTitle,
        price: finalPrice,
        image: card.querySelector('.activity-image img').src,
        variant: variantSelect ? variantSelect.value : null
      };
      
      // Add to cart array
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Update cart display
      updateCartDisplay();
      
      // Visual feedback
      addButton.textContent = 'Added!';
      addButton.classList.add('added');
      
      setTimeout(() => {
        addButton.textContent = 'Add to Cart';
        addButton.classList.remove('added');
      }, 2000);
    });
  });
}

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
  // Check if we're on the checkout page by looking for checkout-specific elements
  const isCheckoutPage = window.location.pathname.includes('checkout.html');
  
  if (!isCheckoutPage) return; // Not on checkout page
  
  const cartItemsList = document.getElementById('cart-items-list');
  const orderSummaryList = document.getElementById('order-summary-list');
  const subtotalAmount = document.getElementById('subtotal-amount');
  const taxAmount = document.getElementById('tax-amount');
  const totalAmount = document.getElementById('total-amount');

  // Get cart data
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Clear existing items
  if (cartItemsList) {
    cartItemsList.innerHTML = '';
  }
  
  if (orderSummaryList) {
    orderSummaryList.innerHTML = '';
  }

  let subtotal = 0;

  // Display cart items
  cart.forEach((item, index) => {
    let itemPrice = 0;
    
    if (item.type === 'activity') {
      itemPrice = parseFloat(item.price);
    } else {
      // Accommodation item
      itemPrice = parseFloat(item.total);
    }
    
    // Add to cart items list if it exists
    if (cartItemsList) {
      // Create cart item element
      const itemElement = document.createElement('div');
      itemElement.className = 'checkout-item';
      
      let itemDetails = '';
      
      if (item.type === 'activity') {
        itemDetails = `
          <div class="checkout-item-details">
            <img src="${item.image}" alt="${item.title}" class="checkout-item-image">
            <div class="checkout-item-info">
              <h4>${item.title}</h4>
              <p>Price: $${item.price}</p>
            </div>
          </div>
        `;
      } else {
        // Accommodation item
        itemDetails = `
          <div class="checkout-item-details">
            <img src="${item.image || 'images/Layer-6.jpg'}" alt="${item.roomType}" class="checkout-item-image">
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

      itemElement.innerHTML = itemDetails;
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

  // Add styles for checkout items
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .checkout-item {
      padding: 20px;
      border-bottom: 1px solid #e6e6e6;
    }

    .checkout-item:last-child {
      border-bottom: none;
    }

    .checkout-item-details {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .checkout-item-image {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
    }

    .checkout-item-info {
      flex: 1;
    }

    .checkout-item-info h4 {
      margin: 0 0 10px;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .checkout-item-info p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }

    .w-commerce-commercecartapplepaybutton,
    .w-commerce-commercecartquickcheckoutbutton {
      display: none !important;
    }
    
    /* Ensure the checkout form is properly displayed */
    .w-commerce-commercecheckoutformcontainer {
      display: block;
      width: 100%;
    }
    
    .w-commerce-commercelayoutcontainer {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: wrap;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .w-commerce-commercelayoutmain {
      display: block !important;
      width: 60% !important;
      padding-right: 20px;
      float: left;
    }
    
    .w-commerce-commercelayoutsidebar {
      display: block !important;
      width: 40% !important;
      float: left;
    }
    
    .w-commerce-commercecheckoutorderitemswrapper,
    .w-commerce-commercecheckoutblockheader,
    .w-commerce-commercecheckoutblockcontent,
    .w-commerce-commercecheckoutcustomerinfowrapper,
    .w-commerce-commercecheckoutshippingaddresswrapper,
    .w-commerce-commercecheckoutpaymentinfowrapper {
      display: block !important;
      width: 100% !important;
    }
    
    .w-commerce-commercecheckoutordersummarywrapper {
      display: block !important;
    }
    
    .cart-items-list {
      display: block !important;
    }
    
    .customer-info-section {
      margin-bottom: 20px;
    }
    
    .section-subheading {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .w-commerce-commercecheckoutplaceorderbutton {
      margin-top: 20px;
    }
  `;
  document.head.appendChild(styleSheet);
} 