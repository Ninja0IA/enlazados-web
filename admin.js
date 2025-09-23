// ==================== 1. INICIALIZACIÓN DE FIREBASE ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Configuración del proyecto "enlazados-final" ---
const firebaseConfig = {
  apiKey: "AIzaSyBPMTXm9oaNOvsXC4BYtVnoGj3VnCR02Yc",
  authDomain: "enlazados-final.firebaseapp.com",
  projectId: "enlazados-final",
  storageBucket: "enlazados-final.firebasestorage.app",
  messagingSenderId: "1036116744539",
  appId: "1:1036116744539:web:65f6696a4dca60e722a27e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== LÓGICA DEL PANEL DE ADMINISTRADOR ====================
const loader = document.getElementById('loader');
const adminContent = document.getElementById('admin-content');
const btnLogout = document.getElementById('btn-logout');
const formNuevaNota = document.getElementById('form-nueva-nota');
const listaNotasAdmin = document.getElementById('lista-notas-admin');
const formTitle = document.getElementById('form-title');
const btnSubmitForm = document.getElementById('btn-submit-form');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const notaIdField = document.getElementById('nota-id');

let quill;

onAuthStateChanged(auth, async (user) => {
    const loader = document.getElementById('loader');
    const adminContent = document.getElementById('admin-content');

    if (user) {
        // Muestra un mensaje mientras se verifica si es admin
        loader.querySelector('h2').textContent = 'Verificando permisos de administrador...';
        
        const adminsRef = collection(db, "administradores");
        const q = query(adminsRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // ¡Éxito! El usuario es admin.
            loader.classList.add('hidden');
            adminContent.classList.remove('hidden');
            inicializarEditor();
            cargarNotasAdmin();
        } else {
            // El usuario está logueado pero NO es admin.
            adminContent.classList.add('hidden');
            loader.classList.remove('hidden');
            loader.innerHTML = '<h2>Acceso Denegado</h2><p>No tienes los permisos necesarios para ver esta página. <a href="index.html">Volver al inicio</a>.</p>';
        }
    } else {
        // El usuario no está logueado.
        adminContent.classList.add('hidden');
        loader.classList.remove('hidden');
        loader.innerHTML = '<h2>Acceso Requerido</h2><p>Debes iniciar sesión como administrador para acceder. <a href="login.html">Volver al inicio e iniciar sesión</a>.</p>';
    }
});

btnLogout.addEventListener('click', () => {
    signOut(auth).catch((error) => console.error('Error al cerrar sesión:', error));
});

function inicializarEditor() {
    if (!quill) {
        quill = new Quill('#editor-cuerpo', {
            theme: 'snow',
            placeholder: 'Escribe aquí el contenido detallado de la noticia...'
        });
    }
}

// ==================== FUNCIONES CRUD (Crear, Leer, Actualizar, Borrar) ====================

async function cargarNotasAdmin() {
    if (!listaNotasAdmin) return;
    listaNotasAdmin.innerHTML = '<p>Cargando notas...</p>';
    const q = query(collection(db, "notas"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    
    listaNotasAdmin.innerHTML = querySnapshot.empty ? '<p>No hay notas publicadas.</p>' : '';
    
    querySnapshot.forEach(doc => {
        const nota = doc.data();
        const notaElement = document.createElement('div');
        notaElement.classList.add('lista-notas-item');
        if (nota.esVisible === false) notaElement.classList.add('oculta');
        
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
    listaNotasAdmin.querySelectorAll('.btn-toggle-visibility').forEach(button => 
        button.addEventListener('click', (e) => toggleVisibilidadNota(e.target.dataset.id, e.target.textContent === 'Ocultar'))
    );
    listaNotasAdmin.querySelectorAll('.btn-borrar').forEach(button => 
        button.addEventListener('click', (e) => borrarNota(e.target.dataset.id))
    );
    listaNotasAdmin.querySelectorAll('.btn-editar').forEach(button => 
        button.addEventListener('click', (e) => cargarNotaEnFormulario(e.target.dataset.id))
    );
}

async function toggleVisibilidadNota(id, estadoActualVisible) {
    try {
        await updateDoc(doc(db, "notas", id), { esVisible: !estadoActualVisible });
        cargarNotasAdmin();
    } catch (error) {
        console.error("Error al cambiar la visibilidad: ", error);
    }
}

async function borrarNota(id) {
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
}

async function cargarNotaEnFormulario(id) {
    try {
        const docRef = doc(db, "notas", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const nota = docSnap.data();
            
            notaIdField.value = id;
            document.getElementById('titulo').value = nota.titulo;
            quill.root.innerHTML = nota.cuerpo;
            document.getElementById('imagen-url').value = nota.media && nota.media[0] ? nota.media[0].url : '';
            document.getElementById('tipo').value = nota.tipo;
            document.getElementById('prioridad').value = nota.prioridad;

            if (nota.fecha && nota.fecha.toDate) {
                const fecha = nota.fecha.toDate();
                const formattedDate = fecha.toISOString().split('T')[0];
                document.getElementById('fecha-nota').value = formattedDate;
            }

            formTitle.textContent = 'Editando Nota';
            btnSubmitForm.textContent = 'Actualizar Nota';
            btnCancelarEdicion.classList.remove('hidden');

            window.scrollTo(0, 0);
        }
    } catch (error) {
        console.error("Error al cargar la nota para edición: ", error);
    }
}

function resetearFormulario() {
    formNuevaNota.reset();
    quill.setText('');
    notaIdField.value = '';
    formTitle.textContent = 'Crear Nota';
    btnSubmitForm.textContent = 'Publicar Nota';
    btnCancelarEdicion.classList.add('hidden');
}

btnCancelarEdicion.addEventListener('click', resetearFormulario);

formNuevaNota.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = notaIdField.value;

    if (id) {
        await actualizarNota(id);
    } else {
        await crearNuevaNota();
    }
});

async function crearNuevaNota() {
    const imageUrl = document.getElementById('imagen-url').value;
    if (!imageUrl) {
        alert("Por favor, proporciona una URL para la imagen principal.");
        return;
    }

    btnSubmitForm.disabled = true;
    btnSubmitForm.textContent = 'Publicando...';

    try {
        let fechaDePublicacion = document.getElementById('fecha-nota').value 
            ? new Date(document.getElementById('fecha-nota').value + 'T12:00:00') 
            : serverTimestamp();
        
        const prioridadValue = document.getElementById('prioridad').value;
        const prioridad = prioridadValue ? parseInt(prioridadValue) : 3;

        const nuevaNota = {
            titulo: document.getElementById('titulo').value,
            cuerpo: quill.root.innerHTML,
            tipo: document.getElementById('tipo').value,
            prioridad: prioridad,
            fecha: fechaDePublicacion,
            esVisible: true,
            media: [{ tipo: "imagen", url: imageUrl, alt: "Imagen de la nota" }]
        };

        await addDoc(collection(db, "notas"), nuevaNota);
        alert("¡Nota publicada con éxito!");
        resetearFormulario();
        cargarNotasAdmin();

    } catch (error) {
        console.error("Error al crear la nota: ", error);
        alert("No se pudo crear la nota. Revisa la consola.");
    } finally {
        btnSubmitForm.disabled = false;
        btnSubmitForm.textContent = 'Publicar Nota';
    }
}

async function actualizarNota(id) {
    btnSubmitForm.disabled = true;
    btnSubmitForm.textContent = 'Actualizando...';

    try {
        let fechaDePublicacion = document.getElementById('fecha-nota').value
            ? new Date(document.getElementById('fecha-nota').value + 'T12:00:00')
            : serverTimestamp();

        const prioridadValue = document.getElementById('prioridad').value;
        const prioridad = prioridadValue ? parseInt(prioridadValue) : 3;

        const datosActualizados = {
            titulo: document.getElementById('titulo').value,
            cuerpo: quill.root.innerHTML,
            tipo: document.getElementById('tipo').value,
            prioridad: prioridad,
            fecha: fechaDePublicacion,
        };

        const imageUrl = document.getElementById('imagen-url').value;
        if (imageUrl) {
            datosActualizados.media = [{ tipo: "imagen", url: imageUrl, alt: "Imagen de la nota" }];
        }

        const docRef = doc(db, "notas", id);
        await updateDoc(docRef, datosActualizados);

        alert("¡Nota actualizada con éxito!");
        resetearFormulario();
        cargarNotasAdmin();

    } catch (error) {
        console.error("Error al actualizar la nota: ", error);
        alert("No se pudo actualizar la nota. Revisa la consola.");
    } finally {
        btnSubmitForm.disabled = false;
        resetearFormulario();
    }
}