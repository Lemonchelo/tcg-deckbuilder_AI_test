# Aetherium TCG Deckbuilder Studio

Constructor de mazos para un TCG con **facciones planetarias**, cartas **Sello** (recursos) y un **Mazo Extra de Tokens** que se genera solo. Funciona 100 % en el navegador, sin dependencias ni backend: tus cartas se importan desde tus propias imágenes y todo se guarda localmente.

## Contenido

- [Inicio rápido](#inicio-rápido)
- [Reglas del mazo](#reglas-del-mazo)
- [Importar cartas](#importar-cartas)
- [Construir el mazo](#construir-el-mazo)
- [Biblioteca, búsqueda y filtros](#biblioteca-búsqueda-y-filtros)
- [Análisis del mazo](#análisis-del-mazo)
- [Inspector de cartas](#inspector-de-cartas)
- [Probar mano (Mulligan)](#probar-mano-mulligan)
- [Exportar e importar mazos](#exportar-e-importar-mazos)
- [Dónde se guardan los datos](#dónde-se-guardan-los-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Problemas frecuentes](#problemas-frecuentes)

---

## Inicio rápido

1. Cloná o descargá el repo.
2. Abrí `index.html` en el navegador (doble clic). No necesita servidor ni instalación.
   - Alternativa con servidor local: `python -m http.server 8000` y entrá a `http://localhost:8000`.
   - Las tipografías vienen de Google Fonts; sin internet la app funciona igual, con tipografías de reemplazo.
3. La app arranca **sin cartas**. Hacé clic en **📁 Importar Cartas** y cargá tus imágenes (ver [Importar cartas](#importar-cartas)).
4. Armá tu mazo de 40 cartas desde la biblioteca de la derecha.

---

## Reglas del mazo

| Regla | Detalle |
|---|---|
| Tamaño del mazo principal | **40 cartas** exactas |
| Copias por rareza | Común: **4** · Rara: **3** · Épica: **2** · Legendaria: **1** |
| Sellos | Sin rareza y **sin límite de copias** (hasta completar las 40) |
| Tokens | No se agregan a mano: forman el **Mazo Extra**, que es automático |
| Facciones | Marte, Neptuno, Júpiter, Tierra, Saturno, Mercurio, Urano, Plutón, más **Arcano** (neutral) |
| Tipos de carta | Criatura, Hechizo Rápido, Hechizo Lento, Estructura, Artefacto, Sello, Terreno (y Token) |

El indicador de la barra superior muestra el estado del mazo: **Incompleto** (menos de 40), **Listo (40/40)** o **Exceso** (más de 40).

---

## Importar cartas

Las cartas se crean a partir de **imágenes**: el *nombre del archivo* define sus datos (nombre, tipo, rareza, planeta, ataque, defensa y coste). No hay que escribir ningún JSON.

### Cómo importar

1. Clic en **📁 Importar Cartas** (barra superior). También podés abrir el importador con el botón del estado vacío de la biblioteca.
2. Elegí una de estas opciones:
   - **Seleccionar Carpeta**: importa todas las imágenes de una carpeta (incluye subcarpetas).
   - **Seleccionar Imágenes**: elegís archivos sueltos.
   - **Arrastrar y soltar** carpetas o archivos sobre el área punteada.
3. Se muestra una barra de progreso y, al terminar, la lista de **cartas detectadas**. Revisala para confirmar que cada archivo se interpretó bien.
4. Cerrá el modal con **Cerrar**, con la ✕ o haciendo clic fuera.

Se aceptan todos los formatos de imagen que soporte el navegador (`png`, `jpg`, `webp`, etc.). Los archivos que no sean imágenes se ignoran.

### Formato de nombre de archivo

Los campos se separan con guion bajo (`_`) y **no** llevan espacios ni guiones bajos internos. La extensión no importa.

#### 1. Carta estándar

```
Nombre_Tipo_Rareza_Planeta_ATK_DEF_Coste.png
```

| Campo | Ejemplos válidos | Notas |
|---|---|---|
| `Nombre` | `Ares`, `GuerreroMarciano`, `Rayo-Dorado` | `CamelCase` y guiones se convierten en espacios: `GuerreroMarciano` → "Guerrero Marciano" |
| `Tipo` | `Criatura`, `HechizoRapido`, `HechizoLento`, `Estructura`, `Artefacto`, `Sello`, `Terreno` | **Sin tildes ni espacios.** También se aceptan alias: `Hechizo` (= Lento), `Rapido`, `Lento`, `Monstruo`, `Unidad`, `Reliquia`, `Objeto`, `Campo`, y equivalentes en inglés (`Creature`, `Instant`, `Sorcery`, `Structure`, `Artifact`, `Field`) |
| `Rareza` | `Comun`, `Rara`, `Epica`, `Legendaria` | Con o sin tilde. También `Common`, `Rare`, `Epic`, `Legendary`, `Mitica` (= Legendaria) |
| `Planeta` | `Marte`, `Neptuno`, `Jupiter`, `Tierra`, `Saturno`, `Mercurio`, `Urano`, `Pluton`, `Neutral` | Con o sin tilde. Alias por elemento o color: `Fuego`/`Rojo` (Marte), `Agua`/`Azul` (Neptuno), `Oro`/`Dorado` (Júpiter), `Verde`/`Naturaleza` (Tierra), `Morado`/`Violeta` (Saturno), `Plata`/`Gris` (Mercurio), `Hielo`/`Cian`/`Celeste` (Urano), `Vacio`/`Sombra`/`Negro` (Plutón), `Arcano`/`Incoloro` (Neutral) |
| `ATK` | `8` | Solo se usa en **Criaturas** (mínimo 0) |
| `DEF` | `6` | Solo se usa en **Criaturas** (mínimo 1) |
| `Coste` | `7` | Coste de maná, de 0 a 20 |

Ejemplos:

```
Ares_Criatura_Legendaria_Marte_8_6_7.png
Rayo_HechizoRapido_Comun_Jupiter_0_0_1.png
TorreDeHielo_Estructura_Rara_Urano_0_0_4.png
```

> **Tip:** aunque la carta no sea una Criatura, completá siempre los 7 campos (usá `0_0` para ATK/DEF). Si faltan campos, el último valor del nombre se interpreta como coste y podés obtener resultados inesperados.

#### 2. Sello (recurso de maná)

```
Sello_Planeta.png
Sello_Nombre_Planeta.png
```

```
Sello_Marte.png              → "Sello de Marte"
Sello_MagmaAncestral_Marte.png → "Sello de Magma Ancestral"
```

Los sellos no tienen rareza ni límite de copias, y su coste es 0. Cada uno provee 1 punto de maná de su planeta.

#### 3. Token (Mazo Extra)

```
Token_Nombre_Planeta.png
Token_Planeta.png
```

```
Token_GuerreroMarciano_Marte.png   → token "Guerrero Marciano" (Marte)
Token_Marte.png                    → "Token de Marte"
```

Los tokens se crean como 1/1 de coste 0 y **no aparecen en la biblioteca**: van directo al [Mazo Extra](#mazo-extra-tokens) cuando su planeta está en el mazo.

### Valores por defecto

Si un campo falta o no se reconoce, la app usa un valor por defecto en lugar de fallar:

| Campo | Por defecto |
|---|---|
| Tipo | Criatura |
| Rareza | Común |
| Planeta | Neutral (Arcano) |
| ATK / DEF (Criatura) | 1 / 1 |
| Coste | 0 |

Por eso conviene revisar la lista de **cartas detectadas** tras importar: un error tipográfico en el nombre del archivo (por ejemplo `HechizoRápido` con tilde) no da error, simplemente cae en el valor por defecto.

### Cosas a tener en cuenta

- **Importar dos veces la misma imagen crea dos cartas distintas.** Para empezar de cero usá **🗑️ Borrar Cartas Personalizadas** dentro del importador.
- **Borrar cartas personalizadas también vacía el mazo actual** (previa confirmación), porque las cartas del mazo dejan de existir.
- Las imágenes se guardan en el navegador (IndexedDB), así que las cartas siguen ahí al recargar la página. Ver [Dónde se guardan los datos](#dónde-se-guardan-los-datos).

---

## Construir el mazo

Hay varias formas de agregar y quitar cartas:

| Acción | Cómo |
|---|---|
| Agregar una carta | **Clic** sobre la carta en la biblioteca, o **arrastrarla** a la zona del mazo |
| Ver detalle de una carta | **Clic derecho** en la biblioteca, o **clic** sobre la carta en el mazo |
| Sumar una copia | Botón **+** que aparece al pasar el mouse sobre una carta del mazo |
| Quitar una copia | Botón **−** sobre la carta, **doble clic** sobre ella, o arrastrarla a la **papelera** (aparece abajo al arrastrar una carta del mazo) |
| Reordenar | Arrastrar una carta del mazo y soltarla sobre otra |
| Renombrar el mazo | Clic en el nombre de la barra superior (hasta 32 caracteres) |
| Vaciar el mazo | **🗑️ Limpiar** (pide confirmación) |

Cada carta del mazo muestra una insignia **x N** con la cantidad de copias, y en la biblioteca una insignia **N/máx** indica cuántas copias llevás sobre el máximo de su rareza (para Sellos muestra solo **xN**).

Si intentás agregar una carta que rompe una regla (límite de rareza alcanzado, mazo lleno, token), aparece un aviso explicando el motivo.

### Mazo Extra (Tokens)

Debajo del mazo principal, el panel **⚡ Mazo Extra** se completa solo: por cada planeta presente en el mazo principal se agregan los tokens de esa facción que hayas importado. Si sacás todas las cartas de un planeta, sus tokens desaparecen. Las cartas neutrales (Arcano) no generan tokens. El contador de la barra superior muestra cuántos tokens hay activos.

---

## Biblioteca, búsqueda y filtros

La columna derecha muestra todas las cartas importadas y cuántas coinciden con los filtros (**Mostrando X / Y**).

- **Búsqueda:** por nombre, descripción o texto de ambientación. Botón ✕ para limpiar.
- **Zoom:** deslizador de 75 % a 135 % para el tamaño de las cartas (se recuerda entre sesiones).
- **Planetas / Facciones:** un botón por planeta, o Todos.
- **Tipos de carta:** Criatura, H. Rápido, H. Lento, Estructura, Artefacto, Sello, Terreno.
- **Coste de maná máximo:** deslizador de 0 a 10+.
- **Rareza:** Común, Rara, Épica, Legendaria. Los Sellos no aparecen al filtrar por rareza.
- **Ordenar:** coste (asc/desc), nombre (A–Z / Z–A), rareza, ataque o vida.
- **Restablecer filtros:** vuelve todo a su valor inicial.

Los filtros se combinan entre sí.

---

## Análisis del mazo

En la parte superior del área del mazo:

- **Curva de maná & Sellos:** gráfico de barras con la cantidad de cartas por coste (1 a 7+) y una columna aparte de Sellos (💎S). Muestra el **coste medio** de las cartas (sin contar Sellos). Hacer **clic en una barra** filtra la biblioteca por ese coste máximo; clic en 💎S filtra por Sellos.
- **Composición del mazo:** cantidad de cartas por tipo (Criaturas, H. Rápido, H. Lento, Estructuras, Artefactos, Sellos, Terrenos).
- **Distribución planetaria:** cuántas cartas tenés de cada planeta.

---

## Inspector de cartas

Abre una vista ampliada de la carta con efecto 3D (se inclina al mover el mouse), más:

- Planeta, tipo, rareza y coste.
- Ataque y vida (solo Criaturas).
- Descripción y texto de ambientación.
- Botón **Agregar al Mazo** con el contador de copias actual.

Se abre con clic derecho sobre una carta de la biblioteca, con clic sobre una carta del mazo o con **🔍 Inspeccionar**. Los tokens del Mazo Extra también se pueden inspeccionar.

---

## Probar mano (Mulligan)

**🎴 Probar Mano** simula el inicio de una partida con tu mazo (requiere al menos 5 cartas):

1. Se baraja el mazo y se reparte una mano de **5 cartas**.
2. Hacé **clic en las cartas** que querés descartar (quedan marcadas).
3. **Hacer Mulligan** devuelve las marcadas al mazo, lo baraja y roba reemplazos.
4. **Robar 1 Carta** suma una carta de la parte superior del mazo.
5. **Nueva Mano** baraja todo de nuevo y reparte otra mano.

---

## Exportar e importar mazos

**📥 Exportar / Importar** abre un modal con dos pestañas. Al abrirlo, ya viene cargado con el mazo actual, listo para copiar con **📋 Copiar al Portapapeles**. Para cargar un mazo, pegá el contenido en la pestaña correspondiente y presioná **⚡ Cargar este Mazo**.

> Importar un mazo **reemplaza** el mazo actual. Las cartas del mazo deben existir antes en tu biblioteca (importá primero las imágenes).

### Lista de texto

Formato legible, una carta por línea:

```
// Deck: Mazo Planetario de Batalla
// Main Deck (40/40 cartas):
4x Rayo [Common] (JUPITER)
3x Ares [Rare] (MARTE)
1x Torre De Hielo [Legendary] (URANO)
12x Sello De Marte [Sello] (MARTE)

// Extra Deck (Tokens Automáticos):
1x Guerrero Marciano [Token] (MARTE)
```

Reglas de lectura al importar:

- Cada línea es `<cantidad>x <Nombre>`; lo que esté entre `[ ]` y `( )` se ignora.
- El nombre debe coincidir con el de una carta de tu biblioteca (sin distinguir mayúsculas). También se acepta el `id` de la carta.
- Las líneas que empiezan con `//` o `#` son comentarios. `// Deck: Nombre` define el nombre del mazo.
- Las cantidades se recortan al máximo permitido por rareza.
- Los tokens se ignoran (se generan solos).
- Las líneas cuyo nombre no coincide con ninguna carta se **omiten sin aviso**. Si el contador de cartas cargadas es menor al esperado, revisá los nombres.
- El total de 40 no se valida al importar: si el mazo tiene más o menos cartas, el indicador de estado te lo marca.

### Código JSON

Formato pensado para respaldar o compartir mazos:

```json
{
  "format": "aetherium-tcg-v1",
  "deckName": "Mazo Planetario de Batalla",
  "createdAt": "2026-09-18T12:00:00.000Z",
  "deck": [
    { "cardId": "custom_ab12cd3_lx9k2", "name": "Rayo", "count": 4 },
    { "cardId": "custom_ef45gh6_lx9k3", "name": "Ares", "count": 1 }
  ]
}
```

Al importar, cada entrada se busca primero por `cardId` y, si no se encuentra, por `name`. Como los `cardId` se generan al azar cuando se importan las imágenes, **un mazo compartido con otra persona (u otro navegador) se reconstruye por nombre**: ambos deben tener las cartas importadas con el mismo nombre. Lo único obligatorio es el arreglo `deck`. Las cantidades se recortan al máximo por rareza.

---

## Dónde se guardan los datos

Todo queda **en tu navegador**; no se envía nada a ningún servidor.

| Dato | Dónde | Clave |
|---|---|---|
| Cartas importadas (con sus imágenes) | IndexedDB | base `AetheriumTCG_CustomCardsDB` |
| Mazo activo, nombre y zoom | localStorage | `aetherium_tcg_active_deck` |

Consecuencias:

- Los datos son **por navegador y por perfil**. Otro navegador u otra computadora empieza vacío.
- Si borrás los datos del sitio desde el navegador, perdés cartas y mazo. **Exportá tus mazos** (texto o JSON) como respaldo y conservá tus imágenes originales.
- Abrir la app desde `file://` y desde `http://localhost` cuenta como sitios distintos, así que no comparten cartas ni mazos.

---

## Estructura del proyecto

```
tcg-deckbuilder/
├── index.html          # Interfaz completa (carga solo js/bundle.js)
├── css/                # main, navbar, deck-grid, library-sidebar, card, modals
└── js/
    ├── bundle.js       # Aplicación unificada que ejecuta index.html
    ├── app.js          # Punto de entrada (versión modular)
    ├── state.js        # Estado del mazo, reglas y export/import
    ├── customCardImporter.js  # Parser de nombres de archivo + IndexedDB
    ├── cardsData.js    # Constantes de planetas y tipos
    ├── deckManager.js  # Vista del mazo y Mazo Extra
    ├── filterManager.js, dragAndDrop.js, manaCurve.js,
    │   cardInspector.js, testHand.js, sound.js
```

`index.html` carga únicamente `js/bundle.js`, un bundle sin dependencias pensado para funcionar abriendo el archivo con doble clic (los módulos ES no cargan desde `file://`). Los archivos sueltos de `js/` son la versión modular del mismo código: si modificás uno, replicá el cambio en `bundle.js`, o el navegador no lo va a ver.

Al cambiar IDs o estructura del HTML, verificá que los `getElementById` del bundle sigan apuntando a elementos existentes; si no, el botón o la función afectada dejará de responder sin mostrar ningún error.

---

