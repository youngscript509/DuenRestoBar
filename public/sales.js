document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();

    // Sauvegarde des ventes
    document.getElementById('saveSale').addEventListener('click', function() {
        saveSale();
    });

    // Fonction pour sauvegarder la vente
    function saveSale() {
        const customerName = document.getElementById('fullname').value;
        const sellerName = document.getElementById('sellerName').value;
        const paymentmeth = document.getElementById('paymentmeth').value;
        const paymentStatut = document.getElementById('paymentStatut').value;
        const date = document.querySelector('#date').value;
        const payOnGdes = parseFloat(document.querySelector('.pay-onGdes').value);
        const payOnUs = parseFloat(document.querySelector('.pay-onUs').value);
        const changeGdes = parseFloat(document.querySelector('.changeGdes').value);
        const changeUs = parseFloat(document.querySelector('.changeUs').value);
        const balanceGdes = parseFloat(document.querySelector('.balanceGdes').value);
        const balanceUs = parseFloat(document.querySelector('.balanceUs').value);
        const time = document.querySelector('#time').value;
        const totalGdes = parseFloat(document.querySelector('.totalGdes').value);
        const totalUs = parseFloat(document.querySelector('.totalUs').value);

        const consumedTableBody = document.getElementById('consumedTableBody');

        if (!factureId || !paymentMethod || isNaN(totalGdes) || !sellerName || !paymentStatut) {
            alert("Veuillez remplir tous les champs obligatoires correctement.");
            return;
        }

        const newSale = {
            factureId,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            paymentMethod,
            totalGdes,
            sellerName,
            paymentStatut,
            products: []
        };

        const rows = consumedTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.getElementsByTagName('td');
            const item = cells[0].textContent.trim();
            const quantityInput = cells[1].querySelector('input');
            const quantity = parseInt(quantityInput.value.trim(), 10);
            const price = parseFloat(cells[2].textContent.trim());

            if (isNaN(quantity) || isNaN(price)) {
                alert("Quantité ou prix invalide dans le tableau des produits.");
                return;
            }

            newSale.products.push({
                item,
                quantity,
                price
            });
        });

        if (newSale.products.length === 0) {
            alert("Ajoutez au moins un produit avant de sauvegarder la vente.");
            return;
        }

        db.collection("globalSales").doc(factureId).get().then((doc) => {
            if (doc.exists) {
                updateSaleAndAdjustQuantities(doc.data(), newSale);
            } else {
                addNewSaleAndAdjustQuantities(newSale);
            }
        }).catch((error) => {
            console.error("Erreur lors de la vérification de la facture :", error);
        });
    }

    // Fonction pour ajouter une nouvelle vente et ajuster les quantités
    function addNewSaleAndAdjustQuantities(newSale) {
        const batch = db.batch();
        const productUpdates = [];

        newSale.products.forEach(saleProduct => {
            const productRef = db.collection("products").where("name", "==", saleProduct.item).limit(1);

            productUpdates.push(productRef.get().then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    const productDoc = querySnapshot.docs[0];
                    const product = productDoc.data();
                    const newQuantity = product.quantity - saleProduct.quantity;

                    console.log(`Produit: ${saleProduct.item}, Quantité initiale: ${product.quantity}, Quantité à soustraire: ${saleProduct.quantity}, Nouvelle quantité: ${newQuantity}`);

                    if (newQuantity < 0) {
                        alert(`Quantité insuffisante pour le produit ${saleProduct.item}.`);
                    } else {
                        batch.update(productDoc.ref, { quantity: newQuantity });
                    }
                } else {
                    console.log(`Produit non trouvé dans la base pour ${saleProduct.item}`);
                }
            }).catch((error) => {
                console.error("Erreur lors de la récupération du produit :", error);
            }));
        });

        const saleRef = db.collection("sales").doc(newSale.factureId);
        batch.set(saleRef, newSale);

        Promise.all(productUpdates).then(() => {
            return batch.commit();
        }).then(() => {
            alert('Vente enregistrée avec succès !');
        }).catch((error) => {
            console.error("Erreur lors de l'enregistrement de la vente :", error);
            alert("Erreur lors de l'enregistrement de la vente : " + error);
        });
    }

    // Fonction pour mettre à jour la vente et ajuster les quantités
    function updateSaleAndAdjustQuantities(existingSale, newSale) {
        const batch = db.batch();
        const productUpdates = [];

        // Ajouter les quantités existantes de retour au stock
        existingSale.products.forEach(existingProduct => {
            const productRef = db.collection("products").where("name", "==", existingProduct.item).limit(1);

            productUpdates.push(productRef.get().then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    const productDoc = querySnapshot.docs[0];
                    const product = productDoc.data();
                    const newQuantity = product.quantity + existingProduct.quantity;

                    console.log(`Produit: ${existingProduct.item}, Quantité initiale: ${product.quantity}, Quantité à ajouter: ${existingProduct.quantity}, Nouvelle quantité: ${newQuantity}`);

                    // Ajoute la mise à jour au batch
                    batch.update(productDoc.ref, { quantity: newQuantity });
                } else {
                    console.log(`Produit non trouvé dans la base pour ${existingProduct.item}`);
                }
            }).catch((error) => {
                console.error("Erreur lors de la récupération du produit :", error);
            }));
        });

        // Soustraire les nouvelles quantités du stock
        newSale.products.forEach(newProduct => {
            const productRef = db.collection("products").where("name", "==", newProduct.item).limit(1);

            productUpdates.push(productRef.get().then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    const productDoc = querySnapshot.docs[0];
                    const product = productDoc.data();
                    const existingProduct = existingSale.products.find(p => p.item === newProduct.item);
                    const previousQuantity = existingProduct ? existingProduct.quantity : 0;
                    const newQuantity1 = product.quantity + previousQuantity;
                    const newQuantity = newQuantity1 - newProduct.quantity;

                    console.log(`Produit: ${newProduct.item}, Quantité initiale: ${product.quantity}, Quantité à soustraire: ${newProduct.quantity}, Nouvelle quantité: ${newQuantity}`);

                    if (newQuantity < 0) {
                        alert(`Quantité insuffisante pour le produit ${newProduct.item}.`);
                    } else {
                        batch.update(productDoc.ref, { quantity: newQuantity });
                    }
                } else {
                    console.log(`Produit non trouvé dans la base pour ${newProduct.item}`);
                }
            }).catch((error) => {
                console.error("Erreur lors de la récupération du produit :", error);
            }));
        });

        // Mise à jour de la vente
        const saleRef = db.collection("sales").doc(newSale.factureId);
        batch.set(saleRef, newSale);

        // Exécuter les mises à jour en lot
        Promise.all(productUpdates).then(() => {
            return batch.commit();
        }).then(() => {
            alert('Vente mise à jour avec succès !');
        }).catch((error) => {
            console.error("Erreur lors de la mise à jour de la vente :", error);
            alert("Erreur lors de la mise à jour de la vente : " + error);
        });
    }


});