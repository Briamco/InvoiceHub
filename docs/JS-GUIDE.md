# InvoiceHub — Guía para implementar el JavaScript

Documento de apoyo para construir la lógica (validaciones, cálculos, DOM dinámico
y generación del documento). El HTML ya está hecho en `index.html`; aquí está
todo lo que necesitas para el JS y las funcionalidades.

> Regla de oro del proyecto: **prohibido `innerHTML`**. Todo se construye con
> `createElement`, `appendChild`, `removeChild`, `replaceChildren`,
> `textContent`, `value`, `setAttribute`, `classList.*` y `addEventListener`.

---

## 1. Estructura y IDs del formulario

El formulario es `#invoiceForm`. Cada sección tiene sus campos con `id` fijo.
Debajo de cada campo hay un `<p class="error-message">` con `data-error-for="<id>"`
donde debes inyectar el mensaje de error (usa `textContent`).

### Sección 1 — Datos del negocio
| Campo | id | Tipo | Requerido |
|---|---|---|---|
| Nombre del negocio | `businessName` | text | Sí |
| RNC / identificación | `businessId` | text | Sí |
| Teléfono | `businessPhone` | tel | Sí |
| Correo electrónico | `businessEmail` | email | Sí |
| URL del logo | `businessLogo` | url | No |
| Dirección | `businessAddress` | textarea | Sí |

### Sección 2 — Datos del cliente
| Campo | id | Tipo | Requerido |
|---|---|---|---|
| Nombre del cliente | `clientName` | text | Sí |
| Identificación o RNC | `clientId` | text | Sí |
| Teléfono | `clientPhone` | tel | Sí |
| Correo electrónico | `clientEmail` | email | Sí |
| Dirección | `clientAddress` | text | Sí |

### Sección 3 — Datos generales del documento
| Campo | id | Tipo | Requerido | Opciones |
|---|---|---|---|---|
| Tipo de documento | `docType` | select | Sí | `Cotización`, `Factura` |
| Número de documento | `docNumber` | text | Sí | — |
| Fecha de emisión | `issueDate` | date | Sí | — |
| Fecha de vencimiento | `dueDate` | date | Sí | — |
| Estado | `docStatus` | select | Sí | ver dependencia abajo |
| Moneda | `currency` | select | Sí | `DOP`, `USD`, `EUR` |

**Dependencia Tipo → Estado** (se actualiza al cambiar `docType`):
- `Cotización` → solo `Pendiente`, `Aprobada`, `Rechazada`
- `Factura` → solo `Pendiente`, `Pagada`

Al reconstruir las opciones del select de Estado, **no uses innerHTML**:
usa `select.replaceChildren(...opciones)` creando cada `<option>` con
`createElement`/`textContent`/`value`.

### Sección 4 — Productos o servicios
- Contenedor de filas: `#productRows`
- Plantilla de fila existente con clases:
  - `.product-row` (contenedor de la fila)
  - `.product-description`, `.product-quantity`, `.product-price`,
    `.product-discount`, `.product-subtotal` (es un `<output>`)
  - `.remove-product` (botón Eliminar)
- Botón agregar: `#addProduct`
- Error de sección: `#productError`

**Subtotal de fila**: solo lectura, el usuario no lo escribe. Es un `<output>`;
usa `.textContent` para actualizarlo.

### Sección 5 — Impuestos y descuentos generales
| Campo | id | Tipo | Requerido | Notas |
|---|---|---|---|---|
| Aplicar impuesto | `applyTax` | checkbox | No | desmarcado al inicio |
| Porcentaje de impuesto | `taxRate` | number | Si `applyTax` marcado | vacío y **disabled** al inicio |
| Descuento general | `globalDiscount` | number | No | vacío = 0 |
| Aplicación del descuento | `discountApplication` | select | Sí | `before` (default), `after` |

Valores del select `discountApplication`:
- `before` → "Aplicar descuento antes del impuesto"
- `after`  → "Aplicar descuento después del impuesto"

### Sección 6 — Resumen de cálculos
| Valor | id |
|---|---|
| Cantidad de productos o servicios | `summaryCount` |
| Subtotal bruto | `summaryGross` |
| Descuento por productos | `summaryProductDiscount` |
| Subtotal después de descuentos individuales | `summaryNet` |
| Descuento general | `summaryGlobalDiscount` |
| Impuesto | `summaryTax` |
| Total final | `summaryTotal` |

### Botón y documento generado
- Botón: `#generateDocument` (submit de `#invoiceForm`)
- Sección documento: `#generatedSection` (tiene `hidden`; quítalo con
  `classList.remove("hidden")` o `.hidden = false` al generar)
- Contenedor del documento: `#generatedDocument` (vacíalo con
  `replaceChildren()` antes de reconstruir)

---

## 2. Modelo de datos sugerido

```js
// Por fila de producto
{ description: string, quantity: int, price: number, discount: number /* % */ }
```

Puedes leer los valores directamente de los inputs de cada `.product-row` con
`closest(".product-row")`, o mantener un array y sincronizarlo. Cualquiera
sirve; evita duplicar la fuente de verdad.

---

## 3. Fórmulas (implementar en JS, NO en HTML)

### 3.1 Subtotal de cada fila
```
subtotalBruto          = cantidad * precioUnitario
montoDescuentoFila     = subtotalBruto * descuentoIndividual / 100
subtotalFila           = subtotalBruto - montoDescuentoFila
```
Si `descuentoIndividual` está vacío → asumir `0`.

### 3.2 Acumulados
```
cantidadProductos      = número de filas
subtotalBruto          = suma de (cantidad * precioUnitario)
descuentoPorProductos  = suma de montoDescuentoFila
subtotalNeto           = subtotalBruto - descuentoPorProductos
```

### 3.3 Regla según `discountApplication`

**Antes del impuesto (`before`)** — default:
```
montoDescuentoGeneral = subtotalNeto * descuentoGeneral / 100
baseImponible         = subtotalNeto - montoDescuentoGeneral
impuesto              = baseImponible * porcentajeImpuesto / 100
totalFinal            = baseImponible + impuesto
```

**Después del impuesto (`after`)**:
```
impuesto                    = subtotalNeto * porcentajeImpuesto / 100
totalAntesDescuento         = subtotalNeto + impuesto
montoDescuentoGeneral       = totalAntesDescuento * descuentoGeneral / 100
totalFinal                  = totalAntesDescuento - montoDescuentoGeneral
```

> **Impuesto = 0** si `applyTax` no está marcado.
> **Descuento general = 0** si el campo está vacío.
> **Total final nunca negativo**: `totalFinal = Math.max(0, totalFinal)`.

### 3.4 Formato de montos
- Siempre **dos decimales** y con la moneda seleccionada.
- Ejemplos: `DOP 1,500.00`, `USD 25.50`, `EUR 80.00`.
- Sugerencia: `new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
  y antepone la moneda: `` `${currency} ${formatted}` ``.

---

## 4. Validaciones y mensajes

Se ejecutan al pulsar **Generar documento**. Muestra el mensaje bajo el campo
correspondiente (`textContent` sobre el `[data-error-for="<id>"]`) y añade/quita
la clase de borde rojo. Los mensajes deben **desaparecer al corregir** el campo
(escucha `input`/`change` y limpia).

| Condición | Mensaje |
|---|---|
| Nombre del negocio vacío | Debe ingresar el nombre del negocio. |
| Nombre del cliente vacío | Debe ingresar el nombre del cliente. |
| Correo con formato inválido (negocio o cliente) | Debe ingresar un correo electrónico válido. |
| Sin productos válidos | Debe agregar al menos un producto o servicio válido. |
| Cantidad ≤ 0 o decimal | La cantidad debe ser un número entero mayor que cero. No se permiten cantidades decimales. |
| Precio unitario ≤ 0 | El precio unitario debe ser mayor que cero. |
| Descuento individual < 0 o > 100 | El descuento individual debe estar entre 0 y 100. |
| Descuento general < 0 o > 100 | El descuento general debe estar entre 0 y 100. |
| `applyTax` marcado sin porcentaje | Debe ingresar el porcentaje de impuesto. |
| `dueDate` < `issueDate` | La fecha de vencimiento no puede ser menor que la fecha de emisión. |

Además, son requeridos (aunque el doc solo da mensaje explícito a algunos):
`businessId`, `businessPhone`, `businessAddress`, `clientId`, `clientPhone`,
`clientAddress`, `docType`, `docNumber`, `issueDate`, `dueDate`, `docStatus`,
`currency`, `discountApplication`.

**Formato de correo**: puedes usar `input.checkValidity()` sobre un `type=email`,
o una regex simple. No uses `innerHTML` para nada del mensaje.

---

## 5. Comportamiento por eventos (resumen)

| Evento | Elemento | Acción |
|---|---|---|
| `input` | cualquier campo | recalcular resumen + limpiar error del campo |
| `change` | `docType` | reconstruir opciones de `docStatus` |
| `change` | `applyTax` | habilitar/limpiar `taxRate`; recalc |
| `change` | `taxRate`, `globalDiscount`, `discountApplication` | recalcular |
| `input` | filas producto (cantidad/precio/descuento) | recalcular fila + resumen |
| `click` | `.remove-product` | eliminar fila (bloquear si es la única) |
| `click` | `#addProduct` | crear fila nueva dinámicamente |
| `submit` | `#invoiceForm` | validar → generar documento → reiniciar formulario |

### Aplicar impuesto (`applyTax`)
- Al marcar: `taxRate.disabled = false`, permitir editar, recalc.
- Al desmarcar: `taxRate.value = ""`, `taxRate.disabled = true`, impuesto = 0.

### Eliminar única fila
Si el usuario pulsa Eliminar y solo queda una fila, no la elimines y muestra:
```
Debe existir al menos un producto o servicio en la cotización o factura.
```
(usa `#productError` con `textContent`).

Después de eliminar una fila, recalcula:
subtotal general, descuento total, impuesto, total final y cantidad de productos.

---

## 6. Agregar fila dinámicamente (sin innerHTML)

Crea los elementos con `document.createElement`, asigna clases con
`classList.add`, textos con `textContent`, y enlaza con `appendChild`. A cada
input nuevo asígnale su listener de `input` para recalcular. Ejemplo de esqueleto:

```js
function createProductRow() {
  const row = document.createElement("div");
  row.classList.add("product-row", /* ...clases de grid... */);

  const desc = document.createElement("input");
  desc.type = "text";
  desc.classList.add("product-description", /* ... */);
  desc.setAttribute("placeholder", "Diseño de sitio web");

  const qty = document.createElement("input");
  qty.type = "number";
  qty.classList.add("product-quantity");
  qty.setAttribute("min", "1");
  qty.setAttribute("step", "1");

  // ...precio, descuento, output subtotal, botón eliminar...

  [desc, qty, price, discount].forEach((el) =>
    el.addEventListener("input", () => { updateRow(row); updateSummary(); })
  );

  removeBtn.addEventListener("click", () => removeRow(row));

  row.append(desc, qty, price, discount, subtotal, removeBtn);
  return row;
}

document.getElementById("addProduct").addEventListener("click", () => {
  document.getElementById("productRows").appendChild(createProductRow());
});
```

> Puedes basarte en la primera fila que ya existe en el HTML: clónala con
> `row.cloneNode(true)` y limpia sus `value` — también es manipulación de DOM
> válida y evita duplicar el marcado.

---

## 7. Construcción del documento generado (sin innerHTML)

Vacía con `generatedDocument.replaceChildren()` y reconstruye con
`createElement`/`appendChild`. Estructura mínima requerida:

1. **Encabezado**: logo (solo si hay URL válida; si no, solo el nombre),
   nombre del negocio, RNC, teléfono, correo y dirección.
   - Logo: `document.createElement("img")`, `img.src = businessLogo.value`,
     `img.alt = businessName.value`. Si no hay URL, no añadas el `<img>`.
2. **Datos del cliente**: nombre, identificación, teléfono, correo, dirección.
3. **Datos del documento**: tipo, número, fecha de emisión, fecha de
   vencimiento, estado y moneda.
4. **Detalle de productos**: tabla con columnas
   `# | Descripción | Cantidad | Precio unitario | Descuento | Subtotal`.
   Construye `table` → `thead`/`tr`/`th` y `tbody` con una fila por producto.
5. **Resumen**: subtotal bruto, descuentos, impuesto y total final.
6. **Pie**: fecha y hora de generación (`new Date()`).

Recomendación: crea ayudantes pequeños y reutilizables, p. ej.
`makeEl(tag, { class, text })` y `makeMoney(value)` que devuelve
`"<moneda> <monto con 2 decimales>"`, para no repetir código.

Tras generar: `#generatedSection`.hidden = false y **reemplaza** cualquier
documento anterior (nunca acumules varios).

---

## 8. Reinicio del formulario tras generar

Después de generar correctamente:
- Campos de texto → vacíos.
- Campos numéricos editables → vacíos.
- Campos calculados → `0.00` (con dos decimales).
- Selects → opción inicial (Cotización, Pendiente, DOP, `before`).
- `applyTax` → desmarcado; `taxRate` → vacío y disabled.
- Dejar **una sola fila** de producto (usa `replaceChildren` o elimina las
  extra con `removeChild`).
- Resumen → todo a cero.
- El **documento generado permanece visible** hasta que se genere otro.

---

## 9. Checklist de requisitos técnicos

- [ ] Solo HTML, CSS y JS vanilla (sin frameworks, sin backend).
- [ ] Funciona abriendo `index.html` directamente, sin servidor ni instalación.
- [ ] **Cero uso de `innerHTML`** en todo el proyecto.
- [ ] Filas creadas/eliminadas con métodos del DOM.
- [ ] Validaciones antes de generar, con mensajes bajo el campo.
- [ ] Mensajes desaparecen al corregir el dato.
- [ ] Cálculos automáticos al cambiar cualquier valor relevante.
- [ ] Montos con 2 decimales y moneda seleccionada.
- [ ] Total final nunca negativo (mínimo 0).
- [ ] Documento anterior reemplazado (nunca dos a la vez).
- [ ] Formulario reiniciado tras generar; documento permanece visible.
- [ ] Interfaz responsiva (móvil, tablet, escritorio).
- [ ] Sin `localStorage`/`sessionStorage`.
- [ ] Vistas sin lógica compleja de cálculo (esa va en JS).

---

## 10. Orden de implementación sugerido

1. Referencias del DOM (`getElementById`/`querySelector`) en un bloque al inicio.
2. Helpers: `makeEl`, `makeMoney`, `setError`, `clearError`.
3. `recalcRow(row)` → subtotal de fila.
4. `recalcSummary()` → todos los valores del resumen + formato de moneda.
5. Listeners de filas (input) y botones agregar/eliminar.
6. Lógica de `applyTax` y de `docType` → estados.
7. `validateForm()` → recorre reglas y devuelve boolean; pinta errores.
8. `buildDocument()` → construye el documento generado.
9. `resetForm()` → reinicio tras generar.
10. Listener `submit` que une: validar → generar → reiniciar.
