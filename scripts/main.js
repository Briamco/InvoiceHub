/* =========================================================================
   main.js — Dependencias (tipo→estado, impuesto), reinicio, eventos e inicio.
   ========================================================================= */

/* ---------------------- Dependencia tipo → estado ---------------------- */
function updateStatusOptions() {
  const options = STATUS_BY_TYPE[docType.value] || [];
  docStatus.replaceChildren(
    ...options.map((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      return option;
    })
  );
}

/* ---------------------- Impuesto ---------------------- */
function syncTaxField() {
  if (applyTax.checked) {
    taxRate.disabled = false;
  } else {
    taxRate.value = "";
    taxRate.disabled = true;
    clearError("taxRate");
  }
  updateSummary();
}

/* ---------------------- Reinicio ---------------------- */
function resetForm() {
  form.reset();

  productRows.replaceChildren(createProductRow());

  applyTax.checked = false;
  taxRate.value = "";
  taxRate.disabled = true;
  docType.value = "Cotización";
  updateStatusOptions();
  docStatus.value = "Pendiente";
  document.getElementById("currency").value = "DOP";
  document.getElementById("discountApplication").value = "before";

  clearAllErrors();
  productError.classList.add("hidden");
  updateSummary();
}

/* ---------------------- Eventos ---------------------- */
function bindEvents() {
  addProductBtn.addEventListener("click", addProductRow);

  docType.addEventListener("change", updateStatusOptions);
  applyTax.addEventListener("change", syncTaxField);

  document.getElementById("globalDiscount").addEventListener("input", updateSummary);
  document.getElementById("discountApplication").addEventListener("change", updateSummary);
  document.getElementById("currency").addEventListener("change", () => {
    productRows.querySelectorAll(".product-row").forEach(updateRowSubtotal);
    updateSummary();
  });
  taxRate.addEventListener("input", updateSummary);

  productRows.querySelectorAll(".product-row").forEach(bindProductRow);

  form.addEventListener("input", (event) => {
    if (event.target.id) clearError(event.target.id);
  });

  form.addEventListener("change", (event) => {
    if (event.target.id) clearError(event.target.id);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    buildDocument();
    resetForm();
  });

  printDocumentBtn.addEventListener("click", () => window.print());
}

/* ---------------------- Estado inicial ---------------------- */
function init() {
  bindEvents();
  updateStatusOptions();
  syncTaxField();
  updateSummary();
}

init();
