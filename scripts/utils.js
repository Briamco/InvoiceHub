/* =========================================================================
   utils.js — Referencias del DOM, helpers y mensajes de error.
   Regla del proyecto: NO usar innerHTML.
   ========================================================================= */

/* ---------------------- Referencias del DOM ---------------------- */
const form = document.getElementById("invoiceForm");
const productRows = document.getElementById("productRows");
const addProductBtn = document.getElementById("addProduct");
const productError = document.getElementById("productError");
const generatedSection = document.getElementById("generatedSection");
const generatedDocument = document.getElementById("generatedDocument");
const printDocumentBtn = document.getElementById("printDocument");

const docType = document.getElementById("docType");
const docStatus = document.getElementById("docStatus");
const applyTax = document.getElementById("applyTax");
const taxRate = document.getElementById("taxRate");

const summaryEls = {
  count: document.getElementById("summaryCount"),
  gross: document.getElementById("summaryGross"),
  productDiscount: document.getElementById("summaryProductDiscount"),
  net: document.getElementById("summaryNet"),
  globalDiscount: document.getElementById("summaryGlobalDiscount"),
  tax: document.getElementById("summaryTax"),
  total: document.getElementById("summaryTotal"),
};

const STATUS_BY_TYPE = {
  Cotización: ["Pendiente", "Aprobada", "Rechazada"],
  Factura: ["Pendiente", "Pagada"],
};

const CURRENCY_FORMAT = new Intl.NumberFormat("es-DO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* ---------------------- Helpers ---------------------- */
function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function formatMoney(value) {
  const amount = Number.isFinite(value) ? value : 0;
  return `${document.getElementById("currency").value} ${CURRENCY_FORMAT.format(amount)}`;
}

function toNumber(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function getRowInputs(row) {
  return {
    description: row.querySelector(".product-description").value.trim(),
    quantity: row.querySelector(".product-quantity").value,
    price: row.querySelector(".product-price").value,
    discount: row.querySelector(".product-discount").value,
    subtotalEl: row.querySelector(".product-subtotal"),
  };
}

/* ---------------------- Mensajes de error ---------------------- */
function setError(fieldId, message) {
  const el = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearError(fieldId) {
  const el = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function clearAllErrors() {
  document.querySelectorAll(".error-message").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });
}
