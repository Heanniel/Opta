# DecididoX — App de toma de decisiones (prototipo React sin build)

Versión ligera que reutiliza los archivos existentes en la carpeta y añade React vía CDN.

Cómo usar

- Abrir `index.html` en el navegador (doble clic) o servir la carpeta con un servidor estático.

Comandos rápido (desde la carpeta del proyecto):

```
# con Python 3
python -m http.server 3000

# o, si prefieres Live Server u otro servidor estático, úsalo y abre http://localhost:3000
```

Qué contiene

- `index.html` — Carga React/ReactDOM y Babel; monta la app en `#root`.
- `codigo.js` — Implementación React (JSX) de la app de decisiones.
- `style.css` — Estilos básicos.

Notas

- Esta es una solución rápida sin paso de compilación; para producción crea un proyecto con Create React App / Vite.
