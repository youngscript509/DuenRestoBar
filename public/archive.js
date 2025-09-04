
// IndexedDB Setup
let dbLocal;
const request = indexedDB.open("DrinksDB", 1);
request.onerror = () => console.error("Failed to open IndexedDB");
request.onsuccess = (event) => {
  dbLocal = event.target.result;
  filterProducts();
};

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore("drinks", { keyPath: "name" });
};
document.getElementById("syncBtn").addEventListener("click", async () => {
  try {
    const progressContainer = document.getElementById("progressContainer");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    progressContainer.classList.remove("hidden");
    progressFill.style.width = "0%";
    progressText.textContent = "Récupération des produits...";

    // Récupérer depuis Firestore
    const snapshot = await db.collection("DrinkStock").get();
    const products = snapshot.docs.map(doc => doc.data());

    const total = products.length;
    if (total === 0) {
      progressText.textContent = "Aucun produit à synchroniser.";
      return;
    }

    const tx = dbLocal.transaction("drinks", "readwrite");
    const store = tx.objectStore("drinks");

    let count = 0;

    // On évite await ici
    products.forEach(product => {
      store.put(product);
      count++;
      const progress = Math.round((count / total) * 100);
      progressFill.style.width = `${progress}%`;
    });

    tx.oncomplete = () => {
      progressText.textContent = "✅ Synchronisation terminée !";
      filterProducts
      setTimeout(() => {
        progressContainer.classList.add("hidden");
      }, 1500);
    };

    tx.onerror = () => {
      progressText.textContent = "❌ Erreur lors de la copie locale.";
    };
  } catch (err) {
    console.error("Erreur de synchronisation :", err);
    document.getElementById("progressText").textContent = "❌ Erreur : " + err.message;
  }
});



document.getElementById("searchInput").addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  filterProducts(keyword);
});

function filterProducts(keyword) {
  const list = document.getElementById("productList");
  list.innerHTML = "";

  const tx = dbLocal.transaction("drinks", "readonly");
  const store = tx.objectStore("drinks");
  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const data = cursor.value;
      const nameMatch = data.name.toLowerCase().includes(keyword);
      const categoryMatch = data.category.toLowerCase().includes(keyword);
      if (nameMatch || categoryMatch) {
        const emoji = getCategoryEmoji(data.category);
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <div class="product-emoji">${emoji}</div>
          <div class="product-info">
            <h3>${data.name}</h3>
            <p>📦 Quantité: ${data.quantity}</p>
            <p>📂 Catégorie: ${data.category}</p>
            <p>💵 Gdes: ${data.priceGdes}</p>
            <p>💲 USD: ${data.priceUs}</p>
          </div>
        `;
        list.appendChild(card);
      }
      cursor.continue();
    }
  };
}

function getCategoryEmoji(cat) {
  const map = {
    drink: "🥤",
    food: "🍽️",
    smoke: "🚬",
  };
  return map[cat.toLowerCase()] || "📦";
}

function showFireworks() {
  const canvas = document.getElementById("fireworksCanvas");
  canvas.classList.remove("hidden");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: Math.random() * 2 + 1,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      dx: (Math.random() - 0.5) * 8,
      dy: (Math.random() - 0.5) * 8,
      life: 100
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 1;
    });
    particles = particles.filter(p => p.life > 0);
    if (particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      canvas.classList.add("hidden");
    }
  }

  animate();
}
document.getElementById("resetBtn").addEventListener("click", () => {
  const tx = dbLocal.transaction("drinks", "readwrite");
  const store = tx.objectStore("drinks");

  const req = store.clear();
  req.onsuccess = () => {
    alert("🧹 Stock local réinitialisé !");
    displayProducts();
  };
  req.onerror = () => {
    alert("❌ Erreur de nettoyage !");
  };
});

tx.oncomplete = () => {
  progressText.textContent = "✅ Synchronisation terminée !";
  progressFill.style.backgroundColor = "#10B981"; // Green
  showFireworks(); // 🎆 feu d’artifice
  displayProducts();
  setTimeout(() => {
    progressContainer.classList.add("hidden");
  }, 2000);
};

filterProducts(''); // au lieu de displayProducts();