document.addEventListener("DOMContentLoaded", function() {

    /* ==================== 1. Generar y mostrar la fecha y la frase ==================== */
    const fechaElemento = document.querySelector(".fecha");
    const hoy = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    fechaElemento.textContent = hoy.toLocaleString('es-ES', opcionesFecha);

    // Array de frases motivacionales (versión extendida y multilingüe).
    const frases = [
        "El único modo de hacer un gran trabajo es amar lo que haces.", // Español
        "La vida es como una bicicleta, para mantener el equilibrio debes seguir moviéndote.", // Español
        "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito.", // Español
        "The future belongs to those who believe in the beauty of their dreams.", // Inglés
        "The only impossible journey is the one you never begin.", // Inglés
        "Believe you can and you're halfway there.", // Inglés
        "七転び八起き (Nanakorobi yaoki) - Cae siete veces, levántate ocho.", // Japonés
        "継続は力なり (Keizoku wa chikara nari) - La perseverancia es poder.", // Japonés
        "明日は明日の風が吹く (Ashita wa ashita no kaze ga fuku) - Mañana soplará el viento de mañana." // Japonés
    ];
    
    const fraseElemento = document.querySelector(".frase");
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    fraseElemento.textContent = `"${fraseAleatoria}"`;

    /* ==================== 2. Cargar y organizar las notas desde el JSON ==================== */
    
    const seccionDestacada = document.querySelector(".seccion-destacada");
    const seccionGrid = document.querySelector(".seccion-grid");
    const loader = document.getElementById("loader");

    function calcularTiempoLectura(texto) {
        const palabrasPorMinuto = 200;
        const numeroDePalabras = texto.trim().split(/\s+/).length;
        const minutos = Math.ceil(numeroDePalabras / palabrasPorMinuto);
        return `Lectura de ${minutos} min`;
    }

    if (seccionDestacada && seccionGrid && loader) {
        fetch('notas.json')
            .then(response => response.json())
            .then(data => {
                const notaDestacada = data.find(nota => nota.tipo === 'destacada');
                const notasGrid = data.filter(nota => nota.tipo === 'grid');
                seccionDestacada.innerHTML = '';
                seccionGrid.innerHTML = '';

                if (notaDestacada) {
                    const link = document.createElement("a");
                    link.href = "#";
                    link.classList.add("articulo-destacado");
                    
                    const shareURL = encodeURIComponent(window.location.href);
                    const shareText = encodeURIComponent(notaDestacada.titulo);
                    const tiempoLectura = calcularTiempoLectura(notaDestacada.cuerpo);

                    link.innerHTML = `
                        <div class="imagen-container">
                            <img src="${notaDestacada.imagen}" alt="${notaDestacada.altImagen}">
                        </div>
                        <div class="contenido-container">
                            <h2>${notaDestacada.titulo}</h2>
                            <p>${notaDestacada.cuerpo}</p>
                            <span class="tiempo-lectura">${tiempoLectura}</span>
                            <div class="share-container">
                                <span>Compartir:</span>
                                <div class="share-icons">
                                    <a href="https://twitter.com/intent/tweet?url=${shareURL}&text=${shareText}" target="_blank" class="twitter-share" title="Compartir en X/Twitter"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                                    <a href="https://www.facebook.com/sharer/sharer.php?u=${shareURL}" target="_blank" class="facebook-share" title="Compartir en Facebook"><svg viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/></svg></a>
                                    <a href="https://api.whatsapp.com/send?text=${shareText}%20${shareURL}" target="_blank" class="whatsapp-share" title="Compartir en WhatsApp"><svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m.01 18.11c-1.53 0-3.01-.4-4.29-1.15l-.3-.18-3.18.84.85-3.1-.2-.31c-.82-1.31-1.26-2.83-1.26-4.41 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24m4.52-6.13c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.29.18-.54.06s-1.05-.39-2-1.23c-.74-.66-1.23-1.47-1.38-1.72s-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.42.04-.3-.02-.42c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.55-.42-.31-.01-.48-.01c-.17 0-.43.06-.66.31s-.86.84-.86 2.04.88 2.37 1 2.54c.12.17 1.74 2.65 4.22 3.72.59.26 1.05.41 1.41.52.59.17 1.13.15 1.56.09.48-.07 1.47-.6 1.67-1.18s.21-1.07.15-1.18c-.07-.12-.23-.19-.48-.31"/></svg></a>
                                </div>
                            </div>
                        </div>
                    `;
                    seccionDestacada.appendChild(link);
                }

                notasGrid.forEach(nota => {
                    const link = document.createElement("a");
                    link.href = "#";
                    link.classList.add("articulo-grid");

                    const shareURL = encodeURIComponent(window.location.href);
                    const shareText = encodeURIComponent(nota.titulo);
                    const tiempoLectura = calcularTiempoLectura(nota.cuerpo);

                    link.innerHTML = `
                        <img src="${nota.imagen}" alt="${nota.altImagen}">
                        <div class="contenido-container">
                            <h3>${nota.titulo}</h3>
                            <p>${nota.cuerpo}</p>
                            <span class="tiempo-lectura">${tiempoLectura}</span>
                            <div class="share-container">
                                <span>Compartir:</span>
                                <div class="share-icons">
                                    <a href="https://twitter.com/intent/tweet?url=${shareURL}&text=${shareText}" target="_blank" class="twitter-share" title="Compartir en X/Twitter"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                                    <a href="https://www.facebook.com/sharer/sharer.php?u=${shareURL}" target="_blank" class="facebook-share" title="Compartir en Facebook"><svg viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/></svg></a>
                                    <a href="https://api.whatsapp.com/send?text=${shareText}%20${shareURL}" target="_blank" class="whatsapp-share" title="Compartir en WhatsApp"><svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m.01 18.11c-1.53 0-3.01-.4-4.29-1.15l-.3-.18-3.18.84.85-3.1-.2-.31c-.82-1.31-1.26-2.83-1.26-4.41 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24m4.52-6.13c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.29.18-.54.06s-1.05-.39-2-1.23c-.74-.66-1.23-1.47-1.38-1.72s-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.42.04-.3-.02-.42c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.55-.42-.31-.01-.48-.01c-.17 0-.43.06-.66.31s-.86.84-.86 2.04.88 2.37 1 2.54c.12.17 1.74 2.65 4.22 3.72.59.26 1.05.41 1.41.52.59.17 1.13.15 1.56.09.48-.07 1.47-.6 1.67-1.18s.21-1.07.15-1.18c-.07-.12-.23-.19-.48-.31"/></svg></a>
                                </div>
                            </div>
                        </div>
                    `;
                    seccionGrid.appendChild(link);
                });

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                const articlesToObserve = document.querySelectorAll('.articulo-destacado, .articulo-grid');
                articlesToObserve.forEach(article => observer.observe(article));

            })
            .catch(error => {
                console.error('Error al cargar las notas:', error);
                seccionDestacada.innerHTML = `<p style="color: red;">Lo sentimos, no pudimos cargar las noticias.</p>`;
            })
            .finally(() => {
                loader.style.display = 'none';
            });
    }

    /* ==================== 3. Lógica para el menú desplegable ==================== */
    const btnMenu = document.getElementById("btn-menu");
    const menuLateral = document.getElementById("menu-lateral");
    const barraTitulo = document.querySelector(".barra-titulo");
    const mainContent = document.querySelector("main");
    const footer = document.querySelector("footer");

    btnMenu.addEventListener("click", function() {
        menuLateral.classList.toggle("visible");
        barraTitulo.classList.toggle("desplazado");
        mainContent.classList.toggle("desplazado");
        footer.classList.toggle("desplazado");
    });

    /* ==================== 4. Lógica para el botón "Volver Arriba" ==================== */
    const backToTopBtn = document.getElementById("back-to-top-btn");

    window.addEventListener("scroll", function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("visible");
        } else {
            backToTopBtn.classList.remove("visible");
        }
    });

    backToTopBtn.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

});