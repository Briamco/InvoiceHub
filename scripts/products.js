/* =========================================================================
   products.js — Filas de productos o servicios (crear, agregar, eliminar).
   ========================================================================= */

function bindProductRow(row) {
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      clearRowError(input);
      updateRowSubtotal(row);
      updateSummary();
    });
  });
  row.querySelector(".remove-product").addEventListener("click", () => removeRow(row));
  updateRowSubtotal(row);
}

function createProductRow() {
  const template = document.querySelector(".product-row");
  const row = template.cloneNode(true);

  row.querySelectorAll("input").forEach((input) => {
    input.value = "";
  });
  row.querySelectorAll("[data-row-error]").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });

  bindProductRow(row);
  return row;
}

function addProductRow() {
  productRows.appendChild(createProductRow());
  updateSummary();
}

function removeRow(row) {
  if (productRows.querySelectorAll(".product-row").length <= 1) {
    productError.textContent =
      "Debe existir al menos un producto o servicio en la cotización o factura.";
    productError.classList.remove("hidden");
    return;
  }
  row.remove();
  productError.classList.add("hidden");
  updateSummary();
}
