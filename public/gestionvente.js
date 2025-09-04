 

    // --- FONCTIONS D'IMPRESSION ---
    function printPOS80mm(invoice) {
      const posStyle = `
        <style>
          body { font-family: monospace; font-size: 12px; width: 80mm; }
          h2, h3, p { margin: 0; padding: 0; text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; }
          .total { font-weight: bold; border-top: 1px dashed black; margin-top: 5px; }
        </style>
      `;

      let productsHTML = "";
      invoice.products.forEach(p => {
        productsHTML += `
          <tr>
            <td>${p.item}</td>
            <td style="text-align:right;">${p.quantity}</td>
            <td style="text-align:right;">${p.priceGdes} ${p.currency}</td>
          </tr>
        `;
      });

      const html = `
        <html>
          <head>${posStyle}</head>
          <body>
            <h2>DUEN HOTEL</h2>
            <p>Contact: 509 3510-1329</p>
            <hr>
            <p>Facture: ${invoice.factureId}</p>
            <p>Date: ${invoice.date} - ${invoice.time}</p>
            <p>Vendeur: ${invoice.sellerName}</p>
            <hr>
            <table>
              <tr><th>Produit</th><th>Qté</th><th>Prix</th></tr>
              ${productsHTML}
            </table>
            <p class="total">Total Gdes: ${invoice.totalGdes}</p>
            <p class="total">Total US$: ${invoice.totalUs}</p>
            <hr>
            <p>Merci et à bientôt</p>
          </body>
        </html>
      `;

      const printWindow = window.open('', '', 'width=400,height=600');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }

    function printA4(invoice) {
      const a4Style = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 14px; }
          h1, h3 { margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid black; padding: 5px; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; }
        </style>
      `;

      let productsHTML = "";
      invoice.products.forEach(p => {
        productsHTML += `
          <tr>
            <td>${p.item}</td>
            <td>${p.category}</td>
            <td>${p.quantity}</td>
            <td>${p.priceGdes} Gdes</td>
            <td>${p.priceUs} US$</td>
          </tr>
        `;
      });

      const html = `
        <html>
          <head>${a4Style}</head>
          <body>
            <h1>DUEN HOTEL</h1>
            <p>Contact: 509 3510-1329</p>
            <h3>Facture: ${invoice.factureId}</h3>
            <p>Date: ${invoice.date} - ${invoice.time}</p>
            <p>Client: ${invoice.customerName}</p>
            <p>Vendeur: ${invoice.sellerName}</p>
            <p>Serveur: ${invoice.serverName}</p>
            <table>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Qté</th>
                <th>Prix Gdes</th>
                <th>Prix US$</th>
              </tr>
              ${productsHTML}
            </table>
            <p class="total">Total Gdes: ${invoice.totalGdes}</p>
            <p class="total">Total US$: ${invoice.totalUs}</p>
          </body>
        </html>
      `;

      const printWindow = window.open('', '', 'width=800,height=1000');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }

    // --- RECHERCHE FACTURE DANS FIRESTORE ---
    async function getInvoiceAndPrint(format) {
      const factureId = document.getElementById("searchInputCustomer").value.trim();
      if (!factureId) {
        alert("Veuillez entrer un factureId.");
        return;
      }

      try {
        const querySnapshot = await db.collection("salesTest")
          .where("factureId", "==", factureId)
          .get();

        if (querySnapshot.empty) {
          alert("Aucune facture trouvée.");
          return;
        }

        querySnapshot.forEach(doc => {
          const invoiceData = doc.data();
          if (format === "POS") {
            printPOS80mm(invoiceData);
          } else {
            printA4(invoiceData);
          }
        });
      } catch (error) {
        console.error("Erreur Firestore:", error);
      }
    }

    // --- BOUTONS ---
    document.getElementById("btnPOS").addEventListener("click", () => getInvoiceAndPrint("POS"));
    document.getElementById("btnA4").addEventListener("click", () => getInvoiceAndPrint("A4"));
