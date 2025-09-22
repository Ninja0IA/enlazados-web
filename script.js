// ==================== 1. INICIALIZACIÓN DE FIREBASE ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDU90OB9I5nqJ3BrOXXU84NPWKwGoZpUqI",
    authDomain: "enlazados-web.firebaseapp.com",
    projectId: "enlazados-web",
    storageBucket: "enlazados-web.appspot.com",
    messagingSenderId: "284995043641",
    appId: "1:284995043641:web:7dc33c5db6d61e656f68e8",
    measurementId: "G-HZGC3EZF42"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ==================== 2. LÓGICA PRINCIPAL DE LA APLICACIÓN ====================
document.addEventListener("DOMContentLoaded", function() {

    const mainView = document.querySelector("main");
    const articleView = document.getElementById("vista-articulo");
    const articleContent = document.getElementById("articulo-contenido");
    const btnVolver = document.getElementById("btn-volver");
    const fechaElemento = document.querySelector(".fecha");
    const fraseElemento = document.querySelector(".frase");
    const seccionDestacada = document.querySelector(".seccion-destacada");
    const seccionGrid = document.querySelector(".seccion-grid");
    const loader = document.getElementById("loader");
    const btnMenu = document.getElementById("btn-menu");
    const menuLateral = document.getElementById("menu-lateral");
    const barraTitulo = document.querySelector(".barra-titulo");
    const footer = document.querySelector("footer");
    const backToTopBtn = document.getElementById("back-to-top-btn");
    const btnInicioMenu = document.getElementById("btn-inicio-menu");
    const tituloPrincipal = document.getElementById("titulo-principal");
    const welcomeModal = document.getElementById("welcome-modal");
    const btnLoginWelcome = document.getElementById("btn-login-welcome");
    const btnAnonimo = document.getElementById("btn-anonimo");
    const btnLoginMenu = document.getElementById("btn-login-menu");
    const mensajeSinNotas = document.getElementById("mensaje-sin-notas");
    const welcomeModalCloseBtn = document.getElementById("welcome-modal-close-btn");

    let todasLasNotas = [];

    /* --- SETUP INICIAL DE LA PÁGINA --- */
    const hoy = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    fechaElemento.textContent = hoy.toLocaleString('es-ES', opcionesFecha);
    const frases = [ "El único modo de hacer un gran trabajo es amar lo que haces.", "La vida es como una bicicleta, para mantener el equilibrio debes seguir moviéndote.", "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito.", "The future belongs to those who believe in the beauty of their dreams.", "The only impossible journey is the one you never begin.", "Believe you can and you're halfway there.", "七転び八起き (Nanakorobi yaoki) - Cae siete veces, levántate ocho.", "継続は力なり (Keizoku wa chikara nari) - La perseverancia es poder.", "明日は明日の風が吹く (Ashita wa ashita no kaze ga fuku) - Mañana soplará el viento de mañana." ];
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    fraseElemento.textContent = `"${fraseAleatoria}"`;
    if (sessionStorage.getItem('welcomeModalShown') !== 'true') {
        welcomeModal.classList.remove('hidden');
        sessionStorage.setItem('welcomeModalShown', 'true');
    }

    /* --- CARGA DE NOTAS DESDE FIREBASE --- */
    async function cargarNotasDesdeFirestore() {
        if (!seccionDestacada || !seccionGrid || !loader) return;
        try {
            const q = query(collection(db, "notas"), where("esVisible", "==", true), orderBy("prioridad"), orderBy("fecha", "desc"));
            const querySnapshot = await getDocs(q);
            todasLasNotas = [];
            querySnapshot.forEach((doc) => {
                todasLasNotas.push({ id: doc.id, ...doc.data() });
            });
            if (todasLasNotas.length === 0) {
                mensajeSinNotas.classList.remove('hidden');
                seccionDestacada.innerHTML = '';
                seccionGrid.innerHTML = '';
            } else {
                mensajeSinNotas.classList.add('hidden');
                renderizarPaginaPrincipal();
            }
        } catch (error) {
            console.error('Error al cargar las notas desde Firestore:', error);
            mainView.innerHTML = `<p id="mensaje-sin-notas">Lo sentimos, no pudimos cargar las noticias desde la base de datos.</p>`;
        } finally {
            if(loader) loader.style.display = 'none';
        }
    }
    cargarNotasDesdeFirestore();

    /* --- LÓGICA DE AUTENTICACIÓN --- */
    function iniciarSesionConGoogle() {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("¡Usuario ha iniciado sesión!", result.user);
                welcomeModal.classList.add('hidden');
            }).catch((error) => {
                console.error("Error durante el inicio de sesión:", error);
            });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const nombreCorto = user.displayName ? user.displayName.split(' ')[0] : 'Usuario';
            btnLoginMenu.textContent = `Cerrar Sesión (${nombreCorto})`;
        } else {
            btnLoginMenu.textContent = 'Iniciar Sesión';
        }
        if (!articleView.classList.contains('hidden')) {
            const currentId = articleView.dataset.currentId;
            if (currentId) { mostrarArticulo(currentId); }
        }
    });

    /* --- FUNCIONES DE RENDERIZADO --- */
    function renderizarPaginaPrincipal() {
        const notaDestacada = todasLasNotas.find(nota => nota.tipo === 'destacada');
        const notasGrid = todasLasNotas.filter(nota => nota.tipo === 'grid');
        seccionDestacada.innerHTML = '';
        seccionGrid.innerHTML = '';
        if (notaDestacada) { seccionDestacada.appendChild(crearTarjeta(notaDestacada)); }
        notasGrid.forEach(nota => { seccionGrid.appendChild(crearTarjeta(nota)); });
    }

    function crearTarjeta(nota) {
        const esDestacada = nota.tipo === 'destacada';
        const article = document.createElement("article");
        article.classList.add(esDestacada ? "articulo-destacado" : "articulo-grid");
        const shareURL = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent(nota.titulo);
        const tiempoLectura = calcularTiempoLectura(nota.cuerpo);
        const tituloHTML = esDestacada ? `<h2>${nota.titulo}</h2>` : `<h3>${nota.titulo}</h3>`;
        const imagenPrincipal = nota.media && nota.media.length > 0 ? nota.media.find(m => m.tipo === 'imagen') : { url: '', alt: 'Imagen no disponible' };
        const enlacePrincipalHTML = `<a href="#" class="enlace-principal-tarjeta" data-id="${nota.id}">${esDestacada ? `<div class="imagen-container"><img src="${imagenPrincipal.url}" alt="${imagenPrincipal.alt}"></div>` : `<img src="${imagenPrincipal.url}" alt="${imagenPrincipal.alt}">`}<div class="contenido-container">${tituloHTML}<p>${nota.cuerpo}</p><span class="tiempo-lectura">${tiempoLectura}</span></div></a>`;
        const botonesCompartirHTML = `<div class="share-container"><span>Compartir:</span><div class="share-icons"><a href="https://twitter.com/intent/tweet?url=${shareURL}&text=${shareText}" target="_blank" class="twitter-share" title="Compartir en X/Twitter"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a><a href="https://www.facebook.com/sharer/sharer.php?u=${shareURL}" target="_blank" class="facebook-share" title="Compartir en Facebook"><svg viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/></svg></a><a href="https://api.whatsapp.com/send?text=${shareText}%20${shareURL}" target="_blank" class="whatsapp-share" title="Compartir en WhatsApp"><svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m.01 18.11c-1.53 0-3.01-.4-4.29-1.15l-.3-.18-3.18.84.85-3.1-.2-.31c-.82-1.31-1.26-2.83-1.26-4.41 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24m4.52-6.13c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.29.18-.54.06s-1.05-.39-2-1.23c-.74-.66-1.23-1.47-1.38-1.72s-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.42.04-.3-.02-.42c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.55-.42-.31-.01-.48-.01c-.17 0-.43.06-.66.31s-.86.84-.86 2.04.88 2.37 1 2.54c.12.17 1.74 2.65 4.22 3.72.59.26 1.05.41 1.41.52.59.17 1.13.15 1.56.09.48-.07 1.47-.6 1.67-1.18s.21-1.07.15-1.18c-.07-.12-.23-.19-.48-.31"/></svg></a></div></div>`;
        article.innerHTML = enlacePrincipalHTML + botonesCompartirHTML;
        article.querySelector('.enlace-principal-tarjeta').addEventListener('click', function(event) { event.preventDefault(); mostrarArticulo(this.dataset.id); });
        return article;
    }

    function mostrarArticulo(id) {
        articleView.dataset.currentId = id;
        const nota = todasLasNotas.find(n => n.id === id);
        if (!nota) return;
        mainView.classList.add('hidden');
        articleView.classList.remove('hidden');
        const fechaNota = nota.fecha.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const imagenPrincipal = nota.media && nota.media.length > 0 ? nota.media.find(m => m.tipo === 'imagen') : { url: '', alt: 'Imagen no disponible' };
        articleContent.innerHTML = `<h2>${nota.titulo}</h2><div class="metadata-articulo"><span>📅 Publicado el ${fechaNota}</span><span>⏱️ ${calcularTiempoLectura(nota.cuerpo)}</span></div><img src="${imagenPrincipal.url}" alt="${imagenPrincipal.alt}"><p>${nota.cuerpo}</p>`;
        renderizarNotasRelacionadas(id);
        renderizarSeccionComentarios();
        window.scrollTo(0, 0);
    }
    
    function renderizarNotasRelacionadas(idArticuloActual) {
        const notasCandidatas = todasLasNotas.filter(n => n.id !== idArticuloActual);
        const notasMezcladas = notasCandidatas.sort(() => 0.5 - Math.random());
        const notasSeleccionadas = notasMezcladas.slice(0, 3);
        if (notasSeleccionadas.length > 0) {
            const relatedContainer = document.createElement('div');
            relatedContainer.className = 'notas-relacionadas';
            const gridContainer = document.createElement('div');
            gridContainer.className = 'grid-relacionadas';
            notasSeleccionadas.forEach(nota => {
                const link = document.createElement('a');
                link.href = `#articulo/${nota.id}`;
                link.className = 'tarjeta-relacionada';
                link.dataset.id = nota.id;
                const imagenRelacionada = nota.media && nota.media.length > 0 ? nota.media.find(m => m.tipo === 'imagen') : { url: '', alt: 'Imagen no disponible' };
                link.innerHTML = `<img src="${imagenRelacionada.url}" alt="${imagenRelacionada.alt}"><h4>${nota.titulo}</h4>`;
                link.addEventListener('click', function(e) { e.preventDefault(); mostrarArticulo(this.dataset.id); });
                gridContainer.appendChild(link);
            });
            relatedContainer.innerHTML = '<h3>También te puede interesar...</h3>';
            relatedContainer.appendChild(gridContainer);
            articleContent.appendChild(relatedContainer);
        }
    }

    function renderizarSeccionComentarios() {
        const interactionContainer = document.createElement('div');
        interactionContainer.className = 'interaccion-seccion';
        const starSVG = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
        let formularioComentariosHTML = '';
        if (auth.currentUser) {
            formularioComentariosHTML = `<h3>Deja tu comentario</h3><form class="comentario-form" id="form-comentario"><textarea placeholder="Escribe tu comentario aquí..." required></textarea><button type="submit">Enviar Comentario</button></form>`;
        } else {
            formularioComentariosHTML = `<div class="login-wall"><p>Debes iniciar sesión para poder puntuar o dejar un comentario.</p><button id="btn-login-popup">Iniciar Sesión / Registrarse</button></div>`;
        }
        interactionContainer.innerHTML = `<div class="puntuacion-seccion"><h3>¡Puntúa esta nota!</h3><div class="estrellas" id="estrellas-rating">${starSVG.repeat(5)}</div></div><div class="comentarios-seccion">${formularioComentariosHTML}<h3>Comentarios</h3><div class="lista-comentarios"><div class="comentario-item"><div class="avatar">U</div><div class="comentario-contenido"><p class="autor">Usuario de Ejemplo</p><p class="fecha">Hace 2 días</p><p>¡Qué gran artículo! Muy informativo y bien escrito.</p></div></div><div class="comentario-item"><div class="avatar">L</div><div class="comentario-contenido"><p class="autor">Lector Anónimo</p><p class="fecha">Hace 1 día</p><p>No estoy de acuerdo con el segundo párrafo, pero el resto del análisis es excelente.</p></div></div></div></div>`;
        articleContent.appendChild(interactionContainer);
        
        const btnLoginPopup = interactionContainer.querySelector('#btn-login-popup');
        if (btnLoginPopup) { btnLoginPopup.addEventListener('click', iniciarSesionConGoogle); }
        
        const formComentario = interactionContainer.querySelector('#form-comentario');
        if (formComentario) { formComentario.addEventListener('submit', function(e) { e.preventDefault(); alert('¡Gracias! Tu comentario ha sido enviado (simulación).'); this.reset(); }); }
        
        interactionContainer.querySelectorAll('.estrellas svg').forEach(estrella => {
            estrella.addEventListener('click', function() {
                if (!auth.currentUser) { iniciarSesionConGoogle(); } 
                else { alert('¡Gracias por tu puntuación! (simulación)'); }
            });
        });
    }
    
    function calcularTiempoLectura(texto) {
        if (!texto || typeof texto !== 'string') return 'Lectura de 0 min';
        const palabrasPorMinuto = 200;
        const numeroDePalabras = texto.trim().split(/\s+/).length;
        const minutos = Math.ceil(numeroDePalabras / palabrasPorMinuto);
        return `Lectura de ${minutos} min`;
    }

    /* --- LÓGICA DE NAVEGACIÓN Y MENÚ --- */
    function regresarAPaginaPrincipal() {
        articleView.classList.add('hidden');
        mainView.classList.remove('hidden');
        menuLateral.classList.remove('visible');
        barraTitulo.classList.remove('desplazado');
        mainView.classList.remove('desplazado');
        footer.classList.remove('desplazado');
    }
    
    btnMenu.addEventListener("click", function() {
        menuLateral.classList.toggle("visible");
        barraTitulo.classList.toggle("desplazado");
        mainView.classList.toggle("desplazado");
        footer.classList.toggle("desplazado");
    });
    
    btnVolver.addEventListener('click', regresarAPaginaPrincipal);
    btnInicioMenu.addEventListener('click', function(event) { event.preventDefault(); regresarAPaginaPrincipal(); });
    tituloPrincipal.addEventListener('click', function(event) { event.preventDefault(); regresarAPaginaPrincipal(); });
    
    btnLoginMenu.addEventListener('click', function(e) {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            signOut(auth);
        } else {
            // CAMBIO: Lógica para cerrar el menú antes de abrir el modal
            menuLateral.classList.remove('visible');
            barraTitulo.classList.remove('desplazado');
            mainView.classList.remove('desplazado');
            footer.classList.remove('desplazado');
            welcomeModal.classList.remove('hidden');
        }
    });

    // --- LÓGICA DEL MODAL ---
    function cerrarWelcomeModal() {
        if (welcomeModal) welcomeModal.classList.add('hidden');
    }
    btnAnonimo.addEventListener('click', cerrarWelcomeModal);
    btnLoginWelcome.addEventListener('click', iniciarSesionConGoogle);
    welcomeModalCloseBtn.addEventListener('click', cerrarWelcomeModal);

    // --- LÓGICA DEL BOTÓN "VOLVER ARRIBA" ---
    window.addEventListener("scroll", function() {
        if (window.scrollY > 300) { backToTopBtn.classList.add("visible"); } 
        else { backToTopBtn.classList.remove("visible"); }
    });
    backToTopBtn.addEventListener("click", function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});