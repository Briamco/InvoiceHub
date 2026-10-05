/* =========================================================================
   validations.js — Reglas de validación del formulario y sus mensajes.
   ========================================================================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRequired(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field.value.trim()) {
    setError(fieldId, message);
    return false;
  }
  return true;
}

function validateEmail(fieldId) {
  const field = document.getElementById(fieldId);
  if (!EMAIL_RE.test(field.value.trim())) {
    setError(fieldId, "Debe ingresar un correo electrónico válido.");
    return false;
  }
  return true;
}

function validateProducts() {
  const rows = productRows.querySelectorAll(".product-row");
  let validCount = 0;
  let firstError = null;

  rows.forEach((row) => {
    const { description, quantity, price, discount } = getRowInputs(row);
    const qty = toNumber(quantity);
    const unit = toNumber(price);
    const disc = toNumber(discount);
    let rowValid = true;

    if (!description) {
      if (firstError === null) firstError = "Debe agregar al menos un producto o servicio válido.";
      rowValid = false;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      if (firstError === null)
        firstError =
          "La cantidad debe ser un número entero mayor que cero. No se permiten cantidades decimales.";
      rowValid = false;
    }
    if (unit <= 0) {
      if (firstError === null) firstError = "El precio unitario debe ser mayor que cero.";
      rowValid = false;
    }
    if (disc < 0 || disc > 100) {
      if (firstError === null) firstError = "El descuento individual debe estar entre 0 y 100.";
      rowValid = false;
    }
    if (rowValid) validCount += 1;
  });

  if (validCount === 0) {
    productError.textContent = firstError || "Debe agregar al menos un producto o servicio válido.";
    productError.classList.remove("hidden");
    return false;
  }

  productError.classList.add("hidden");
  return true;
}

function validateForm() {
  clearAllErrors();
  let valid = true;

  if (!validateRequired("businessName", "Debe ingresar el nombre del negocio.")) valid = false;
  if (!validateRequired("businessId", "Debe ingresar el RNC o identificación del negocio."))
    valid = false;
  if (!validateRequired("businessPhone", "Debe ingresar el teléfono del negocio.")) valid = false;
  if (!validateRequired("businessEmail", "Debe ingresar el correo del negocio.")) valid = false;
  else if (!validateEmail("businessEmail")) valid = false;
  if (!validateRequired("businessAddress", "Debe ingresar la dirección del negocio."))
    valid = false;

  if (document.getElementById("businessLogo").value.trim()) {
    try {
      new URL(document.getElementById("businessLogo").value.trim());
    } catch {
      setError("businessLogo", "Debe ingresar una URL válida.");
      valid = false;
    }
  }

  if (!validateRequired("clientName", "Debe ingresar el nombre del cliente.")) valid = false;
  if (!validateRequired("clientId", "Debe ingresar la identificación o RNC del cliente."))
    valid = false;
  if (!validateRequired("clientPhone", "Debe ingresar el teléfono del cliente.")) valid = false;
  if (!validateRequired("clientEmail", "Debe ingresar el correo del cliente.")) valid = false;
  else if (!validateEmail("clientEmail")) valid = false;
  if (!validateRequired("clientAddress", "Debe ingresar la dirección del cliente.")) valid = false;

  if (!validateRequired("docType", "Debe seleccionar el tipo de documento.")) valid = false;
  if (!validateRequired("docNumber", "Debe ingresar el número de documento.")) valid = false;
  if (!validateRequired("issueDate", "Debe ingresar la fecha de emisión.")) valid = false;
  if (!validateRequired("dueDate", "Debe ingresar la fecha de vencimiento.")) valid = false;
  if (!validateRequired("docStatus", "Debe seleccionar el estado.")) valid = false;
  if (!validateRequired("currency", "Debe seleccionar la moneda.")) valid = false;

  const issue = document.getElementById("issueDate").value;
  const due = document.getElementById("dueDate").value;
  if (issue && due && due < issue) {
    setError("dueDate", "La fecha de vencimiento no puede ser menor que la fecha de emisión.");
    valid = false;
  }

  if (applyTax.checked) {
    const pct = taxRate.value.trim();
    if (pct === "") {
      setError("taxRate", "Debe ingresar el porcentaje de impuesto.");
      valid = false;
    } else if (toNumber(pct) < 0 || toNumber(pct) > 100) {
      setError("taxRate", "El porcentaje de impuesto debe estar entre 0 y 100.");
      valid = false;
    }
  }

  const globalDisc = toNumber(document.getElementById("globalDiscount").value);
  if (globalDisc < 0 || globalDisc > 100) {
    setError("globalDiscount", "El descuento general debe estar entre 0 y 100.");
    valid = false;
  }

  if (!validateProducts()) valid = false;

  return valid;
}
