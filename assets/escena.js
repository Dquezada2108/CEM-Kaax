import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* Dos visores del mismo robot, con propósitos distintos:
     portada   — grande y centrado, gira conforme desplazas. No se toca.
     prototipo — el visitante lo arrastra y lo gira a mano.

   El GLB se descarga UNA vez y se clona: son 6.5 MB y pedirlo dos veces
   duplicaría la espera sin ganar nada.

   Orientación: Onshape exporta con el eje largo en Y (0.98) y el corto en Z
   (0.35). En three.js la vertical es Y, así que el modelo llega de pie sobre
   la popa. Girando -90° en X el largo pasa a Z y la altura a Y, que es como
   flota un catamarán. */
const MODEL_FIX_X = -Math.PI / 2;
const reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;

function crearVisor(host, { fov = 38, margen = 1.06, alto = .28 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, .1, 100);
  // La direccion fija el angulo de vista; encuadrar() ajusta la distancia.
  camera.position.set(0, alto, 1).normalize();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbcd9e4, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(4, 7, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x69d7ea, 1.1); rim.position.set(-5, 2, -4); scene.add(rim);

  const pivot = new THREE.Group();          // lo que gira
  scene.add(pivot);

  function colocar(obj) {
    // Normalizar antes de medir. Si el objeto llega ya transformado, la caja
    // envolvente sale en otra escala y el factor que se calcule estara mal.
    obj.position.set(0, 0, 0);
    obj.scale.setScalar(1);
    obj.rotation.set(0, 0, 0);
    obj.rotation.x = MODEL_FIX_X;

    // Se normaliza por la ESFERA envolvente, no por el lado mayor de la caja.
    // Al girar, la silueta del modelo llega hasta la diagonal de la caja —para
    // este chasis un 17% mas que su lado largo— y por eso se recortaba en los
    // angulos intermedios. La esfera es invariante a la rotacion: si cabe, cabe
    // siempre. Queda con radio 1 y centrada, y la camara se acomoda a ella.
    const caja = new THREE.Box3().setFromObject(obj);
    const esfera = caja.getBoundingSphere(new THREE.Sphere());
    const k = 1 / (esfera.radius || 1);
    obj.scale.setScalar(k);
    obj.position.copy(esfera.center).multiplyScalar(-k);
    const cont = new THREE.Group();
    cont.add(obj);
    pivot.add(cont);
    encuadrar();
  }

  /** Aleja la camara lo justo para que una esfera de radio 1 quepa entera,
   *  tanto de alto como de ancho. Recalculado en cada cambio de tamano, porque
   *  en un lienzo apaisado manda el alto y en uno vertical manda el ancho. */
  function encuadrar() {
    const vFov = camera.fov * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const d = Math.max(1 / Math.sin(vFov / 2), 1 / Math.sin(hFov / 2)) * margen;
    camera.position.setLength(d);
    camera.lookAt(0, 0, 0);
    return d;
  }

  function medir() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    if (pivot.children.length) encuadrar();
  }
  new ResizeObserver(medir).observe(host);
  medir();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(host);

  return { renderer, scene, camera, pivot, colocar, encuadrar, ver: () => visible };
}

// ---------- portada: gira con el desplazamiento ----------
// Cada pagina tiene los visores que le tocan: la portada solo en el inicio,
// el manipulable solo en la ficha de Kaax. Sin guardas, una pagina sin
// portada reventaria al construir un visor sobre un contenedor inexistente.
const heroHost = document.getElementById("hero-stage");
const hero = heroHost ? crearHero(heroHost) : null;
function crearHero(heroHost) {
// margen 1.10: el modelo de portada tambien sube y baja con el scroll,
// asi que necesita un poco mas de holgura que el del prototipo.
// margen 1.04: el lienzo es toda la portada, asi que el modelo puede ir casi
// a sangre sin riesgo de recorte, porque la esfera lo garantiza.
const hero = crearVisor(heroHost, { fov: 32, margen: 1.22, alto: .26 });

let heroObjetivo = 0, heroActual = 0;
function heroProgreso() {
  const r = document.getElementById("inicio").getBoundingClientRect();
  heroObjetivo = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
}
addEventListener("scroll", heroProgreso, { passive: true });
addEventListener("resize", heroProgreso);
heroProgreso();

hero.renderer.setAnimationLoop(() => {
  if (!hero.ver()) return;
  heroActual += (heroObjetivo - heroActual) * .08;
  // Una vuelta y media mientras la portada sale de pantalla, más una deriva
  // lenta para que no se vea congelado al llegar.
  const t = reduced ? 0 : performance.now() * .00007;
  hero.pivot.rotation.y = -0.6 + heroActual * Math.PI * 1.5 + t;
  hero.pivot.rotation.x = 0.12 + heroActual * 0.38;
  // Desplazado hacia abajo: deja despejado el bloque de texto de arriba.
  hero.pivot.position.y = -0.18 - heroActual * 0.45;
  hero.pivot.scale.setScalar(1 - heroActual * 0.18);
  hero.renderer.render(hero.scene, hero.camera);
});
  return hero;
}

// ---------- prototipo: lo mueve el visitante ----------
const protoHost = document.getElementById("viewer");
const proto = protoHost ? crearProto(protoHost) : null;
function crearProto(protoHost) {
const proto = crearVisor(protoHost, { fov: 38, margen: 1.12, alto: .42 });

const ctrl = new OrbitControls(proto.camera, proto.renderer.domElement);
ctrl.enableDamping = true; ctrl.dampingFactor = .075;
ctrl.enablePan = false;                 // desplazar el objeto solo confunde
ctrl.minDistance = 1.6; ctrl.maxDistance = 9;
ctrl.minPolarAngle = .25; ctrl.maxPolarAngle = Math.PI * .82;
ctrl.autoRotate = !reduced; ctrl.autoRotateSpeed = .9;
ctrl.target.set(0, 0, 0);
// Al primer arrastre se apaga el giro automático: a partir de ahí manda el usuario.
["pointerdown", "wheel", "touchstart"].forEach(ev =>
  proto.renderer.domElement.addEventListener(ev, () => { ctrl.autoRotate = false; }, { once: true, passive: true }));

proto.renderer.setAnimationLoop(() => {
  if (!proto.ver()) return;
  ctrl.update();
  proto.renderer.render(proto.scene, proto.camera);
});
  return proto;
}

// ---------- carga única, dos copias ----------
const aviso = document.getElementById("viewer-loading");
function respaldo() {
  // Sin GLB se arma un robot de referencia, para que la página nunca quede vacía.
  const g = new THREE.Group();
  const casco = new THREE.MeshStandardMaterial({ color: 0xe9eef0, roughness: .5 });
  const azul = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: .4, metalness: .2 });
  for (const x of [-1.15, 1.15]) {
    const h = new THREE.Mesh(new THREE.CapsuleGeometry(.42, 2.5, 8, 20), casco);
    h.rotation.z = Math.PI / 2; h.position.set(x, 0, 0); g.add(h);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.55, .17, 1.75), casco); deck.position.y = .42; g.add(deck);
  const caja = new THREE.Mesh(new THREE.BoxGeometry(1.05, .5, .85), azul); caja.position.y = .76; g.add(caja);
  g.rotation.x = -MODEL_FIX_X;           // se compensa el giro que colocar() aplica
  return g;
}

if (hero || proto) new GLTFLoader().load(
  "assets/kaax.glb",
  (gltf) => {
    // El clon se saca ANTES de colocar nada: colocar() muta el objeto que
    // recibe, y clonar despues copiaba un modelo ya escalado y desplazado.
    const copia = gltf.scene.clone(true);
    hero?.colocar(gltf.scene);
    proto?.colocar(copia);
    aviso?.remove();
    heroHost?.classList.add("listo");
  },
  undefined,
  () => {
    hero?.colocar(respaldo());
    proto?.colocar(respaldo());
    if (aviso) {
      aviso.textContent = "modelo de referencia";
      aviso.style.cssText = "position:absolute;left:14px;top:13px;color:#6b8a9c;font-size:.63rem;letter-spacing:.12em;text-transform:uppercase";
    }
    heroHost?.classList.add("listo");
  }
);
