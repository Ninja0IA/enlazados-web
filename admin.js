// Importamos las funciones que necesitamos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const adminEmail = "angelmaya.180204@gmail.com"; 

const loader = document.getElementById('loader');
const adminContent = document.getElementById('admin-content');
const btnLogout = document.getElementById('btn-logout');
const formNuevaNota = document.getElementById('form-nueva-nota');
const listaNotasAdmin = document.getElementById('lista-notas-admin');

let quill;

function inicializarEditor() {
    if (!quill) {
        quill = new Quill('#editor-cuerpo', {
            theme: 'snow',
            placeholder: 'Escribe aquí el contenido detallado de la noticia...'
        });
    }
}

async function cargarNotasAdmin() {
    if (!listaNotasAdmin) return;
    
    listaNotasAdmin.innerHTML = '<p>Cargando notas...</p>';
    const q = query(collection(db, "notas"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        listaNotasAdmin.innerHTML = '<p>No hay notas publicadas.</p>';
        return;
    }

    listaNotasAdmin.innerHTML = '';
    querySnapshot.forEach(doc => {
        const nota = doc.data();
        const notaElement = document.createElement('div');
        notaElement.classList.add('lista-notas-item');
        if (nota.esVisible === false) {
            notaElement.classList.add('oculta');
        }
        notaElement.innerHTML = `
            <p>${nota.titulo}</p>
            <div class="nota-acciones">
                <button class="btn-toggle-visibility" data-id="${doc.id}">${nota.esVisible ? 'Ocultar' : 'Mostrar'}</button>
                <button class="btn-editar" data-id="${doc.id}">Editar</button>
                <button class="btn-borrar" data-id="${doc.id}">Borrar</button>
            </div>
        `;
        listaNotasAdmin.appendChild(notaElement);
    });

    agregarListenersBotonesAdmin();
}

function agregarListenersBotonesAdmin() {
    listaNotasAdmin.querySelectorAll('.btn-toggle-visibility').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const estadoActualVisible = e.target.textContent === 'Ocultar';
            const docRef = doc(db, "notas", id);
            try {
                await updateDoc(docRef, { esVisible: !estadoActualVisible });
                cargarNotasAdmin();
            } catch (error) {
                console.error("Error al cambiar la visibilidad: ", error);
            }
        });
    });

    listaNotasAdmin.querySelectorAll('.btn-borrar').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (confirm("¿Estás seguro de que quieres borrar esta nota de forma permanente?")) {
                try {
                    await deleteDoc(doc(db, "notas", id));
                    alert("Nota borrada con éxito.");
                    cargarNotasAdmin();
                } catch (error) {
                    console.error("Error al borrar la nota: ", error);
                    alert("No se pudo borrar la nota.");
                }
            }
        });
    });

    listaNotasAdmin.querySelectorAll('.btn-editar').forEach(button => {
        button.addEventListener('click', (e) => {
            alert("La función de editar se implementará en el siguiente paso.");
        });
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const adminsRef = collection(db, "administradores");
        const q = query(adminsRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            loader.classList.add('hidden');
            adminContent.classList.remove('hidden');
            inicializarEditor();
            cargarNotasAdmin();
        } else {
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
});

btnLogout.addEventListener('click', () => {
    signOut(auth).catch((error) => console.error('Error al cerrar sesión:', error));
});

formNuevaNota.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevaNota = {
        titulo: document.getElementById('titulo').value,
        cuerpo: quill.root.innerHTML,
        tipo: document.getElementById('tipo').value,
        prioridad: parseInt(document.getElementById('prioridad').value),
        fecha: serverTimestamp(),
        esVisible: true,
        media: [{
            tipo: "imagen",
            url: document.getElementById('imagen-url').value,
            alt: "Imagen de la nota: " + document.getElementById('titulo').value
        }]
    };
    try {
        await addDoc(collection(db, "notas"), nuevaNota);
        alert("¡Nota publicada con éxito!");
        formNuevaNota.reset();
        quill.setText('');
        cargarNotasAdmin();
    } catch (error) {
        console.error("Error al guardar la nota: ", error);
        alert("Error al publicar la nota. Revisa la consola para más detalles.");
    }
});