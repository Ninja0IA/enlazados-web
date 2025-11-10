// ========== Firebase ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy, where,
  doc, addDoc, setDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ========== Estado global ==========
let notas = [];              // todas las notas
let notaActual = null;       // objeto nota seleccionada
let relacionadasSel = [];    // ids seleccionados
let usuario = null;

// ========== Utilidades UI ==========
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const setText = (el, t) => { if (el) el.textContent = t; };

function toast(msg="Listo") {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 1800);
}

function fraseElegante() {
  const frases = [
    "“Cada palabra bien elegida ilumina a quien la lee.”",
    "“Escribir es ordenar el mundo con tinta y paciencia.”",
    "“Una buena nota es un faro en la tormenta informativa.”",
    "“El rigor del dato es la elegancia del periodismo.”",
    "“Quien informa con claridad deja una huella imborrable.”"
  ];
  return frases[Math.floor(Math.random()*frases.length)];
}

function aplicarTemaGuardado() {
  const tema = localStorage.getItem("tema") || "claro";
  document.body.classList.toggle("modo-oscuro", tema === "oscuro");
  const btn = $("#btn-toggle-tema");
  if (btn) {
    btn.textContent = tema === "oscuro" ? "☀️ Modo claro" : "🌙 Modo oscuro";
    btn.setAttribute("aria-pressed", tema === "oscuro" ? "true" : "false");
  }
}

// ========== Autenticación ==========
function actualizarUIAuth(user) {
  usuario = user || null;
  $("#btn-login").style.display = user ? "none" : "inline-block";
  $("#btn-logout").style.display = user ? "inline-block" : "none";
  const info = $("#user-info");
  if (user) {
    info.textContent = `Conectado como ${user.email}`;
    info.style.display = "inline-block";
  } else {
    info.style.display = "none";
  }
}

$("#btn-login")?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    toast("No se pudo iniciar sesión.");
  }
});

$("#btn-logout")?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  actualizarUIAuth(user);
});

// ========== Tema ==========
aplicarTemaGuardado();
$("#btn-toggle-tema")?.addEventListener("click", () => {
  const actual = localStorage.getItem("tema") || "claro";
  const nuevo = (actual === "oscuro") ? "claro" : "oscuro";
  localStorage.setItem("tema", nuevo);
  aplicarTemaGuardado();
});

// Frase motivacional al entrar
setText($("#frase-motivacional"), fraseElegante());

// ========== Carga de datos ==========
async function cargarNotas() {
  const qNotas = query(
    collection(db, "notas"),
    where("esVisible", "==", true),
    orderBy("prioridad"),
    orderBy("fecha", "desc")
  );

  const snap = await getDocs(qNotas);
  notas = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      views: typeof data.views === "number" ? data.views : 0,
      media: Array.isArray(data.media) ? data.media : [],
      categoria: data.categoria || data.tipo || "",
      etiquetas: Array.isArray(data.etiquetas) ? data.etiquetas : [],
    };
  });

  renderTabla(notas);
  renderSugerenciasRelacionadas();
  renderEstadisticas();
}

function renderEstadisticas() {
  setText($("#stat-total"), String(notas.length));
  const vistas = notas.reduce((a,n)=> a + (n.views||0), 0);
  setText($("#stat-vistas"), String(vistas));
  const top = [...notas].sort((a,b)=>(b.views||0)-(a.views||0))[0];
  setText($("#stat-top"), top ? `${top.titulo} (${top.views||0} vistas)` : "—");
}

function renderTabla(lista) {
  const tbody = $("#tbody-notas");
  tbody.innerHTML = "";
  const busq = ($("#buscar").value || "").toLowerCase();

  lista
    .filter(n => (n.titulo||"").toLowerCase().includes(busq))
    .forEach(n => {
      const tr = document.createElement("tr");

      const problemas = diagnosticarNota(n);
      const estado = problemas.length
        ? `<span class="badge warn">${problemas.length} alertas</span>`
        : `<span class="badge ok">OK</span>`;

      tr.innerHTML = `
        <td>${n.titulo || "(Sin título)"}</td>
        <td>${n.categoria || "—"}</td>
        <td>${n.prioridad ?? "—"}</td>
        <td>${n.views || 0}</td>
        <td>${n.esVisible ? "Sí" : "No"}</td>
        <td>${estado}</td>
        <td>
          <button class="btn btn-editar" data-id="${n.id}">Editar</button>
          <button class="btn btn-vis" data-id="${n.id}">${n.esVisible ? "Ocultar" : "Mostrar"}</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  // Listeners
  $$(".btn-editar").forEach(b => b.addEventListener("click", () => editarNota(b.dataset.id)));
  $$(".btn-vis").forEach(b => b.addEventListener("click", () => toggleVisibilidad(b.dataset.id)));
}

function diagnosticarNota(n) {
  const issues = [];
  const textoPlano = quitarHTML(n.cuerpo || "");
  if (!n.titulo || n.titulo.trim().length < 5) issues.push("Título muy corto o ausente.");
  if (!textoPlano || textoPlano.trim().length < 40) issues.push("Cuerpo demasiado corto.");
  const imagen = (n.media||[]).find(m=>m.tipo==="imagen");
  if (!imagen || !imagen.url) issues.push("Sin imagen principal.");
  if (!n.categoria) issues.push("Sin categoría.");
  return issues;
}

function renderSugerenciasRelacionadas() {
  const wrap = $("#sugerencias-rel");
  const selectHiper = $("#select-hiper");
  wrap.innerHTML = "";
  selectHiper.innerHTML = "<option value=''>— Selecciona una nota —</option>";

  notas.forEach(n => {
    // chips sugeridos
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "rel-chip";
    chip.textContent = n.titulo;
    chip.dataset.id = n.id;
    chip.addEventListener("click", () => toggleRelacionada(n.id, n.titulo));
    wrap.appendChild(chip);

    // selector hipertexto
    const opt = document.createElement("option");
    opt.value = n.id;
    opt.textContent = n.titulo;
    selectHiper.appendChild(opt);
  });

  // refrescar selección activa
  pintarRelacionadasSeleccionadas();
}

function toggleRelacionada(id, titulo) {
  const idx = relacionadasSel.indexOf(id);
  if (idx >= 0) relacionadasSel.splice(idx, 1);
  else if (relacionadasSel.length < 5) relacionadasSel.push(id);

  pintarRelacionadasSeleccionadas();
}

function pintarRelacionadasSeleccionadas() {
  // chips activas
  $$(".rel-chip").forEach(ch => {
    if (relacionadasSel.includes(ch.dataset.id)) ch.classList.add("activa");
    else ch.classList.remove("activa");
  });
  // lista visible
  const cont = $("#rel-seleccionadas");
  cont.innerHTML = "";
  relacionadasSel.forEach(id => {
    const n = notas.find(x=>x.id===id);
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = n ? n.titulo : id;
    cont.appendChild(span);
  });
}

// ========== Nueva / Editar ==========
function limpiarFormulario() {
  $("#nota-id").value = "";
  $("#titulo").value = "";
  $("#categoria").value = "";
  $("#etiquetas").value = "";
  $("#prioridad").value = 5;
  $("#imagen-url").value = "";
  $("#imagen-alt").value = "";
  $("#es-visible").checked = true;
  $("#cuerpo").value = "";

  relacionadasSel = [];
  pintarRelacionadasSeleccionadas();

  setText($("#frase-motivacional"), fraseElegante());
  notaActual = null;
}

async function editarNota(id) {
  const n = notas.find(x=>x.id===id);
  if (!n) return;
  notaActual = n;

  $("#nota-id").value = n.id;
  $("#titulo").value = n.titulo || "";
  $("#categoria").value = n.categoria || "";
  $("#etiquetas").value = (n.etiquetas || []).join(", ");
  $("#prioridad").value = n.prioridad ?? 5;

  const img = (n.media || []).find(m=>m.tipo==="imagen") || {url:"", alt:""};
  $("#imagen-url").value = img.url || "";
  $("#imagen-alt").value = img.alt || "";

  $("#es-visible").checked = !!n.esVisible;
  $("#cuerpo").value = n.cuerpo || "";

  relacionadasSel = Array.isArray(n.relacionadas) ? [...n.relacionadas].slice(0,5) : [];
  pintarRelacionadasSeleccionadas();

  setText($("#frase-motivacional"), fraseElegante());
  toast("Nota cargada para edición.");
}

async function toggleVisibilidad(id) {
  const n = notas.find(x=>x.id===id);
  if (!n) return;
  const nuevo = !n.esVisible;
  await updateDoc(doc(db, "notas", id), { esVisible: nuevo });
  toast(nuevo ? "Nota visible" : "Nota oculta");
  await cargarNotas();
}

// Insertar hipertexto en el cursor del textarea
$("#btn-insertar-enlace")?.addEventListener("click", () => {
  const id = $("#select-hiper").value;
  if (!id) return;
  const nota = notas.find(n => n.id === id);
  if (!nota) return;

  const ta = $("#cuerpo");
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const antes = ta.value.slice(0, start);
  const despues = ta.value.slice(end);
  const html = `<a href="#articulo/${id}">${nota.titulo}</a>`;
  ta.value = `${antes}${html}${despues}`;
  ta.focus();
  ta.selectionEnd = start + html.length;

  toast("Enlace insertado.");
});

// Guardar / borrar
$("#btn-guardar")?.addEventListener("click", guardarNota);
$("#btn-borrar")?.addEventListener("click", borrarNota);
$("#btn-nueva")?.addEventListener("click", limpiarFormulario);
$("#btn-refrescar")?.addEventListener("click", cargarNotas);
$("#btn-diagnosticar")?.addEventListener("click", ejecutarDiagnostico);

$("#buscar")?.addEventListener("input", () => renderTabla(notas));

async function guardarNota() {
  if (!usuario) { toast("Inicia sesión para guardar."); return; }

  const id = $("#nota-id").value.trim();
  const titulo = $("#titulo").value.trim();
  const categoria = $("#categoria").value.trim();
  const etiquetas = $("#etiquetas").value.split(",").map(s=>s.trim()).filter(Boolean);
  const prioridad = Number($("#prioridad").value) || 5;
  const url = $("#imagen-url").value.trim();
  const alt = $("#imagen-alt").value.trim();
  const esVisible = $("#es-visible").checked;
  const cuerpo = $("#cuerpo").value;

  const media = url ? [{ tipo:"imagen", url, alt }] : [];

  const data = {
    titulo, categoria, etiquetas, prioridad, esVisible, cuerpo, media,
    relacionadas: relacionadasSel
  };

  try {
    if (id) {
      await setDoc(doc(db, "notas", id), data, { merge:true });
      toast("Nota actualizada.");
    } else {
      const ref = await addDoc(collection(db, "notas"), {
        ...data,
        fecha: new Date(), // si no estás usando serverTimestamp
        views: 0
      });
      $("#nota-id").value = ref.id;
      toast("Nota creada.");
    }
    setText($("#frase-motivacional"), fraseElegante());
    await cargarNotas();
  } catch (e) {
    console.error(e);
    toast("Error al guardar.");
  }
}

async function borrarNota() {
  if (!usuario) { toast("Inicia sesión para borrar."); return; }
  const id = $("#nota-id").value.trim();
  if (!id) { toast("No hay nota cargada."); return; }
  if (!confirm("¿Seguro que quieres borrar esta nota?")) return;

  try {
    await deleteDoc(doc(db, "notas", id));
    toast("Nota borrada.");
    limpiarFormulario();
    await cargarNotas();
  } catch (e) {
    console.error(e);
    toast("Error al borrar.");
  }
}

// ========== Diagnóstico ==========
function ejecutarDiagnostico() {
  const cont = $("#diagnostico-lista");
  if (!notas.length) { cont.textContent = "No hay notas para analizar."; return; }

  const lista = document.createElement("div");
  notas.forEach(n => {
    const issues = diagnosticarNota(n);
    const div = document.createElement("div");
    const estado = issues.length ? `<span class="badge warn">${issues.length} alertas</span>` : `<span class="badge ok">OK</span>`;
    div.innerHTML = `<p><strong>${n.titulo || "(Sin título)"}:</strong> ${estado} ${issues.length ? "— " + issues.join(" · ") : ""}</p>`;
    lista.appendChild(div);
  });

  cont.innerHTML = "";
  cont.appendChild(lista);
}

// ========== Helpers ==========
function quitarHTML(html) {
  const d = document.createElement("div"); d.innerHTML = html;
  return d.textContent || d.innerText || "";
}

// ========== Init ==========
cargarNotas().catch(e => console.error(e));
