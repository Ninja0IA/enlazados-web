// ===========================================================
// ENLAZADOS — Panel de Administración (Versión segura + completa)
// ===========================================================

// ========== Importar módulos Firebase ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ========== Configuración Firebase ==========
const firebaseConfig = {
  apiKey: "AIzaSyCF9j...TU_API_KEY...",
  authDomain: "enlazados-uat.firebaseapp.com",
  projectId: "enlazados-uat",
  storageBucket: "enlazados-uat.appspot.com",
  messagingSenderId: "107427890352",
  appId: "1:107427890352:web:dfbc27e8c5e4784e5e00b2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// ========== Persistencia local ==========
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn("Error persistencia:", e)
);

// ========== Lista blanca ==========
const USUARIOS_PERMITIDOS = [
  "angelmaya.180204@gmail.com",
  "profesor.fadycs@uat.edu.mx",
  "editor.enlazados@gmail.com"
];

// ========== Elementos del DOM ==========
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const userInfo = document.getElementById("user-info");
const contenedorNotas = document.getElementById("lista-notas") || document.getElementById("tbody-notas");
const formularioNota = document.getElementById("form-nueva-nota") || document.getElementById("formulario-nota");
const toast = document.getElementById("toast");

// ===========================================================
// SESIÓN Y PROTECCIÓN DE ACCESO
// ===========================================================
onAuthStateChanged(auth, async (user) => {
  // Esperar medio segundo para permitir carga del estado persistente
  await new Promise(res => setTimeout(res, 500));

  // Rechequear estado
  const currentUser = auth.currentUser;

  if (!currentUser) {
    // 🚫 No hay sesión después de la espera: redirige
    window.location.href = "login.html";
    return;
  }

  // 🔐 Validar usuario con la lista blanca
  const email = (currentUser.email || "").toLowerCase();
  const autorizado = USUARIOS_PERMITIDOS.map(e => e.toLowerCase()).includes(email);

  if (!autorizado) {
    alert("No tienes permiso para acceder al panel de administración.");
    await signOut(auth);
    window.location.href = "login.html";
    return;
  }

  // ✅ Usuario autorizado
  mostrarDatosUsuario(currentUser);
  cargarNotas();
});


  // 🔐 Validar usuario
  const email = (user.email || "").toLowerCase();
  const autorizado = USUARIOS_PERMITIDOS.map(e => e.toLowerCase()).includes(email);

  if (!autorizado) {
    alert("No tienes permiso para acceder al panel de administración.");
    signOut(auth);
    window.location.href = "login.html";
    return;
  }

  // ✅ Usuario autorizado
  mostrarDatosUsuario(user);
  cargarNotas();
});

// ===========================================================
// LOGIN MANUAL (por si se activa accidentalmente)
// ===========================================================
if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      alert("No fue posible iniciar sesión. Intenta de nuevo.");
    }
  });
}

// ===========================================================
// LOGOUT
// ===========================================================
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
    localStorage.removeItem("tema");
    window.location.href = "login.html";
  });
}

// ===========================================================
// MOSTRAR DATOS DEL USUARIO
// ===========================================================
function mostrarDatosUsuario(user) {
  if (userInfo) {
    userInfo.style.display = "inline-block";
    userInfo.innerHTML = `
      <div class="user-card" style="display:flex;align-items:center;gap:8px;">
        <img src="${user.photoURL}" alt="Usuario" class="user-photo"
             style="width:28px;height:28px;border-radius:50%;object-fit:cover;">
        <div style="font-size:.85rem;">
          <strong>${user.displayName}</strong><br>
          <span>${user.email}</span>
        </div>
      </div>
    `;
  }
}

// ===========================================================
// CRUD — GESTIÓN DE NOTAS
// ===========================================================

// Cargar notas
async function cargarNotas() {
  if (contenedorNotas) contenedorNotas.innerHTML = "<p>Cargando notas...</p>";
  try {
    const snapshot = await getDocs(collection(db, "notas"));
    if (!contenedorNotas) return;

    contenedorNotas.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${data.titulo || "—"}</td>
        <td>${data.categoria || "—"}</td>
        <td>${data.prioridad || "—"}</td>
        <td>${data.vistas || 0}</td>
        <td>${data.visible ? "✅" : "🚫"}</td>
        <td>${data.estado || "Publicada"}</td>
        <td>
          <button class="btn-editar" data-id="${docSnap.id}">✏️</button>
          <button class="btn-eliminar" data-id="${docSnap.id}">🗑️</button>
        </td>
      `;
      contenedorNotas.appendChild(fila);
    });

    document.querySelectorAll(".btn-eliminar").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await eliminarNota(id);
      })
    );

    document.querySelectorAll(".btn-editar").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        editarNota(id);
      })
    );
  } catch (error) {
    console.error("Error al cargar notas:", error);
  }
}

// Añadir nota
if (formularioNota) {
  formularioNota.addEventListener("submit", async (e) => {
    e.preventDefault();
    const titulo = formularioNota["titulo"]?.value.trim() || "";
    const contenido = formularioNota["contenido"]?.value.trim() || formularioNota["cuerpo"]?.value.trim() || "";

    if (!titulo || !contenido) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      await addDoc(collection(db, "notas"), {
        titulo,
        contenido,
        fecha: new Date().toISOString(),
        visible: true
      });
      formularioNota.reset();
      mostrarToast("Nota añadida correctamente");
      cargarNotas();
    } catch (error) {
      console.error("Error al agregar nota:", error);
    }
  });
}

// Eliminar nota
async function eliminarNota(id) {
  const confirmar = confirm("¿Eliminar esta nota?");
  if (!confirmar) return;

  try {
    await deleteDoc(doc(db, "notas", id));
    mostrarToast("Nota eliminada");
    cargarNotas();
  } catch (error) {
    console.error("Error al eliminar nota:", error);
  }
}

// Editar nota
async function editarNota(id) {
  const nuevoTitulo = prompt("Nuevo título:");
  const nuevoContenido = prompt("Nuevo contenido:");
  if (!nuevoTitulo || !nuevoContenido) return;

  try {
    const ref = doc(db, "notas", id);
    await updateDoc(ref, {
      titulo: nuevoTitulo,
      contenido: nuevoContenido
    });
    mostrarToast("Nota actualizada");
    cargarNotas();
  } catch (error) {
    console.error("Error al editar nota:", error);
  }
}

// ===========================================================
// UTILIDAD — NOTIFICACIÓN SUTIL (Toast)
// ===========================================================
function mostrarToast(mensaje) {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// ===========================================================
// TEMA OSCURO / HALLOWEEN
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  const tema = localStorage.getItem("tema") || "claro";
  document.body.classList.toggle("modo-oscuro", tema === "oscuro");

  const btnToggle = document.getElementById("btn-toggle-tema");
  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      document.body.classList.toggle("modo-oscuro");
      localStorage.setItem("tema", document.body.classList.contains("modo-oscuro") ? "oscuro" : "claro");
    });
  }
});
