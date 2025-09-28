// ==================== 1. INICIALIZACIÓN DE FIREBASE ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

// ==================== 2. LÓGICA PRINCIPAL DE LA APLICACIÓN (SOLO LECTURA) ====================
document.addEventListener("DOMContentLoaded", function() {

    const mainView = document.querySelector("main");
    const articleView = document.getElementById("vista-articulo");
    const articleContent = document.getElementById("articulo-contenido");
    const btnVolver = document.getElementById("btn-volver");
    const fechaElemento = document.querySelector(".fecha");
    const fraseElemento = document.querySelector(".frase");
    const loader = document.getElementById("loader");
    const btnMenu = document.getElementById("btn-menu");
    const menuLateral = document.getElementById("menu-lateral");
    const barraTitulo = document.querySelector(".barra-titulo");
    const footer = document.querySelector("footer");
    const backToTopBtn = document.getElementById("back-to-top-btn");
    const btnInicioMenu = document.getElementById("btn-inicio-menu");
    const tituloPrincipal = document.getElementById("titulo-principal");
    const mensajeSinNotas = document.getElementById("mensaje-sin-notas");

    let todasLasNotas = [];

    /* --- SETUP INICIAL DE LA PÁGINA --- */
    const hoy = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    fechaElemento.textContent = hoy.toLocaleString('es-ES', opcionesFecha);
    const frases = [ "El único modo de hacer un gran trabajo es amar lo que haces.", "La vida es como una bicicleta, para mantener el equilibrio debes seguir moviéndote.", "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito."];
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    fraseElemento.textContent = `"${fraseAleatoria}"`;

    /* --- CARGA DE NOTAS DESDE FIREBASE --- */
    async function cargarNotasDesdeFirestore() {
        // ===== INICIO DE CÓDIGO MODIFICADO =====
        // Referencias a los nuevos contenedores del index.html
        const seccionDestacada = document.getElementById("seccion-destacada-dinamica");
        const seccionGridArriba = document.getElementById("seccion-grid-arriba");
        const seccionGridAbajo = document.getElementById("seccion-grid-abajo");
        // ===== FIN DE CÓDIGO MODIFICADO =====

        if (!seccionDestacada || !seccionGridArriba || !seccionGridAbajo || !loader) return;
        try {
            const q = query(collection(db, "notas"), where("esVisible", "==", true), orderBy("prioridad"), orderBy("fecha", "desc"));
            const querySnapshot = await getDocs(q);
            todasLasNotas = [];
            querySnapshot.forEach((doc) => {
                todasLasNotas.push({ id: doc.id, ...doc.data() });
            });
            if (todasLasNotas.length === 0) {
                mensajeSinNotas.classList.remove('hidden');
                // ===== INICIO DE CÓDIGO MODIFICADO =====
                seccionDestacada.innerHTML = '';
                seccionGridArriba.innerHTML = '';
                seccionGridAbajo.innerHTML = '';
                // ===== FIN DE CÓDIGO MODIFICADO =====
            } else {
                mensajeSinNotas.classList.add('hidden');
                renderizarPaginaPrincipal();
            }
        } catch (error) {
            console.error('Error al cargar las notas desde Firestore:', error);
            mainView.innerHTML = `<p id="mensaje-sin-notas">Lo sentimos, no pudimos cargar las noticias. Revisa la consola para más detalles.</p>`;
        } finally {
            if(loader) loader.style.display = 'none';
        }
    }
    cargarNotasDesdeFirestore();
    
    function generarSinopsis(html, limitePalabras) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const textoPlano = div.textContent || div.innerText || "";
        const palabras = textoPlano.trim().split(/\s+/);
        if (palabras.length <= limitePalabras) return textoPlano;
        return palabras.slice(0, limitePalabras).join(' ') + '...';
    }

    /* --- FUNCIONES DE RENDERIZADO --- */
    // ===== ESTA FUNCIÓN HA SIDO COMPLETAMENTE REEMPLAZADA =====
    function renderizarPaginaPrincipal() {
        // Referencias a los nuevos contenedores
        const seccionDestacada = document.getElementById("seccion-destacada-dinamica");
        const seccionGridArriba = document.getElementById("seccion-grid-arriba");
        const seccionGridAbajo = document.getElementById("seccion-grid-abajo");
    
        // Limpiamos los contenedores
        seccionDestacada.innerHTML = '';
        seccionGridArriba.innerHTML = '';
        seccionGridAbajo.innerHTML = '';
    
        // LÓGICA DE TIEMPO para determinar el turno actual
        const horaActual = new Date().getHours();
        let turnoActual;
    
        if (horaActual >= 5 && horaActual < 14) {
            turnoActual = 'mañana';
        } else if (horaActual >= 14 && horaActual < 22) {
            turnoActual = 'tarde';
        } else {
            turnoActual = 'noche';
        }
        
        console.log(`Hora actual: ${horaActual}, el turno seleccionado es: ${turnoActual}`); // Ayuda para depurar
    
        // FILTRADO DE NOTAS
        // 1. Encontrar la nota destacada para el turno actual o una que sea para 'siempre'
        const notaDestacada = todasLasNotas.find(nota => 
            nota.tipo === 'destacada' && (nota.turno === turnoActual || nota.turno === 'siempre')
        );
        
        // 2. Obtener todas las demás notas (las de tipo 'grid' y las destacadas que no se seleccionaron)
        const otrasNotas = todasLasNotas.filter(nota => !notaDestacada || nota.id !== notaDestacada.id);
    
        // RENDERIZADO EN LA NUEVA ESTRUCTURA
        // 1. Renderizar la nota destacada si se encontró una
        if (notaDestacada) {
            seccionDestacada.appendChild(crearTarjeta(notaDestacada));
        }
    
        // 2. Distribuir las notas restantes en las dos secciones de grid
        const mitad = Math.ceil(otrasNotas.length / 2);
        const notasArriba = otrasNotas.slice(0, mitad);
        const notasAbajo = otrasNotas.slice(mitad);
    
        notasArriba.forEach(nota => seccionGridArriba.appendChild(crearTarjeta(nota)));
        notasAbajo.forEach(nota => seccionGridAbajo.appendChild(crearTarjeta(nota)));
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
        const sinopsis = generarSinopsis(nota.cuerpo, 25);
        const enlacePrincipalHTML = `<a href="#" class="enlace-principal-tarjeta" data-id="${nota.id}">${esDestacada ? `<div class="imagen-container"><img src="${imagenPrincipal.url}" alt="${imagenPrincipal.alt}"></div>` : `<img src="${imagenPrincipal.url}" alt="${imagenPrincipal.alt}">`}<div class="contenido-container">${tituloHTML}<p>${sinopsis}</p><span class="tiempo-lectura">${tiempoLectura}</span></div></a>`;
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
        articleContent.innerHTML = `<h2>${nota.titulo}</h2><div class="metadata-articulo"><span>📅 Publicado el ${fechaNota}</span><span>⏱️ ${calcularTiempoLectura(nota.cuerpo)}</span></div><img src="${imagenPrincipal.url}" alt="${imagenPrincipal.alt}"><div class="cuerpo-articulo">${nota.cuerpo}</div>`;
        renderizarNotasRelacionadas(id);
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
    
    function calcularTiempoLectura(texto) {
        if (!texto || typeof texto !== 'string') return 'Lectura de 0 min';
        const div = document.createElement('div');
        div.innerHTML = texto;
        const textoPlano = div.textContent || div.innerText || "";
        const palabrasPorMinuto = 200;
        const numeroDePalabras = textoPlano.trim().split(/\s+/).length;
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
    
    // --- LÓGICA DEL BOTÓN "VOLVER ARRIBA" ---
    window.addEventListener("scroll", function() {
        if (window.scrollY > 300) { backToTopBtn.classList.add("visible"); } 
        else { backToTopBtn.classList.remove("visible"); }
    });
    backToTopBtn.addEventListener("click", function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});