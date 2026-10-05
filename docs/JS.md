# InvoiceHub — Cómo funciona el JavaScript

Documentación de la carpeta `scripts/`: qué hace cada parte, cómo se conecta con
el HTML y cómo fluyen los datos. Cumple la regla del proyecto: **cero
`innerHTML`**, todo con `createElement`, `appendChild`, `removeChild`,
`replaceChildren`, `textContent`, `value`, `setAttribute`, `classList.*` y
`addEventListener`.

---

## 0. Archivos (orden de carga)

El código está separado por responsabilidad. Se cargan como scripts clásicos
(no módulos) para que la app funcione abriendo `index.html` directamente. El
**orden importa**, porque comparten el ámbito global:

| Orden | Archivo | Responsabilidad |
|---|---|---|
| 1 | `utils.js` | Referencias del DOM, helpers y mensajes de error. |
| 2 | `products.js` | Crear / agregar / eliminar filas de productos. |
| 3 | `calculations.js` | Subtotal por fila, totales y resumen. |
| 4 | `validations.js` | Reglas de validación y sus mensajes. |
| 5 | `document.js` | Construcción del documento generado. |
| 6 | `main.js` | Dependencias, reinicio, eventos e inicio (`init()`). |

```html
<script src="scripts/utils.js"></script>
<script src="scripts/products.js"></script>
<script src="scripts/calculations.js"></script>
<script src="scripts/validations.js"></script>
<script src="scripts/document.js"></script>
<script src="scripts/main.js"></script>
```

`utils.js` debe ir primero porque define las referencias y helpers que usan los
demás; `main.js` va al final porque ejecuta `init()` cuando todo ya existe.

---

## 1. Panorama general (antes un solo archivo, ahora 6)

El código está dividido en bloques, en este orden:

1. **Referencias del DOM** — constantes a los elementos clave.
2. **Helpers** — utilidades pequeñas reutilizables.
3. **Manejo de mensajes de error**.
4. **Filas de productos** — crear, agregar y eliminar.
5. **Cálculos** — subtotal de fila, totales y resumen.
6. **Dependencias e impuesto** — tipo→estado, checkbox de impuesto.
7. **Validaciones** — reglas y mensajes.
8. **Generación del documento** — construye la vista con DOM.
9. **Reinicio del formulario**.
10. **Registro de eventos** y estado inicial.

Cada bloque vive ahora en su propio archivo (ver sección 0).

El flujo de datos es **unidireccional**: el usuario escribe → se lee de los
inputs → se calcula → se pinta en el resumen o en el documento. No se guarda
estado duplicado: **los inputs son la única fuente de verdad**.

---

## 2. Referencias y helpers

```js
const form = document.getElementById("invoiceForm");
const productRows = document.getElementById("productRows");
// ...etc
```

Se resuelven una sola vez al cargar. `summaryEls` agrupa los 7 valores del
resumen por nombre para no repetir `getElementById`.

| Helper | Para qué sirve |
|---|---|
| `makeEl(tag, className, text)` | Crea un elemento con clase y texto en un paso (evita 3 líneas por elemento). |
| `formatMoney(value)` | Devuelve `"DOP 1,500.00"` usando `Intl.NumberFormat` con 2 decimales. |
| `toNumber(value)` | Convierte a número seguro; vacío o inválido → `0`. |
| `getRowInputs(row)` | Lee descripción, cantidad, precio, descuento y el `<output>` de una fila. |

`formatMoney` toma la moneda actual del select `#currency` en cada llamada, así
que **todos los montos siguen la moneda seleccionada** sin pasarla por parámetro.

```js
const CURRENCY_FORMAT = new Intl.NumberFormat("es-DO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
```

---

## 3. Filas de productos

### Crear una fila (`createProductRow`)
- Toma la primera `.product-row` como plantilla y hace `cloneNode(true)`.
- Limpia todos los `input` con un `forEach` (`querySelectorAll` devuelve una
  lista, no un elemento: hay que recorrerla).
- Pone el `<output>` de subtotal en `"0.00"`.
- **Reengancha los eventos**: `cloneNode` copia la estructura pero **no** los
  listeners, por eso se vuelven a asignar aquí.
- Devuelve la fila lista.

### Agregar (`addProductRow`)
- `productRows.appendChild(createProductRow())` y recalcula el resumen.

### Eliminar (`removeRow`)
- Si solo queda **una** fila, no la borra y muestra el mensaje en `#productError`:
  *"Debe existir al menos un producto o servicio en la cotización o factura."*
- Si hay más de una: `row.remove()` + recálculo del resumen.

> Clonar la plantilla en vez de construir con `createElement` mantiene el diseño
> responsivo intacto y cumple igual la restricción de no usar `innerHTML`.

---

## 4. Cálculos

### Subtotal de fila (`updateRowSubtotal`)
```
subtotalBruto      = cantidad * precioUnitario
montoDescuentoFila = subtotalBruto * descuentoIndividual / 100
subtotalFila       = subtotalBruto - montoDescuentoFila
```
Escribe el resultado (con `Math.max(0, ...)`) en el `<output>` de la fila.
Descuento vacío → `toNumber` lo trata como `0`.

### Totales (`calculateTotals`)
Recorre todas las filas, acumula `gross` y `productDiscount`, y calcula según la
opción del select `#discountApplication`:

**Antes del impuesto (`before`, por defecto):**
```
subtotalNeto    = gross - productDiscount
descuentoGeneral = subtotalNeto * descGeneral / 100
baseImponible   = subtotalNeto - descuentoGeneral
impuesto        = baseImponible * impuestoPct / 100
total           = baseImponible + impuesto
```

**Después del impuesto (`after`):**
```
impuesto         = subtotalNeto * impuestoPct / 100
antesDescuento   = subtotalNeto + impuesto
descuentoGeneral = antesDescuento * descGeneral / 100
total            = antesDescuento - descuentoGeneral
```

- El impuesto es `0` si `#applyTax` no está marcado.
- `total` nunca baja de 0: `Math.max(0, total)`.
- Devuelve un objeto con `count, gross, productDiscount, net,
  globalDiscount, tax, total` que usan tanto el resumen como el documento.

### Resumen (`updateSummary`)
Pinta los 7 valores en sus `dd` del `#summary...`, todos con `formatMoney`
salvo la cantidad (`count`), que es un entero.

---

## 5. Dependencias e impuesto

| Función | Qué hace |
|---|---|
| `updateStatusOptions()` | Al cambiar `#docType`, reconstruye las opciones de `#docStatus` con `replaceChildren(...options)`. Cotización → Pendiente/Aprobada/Rechazada; Factura → Pendiente/Pagada. |
| `syncTaxField()` | Al marcar `#applyTax` habilita `#taxRate`; al desmarcar lo limpia, lo deshabilita y pone el impuesto en 0. Siempre recalcula. |

---

## 6. Validaciones

Todas se ejecutan en `validateForm()` al enviar el formulario.

### Piezas
- `setError(id, msg)` / `clearError(id)`: escriben el texto en el
  `[data-error-for="<id>"]` con `textContent` y alternan `hidden`.
- `clearAllErrors()`: limpia todos los `.error-message` al inicio de la validación.
- `validateRequired(id, msg)` y `validateEmail(id)`: reglas reutilizables.
- `validateProducts()`: recorre cada fila y comprueba descripción, cantidad
  (entero > 0), precio (> 0) y descuento (0–100). Guarda el **primer** mensaje de
  error y, si ninguna fila es válida, lo muestra en `#productError`.

### Reglas aplicadas
| Campo | Regla | Mensaje |
|---|---|---|
| businessName | requerido | Debe ingresar el nombre del negocio. |
| businessEmail / clientEmail | formato email | Debe ingresar un correo electrónico válido. |
| businessLogo | URL válida si viene | Debe ingresar una URL válida. |
| clientName | requerido | Debe ingresar el nombre del cliente. |
| dueDate | ≥ issueDate | La fecha de vencimiento no puede ser menor que la fecha de emisión. |
| productos | al menos uno válido | Debe agregar al menos un producto o servicio válido. |
| cantidad | entero > 0 | La cantidad debe ser un número entero mayor que cero… |
| precio | > 0 | El precio unitario debe ser mayor que cero. |
| desc. individual | 0–100 | El descuento individual debe estar entre 0 y 100. |
| desc. general | 0–100 | El descuento general debe estar entre 0 y 100. |
| taxRate (si applyTax) | requerido, 0–100 | Debe ingresar el porcentaje de impuesto. |

Formato de correo: regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
`businessLogo` se valida con `new URL(...)` dentro de un `try/catch`.

**Los mensajes desaparecen al corregir**: dos listeners en `#invoiceForm`
(`input` y `change`) llaman a `clearError(event.target.id)` cuando cambia
cualquier campo con `id`.

---

## 7. Generación del documento

`buildDocument()` (al pasar la validación) reconstruye `#generatedDocument`:

1. `generatedDocument.replaceChildren()` — **reemplaza** el documento anterior
   (nunca se acumulan dos).
2. **Encabezado**: logo (solo si hay URL; `<img>` con `src`/`alt`), nombre, RNC,
   teléfono, correo y dirección.
3. **Datos del cliente** y **Datos del documento** con `buildInfoBlock`.
4. **Tabla de productos** con `buildProductsTable`: columnas
   `# | Descripción | Cantidad | Precio unitario | Descuento | Subtotal`.
5. **Resumen** con `buildSummaryBlock` (subtotal, descuentos, impuesto, total).
6. **Pie** con fecha/hora vía `new Date().toLocaleString("es-DO")`.
7. `generatedSection.hidden = false` para mostrarlo.

Ningún texto se inyecta como HTML: `makeEl` usa `textContent`, y las tablas se
crean nodo a nodo con `createElement`/`appendChild`.

---

## 8. Reinicio y eventos

### `resetForm()` (tras generar)
- `form.reset()` limpia inputs y selects a su valor inicial.
- `productRows.replaceChildren(createProductRow())` deja **una sola** fila.
- Reajusta checkbox de impuesto, tipo, estado, moneda y aplicación del descuento.
- Limpia errores y recalcula el resumen.
- El **documento generado permanece visible** hasta que se genere otro (no se
  toca `#generatedSection` aquí).

### Tabla de eventos
| Evento | Elemento | Acción |
|---|---|---|
| `click` | `#addProduct` | `addProductRow` |
| `change` | `#docType` | `updateStatusOptions` |
| `change` | `#applyTax` | `syncTaxField` |
| `input` | `#globalDiscount`, `#taxRate` | `updateSummary` |
| `change` | `#discountApplication` | `updateSummary` |
| `change` | `#currency` | recalcula filas + resumen |
| `input` | inputs de cada fila | `updateRowSubtotal` + `updateSummary` |
| `click` | `.remove-product` | `removeRow` |
| `input`/`change` | `#invoiceForm` (delegado) | `clearError` |
| `submit` | `#invoiceForm` | validar → generar → reiniciar |

Al final del archivo se fija el **estado inicial**: `updateStatusOptions()`,
`syncTaxField()` y `updateSummary()`, para que la pantalla arranque coherente
(estado filtrado por tipo, impuesto deshabilitado, resumen en cero).

---

## 9. Cumplimiento de requisitos

- ✅ Solo HTML/CSS/JS vanilla, sin backend ni frameworks.
- ✅ Sin `innerHTML` en ningún punto.
- ✅ Filas creadas y eliminadas con métodos del DOM.
- ✅ Validación antes de generar, mensajes bajo cada campo.
- ✅ Errores que desaparecen al corregir.
- ✅ Cálculo automático ante cualquier cambio relevante.
- ✅ Montos con 2 decimales y moneda seleccionada.
- ✅ Total final nunca negativo.
- ✅ Documento anterior reemplazado.
- ✅ Formulario reiniciado tras generar; documento permanece visible.
