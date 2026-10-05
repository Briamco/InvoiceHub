/* =========================================================================
   document.js — Construcción de la cotización o factura generada.
   ========================================================================= */

function buildInfoBlock(title, pairs) {
  const block = makeEl("div", "mb-4");
  block.appendChild(
    makeEl("h3", "mb-2 text-sm font-bold uppercase tracking-wide text-slate-500", title)
  );
  const list = makeEl("dl", "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm");
  pairs.forEach(([label, value]) => {
    list.appendChild(makeEl("dt", "font-medium text-slate-600", label));
    list.appendChild(makeEl("dd", "text-slate-900", value || "—"));
  });
  block.appendChild(list);
  return block;
}

function buildProductsTable() {
  const table = makeEl("table", "w-full border-collapse text-sm");
  const thead = makeEl("thead");
  const headRow = makeEl("tr");
  ["#", "Descripción", "Cantidad", "Precio unitario", "Descuento", "Subtotal"].forEach((label) => {
    headRow.appendChild(
      makeEl("th", "border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-600", label)
    );
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = makeEl("tbody");
  productRows.querySelectorAll(".product-row").forEach((row, index) => {
    const { description, quantity, price, discount } = getRowInputs(row);
    const lineGross = toNumber(quantity) * toNumber(price);
    const lineDiscount = (lineGross * toNumber(discount)) / 100;
    const lineSubtotal = lineGross - lineDiscount;

    const tr = makeEl("tr");
    [
      String(index + 1),
      description,
      String(toNumber(quantity)),
      formatMoney(toNumber(price)),
      `${toNumber(discount)}%`,
      formatMoney(lineSubtotal),
    ].forEach((text, colIndex) => {
      tr.appendChild(
        makeEl(
          "td",
          `border-b border-slate-100 px-2 py-2 text-slate-800${colIndex > 1 ? " text-right tabular-nums" : ""}`,
          text
        )
      );
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function buildSummaryBlock(totals) {
  const rows = [
    ["Subtotal bruto", totals.gross],
    ["Descuento por productos", totals.productDiscount],
    ["Subtotal después de descuentos", totals.net],
    ["Descuento general", totals.globalDiscount],
    ["Impuesto", totals.tax],
  ];
  const block = makeEl("div", "mt-6 ml-auto w-full max-w-xs");
  rows.forEach(([label, value]) => {
    const line = makeEl("div", "flex justify-between border-b border-slate-100 py-1.5 text-sm");
    line.appendChild(makeEl("span", "text-slate-600", label));
    line.appendChild(makeEl("span", "tabular-nums text-slate-900", formatMoney(value)));
    block.appendChild(line);
  });
  const totalLine = makeEl("div", "flex justify-between pt-2 text-base font-bold");
  totalLine.appendChild(makeEl("span", "text-slate-900", "Total final"));
  totalLine.appendChild(makeEl("span", "tabular-nums text-teal-700", formatMoney(totals.total)));
  block.appendChild(totalLine);
  return block;
}

function buildDocument() {
  const totals = calculateTotals();
  generatedDocument.replaceChildren();

  const header = makeEl("header", "mb-6 flex items-start gap-4 border-b border-slate-200 pb-6");
  const logoUrl = document.getElementById("businessLogo").value.trim();
  if (logoUrl) {
    const img = document.createElement("img");
    img.src = logoUrl;
    img.alt = document.getElementById("businessName").value;
    img.className = "size-16 rounded object-contain";
    header.appendChild(img);
  }
  const headerText = makeEl("div");
  headerText.appendChild(
    makeEl("h1", "text-2xl font-bold text-slate-900", document.getElementById("businessName").value)
  );
  headerText.appendChild(
    makeEl("p", "text-sm text-slate-600", `RNC: ${document.getElementById("businessId").value}`)
  );
  headerText.appendChild(
    makeEl("p", "text-sm text-slate-600", document.getElementById("businessPhone").value)
  );
  headerText.appendChild(
    makeEl("p", "text-sm text-slate-600", document.getElementById("businessEmail").value)
  );
  headerText.appendChild(
    makeEl("p", "text-sm text-slate-600", document.getElementById("businessAddress").value)
  );
  header.appendChild(headerText);
  generatedDocument.appendChild(header);

  const meta = makeEl("div", "mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2");
  meta.appendChild(
    buildInfoBlock("Datos del cliente", [
      ["Cliente", document.getElementById("clientName").value],
      ["Identificación", document.getElementById("clientId").value],
      ["Teléfono", document.getElementById("clientPhone").value],
      ["Correo", document.getElementById("clientEmail").value],
      ["Dirección", document.getElementById("clientAddress").value],
    ])
  );
  meta.appendChild(
    buildInfoBlock("Datos del documento", [
      ["Tipo", docType.value],
      ["Número", document.getElementById("docNumber").value],
      ["Emisión", document.getElementById("issueDate").value],
      ["Vencimiento", document.getElementById("dueDate").value],
      ["Estado", docStatus.value],
      ["Moneda", document.getElementById("currency").value],
    ])
  );
  generatedDocument.appendChild(meta);

  generatedDocument.appendChild(
    makeEl("h3", "mb-2 text-sm font-bold uppercase tracking-wide text-slate-500", "Detalle de productos")
  );
  generatedDocument.appendChild(buildProductsTable());
  generatedDocument.appendChild(buildSummaryBlock(totals));

  const stamp = new Date().toLocaleString("es-DO");
  generatedDocument.appendChild(
    makeEl(
      "footer",
      "mt-6 border-t border-slate-200 pt-3 text-right text-xs text-slate-500",
      `Generado el ${stamp}`
    )
  );

  generatedSection.hidden = false;
}
