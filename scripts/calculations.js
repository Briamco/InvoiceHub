/* =========================================================================
   calculations.js — Subtotal por fila, totales y resumen.
   ========================================================================= */

function updateRowSubtotal(row) {
  const { quantity, price, discount, subtotalEl } = getRowInputs(row);
  const qty = toNumber(quantity);
  const unit = toNumber(price);
  const disc = toNumber(discount);

  const gross = qty * unit;
  const discAmount = (gross * disc) / 100;
  const subtotal = gross - discAmount;

  subtotalEl.textContent = formatMoney(Math.max(0, subtotal));
}

function calculateTotals() {
  const rows = productRows.querySelectorAll(".product-row");
  let gross = 0;
  let productDiscount = 0;

  rows.forEach((row) => {
    const { quantity, price, discount } = getRowInputs(row);
    const lineGross = toNumber(quantity) * toNumber(price);
    const lineDiscount = (lineGross * toNumber(discount)) / 100;
    gross += lineGross;
    productDiscount += lineDiscount;
  });

  const net = gross - productDiscount;
  const globalDiscountPct = toNumber(document.getElementById("globalDiscount").value);
  const taxPct = applyTax.checked ? toNumber(taxRate.value) : 0;
  const appliesBefore = document.getElementById("discountApplication").value === "before";

  let globalDiscount;
  let tax;
  let total;

  if (appliesBefore) {
    globalDiscount = (net * globalDiscountPct) / 100;
    const taxableBase = net - globalDiscount;
    tax = (taxableBase * taxPct) / 100;
    total = taxableBase + tax;
  } else {
    tax = (net * taxPct) / 100;
    const beforeDiscount = net + tax;
    globalDiscount = (beforeDiscount * globalDiscountPct) / 100;
    total = beforeDiscount - globalDiscount;
  }

  return {
    count: rows.length,
    gross,
    productDiscount,
    net,
    globalDiscount,
    tax,
    total: Math.max(0, total),
  };
}

function updateSummary() {
  const t = calculateTotals();
  summaryEls.count.textContent = t.count;
  summaryEls.gross.textContent = formatMoney(t.gross);
  summaryEls.productDiscount.textContent = formatMoney(t.productDiscount);
  summaryEls.net.textContent = formatMoney(t.net);
  summaryEls.globalDiscount.textContent = formatMoney(t.globalDiscount);
  summaryEls.tax.textContent = formatMoney(t.tax);
  summaryEls.total.textContent = formatMoney(t.total);
}
