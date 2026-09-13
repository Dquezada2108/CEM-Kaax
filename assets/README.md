# Archivos opcionales

El sitio funciona sin ellos: cada uno cae a un respaldo limpio.

| Archivo | Qué es | Si falta |
|---|---|---|
| `equipo/diego.jpg` | Foto de Diego Quezada Ramírez | salen sus iniciales |
| `equipo/yael.jpg` | Foto de Yael García Blanco | salen sus iniciales |
| `equipo/daniel.jpg` | Foto de Daniel A. Carvajal Macías | salen sus iniciales |
| `campo.mp4` | Video del robot en operación ✅ ya está | la figura no se muestra |
| `campo-poster.jpg` | Fotograma de portada del video ✅ generado | el video arranca en negro |

## Fotos del equipo

**Cuadradas**, mínimo 400×400 px, con la cara centrada — se recortan a círculo.
JPG a calidad 80 basta; apunta a menos de 200 KB cada una.

## Video

**MP4 (H.264 + AAC)**, horizontal 16:9, y **menos de 15 MB**. GitHub rechaza
archivos de más de 100 MB y cualquier cosa por encima de ~20 MB hace que la
página tarde demasiado en un celular con datos.

Para comprimir uno pesado:

```bash
ffmpeg -i original.mov -vf "scale=1280:-2" -c:v libx264 -crf 26 -preset slow \
       -c:a aac -b:a 96k -movflags +faststart assets/campo.mp4
```

`-movflags +faststart` no es opcional: sin eso el video no empieza a
reproducirse hasta descargarse entero.

El póster del reproductor usa `campo1.jpg` mientras el video no se abre.


## Nota sobre el video actual

`campo.mp4` es vertical (464×832) y el sitio lo detecta solo: respeta su
proporción y lo centra sobre fondo oscuro en vez de forzarlo a 16:9, que le
recortaba casi todo el encuadre. Si algún día subes uno horizontal, el mismo
código lo acomoda sin tocar nada.

Su primer fotograma es negro, así que lleva `campo-poster.jpg`, extraído del
propio video. Si reemplazas el video, regenera el póster:

```python
import cv2
cap = cv2.VideoCapture("assets/campo.mp4"); cap.set(cv2.CAP_PROP_POS_FRAMES, 40)
ok, f = cap.read(); cv2.imwrite("assets/campo-poster.jpg", f, [cv2.IMWRITE_JPEG_QUALITY, 82])
```
