# Archivos que faltan

| Archivo | Qué es | De dónde sale |
|---|---|---|
| `logo_kaax_full.png` | Logotipo completo (K con la fronda + "aax"), fondo transparente | lo tiene Diego |
| `logo_k.png` | Solo la K, para el favicon | `kaax_app/docs/assets/logo_k_sm.png` |
| `kaax.glb` | Modelo 3D del robot | Onshape → Assembly *Full Robot* → Export → glTF binario |

El sitio **funciona sin ellos**: el logotipo cae a texto y el visor 3D arma un
robot de referencia con primitivas. En cuanto aparezcan los archivos, se usan
solos sin tocar código.

## Exportar el modelo desde Onshape

1. Abre el documento *Full Robot*
2. Clic derecho en la pestaña del **Assembly** (abajo) → **Export**
3. Formato **glTF**, marca **Binary** si te lo ofrece
4. Resolution **Medium** o **Coarse** — nunca Fine

Apunta a **menos de 5 MB**. Un ensamble a resolución fina se va a 50–200 MB y
el sitio tardaría un minuto en abrir. Si no hay opción de glTF, exporta **STL
binario** y se convierte con Blender.
