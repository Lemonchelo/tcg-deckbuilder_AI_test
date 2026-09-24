# Cartas de Rise of Gods

464 imágenes originales del catálogo público https://www.riseofgodstcg.store/cartas, organizadas por set y preparadas para el importador existente.

En la aplicación, seleccioná **Importar Cartas → Seleccionar Carpeta** y elegí esta carpeta `cartas`. El importador recorre sus subcarpetas e ignora los archivos JSON y Markdown. Las cartas se guardan en el navegador después de importarlas. Una imagen ya importada con el mismo nombre, tipo y facción se omite; los duplicados históricos no se eliminan automáticamente.

## Formatos

- 438 cartas estándar: `Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.webp`. El coste es el total de sellos de facción más coste neutral.
- 19 tokens: `Token_Nombre_Faccion.webp`.
- 7 sellos: `Sello_Faccion.webp`.

Se usan guiones entre las palabras del nombre; el importador los transforma en espacios. Las imágenes no fueron convertidas ni modificadas.

## Límites del importador actual

Los tokens importados reciben coste 0, ataque 1, defensa 1 y rareza común. Sus tipos secundarios no pueden expresarse en este formato. Los sellos reciben coste 0 y no tienen rareza. El importador solo conserva ataque y defensa para criaturas y genera textos genéricos de descripción y ambientación.

`catalogo-original.json` conserva los datos originales, los tipos múltiples, el coste desglosado, los textos y la URL de origen de cada carta, junto con su ruta local.
