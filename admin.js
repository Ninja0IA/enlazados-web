// Importamos las funciones que necesitamos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDU90OB9I5nqJ3BrOXXU84NPWKwGoZpUqI",
    authDomain: "enlazados-web.firebaseapp.com",
    projectId: "enlazados-web",
    storageBucket: "enlazados-web.appspot.com",
    messagingSenderId: "284995043641",
    appId: "1:284995043641:web:7dc33c5db6d61e656f68e8",
    measurementId: "G-HZGC3EZF42"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== LÓGICA DE SEGURIDAD Y DEL PANEL ====================

// Correo del administrador autorizado
const adminEmail = "angelmaya.180204@gmail.com"; 

const loader = document.getElementById('loader');
const adminContent = document.getElementById('admin-content');
const btnLogout = document.getElementById('btn-logout');
const formNuevaNota = document.getElementById('form-nueva-nota');

let quill; // Hacemos Quill accesible globalmente en este script

// Función para inicializar el editor de texto
function inicializarEditor() {
    if (!quill) { // Solo inicializa si no ha sido ya creado
        quill = new Quill('#editor-cuerpo', {
            theme: 'snow',
            placeholder: 'Escribe aquí el contenido detallado de la noticia...'
        });
    }
}

// Verifica el estado del usuario al cargar la página
onAuthStateChanged(auth, (user) => {
    if (user && user.email === adminEmail) {
        console.log("Acceso de administrador concedido a:", user.email);
        loader.classList.add('hidden');
        adminContent.classList.remove('hidden');
        inicializarEditor();
    } else {
        console.log("Acceso denegado. Redirigiendo a la página principal.");
        window.location.href = 'index.html';
    }
});

// Lógica para el botón de cerrar sesión
btnLogout.addEventListener('click', () => {
    signOut(auth).catch((error) => console.error('Error al cerrar sesión:', error));
});

// Lógica para guardar la nueva nota en la base de datos
formNuevaNota.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Recopilamos los datos del formulario
    const nuevaNota = {
        titulo: document.getElementById('titulo').value,
        cuerpo: quill.root.innerHTML,
        tipo: document.getElementById('tipo').value,
        prioridad: parseInt(document.getElementById('prioridad').value),
        fecha: serverTimestamp(),
        media: [
            {
                tipo: "imagen",
                url: document.getElementById('imagen-url').value,
                alt: "Imagen de la nota: " + document.getElementById('titulo').value
            }
        ]
        // El 'id' se generará automáticamente por Firestore
    };

    try {
        const docRef = await addDoc(collection(db, "notas"), nuevaNota);
        console.log("Nota guardada con ID: ", docRef.id);
        alert("¡Nota publicada con éxito!");
        formNuevaNota.reset();
        quill.setText('');
    } catch (error) {
        console.error("Error al guardar la nota: ", error);
        alert("Error al publicar la nota. Revisa la consola para más detalles.");
    }
});