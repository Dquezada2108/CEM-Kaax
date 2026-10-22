#!/usr/bin/env python3
"""Arma las páginas del sitio desde partials/ y las hojas de assets/.

GitHub Pages sirve archivos estáticos: no hay forma de incluir una cabecera
común en tiempo de servidor. Las opciones eran duplicar la navegación en cada
archivo —y que se desincronice— o inyectarla con JavaScript —y que no exista
para quien no lo ejecute, buscadores incluidos—. Esto es la tercera: una sola
fuente aquí, HTML real en la salida.

    python3 build.py
"""
import pathlib, re, hashlib

RAIZ = pathlib.Path(__file__).parent
SITIO = "DAY1 Robotics"
IG = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
      'stroke-linecap="round" aria-hidden="true"><rect x="2.7" y="2.7" width="18.6" height="18.6" rx="5.4"/>'
      '<circle cx="12" cy="12" r="4.15"/><circle cx="17.35" cy="6.65" r="1.15" fill="currentColor" stroke="none"/></svg>')

MENU = [("index.html", "Inicio"), ("productos.html", "Productos"),
        ("servicios.html", "Servicios"), ("nosotros.html", "Nosotros"),
        ("contacto.html", "Contacto")]

# archivo -> (título, descripción, fragmentos, ¿lleva three.js?)
PAGINAS = {
  "index.html": ("Robótica para el agua de México",
      "DAY1 Robotics: startup mexicana de robótica acuática. Plataformas remotas y servicios de limpieza y consultoría para cuerpos de agua.",
      ["inicio", "igtira", "problema", "comunidad", "etica", "rutas", "testimonios"], True),
  "productos.html": ("Productos",
      "Kaax, plataforma acuática remota de usos múltiples, y las configuraciones Obsidian y Maelstrom en desarrollo.",
      ["respuesta", "productos", "comparativa"], False),
  "kaax.html": ("Kaax · la plataforma",
      "Cómo funciona Kaax: visión por computadora, pruebas de campo, validación con especialistas y la estación de control.",
      ["prototipo", "ia", "validacion", "codigo"], True),
  "servicios.html": ("Servicios",
      "Limpieza de cuerpos de agua y consultoría en tecnologías del agua.",
      ["servicios"], False),
  "nosotros.html": ("Nosotros",
      "Una startup mexicana de robótica. Quiénes somos, misión y visión.",
      ["fundadores"], False),
  "contacto.html": ("Contacto",
      "Escríbenos: teléfono, Instagram y correo de DAY1 Robotics.",
      ["contacto"], False),
}

def version(rel):
    """Sufijo ?v=<hash del contenido>. Sin esto el navegador —y la cache de
    GitHub Pages— siguen sirviendo el CSS y el JS viejos despues de publicar,
    y el sitio queda a medias sin que nadie vea un error."""
    h = hashlib.sha256((RAIZ / rel).read_bytes()).hexdigest()[:8]
    return f"{rel}?v={h}"

def frag(n):
    return (RAIZ / "partials" / f"{n}.html").read_text().rstrip()

def nav(actual, conPortada):
    li = "".join(
        f'\n      <li><a href="{h}"{" class=\"active\" aria-current=\"page\"" if h == actual else ""}>{t}</a></li>'
        for h, t in MENU)
    # Sin portada oscura detras, la barra tiene que nacer ya en su version
    # clara: en modo transparente el texto es blanco y sobre fondo blanco
    # desaparece. Se marca aqui y no solo en JS para que no parpadee.
    return f'''<nav class="nav{"" if conPortada else " stuck"}" id="nav">
  <a href="index.html" class="mark" aria-label="{SITIO}">
    <img src="assets/day1_logo.png" alt="{SITIO}"
         onerror="this.replaceWith(Object.assign(document.createElement('span'),{{className:'fallback',textContent:'DAY1'}}))">
  </a>
  <div class="nav-right">
    <ul id="navlist">{li}
    </ul>
    <a class="btn-ig" href="https://www.instagram.com/day1robotics/" target="_blank"
       rel="noopener" aria-label="Instagram de DAY1 Robotics">{IG}<span>Instagram</span></a>
    <a class="btn-app" href="https://dquezada2108.github.io/kaax_app/"
       target="_blank" rel="noopener">Abrir la app<span class="arw" aria-hidden="true">↗</span></a>
    <button class="navtoggle" id="navtoggle" aria-label="Menú" aria-expanded="false" aria-controls="navlist">☰</button>
  </div>
</nav>'''

PIE = '''<footer>
  <div class="fgrid">
    <div>
      <img src="assets/day1_logo.png" alt="DAY1 Robotics" style="height:30px;width:auto;
           filter:brightness(0) invert(1);opacity:.92;margin-bottom:12px"
           onerror="this.replaceWith(Object.assign(document.createElement('h4'),{textContent:'DAY1 ROBOTICS'}))">
      <p style="font-size:.9rem;opacity:.85;max-width:32ch">Startup mexicana de robótica.
        Plataformas y servicios para limpiar los cuerpos de agua del país.</p>
    </div>
    <div>
      <h4>Sitio</h4>
      <ul>
        <li><a href="productos.html">Productos</a></li>
        <li><a href="servicios.html">Servicios</a></li>
        <li><a href="nosotros.html">Nosotros</a></li>
        <li><a href="contacto.html">Contacto</a></li>
      </ul>
    </div>
    <div>
      <h4>Kaax</h4>
      <ul>
        <li><a href="kaax.html">Cómo funciona</a></li>
        <li><a href="kaax.html#codigo">La estación de control</a></li>
        <li><a href="kaax.html#finanzas">Costos</a></li>
        <li><a href="https://dquezada2108.github.io/kaax_app/" target="_blank" rel="noopener">Abrir la app</a></li>
      </ul>
    </div>
    <div>
      <h4>Contacto</h4>
      <ul>
        <li><a href="https://www.instagram.com/day1robotics/" target="_blank" rel="noopener">Instagram · @day1robotics</a></li>
        <li><a href="tel:+525630229339">+52 56 3022 9339</a></li>
        <li>México</li>
      </ul>
    </div>
  </div>
  <div class="fbottom">
    <span>© <span id="year"></span> DAY1 Robotics</span>
    <span>Hecho en México</span>
  </div>
</footer>'''

def pagina(archivo, titulo, desc, partes, tres):
    cuerpo = "\n\n".join(frag(n) for n in partes)
    imports = f'''
<script type="importmap">
{{ "imports": {{
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
}} }}
</script>
<script type="module" src="{version('assets/escena.js')}"></script>''' if tres else ""
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{titulo} · {SITIO}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#255764">
<link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="512x512" href="assets/favicon-512.png">
<link rel="apple-touch-icon" href="assets/favicon-180.png">
<meta property="og:title" content="{titulo} · {SITIO}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{version("assets/site.css")}">
</head>
<body>

<a class="saltar" href="#contenido">Saltar al contenido</a>

{nav(archivo, 'inicio' in partes)}

<main id="contenido">
{cuerpo}
</main>

{PIE}
<script src="{version("assets/site.js")}"></script>{imports}
</body>
</html>
'''

if __name__ == "__main__":
    for archivo, (t, d, partes, tres) in PAGINAS.items():
        (RAIZ / archivo).write_text(pagina(archivo, t, d, partes, tres))
        print(f"  {archivo:<16} {len(partes)} fragmentos{'  + three.js' if tres else ''}")
