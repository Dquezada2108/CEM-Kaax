# Archivos opcionales

El sitio funciona sin ellos: cada uno cae a un respaldo limpio.

| Archivo | Qué es | Si falta |
|---|---|---|
| `equipo/diego.jpg` | Foto de Diego Quezada Ramírez | salen sus iniciales |
| `equipo/yael.jpg` | Foto de Yael García Blanco | salen sus iniciales |
| `equipo/daniel.jpg` | Foto de Daniel A. Carvajal Macías | salen sus iniciales |
| `campo.mp4` | Video del robot en operación | la figura no se muestra |

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
