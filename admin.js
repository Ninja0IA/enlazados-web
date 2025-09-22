// Importamos las funciones que necesitamos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage(app);

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

// Resto del código...

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
            alert("Acceso denegado. No eres un administrador.");
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
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

// --- LEER (Read) ---
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

// --- ACTUALIZAR VISIBILIDAD (Update) ---
async function toggleVisibilidadNota(id, estadoActualVisible) {
    try {
        await updateDoc(doc(db, "notas", id), { esVisible: !estadoActualVisible });
        cargarNotasAdmin();
    } catch (error) {
        console.error("Error al cambiar la visibilidad: ", error);
    }
}

// --- BORRAR (Delete) ---
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

// --- LÓGICA PARA CARGAR NOTA EN EL FORMULARIO (Pre-Update) ---
async function cargarNotaEnFormulario(id) {
    try {
        const docRef = doc(db, "notas", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const nota = docSnap.data();
            
            // Llenar el formulario con los datos de la nota
            notaIdField.value = id;
            document.getElementById('titulo').value = nota.titulo;
            quill.root.innerHTML = nota.cuerpo;
            document.getElementById('tipo').value = nota.tipo;
            document.getElementById('prioridad').value = nota.prioridad;

            // Formatear y establecer la fecha
            if (nota.fecha && nota.fecha.toDate) {
                const fecha = nota.fecha.toDate();
                const formattedDate = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
                document.getElementById('fecha-nota').value = formattedDate;
            }

            // Cambiar la interfaz a "modo edición"
            formTitle.textContent = 'Editando Nota';
            btnSubmitForm.textContent = 'Actualizar Nota';
            btnCancelarEdicion.classList.remove('hidden');
            document.getElementById('imagen-file').required = false; // La imagen no es requerida al editar

            // Mover la vista al formulario
            window.scrollTo(0, 0);
        } else {
            console.error("No se encontró la nota para editar.");
        }
    } catch (error) {
        console.error("Error al cargar la nota para edición: ", error);
    }
}

// --- FUNCIÓN PARA LIMPIAR EL FORMULARIO Y SALIR DEL MODO EDICIÓN ---
function resetearFormulario() {
    formNuevaNota.reset();
    quill.setText('');
    notaIdField.value = '';
    formTitle.textContent = 'Crear Nota';
    btnSubmitForm.textContent = 'Publicar Nota';
    btnCancelarEdicion.classList.add('hidden');
    document.getElementById('imagen-file').required = true; // La imagen vuelve a ser requerida para notas nuevas
}

btnCancelarEdicion.addEventListener('click', resetearFormulario);

// --- LÓGICA DEL FORMULARIO PARA CREAR Y ACTUALIZAR ---
formNuevaNota.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = notaIdField.value;

    if (id) {
        // --- LÓGICA DE ACTUALIZAR (Update) ---
        await actualizarNota(id);
    } else {
        // --- LÓGICA DE CREAR (Create) ---
        await crearNuevaNota();
    }
});

async function crearNuevaNota() {
    const archivoImagen = document.getElementById('imagen-file').files[0];
    if (!archivoImagen) {
        alert("Por favor, selecciona un archivo de imagen para la nueva nota.");
        return;
    }

    btnSubmitForm.disabled = true;
    btnSubmitForm.textContent = 'Publicando...';

    try {
        const storageRef = ref(storage, `notas/${Date.now()}-${archivoImagen.name}`);
        await uploadBytes(storageRef, archivoImagen);
        const imageUrl = await getDownloadURL(storageRef);

        let fechaDePublicacion = document.getElementById('fecha-nota').value 
            ? new Date(document.getElementById('fecha-nota').value + 'T12:00:00') 
            : serverTimestamp();

        const nuevaNota = {
            titulo: document.getElementById('titulo').value,
            cuerpo: quill.root.innerHTML,
            tipo: document.getElementById('tipo').value,
            prioridad: parseInt(document.getElementById('prioridad').value),
            fecha: fechaDePublicacion,
            esVisible: true,
            media: [{ tipo: "imagen", url: imageUrl, alt: "Imagen de la nota: " + document.getElementById('titulo').value }]
        };

        await addDoc(collection(db, "notas"), nuevaNota);
        alert("¡Nota publicada con éxito!");
        resetearFormulario();
        cargarNotasAdmin();

    } catch (error) {
        console.error("Error al guardar la nota: ", error);
    } finally {
        btnSubmitForm.disabled = false;
    }
}

async function actualizarNota(id) {
    btnSubmitForm.disabled = true;
    btnSubmitForm.textContent = 'Actualizando...';

    try {
        const archivoImagen = document.getElementById('imagen-file').files[0];
        let imageUrl;

        // Si el usuario subió una nueva imagen, la procesamos.
        if (archivoImagen) {
            const storageRef = ref(storage, `notas/${Date.now()}-${archivoImagen.name}`);
            await uploadBytes(storageRef, archivoImagen);
            imageUrl = await getDownloadURL(storageRef);
        }

        let fechaDePublicacion = document.getElementById('fecha-nota').value
            ? new Date(document.getElementById('fecha-nota').value + 'T12:00:00')
            : serverTimestamp(); // Si se borra la fecha, se actualiza a la actual.

        const datosActualizados = {
            titulo: document.getElementById('titulo').value,
            cuerpo: quill.root.innerHTML,
            tipo: document.getElementById('tipo').value,
            prioridad: parseInt(document.getElementById('prioridad').value),
            fecha: fechaDePublicacion,
        };

        // Si obtuvimos una nueva URL de imagen, la añadimos a los datos a actualizar.
        if (imageUrl) {
            datosActualizados.media = [{ tipo: "imagen", url: imageUrl, alt: "Imagen de la nota: " + datosActualizados.titulo }];
        }

        const docRef = doc(db, "notas", id);
        await updateDoc(docRef, datosActualizados);

        alert("¡Nota actualizada con éxito!");
        resetearFormulario();
        cargarNotasAdmin();

    } catch (error) {
        console.error("Error al actualizar la nota: ", error);
    } finally {
        btnSubmitForm.disabled = false;
    }
}