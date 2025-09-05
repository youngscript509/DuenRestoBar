
const productSearch = document.getElementById('productSearch');
const searchResults = document.getElementById('searchResults');
const invoiceList = document.getElementById('invoiceList');
const totalAmountSpan = document.getElementById('totalAmount');
const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');

let selectedProducts = [];

// 🔍 Recherche
productSearch.addEventListener('input', async (e) => {
  const query = e.target.value.trim().toLowerCase();
  searchResults.innerHTML = '';

  if (query.length === 0) return;

  const snapshot = await db.collection('DrinkStock')
    .where('name', '>=', query)
    .where('name', '<=', query + '\uf8ff')
    .limit(10)
    .get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement('li');
    li.textContent = `${data.name}`;
    li.addEventListener('click', () => showCurrencyChoice(data));
    searchResults.appendChild(li);
  });
});

// 🪙 Choisir la devise
function showCurrencyChoice(product) {
  const choice = confirm(`Ajouter "${product.name}" en GDES ?\nCliquez sur "Annuler" pour l'ajouter en USD.`);
  const currency = choice ? 'HTG' : 'USD';
  const price = currency === 'HTG' ? product.priceGdes : product.priceUs;

  addProductToInvoice({ name: product.name, currency, price });
  productSearch.value = '';
  searchResults.innerHTML = '';
}

// ➕ Ajouter à la facture
function addProductToInvoice(product) {
  const existing = selectedProducts.find(p => p.name === product.name && p.currency === product.currency);

  if (existing) {
    existing.quantity += 1;
  } else {
    selectedProducts.push({ ...product, quantity: 1 });
  }

  renderInvoice();
  updateTotal();
}

// 🧾 Affichage
function renderInvoice() {
  invoiceList.innerHTML = '';
  selectedProducts.forEach((product) => {
    const div = document.createElement('div');
    div.classList.add('invoice-item');

    div.innerHTML = `
      <span>${product.name} (${product.currency}) x ${product.quantity}</span>
      <span>${(product.price * product.quantity).toFixed(2)} ${product.currency}</span>
    `;

    invoiceList.appendChild(div);
  });
}

// 💰 Total en GDES
function updateTotal() {
  const total = selectedProducts.reduce((sum, product) => {
    if (product.currency === 'HTG') return sum + (product.price * product.quantity);
    else return sum + (product.price * product.quantity * 100); // conversion USD -> HTG approx.
  }, 0);

  totalAmountSpan.textContent = total.toFixed(2);
}

// 💾 Enregistrement
saveInvoiceBtn.addEventListener('click', async () => {
  const user = firebase.auth().currentUser;
  if (!user) return alert("Utilisateur non connecté.");

  if (selectedProducts.length === 0) return alert("Veuillez ajouter des produits.");

  const invoice = {
    sellerName: document.getElementById('sellerName').textContent,
    products: selectedProducts,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString(),
    totalGdes: selectedProducts.reduce((sum, p) => {
      return sum + (p.currency === 'HTG' ? p.price * p.quantity : p.price * p.quantity * 100);
    }, 0),
    totalUs: selectedProducts.reduce((sum, p) => {
      return sum + (p.currency === 'USD' ? p.price * p.quantity : 0);
    }, 0),
    paymentStatut: 'UNPAID',
    paymentmeth: 'CASH' // ou MOBILE si tu veux ajouter un champ plus tard
  };

  try {
    await db.collection('globalSales').add(invoice);
    alert("Facture enregistrée !");
    selectedProducts = [];
    renderInvoice();
    updateTotal();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    alert("Échec de l'enregistrement de la facture.");
  }
});
