/* =========================================================================
   products.js — Filas de productos o servicios (crear, agregar, eliminar).
   ========================================================================= */

function createProductRow() {
  const template = document.querySelector(".product-row");
  const row = template.cloneNode(true);

  row.querySelectorAll("input").forEach((input) => {
    input.value = "";
  });
  row.querySelector(".product-subtotal").textContent = "0.00";

  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      updateRowSubtotal(row);
      updateSummary();
    });
  });
  row.querySelector(".remove-product").addEventListener("click", () => removeRow(row));

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
