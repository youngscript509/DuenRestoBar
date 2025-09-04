
        // Get current date
        const today = new Date();

        // Format date to 'YYYY-MM-DD' (required by HTML date input)
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // Set the value of the input field to the current date
        document.getElementById('filterDate').value = formattedDate;
  
         // Set the value of the input field to the current date
        document.getElementById('invoiceDate').value = formattedDate;
  

  

        // Format time to 'HH:MM' (required by HTML time input)
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;

        // Set the value of the input field to the current time
        document.getElementById('invoiceTime').value = formattedTime;


    document.getElementById('createNewInvoice').addEventListener('click', async function (event) {
        event.preventDefault();
    
        const factureId = document.getElementById('invoiceId').value.trim();
        const customerName = document.getElementById('clientName').value;
        const sellerName = document.getElementById('sellerName').textContent.trim();
        const serverName = document.getElementById('waiterName').value;
        const date = document.querySelector('#invoiceDate').value;
        const time = document.querySelector('#invoiceTime').value;
       
    
        const products = [];
    
    
    
        try {
            const docRef = db.collection("salesTest").doc(factureId);
            const doc = await docRef.get();
    
            if (doc.exists) {
                // Facture existante, on annule la creation
                alert("Cette facture existe déjà. Vous pouvez la modifier dans la liste des factures.");
                displaySales();
            } else {
                // Nouvelle facture
                products.forEach(p => updateStock(p.item, 0, p.quantity));
    
                await docRef.set({
                    factureId,
                    customerName,
                    sellerName,
                    serverName,
                    date,
                    time,
                    products,
                });
                displaySales();
                 
            }
    
           resetInputNewInvoice();
    
        } catch (error) {
            console.error("Erreur lors du traitement de la facture :", error);
        }
    });
    
   
  

 function resetInputNewInvoice() {
 

       document.getElementById('clientName').value = "";
        document.getElementById('waiterName').value = "";
       document.getElementById('sellerName').textContent = "";
        newInvoiceModal.classList.add('hidden');
    
      
}

      // Fonction pour récupérer l'utilisateur connecté
        function getCurrentUser() {
            const user = firebase.auth().currentUser;
            if (user) {
                return db.collection('users').doc(user.uid).get()
                    .then(function(doc) {
                        if (doc.exists) {
                            return doc.data().name;
                        } else {
                            throw new Error("No such document!");
                        }
                    })
                    .catch(function(error) {
                        console.error("Error getting document: ", error);
                    });
            } else {
                return Promise.reject(new Error("No user is currently logged in."));
            }
        }


        // Fonction pour afficher les ventes
        function displaySales() {
            const userList = document.getElementById('invoices');
            userList.innerHTML = ''; // Réinitialiser la liste des utilisateurs
            const selectedDate = document.getElementById('filterDate').value;

            if (!selectedDate) {
                alert('Veuillez sélectionner une date.');
                return;
            }


            // Récupérer l'utilisateur connecté
            getCurrentUser().then(function(currentUserName) {
                // Récupérer la collection de ventes pour la date sélectionnée et le vendeur connecté
                db.collection('salesTest')
                    .where("date", "==", selectedDate)
                    .where("sellerName", "==", currentUserName) // Filtrer par vendeur connecté
                    .get()
                    .then(function(querySnapshot) {
                        querySnapshot.forEach(function(doc) {
                            const data = doc.data();
                            const factureItem = document.createElement('div');
                                factureItem.classList.add('facture-item');
                            // Créer des éléments span pour chaque donnée
                            const customerNameSpan = document.createElement('span');
                            customerNameSpan.textContent = data.customerName;

                            const totalGdesSpan = document.createElement('span');
                            totalGdesSpan.textContent = `${data.totalGdes ?? 0} Gdes`;

                            const totalUsSpan = document.createElement('span');
                            totalUsSpan.textContent = `${data.totalUs ?? 0} Us`;


                            const timeSpan = document.createElement('span');
                            timeSpan.textContent = data.time;

                            const seller = document.createElement('span');
                            seller.textContent = data.sellerName;

                            // Créer le bouton d'édition
                            const editBtn = document.createElement('button');
                            editBtn.textContent = '✏️';
                            editBtn.setAttribute('data-id', doc.id);
                            editBtn.classList.add('edit-facture');

                             // Créer le bouton de sortie
                            const outBtn = document.createElement('button');
                            outBtn.textContent = '🧾';
                            outBtn.setAttribute('data-id', doc.id);
                            outBtn.classList.add('fun-button');
                            outBtn.addEventListener('click', () => {
                               modal.classList.remove('hidden');
                              });

                            // Ajouter tous les éléments à la balise li
                            factureItem.appendChild(customerNameSpan);
                            factureItem.appendChild(document.createTextNode(' - ')); // Ajouter un espace
                            factureItem.appendChild(totalGdesSpan);
                            factureItem.appendChild(document.createTextNode(' - ')); // Ajouter un espace
                            factureItem.appendChild(totalUsSpan);
                            factureItem.appendChild(document.createTextNode(' - ')); // Ajouter un espace
                            factureItem.appendChild(timeSpan);
                            factureItem.appendChild(document.createTextNode(' - ')); // Ajouter un espace
                            factureItem.appendChild(seller);
                            factureItem.appendChild(document.createTextNode(' ')); // Ajouter un espace
                            factureItem.appendChild(editBtn);
                            factureItem.appendChild(outBtn);

                            // Ajouter la balise li à la liste
                            userList.appendChild(factureItem);
                        });
                    }).catch(function(error) {
                        console.error("Error getting documents: ", error);
                    });
            }).catch(function(error) {
                console.error('Error getting current user: ', error);
                alert('Veuillez vous connecter pour afficher les ventes.');
            });
        }

        // Attendre que Firebase Auth soit prêt avant d'ajouter l'écouteur d'événement
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                document.getElementById("filterDate").addEventListener("change", displaySales);
                displaySales(); // Afficher les ventes dès que l'utilisateur est connecté
            } else {
                alert('Veuillez vous connecter pour afficher les ventes.');
            }
        });


        // Charger les données de la facture sélectionnée dans le formulaire pour édition
        const userList = document.getElementById('invoices');
        userList.addEventListener('click', function(event) {
            if (event.target.classList.contains('edit-facture')) {
                const docId = event.target.dataset.id;
                db.collection("salesTest").doc(docId).get().then(function(doc) {
                    if (doc.exists) {
                        const data = doc.data();
                        document.getElementById('searchInputCustomer').value = data.factureId;
                        document.getElementById('customerNameDisplay').textContent = data.customerName;
                        document.getElementById('dateDisplay').textContent = data.date;
                        document.getElementById('timeDisplay').textContent = data.time;
                        document.getElementById('serverDisplay').textContent = data.serverName;
                         document.getElementById('sellerDisplay').textContent = data.sellerName;
                         document.getElementById('totalGdesDisplay').textContent = `${data.totalGdes ?? 0} HT`;
                        document.getElementById('totalUsDisplay').textContent = `${data.totalUs ?? 0} $`;
             
                        // Code pour remplir les données dans le tableau de l'édition
                        const invoiceTable = document.getElementById('productToDisplay');
                        
                        invoiceTable.innerHTML = '';

  data.products.forEach(product => {
   const html = `
    <div class="product-item">
      <span>${product.item}</span>
      <span>Qté: <span class="qty">${product.quantity}</span></span>
      <span>Prix: <span class="price">${product.currency === 'Gdes' ? product.priceGdes : product.priceUs}</span> ${product.currency}</span>
      <div class="product-controls">
         
              
      </div>
    </div>
  `;
  invoiceTable.insertAdjacentHTML('beforeend', html);
});
                    } else {
                        console.log("No such document!");
                    }
                }).catch(function(error) {
                    console.error("Error getting document:", error);
                });
            }
        });

        // Fonction utilitaire pour créer un input avec une valeur par défaut
        function createInput(type, value) {
            const input = document.createElement('input');
            input.type = type;
            input.value = value;
            return input;
        }

        // Fonction utilitaire pour créer une cellule de tableau avec un élément enfant
        function createTableCell(child) {
            const cell = document.createElement('td');
            cell.appendChild(child);
            return cell;
        }
// Fonction pour ajouter un produit à la facture
document.getElementById('addProductBtn').addEventListener('click', async () => {
  const factureId = document.getElementById('searchInputCustomer').value.trim();
  const productName = document.getElementById('searchInput').value.trim();
  const quantity = parseInt(document.getElementById('productQuantity').value);
  const category = document.getElementById('categoryDisplay').textContent.trim();
  // Récupérer le prix affiché et le convertir en nombre
  const price = parseFloat(document.getElementById('productPriceDisplay').value.trim()) || 0;

  // Détermination de la devise sélectionnée (index 0 → Gdes, sinon → Us)
  const select = document.getElementById('productPriceDisplay');
  const selectedIndex = select.selectedIndex;
  const currency = selectedIndex === 0 ? 'Gdes' : 'Us';

  if (!factureId || !productName || isNaN(quantity) || quantity <= 0) {
    alert('Veuillez remplir tous les champs correctement.');
    return;
  }

  try {
    // Étape 1 : Chercher la facture
    const factureQuery = await db.collection('salesTest')
      .where('factureId', '==', factureId)
      .limit(1)
      .get();

    if (factureQuery.empty) {
      alert('Facture non trouvée.');
      return;
    }

    const factureDoc = factureQuery.docs[0];
    const factureRef = factureDoc.ref;
    let factureData = factureDoc.data();
    const products = factureData.products || [];

    // Étape 2 : Chercher le produit dans DrinkStock
    const stockQuery = await db.collection('DrinkStock')
      .where('name', '==', productName)
      .limit(1)
      .get();

    if (stockQuery.empty) {
      alert('Produit non trouvé dans DrinkStock.');
      return;
    }

    const stockDoc = stockQuery.docs[0];
    const stockRef = stockDoc.ref;
    const stockData = stockDoc.data();

    const priceGdes = parseFloat(stockData.priceGdes) || 0;
    const priceUs = parseFloat(stockData.priceUs) || 0;
    const stockQuantity = parseInt(stockData.quantity) || 0;

    if (stockQuantity < quantity) {
      alert("Stock insuffisant.");
      return;
    }

    // Étape 3 : Mettre à jour le stock
    await stockRef.update({
      quantity: stockQuantity - quantity
    });

    // Étape 4 : Ajouter ou mettre à jour le produit dans la facture
    let found = false;

    for (let p of products) {
      if (p.item.toLowerCase() === productName && p.currency === currency) {
        p.quantity += quantity;
        found = true;
        break;
      }
    }

    if (!found) {
      products.push({
        item: productName,
        category: category,
        currency: currency,
        priceGdes: priceGdes,
        priceUs: priceUs,
        quantity: quantity,
        price: price
      });
    }

// Étape 5 : Recalculer les totaux en fonction de la devise de chaque produit
let totalGdes = 0;
let totalUs = 0;

for (let p of products) {
  if (p.currency === 'Gdes') {
    totalGdes += p.quantity * (parseFloat(p.priceGdes) || 0);
  } else if (p.currency === 'Us') {
    totalUs += p.quantity * (parseFloat(p.priceUs) || 0);
  }
}


    // Étape 6 : Mise à jour de la facture
    await factureRef.update({
      products: products,
      totalGdes: totalGdes,
      totalUs: totalUs
    });

    displaySales(); // Rafraîchir l'affichage des ventes
    quantity.value = 1; // Réinitialiser la quantité
    document.getElementById('searchInput').value = ""; // Réinitialiser le nom du produit
    document.getElementById('categoryDisplay').textContent = "";
    document.getElementById('productPriceDisplay').selectedIndex = 0;
  } catch (err) {
    console.error("Erreur :", err);
    alert("Une erreur s’est produite.");
  }
});


document.getElementById('updateProduct').addEventListener('click', async () => {
  const factureId = document.getElementById('searchInputCustomer').value.trim();
  if (!factureId) {
    alert("Veuillez entrer un ID de facture valide.");
    return;
  }

  const productItems = document.querySelectorAll('.product-item');

  try {
    // 1. Récupérer la facture complète
    const factureQuery = await db.collection('salesTest')
      .where('factureId', '==', factureId)
      .limit(1)
      .get();

    if (factureQuery.empty) {
      alert("Facture non trouvée.");
      return;
    }

    const factureDoc = factureQuery.docs[0];
    const factureRef = factureDoc.ref;
    const factureData = factureDoc.data();
    const products = factureData.products || [];

    // 2. Mettre à jour les produits affichés
    for (const itemEl of productItems) {
      const itemName = itemEl.querySelector('span').textContent.trim();
      const newQty = parseInt(itemEl.querySelector('.qty').textContent.trim());

      const product = products.find(p => p.item.toLowerCase() === itemName);
      if (!product) continue;

      const oldQty = parseInt(product.quantity);
      const deltaQty = newQty - oldQty;

      if (deltaQty !== 0) {
        // Récupérer la référence dans DrinkStock
        const stockQuery = await db.collection('DrinkStock')
          .where('name', '==', product.item)
          .limit(1)
          .get();

        if (stockQuery.empty) {
          alert(`Produit '${product.item}' introuvable dans le stock.`);
          return;
        }

        const stockDoc = stockQuery.docs[0];
        const stockRef = stockDoc.ref;
        const stockData = stockDoc.data();
        const stockQty = parseInt(stockData.quantity || 0);

        if (deltaQty > 0) {
          if (stockQty < deltaQty) {
            alert(`Stock insuffisant pour '${product.item}'.`);
            return;
          }
          await stockRef.update({ quantity: stockQty - deltaQty });
        } else {
          await stockRef.update({ quantity: stockQty + Math.abs(deltaQty) });
        }

        // Mettre à jour la quantité dans le tableau local
        product.quantity = newQty;
      }
    }

    // 3. Recalculer les totaux sur tous les produits existants
    let totalGdes = 0;
    let totalUs = 0;

    for (let p of products) {
      if (p.currency === 'Gdes') {
        totalGdes += p.quantity * parseFloat(p.priceGdes || 0);
      } else if (p.currency === 'Us') {
        totalUs += p.quantity * parseFloat(p.priceUs || 0);
      }
    }

    // 4. Mettre à jour la facture
    await factureRef.update({
      products: products,
      totalGdes,
      totalUs
    });

    displaySales(); // Rafraîchir affichage si applicable
    alert("Facture mise à jour avec succès !");
  } catch (err) {
    console.error("Erreur lors de la mise à jour :", err);
    alert("Une erreur s’est produite.");
  }
});

