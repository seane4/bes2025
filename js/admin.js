// Ensure Supabase variables are loaded from env-config.js
if (!window.ENV || !window.ENV.SUPABASE || !window.ENV.SUPABASE.URL || !window.ENV.SUPABASE.ANON_KEY) {
    console.error('Supabase URL or Anon Key is missing. Check env-config.js');
    alert('Configuration error. Cannot initialize admin functions.');
    return;
}

// Initialize Supabase client using the global 'supabase' object via window
const supabase = supabaseClient.createClient(window.ENV.SUPABASE.URL, window.ENV.SUPABASE.ANON_KEY);

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminContentSection = document.getElementById('admin-content-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const ordersTbody = document.getElementById('orders-tbody');
const customersTbody = document.getElementById('customers-tbody');
const loadingOrdersMessage = document.getElementById('loading-orders-message');
const loadingCustomersMessage = document.getElementById('loading-customers-message');
const ordersError = document.getElementById('orders-error');
const customersError = document.getElementById('customers-error');
const logoutButton = document.getElementById('logout-button');

// --- Authentication ---

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginError.classList.add('hidden');
    loginError.textContent = '';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            throw error;
        }

        // Login successful
        console.log('Admin login successful:', data.user);
        showAdminSections();
        fetchOrders();
        fetchCustomers();

    } catch (error) {
        console.error('Login failed:', error);
        loginError.textContent = `Login failed: ${error.message}`;
        loginError.classList.remove('hidden');
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log('Admin logged out');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
        alert(`Logout failed: ${error.message}`);
    }
}

// --- Data Fetching & Display ---

async function fetchOrders() {
    loadingOrdersMessage.classList.remove('hidden');
    ordersError.classList.add('hidden');
    ordersTbody.innerHTML = '';

    try {
        // Fetch orders and join with customers table to get email
        const { data: orders, error } = await supabase
            .from('orders') // Your orders table name
            .select(`
                id,
                created_at,
                total,
                status,
                customer_id,
                customers ( email )
            `) // Your customers table name and email column
            .order('created_at', { ascending: false });

        if (error) {
            if (error.message.includes('security barrier') || error.message.includes('policy')) {
                 throw new Error("Permission denied on 'orders'. Check Row Level Security policies.");
            }
            throw error;
        }

        console.log('Fetched orders:', orders);
        loadingOrdersMessage.classList.add('hidden');

        if (!orders || orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="5" class="center-align">No orders found.</td></tr>';
            return;
        }

        // Populate the table
        orders.forEach(order => {
            const row = ordersTbody.insertRow();
            row.insertCell().textContent = order.id;
            row.insertCell().textContent = new Date(order.created_at).toLocaleString();
            row.insertCell().textContent = order.customers ? order.customers.email : 'N/A';
            row.insertCell().textContent = order.total ? `$${order.total.toFixed(2)}` : 'N/A';
            row.insertCell().textContent = order.status || 'N/A';
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        loadingOrdersMessage.classList.add('hidden');
        ordersError.textContent = `Error loading orders: ${error.message}`;
        ordersError.classList.remove('hidden');
    }
}

async function fetchCustomers() {
    loadingCustomersMessage.classList.remove('hidden');
    customersError.classList.add('hidden');
    customersTbody.innerHTML = '';

    try {
        // Fetch customers
        // Adjust select based on your 'customers' table columns
        const { data: customers, error } = await supabase
            .from('customers') // Your customers table name
            .select(`
                id,
                name,
                email,
                phone,
                created_at
            `)
            .order('created_at', { ascending: false }); // Show newest first

        if (error) {
            if (error.message.includes('security barrier') || error.message.includes('policy')) {
                 throw new Error("Permission denied on 'customers'. Check Row Level Security policies.");
            }
            throw error;
        }

        console.log('Fetched customers:', customers);
        loadingCustomersMessage.classList.add('hidden');

        if (!customers || customers.length === 0) {
            customersTbody.innerHTML = '<tr><td colspan="5" class="center-align">No customers found.</td></tr>';
            return;
        }

        // Populate the customer table
        customers.forEach(customer => {
            const row = customersTbody.insertRow();
            row.insertCell().textContent = customer.id;
            row.insertCell().textContent = customer.name || 'N/A';
            row.insertCell().textContent = customer.email || 'N/A';
            row.insertCell().textContent = customer.phone || 'N/A';
            row.insertCell().textContent = new Date(customer.created_at).toLocaleDateString(); // Just date for joined
        });

    } catch (error) {
        console.error('Error fetching customers:', error);
        loadingCustomersMessage.classList.add('hidden');
        customersError.textContent = `Error loading customers: ${error.message}`;
        customersError.classList.remove('hidden');
    }
}

// --- UI Control ---

function showLoginSection() {
    loginSection.classList.remove('hidden');
    adminContentSection.classList.add('hidden');
}

function showAdminSections() {
    loginSection.classList.add('hidden');
    adminContentSection.classList.remove('hidden');
}

// --- Initialization ---

async function initializeAdminPage() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        console.log('Admin already logged in:', session.user);
        showAdminSections();
        fetchOrders();
        fetchCustomers();
    } else {
        console.log('Admin not logged in.');
        showLoginSection();
    }

    // Add event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
}

// Run initialization when the script loads
initializeAdminPage(); 