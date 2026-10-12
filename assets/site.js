/* ---------- anclas de la version de una sola pagina ---------- */
// El QR impreso apunta a #finanzas y hay ligas compartidas a #prototipo y
// compania. Esas secciones ahora viven en otra pagina: si el ancla no existe
// aqui, se manda a donde quedo en vez de dejar al visitante en la portada.
const MUDANZA = {
  finanzas: "kaax.html#finanzas", prototipo: "kaax.html#prototipo",
  codigo: "kaax.html#codigo", conocenos: "nosotros.html",
  nosotros: "nosotros.html", productos: "productos.html",
  servicios: "servicios.html", contacto: "contacto.html",
};
{
  const id = location.hash.slice(1);
  if (id && MUDANZA[id] && !document.getElementById(id)) {
    location.replace(MUDANZA[id]);
  }
}

const sYear = document.getElementById("year");
if (sYear) sYear.textContent = new Date().getFullYear();

// ---- navegación ---------------------------------------------------------
const nav = document.getElementById("nav");
const navlist = document.getElementById("navlist");
const navtoggle = document.getElementById("navtoggle");
const mq = window.matchMedia("(max-width:720px)");

const syncNavList = () => { navlist.hidden = mq.matches && navtoggle.getAttribute("aria-expanded") !== "true"; };
navtoggle.onclick = () => {
  const open = navtoggle.getAttribute("aria-expanded") === "true";
  navtoggle.setAttribute("aria-expanded", String(!open));
  syncNavList();
};
navlist.addEventListener("click", (e) => {
  if (e.target.tagName === "A" && mq.matches) { navtoggle.setAttribute("aria-expanded", "false"); syncNavList(); }
});
mq.addEventListener("change", () => { navtoggle.setAttribute("aria-expanded", "false"); syncNavList(); });
syncNavList();

// La version transparente solo tiene sentido si detras hay una portada
// oscura. En las demas paginas la barra se queda clara siempre.
const conPortada = !!document.getElementById("inicio");
const fijarNav = () => nav.classList.toggle("stuck", !conPortada || scrollY > 8);
addEventListener("scroll", fijarNav, { passive: true });
fijarNav();

// Resalta la sección visible. rootMargin recorta la franja de decisión a una
// banda estrecha del centro, si no varias secciones "activas" a la vez.
const links = [...navlist.querySelectorAll("a")];
document.querySelectorAll("section[id]").forEach(s => {
  new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => {
      const h = a.getAttribute("href") || "";
      if (h.startsWith("#")) a.classList.toggle("active", h === "#" + s.id);
    });
  }), { rootMargin: "-45% 0px -50% 0px" }).observe(s);
});

// ---- aparición al desplazar --------------------------------------------
const io = new IntersectionObserver((es) => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
// Las barras de costo crecen al entrar en pantalla, proporcionales al valor.
const bars = document.getElementById("bars");
if (bars) {
  const max = Math.max(...[...bars.querySelectorAll(".fill")].map(f => +f.dataset.v));
  new IntersectionObserver((es, ob) => es.forEach(e => {
    if (!e.isIntersecting) return;
    bars.querySelectorAll(".fill").forEach((f, i) =>
      setTimeout(() => { f.style.width = (+f.dataset.v / max * 100) + "%"; }, i * 110));
    ob.disconnect();
  }), { threshold: .35 }).observe(bars);
}

// El video aparece solo si assets/campo.mp4 existe. Dejar un <video> con un
// src inexistente muestra un reproductor roto, peor que no mostrar nada.
const vfig = document.getElementById("video-campo");
const vid = document.getElementById("campo-video");
if (vfig && vid) {
  vid.addEventListener("loadedmetadata", () => {
    // La proporcion se decide con el archivo real, no de antemano: asi sirve
    // igual un clip vertical de telefono que uno horizontal de camara.
    vfig.classList.toggle("vertical", vid.videoHeight > vid.videoWidth);
    vfig.hidden = false;
  }, { once: true });
  vid.addEventListener("error", () => { vfig.remove(); }, { once: true });
  vid.querySelector("source")?.addEventListener("error", () => { vfig.remove(); }, { once: true });
}

/* ---------- testimonios, desde una hoja de cálculo ---------- */
/* Flujo: Google Forms → pestaña de respuestas → pestaña "Publicadas", que con
   un FILTER deja solo las filas con la casilla de aprobación marcada → esa
   pestaña (SOLO esa) se publica como CSV → esto la lee cada vez que alguien
   abre el sitio.

   Publicar es publicar: cualquiera con la liga ve ese CSV. Por eso se publica
   la pestaña derivada y nunca la de respuestas, que trae correos y horas. */
const TESTIMONIOS_CSV  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAbklxbAoGK2qbeXLWfzRok6N9TNKbuDknddB5758BSMlSqdBngDCutxwbG0dV-_5acDcMpzgTX5UN/pub?gid=1096177084&single=true&output=csv";
const TESTIMONIOS_FORM = "";   // ← pega aquí la liga del formulario

/* Un split(",") parte el comentario en la primera coma que traiga. Esto
   respeta comillas y saltos de línea dentro de una celda, que es como Sheets
   escribe cualquier texto con puntuación. */
function leerCSV(txt) {
  const filas = []; let fila = [], celda = "", dentro = false;
  txt = txt.replace(/\r\n?/g, "\n");
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (dentro) {
      if (c === '"') { if (txt[i + 1] === '"') { celda += '"'; i++; } else dentro = false; }
      else celda += c;
    }
    else if (c === '"') dentro = true;
    else if (c === ",") { fila.push(celda); celda = ""; }
    else if (c === "\n") { fila.push(celda); filas.push(fila); fila = []; celda = ""; }
    else celda += c;
  }
  fila.push(celda); filas.push(fila);
  return filas.filter(f => f.some(c => c.trim() !== ""));
}

const iniciales = (n) => n.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  .map(p => p[0]).join("").toUpperCase() || "·";

function tarjeta(nombre, cargo, texto) {
  const q = document.createElement("article");
  q.className = "quote";
  q.innerHTML = '<div class="qm" aria-hidden="true">\u201C</div><p></p>' +
    '<div class="who"><div class="ini"></div><div><b></b><span></span></div></div>';
  // textContent y no innerHTML: el texto llega de un formulario abierto
  // a cualquiera, así que se inserta como texto, nunca como marcado.
  q.querySelector("p").textContent         = texto.trim();
  q.querySelector(".ini").textContent      = iniciales(nombre || "");
  q.querySelector(".who b").textContent    = (nombre || "").trim();
  q.querySelector(".who span").textContent = (cargo  || "").trim();
  return q;
}

/* La cinta gira sin fin repitiendo el mismo juego de tarjetas y recorriendo
   exactamente el ancho de UN juego: al terminar, la copia siguiente esta
   justo donde estaba la primera y el salto no se ve.
   La duracion sale del ancho, no de un numero fijo, para que la velocidad de
   lectura no cambie cuando haya tres comentarios o treinta. */
function armarCinta(riel, juego, cinta) {
  const VEL = 55;                                 // px por segundo
  // El hueco sale del CSS: repetirlo aqui es un numero que algun dia deja
  // de coincidir, y entonces la cinta da un salto en cada vuelta.
  const GAP = parseFloat(getComputedStyle(riel).gap) || 0;
  const medir = () => {
    const paso = juego.getBoundingClientRect().width + GAP;
    riel.style.setProperty("--paso", paso + "px");
    riel.style.setProperty("--dur", (paso / VEL).toFixed(1) + "s");
    return paso;
  };
  const paso = medir();
  // Copias suficientes para cubrir la pantalla dos veces (y de sobra al girar
  // el telefono): con menos, al final del recorrido se abre un hueco.
  const copias = Math.ceil((Math.max(innerWidth, innerHeight) * 2) / paso);
  for (let i = 0; i < copias; i++) {
    const c = juego.cloneNode(true);
    c.setAttribute("aria-hidden", "true");        // que no se lea repetido
    riel.appendChild(c);
  }
  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(medir, 200); });
}

(async function testimonios() {
  const sec   = document.getElementById("testimonios");
  const cinta = document.getElementById("testi-cinta");
  const riel  = document.getElementById("testi-riel");
  const cta   = document.getElementById("testi-cta");
  if (!sec || !cinta || !riel || !cta) return;      // pagina sin testimonios

  if (TESTIMONIOS_FORM) {
    cta.querySelector("a").href = TESTIMONIOS_FORM;
    cta.hidden = false;
  }

  if (TESTIMONIOS_CSV) {
    try {
      // cb: el navegador guarda el CSV en caché. (Google además lo sirve desde
      // la suya, que tarda unos minutos en reflejar una casilla recién marcada.)
      const r = await fetch(TESTIMONIOS_CSV + "&cb=" + Date.now(), { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const filas = leerCSV(await r.text());
      if (filas[0] && /nombre/i.test(filas[0][0] || "")) filas.shift();   // encabezado

      const juego = document.createElement("div");
      juego.className = "testi-juego";
      for (const [nombre, cargo, texto] of filas) {
        if (!texto || !texto.trim()) continue;
        juego.appendChild(tarjeta(nombre, cargo, texto));
      }

      if (juego.children.length) {
        riel.appendChild(juego);
        // Hay que descubrir la seccion ANTES de medir: dentro de un elemento
        // con display:none todo mide cero y la cinta saldria rota.
        sec.hidden = false;
        cinta.hidden = false;
        armarCinta(riel, juego, cinta);
      }
    } catch (e) {
      // Sin red o con la hoja mal publicada la sección simplemente no aparece.
      console.warn("testimonios:", e.message);
    }
  }

  if (!cinta.hidden || !cta.hidden) {
    sec.hidden = false;
    // El enlace del pie iria a una seccion oculta mientras no haya nada que
    // mostrar: aparece con ella, no antes.
    const fl = document.getElementById("fl-testi"); if (fl) fl.hidden = false;
  }
})();

/* ---------- contacto ---------- */
// Pon aqui el correo y la liga del formulario: cada tarjeta aparece sola en
// cuanto tenga valor, y mientras este vacia no se muestra. Mas vale que no
// exista a que un visitante escriba a una direccion que rebota.
const CORREO        = "";   // ej. "hola@day1robotics.com"
const CONTACTO_FORM = "";   // liga del Google Form

if (CORREO && document.getElementById("c-correo-a")) {
  const a = document.getElementById("c-correo-a");
  a.textContent = CORREO; a.href = "mailto:" + CORREO;
  document.getElementById("c-correo").hidden = false;
}
if (CONTACTO_FORM && document.getElementById("c-form")) {
  const c = document.getElementById("c-form");
  c.querySelector("a").href = CONTACTO_FORM; c.hidden = false;
}

/* ---------- movimiento ---------- */
// Barra de avance en la parte alta: ubica al visitante en una pagina larga.
const barra = document.createElement("div");
barra.className = "progreso"; document.body.appendChild(barra);
const avance = () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  barra.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
};
addEventListener("scroll", avance, { passive: true }); avance();

// Brillo que sigue al cursor sobre las tarjetas de servicio. Se pasa por
// variables CSS en vez de recalcular estilos: el navegador lo compone solo.
for (const t of document.querySelectorAll(".servicio")) {
  t.addEventListener("pointermove", (e) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty("--mx", (e.clientX - r.left) + "px");
    t.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
}

// Las cifras cuentan hacia arriba al entrar en pantalla. Respeta el formato
// original (comas de millar) en vez de reescribirlo.
const num = (el) => {
  const fin = parseFloat(el.dataset.v);
  if (!isFinite(fin)) return;
  const t0 = performance.now(), dur = 1400;
  const paso = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);                 // frena al final
    el.textContent = Math.round(fin * e).toLocaleString("es-MX");
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
};
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const cifras = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { num(e.target); cifras.unobserve(e.target); }
  }), { threshold: .6 });
  for (const n of document.querySelectorAll(".stat .n")) {
    const v = parseFloat(n.textContent.replace(/[^\d.]/g, ""));
    if (isFinite(v)) { n.dataset.v = v; n.textContent = "0"; cifras.observe(n); }
  }
}

/* Una rejilla que aparece de golpe se siente plana. Se le quita el reveal al
   contenedor y se le pone a cada hijo con un retraso creciente: la seccion se
   arma en cascada en vez de encenderse como un bloque. */
for (const caja of document.querySelectorAll(".grid,.servicios,.variantes,.contacto,.stats,.shots")) {
  caja.classList.remove("reveal");
  [...caja.children].forEach((h, i) => {
    h.classList.add("reveal");
    h.style.setProperty("--d", Math.min(i * 85, 420) + "ms");
  });
}
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* Desplazamiento suave de las fotos: se mueven algo menos que la pagina, que
   es lo que da profundidad. Se calcula en un solo rAF para no disparar un
   reflow por cada evento de scroll. */
if (!matchMedia("(prefers-reduced-motion:reduce)").matches) {
  const capas = [...document.querySelectorAll(".shot img,.shotbig img")];
  capas.forEach(i => { i.classList.add("parallax"); i.style.transform = "scale(1.12)"; });
  let pendiente = false;
  const mover = () => {
    pendiente = false;
    for (const i of capas) {
      const r = i.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const centro = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      i.style.transform = `translate3d(0,${(-centro * 26).toFixed(1)}px,0) scale(1.12)`;
    }
  };
  addEventListener("scroll", () => {
    if (!pendiente) { pendiente = true; requestAnimationFrame(mover); }
  }, { passive: true });
  mover();
}
