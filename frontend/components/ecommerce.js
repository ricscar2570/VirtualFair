// Funzione per aggiungere un prodotto al carrello
export function addToCart(productId, productName, price) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const product = { productId, productName, price, quantity: 1 };

    // Controlla se il prodotto è già nel carrello
    const existingProduct = cart.find(item => item.productId === productId);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push(product);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    console.log(`Added ${productName} to the cart.`);
}

// Funzione per rimuovere un prodotto dal carrello
export function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.productId !== productId);

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    console.log(`Removed product ID ${productId} from the cart.`);
}

// Funzione per aggiornare la UI del carrello
export function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    cartList.innerHTML = '';

    let total = 0;
    cart.forEach(({ productId, productName, price, quantity }) => {
        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <p>${productName} x ${quantity} - $${(price * quantity).toFixed(2)}</p>
            <button class="remove-btn" onclick="removeFromCart('${productId}')">Remove</button>
        `;
        cartList.appendChild(item);
        total += price * quantity;
    });

    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

// Funzione per processare il pagamento
export async function processPayment() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Calcola il totale
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Simula una sorgente di pagamento (es. Stripe token)
    const paymentSource = 'test-source-id'; // Sostituisci con il token reale

    // Effettua una richiesta al backend per processare il pagamento
    const response = await fetch('<API Gateway URL>/process-ecommerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: Math.round(totalAmount * 100), // Importo in centesimi
            currency: 'usd',
            source: paymentSource
        })
    });

    if (response.ok) {
        const result = await response.json();
        console.log('Payment successful:', result);
        alert('Payment processed successfully!');
        localStorage.removeItem('cart'); // Svuota il carrello
        updateCartUI();
    } else {
        console.error('Payment failed:', response.statusText);
        alert('Payment failed. Please try again.');
    }
}

// Aggiorna il carrello al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});
