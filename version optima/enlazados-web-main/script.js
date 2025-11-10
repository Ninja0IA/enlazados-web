// ==================== Firebase ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy, where, doc, updateDoc, increment, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// ==================== App ====================
document.addEventListener("DOMContentLoaded", () => {
  // DOM refs
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
  const slogan = document.getElementById("slogan");

  const seccionDestacada = document.getElementById("seccion-destacada-dinamica");
  const seccionGridArriba = document.getElementById("seccion-grid-arriba");
  const seccionGridAbajo = document.getElementById("seccion-grid-abajo");
  const seccionMasLeidas = document.getElementById("seccion-mas-leidas");

  // Filtros (Fase 1)
  const buscadorNotas = document.getElementById("buscador-notas");
  const botonesOrden = document.querySelectorAll(".botones-orden button");
  let terminoBusqueda = "";
  let ordenActual = "recientes";

  // ======== Tema + Halloween ========
  const btnToggleTema = document.getElementById("btn-toggle-tema");
  const overlayTormenta = document.getElementById("efecto-tormenta");
  const sonidoMaullido = document.getElementById("sonido-maullido");

  function setSlogan(tema) {
    if (!slogan) return;
    if (tema === "oscuro") {
      slogan.textContent = "Enlazados: Contigo, con el sur de Tamaulipas. 🎃🦇⚡";
    } else {
      slogan.textContent = "Enlazados: Contigo, con el sur de Tamaulipas. ☀️🌊🌴";
    }
  }

  const aplicarTemaGuardado = () => {
    const tema = localStorage.getItem("tema") || "claro";
    document.body.classList.toggle("modo-oscuro", tema === "oscuro");
    if (btnToggleTema) {
      btnToggleTema.textContent = (tema === "oscuro") ? "☀️ Modo claro" : "🌙 Modo oscuro";
      btnToggleTema.setAttribute("aria-pressed", tema === "oscuro" ? "true" : "false");
    }
    setSlogan(tema);
  };
  aplicarTemaGuardado();

  if (btnToggleTema) {
    btnToggleTema.addEventListener("click", async () => {
      const actual = localStorage.getItem("tema") || "claro";
      const pasandoAOscuro = actual !== "oscuro";
      const nuevo = pasandoAOscuro ? "oscuro" : "claro";
      localStorage.setItem("tema", nuevo);

      // Cinemática Halloween al pasar a oscuro
      if (pasandoAOscuro) {
        try {
          if (overlayTormenta) {
            overlayTormenta.classList.add("activo");
            setTimeout(() => overlayTormenta.classList.remove("activo"), 1100);
          }
          if (sonidoMaullido) { await sonidoMaullido.play().catch(()=>{}); }
        } catch (_) {}
      }

      aplicarTemaGuardado();
    });
  }

  let todasLasNotas = [];

  // Fecha y frase
  const hoy = new Date();
  const opcionesFecha = { year: "numeric", month: "long", day: "numeric" };
  if (fechaElemento) fechaElemento.textContent = hoy.toLocaleString("es-ES", opcionesFecha);
  const frases = [
    "El único modo de hacer un gran trabajo es amar lo que haces.",
    "La vida es como una bicicleta, para mantener el equilibrio debes seguir moviéndote.",
    "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito."
  ];
  if (fraseElemento) fraseElemento.textContent = `"${frases[Math.floor(Math.random() * frases.length)]}"`;

  // ==================== Cargar notas ====================
  async function cargarNotasDesdeFirestore() {
    if (!seccionDestacada || !seccionGridArriba || !seccionGridAbajo || !loader) return;
    try {
      const qNotas = query(
        collection(db, "notas"),
        where("esVisible", "==", true),
        orderBy("prioridad"),
        orderBy("fecha", "desc")
      );
      const snap = await getDocs(qNotas);

      todasLasNotas = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          views: typeof data.views === "number" ? data.views : 0,
          media: Array.isArray(data.media) ? data.media : [],
          // campos opcionales para mejor matching
          categoria: data.categoria || data.tipo || "",
          etiquetas: Array.isArray(data.etiquetas) ? data.etiquetas : []
        };
      });

      if (todasLasNotas.length === 0) {
        mensajeSinNotas?.classList.remove("hidden");
        seccionDestacada.innerHTML = "";
        seccionGridArriba.innerHTML = "";
        seccionGridAbajo.innerHTML = "";
        seccionMasLeidas.innerHTML = "";
      } else {
        mensajeSinNotas?.classList.add("hidden");
        renderizarPaginaPrincipal();
        await renderizarMasLeidas();
      }
    } catch (e) {
      console.error("Error al cargar las notas desde Firestore:", e);
      mainView.innerHTML = `<p id="mensaje-sin-notas">Lo sentimos, no pudimos cargar las noticias. Revisa la consola para más detalles.</p>`;
    } finally {
      loader.style.display = "none";
    }
  }
  cargarNotasDesdeFirestore();

  // ==================== Render principal ====================
  function renderizarPaginaPrincipal() {
    seccionDestacada.innerHTML = "";
    seccionGridArriba.innerHTML = "";
    seccionGridAbajo.innerHTML = "";

    const visibles = aplicarFiltrosYOrden(todasLasNotas);
    if (!visibles.length) return;

    // Destacada
    seccionDestacada.appendChild(crearTarjeta(visibles[0], true));
    // Arriba (1..6)
    visibles.slice(1, 7).forEach(n => seccionGridArriba.appendChild(crearTarjeta(n, false)));
    // Abajo (resto)
    visibles.slice(7).forEach(n => seccionGridAbajo.appendChild(crearTarjeta(n, false)));
  }

  // ==================== Filtros y orden ====================
  function aplicarFiltrosYOrden(notas) {
    let lista = [...notas];

    if (terminoBusqueda.trim() !== "") {
      const t = terminoBusqueda.toLowerCase();
      lista = lista.filter(n => {
        const titulo = (n.titulo || "").toLowerCase();
        const cuerpoPlano = quitarHTML(n.cuerpo || "").toLowerCase();
        return titulo.includes(t) || cuerpoPlano.includes(t);
      });
    }

    if (ordenActual === "recientes") {
      lista.sort((a, b) => b.fecha?.toDate?.() - a.fecha?.toDate?.());
    } else if (ordenActual === "antiguas") {
      lista.sort((a, b) => a.fecha?.toDate?.() - b.fecha?.toDate?.());
    } else if (ordenActual === "prioridad") {
      lista.sort((a, b) => (a.prioridad ?? 999) - (b.prioridad ?? 999) || (b.fecha?.toDate?.() - a.fecha?.toDate?.()));
    }

    return lista;
  }

  // ==================== Tarjetas ====================
  function crearTarjeta(nota, esDestacada = false) {
    const article = document.createElement("article");
    article.className = esDestacada ? "articulo-destacado" : "articulo-grid";

    const imgObj = (nota.media || []).find(m => m.tipo === "imagen") || { url: "", alt: "Imagen no disponible" };
    const tiempoLectura = calcularTiempoLectura(nota.cuerpo || "");
    const tituloHTML = esDestacada ? `<h2>${nota.titulo || ""}</h2>` : `<h3>${nota.titulo || ""}</h3>`;

    const shareText = encodeURIComponent(nota.titulo || "ENLAZADOS");
    const shareURL = encodeURIComponent(`${location.origin}/#articulo/${nota.id}`);

    const enlacePrincipalHTML = `
      <a href="#" class="enlace-principal-tarjeta" data-id="${nota.id}">
        ${esDestacada
          ? `<div class="imagen-container"><img src="${imgObj.url}" alt="${imgObj.alt}"></div>`
          : `<img src="${imgObj.url}" alt="${imgObj.alt}">`}
        <div class="contenido-container">
          ${tituloHTML}
          <p>${generarSinopsis(nota.cuerpo || "", 25)}</p>
          <span class="tiempo-lectura">${tiempoLectura}</span>
        </div>
      </a>`;

    const botonesCompartirHTML = `
      <div class="share-container">
        <span>Compartir:</span>
        <div class="share-icons">
          <a href="https://twitter.com/intent/tweet?url=${shareURL}&text=${shareText}" target="_blank" class="twitter-share" title="Compartir en X/Twitter">X</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${shareURL}" target="_blank" class="facebook-share" title="Compartir en Facebook">FB</a>
          <a href="https://api.whatsapp.com/send?text=${shareText}%20${shareURL}" target="_blank" class="whatsapp-share" title="Compartir en WhatsApp">WA</a>
        </div>
      </div>`;

    article.innerHTML = enlacePrincipalHTML + botonesCompartirHTML;

    article.querySelector(".enlace-principal-tarjeta").addEventListener("click", (e) => {
      e.preventDefault();
      mostrarArticulo(nota.id);
    });

    return article;
  }

  // ==================== Utils ====================
  function generarSinopsis(html, limitePalabras) {
    const div = document.createElement("div");
    div.innerHTML = html;
    const textoPlano = div.textContent || div.innerText || "";
    const palabras = textoPlano.trim().split(/\s+/);
    if (palabras.length <= limitePalabras) return textoPlano;
    return palabras.slice(0, limitePalabras).join(" ") + ".";
  }
  function quitarHTML(html) {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.textContent || d.innerText || "";
  }
  function calcularTiempoLectura(texto) {
    const plano = quitarHTML(texto || "");
    const ppm = 200;
    const minutos = Math.max(1, Math.ceil(plano.split(/\s+/).filter(Boolean).length / ppm));
    return `Lectura de ${minutos} min`;
  }

  // ==================== Artículo + vistas + relacionadas ====================
  async function mostrarArticulo(id) {
    const nota = todasLasNotas.find(n => n.id === id);
    if (!nota) return;

    mainView.classList.add("hidden");
    articleView.classList.remove("hidden");

    // Vistas (no repetir en misma sesión)
    const sessionKey = `viewed_${id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      try {
        await updateDoc(doc(db, "notas", id), { views: increment(1) });
        sessionStorage.setItem(sessionKey, "1");
        nota.views = (nota.views || 0) + 1;
      } catch (e) { console.warn("No se pudo incrementar views:", e); }
    }

    const fechaNota = nota.fecha?.toDate?.().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) || "";
    const imagenPrincipal = (nota.media || []).find(m => m.tipo === "imagen") || { url: "", alt: "Imagen no disponible" };

    articleContent.innerHTML = `
      <h2>${nota.titulo || ""}</h2>
      <div class="metadata-articulo">
        <span>📅 ${fechaNota}</span>
        <span>⏱️ ${calcularTiempoLectura(nota.cuerpo || "")}</span>
      </div>
      <img src="${imagenPrincipal.url}" alt="${imagenPrincipal.alt}">
      <div class="cuerpo-articulo">${nota.cuerpo || ""}</div>
    `;

    renderizarNotasRelacionadasAvanzada(nota);
    window.scrollTo(0, 0);
  }

  // --- Matching por título/categoría/etiquetas + fallback ---
  function puntuarRelacion(base, candidata) {
    if (base.id === candidata.id) return -Infinity;
    let score = 0;

    const tituloBase = (base.titulo || "").toLowerCase();
    const tituloCand = (candidata.titulo || "").toLowerCase();

    // Palabras clave del título (sin stopwords básicas)
    const stop = new Set(["de","la","el","y","en","a","los","las","un","una","del","por","para","con","al"]);
    const palabras = tituloBase.split(/\W+/).filter(w => w && !stop.has(w));

    palabras.forEach(p => { if (tituloCand.includes(p)) score += 2; });

    // Coincidencia de categoría o etiquetas
    if (base.categoria && candidata.categoria && base.categoria === candidata.categoria) score += 3;

    const setBaseEtiq = new Set((base.etiquetas || []).map(e => String(e).toLowerCase()));
    (candidata.etiquetas || []).forEach(e => { if (setBaseEtiq.has(String(e).toLowerCase())) score += 1.5; });

    // Boost por cercanía temporal (si existen fechas)
    const fb = base.fecha?.toDate?.()?.getTime?.() || 0;
    const fc = candidata.fecha?.toDate?.()?.getTime?.() || 0;
    if (fb && fc) {
      const diffDays = Math.abs(fb - fc) / (1000*60*60*24);
      if (diffDays <= 30) score += 1;
    }
    // Pequeño boost por popularidad
    score += Math.min(2, (candidata.views || 0) / 1000);

    return score;
  }

  function renderizarNotasRelacionadasAvanzada(notaBase) {
    const candidatos = todasLasNotas.filter(n => n.id !== notaBase.id);
    let ordenados = candidatos
      .map(n => ({ n, s: puntuarRelacion(notaBase, n) }))
      .filter(x => x.s > 0)
      .sort((a,b) => b.s - a.s)
      .map(x => x.n);

    // Fallback si no hay suficientes
    if (ordenados.length < 5) {
      const faltan = 5 - ordenados.length;
      const pool = candidatos.filter(c => !ordenados.includes(c));
      ordenados = ordenados.concat(pool.sort(()=>0.5 - Math.random()).slice(0, faltan));
    }

    // Construir carrusel (5 elementos máx.)
    const seleccion = ordenados.slice(0,5);
    if (!seleccion.length) return;

    const wrap = document.createElement("div");
    wrap.className = "notas-relacionadas";
    wrap.innerHTML = `<h3>Notas relacionadas</h3>`;

    const carruselWrap = document.createElement("div");
    carruselWrap.className = "relacionadas-wrapper";

    const carrusel = document.createElement("div");
    carrusel.className = "relacionadas-carrusel";

    seleccion.forEach(n => {
      const img = (n.media || []).find(m => m.tipo === "imagen") || { url:"", alt:"Imagen no disponible" };
      const card = document.createElement("a");
      card.href = "#";
      card.className = "rel-card";
      card.innerHTML = `
        <img src="${img.url}" alt="${img.alt}">
        <div class="rel-body">
          <div class="rel-title">${n.titulo || ""}</div>
          <div class="rel-meta">
            <span>${n.categoria || "General"}</span>
            <span>${n.views || 0} vistas</span>
          </div>
        </div>
      `;
      card.addEventListener("click",(e)=>{ e.preventDefault(); mostrarArticulo(n.id); });
      carrusel.appendChild(card);
    });

    const btnPrev = document.createElement("button");
    btnPrev.className = "rel-nav rel-prev";
    btnPrev.setAttribute("aria-label","Anterior");
    btnPrev.textContent = "‹";
    btnPrev.addEventListener("click", ()=> { carrusel.scrollBy({left:-300, behavior:"smooth"}); });

    const btnNext = document.createElement("button");
    btnNext.className = "rel-nav rel-next";
    btnNext.setAttribute("aria-label","Siguiente");
    btnNext.textContent = "›";
    btnNext.addEventListener("click", ()=> { carrusel.scrollBy({left:300, behavior:"smooth"}); });

    carruselWrap.appendChild(btnPrev);
    carruselWrap.appendChild(carrusel);
    carruselWrap.appendChild(btnNext);

    wrap.appendChild(carruselWrap);
    articleContent.appendChild(wrap);
  }

  // ==================== Más leídas ====================
  async function renderizarMasLeidas() {
    if (!seccionMasLeidas) return;
    seccionMasLeidas.innerHTML = "";

    try {
      const qTop = query(
        collection(db, "notas"),
        where("esVisible", "==", true),
        orderBy("views", "desc"),
        limit(6)
      );
      const snap = await getDocs(qTop);
      const top = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (!top.length) {
        seccionMasLeidas.innerHTML = "<p>No hay notas con vistas registradas todavía.</p>";
        return;
      }

      const grid = document.createElement("div");
      grid.className = "grid-minis";
      top.forEach(n => {
        const img = (n.media || []).find(m => m.tipo === "imagen") || { url: "", alt: "Imagen no disponible" };
        const a = document.createElement("a");
        a.className = "tarjeta-min";
        a.href = "#";
        a.innerHTML = `
          <img src="${img.url}" alt="${img.alt}">
          <div class="mini-content">
            <h4>${n.titulo || ""}</h4>
            <div class="meta-mini">${(n.views || 0)} vistas</div>
          </div>
        `;
        a.addEventListener("click", e => { e.preventDefault(); mostrarArticulo(n.id); });
        grid.appendChild(a);
      });
      seccionMasLeidas.appendChild(grid);
    } catch (e) {
      console.warn("Índice faltante para 'views'. Usando orden local.", e);
      const topLocal = [...todasLasNotas].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,6);
      if (topLocal.length) {
        const grid = document.createElement("div");
        grid.className = "grid-minis";
        topLocal.forEach(n => {
          const img = (n.media || []).find(m => m.tipo === "imagen") || { url: "", alt: "Imagen no disponible" };
          const a = document.createElement("a");
          a.className = "tarjeta-min";
          a.href = "#";
          a.innerHTML = `
            <img src="${img.url}" alt="${img.alt}">
            <div class="mini-content">
              <h4>${n.titulo || ""}</h4>
              <div class="meta-mini">${(n.views || 0)} vistas</div>
            </div>
          `;
          a.addEventListener("click", e => { e.preventDefault(); mostrarArticulo(n.id); });
          grid.appendChild(a);
        });
        seccionMasLeidas.appendChild(grid);
      }
    }
  }

  // ==================== Menú, scroll y controles ====================
  function regresarAPaginaPrincipal() {
    articleView.classList.add("hidden");
    mainView.classList.remove("hidden");
    menuLateral.classList.remove("visible");
    barraTitulo.classList.remove("desplazado");
    mainView.classList.remove("desplazado");
    footer.classList.remove("desplazado");
  }
  btnMenu?.addEventListener("click", () => {
    menuLateral.classList.toggle("visible");
    barraTitulo.classList.toggle("desplazado");
    mainView.classList.toggle("desplazado");
    footer.classList.toggle("desplazado");
  });
  btnVolver?.addEventListener("click", regresarAPaginaPrincipal);
  btnInicioMenu?.addEventListener("click", e => { e.preventDefault(); regresarAPaginaPrincipal(); });
  tituloPrincipal?.addEventListener("click", e => { e.preventDefault(); regresarAPaginaPrincipal(); });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) backToTopBtn.classList.add("visible");
    else backToTopBtn.classList.remove("visible");
  });
  backToTopBtn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Buscador + orden (Fase 1)
  buscadorNotas?.addEventListener("input", (e) => {
    terminoBusqueda = e.target.value || "";
    renderizarPaginaPrincipal();
  });
  botonesOrden?.forEach(btn => {
    btn.addEventListener("click", () => {
      botonesOrden.forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
      ordenActual = btn.dataset.orden || "recientes";
      renderizarPaginaPrincipal();
    });
  });
});
