const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

function safeText(value) {
  return value === null || value === undefined || value === ""
    ? "N/A"
    : String(value);
}

function writeSection(doc, title, lines) {
  if (lines.length === 0) {
    return;
  }

  doc.fontSize(14).text(title, { underline: true });
  doc.moveDown(0.5);

  lines.forEach((line) => {
    doc.fontSize(12).text(line);
  });

  doc.moveDown();
}

exports.generateQuotePDF = async (quoteId) => {
  try {
    const [quoteRows] = await db.query(
      `SELECT q.*, c.name, c.phone, c.email
       FROM quotes q
       LEFT JOIN clients c ON q.client_id = c.id
       WHERE q.id = ?`,
      [quoteId]
    );

    const [items] = await db.query(
      `SELECT
         qi.*,
         COALESCE(qi.technique_name, nt.name) AS technique_label,
         COALESCE(qi.length_name, nl.name) AS length_label
       FROM quote_items qi
       LEFT JOIN nail_techniques nt ON qi.technique_id = nt.id
       LEFT JOIN nail_lengths nl ON qi.length_id = nl.id
       WHERE qi.quote_id = ?`,
      [quoteId]
    );

    const [extras] = await db.query(
      `SELECT
         qe.*,
         COALESCE(qe.extra_name, se.name) AS extra_label
       FROM quote_extras qe
       LEFT JOIN service_extras se ON qe.extra_id = se.id
       WHERE qe.quote_id = ?`,
      [quoteId]
    );

    const [decorations] = await db.query(
      `SELECT
         qd.*,
         COALESCE(qd.decoration_name, d.name) AS decoration_label
       FROM quote_decorations qd
       LEFT JOIN decorations d ON qd.decoration_id = d.id
       WHERE qd.quote_id = ?`,
      [quoteId]
    );

    if (!quoteRows.length) {
      throw new Error("Quote not found");
    }

    const quote = quoteRows[0];
    const filePath = path.join(__dirname, `../pdfs/quote-${quoteId}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);

      stream.on("finish", resolve);
      stream.on("error", reject);
      doc.on("error", reject);

      doc.pipe(stream);

      doc.fontSize(20).text("COTIZACION", { align: "center" });
      doc.moveDown();

      doc.fontSize(12).text(`Cliente: ${safeText(quote.name)}`);
      doc.text(`Telefono: ${safeText(quote.phone || quote.contact_phone)}`);
      doc.text(`Correo: ${safeText(quote.email)}`);
      doc.text(`Cita: ${safeText(quote.appointment_date)}`);
      doc.text(`Estado: ${safeText(quote.status)}`);
      doc.text(`Origen: ${safeText(quote.source)}`);
      doc.moveDown();

      writeSection(
        doc,
        "Servicios",
        items.map((item) => {
          const parts = [item.technique_label, item.length_label].filter(Boolean);
          const label = parts.length > 0 ? parts.join(" / ") : "Servicio";
          return `${label} | Cantidad: ${item.quantity} | Precio: Lps. ${item.price}`;
        })
      );

      writeSection(
        doc,
        "Extras",
        extras.map(
          (extra) =>
            `${safeText(extra.extra_label)} | Cantidad: ${extra.quantity} | Precio: Lps. ${extra.price}`
        )
      );

      writeSection(
        doc,
        "Decoraciones",
        decorations.map(
          (decoration) =>
            `${safeText(decoration.decoration_label)} | Cantidad: ${decoration.quantity} | Precio: Lps. ${decoration.price}`
        )
      );

      if (quote.notes) {
        doc.fontSize(14).text("Notas", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(quote.notes);
        doc.moveDown();
      }

      

      if (quote.reference_image_path) {
        const imagePath = path.join(__dirname, "..", quote.reference_image_path);
        if (fs.existsSync(imagePath)) {
          doc.fontSize(14).text("Foto de referencia", { underline: true });
          doc.moveDown(0.5);
          doc.image(imagePath, { fit: [400, 300], align: "center" });
          doc.moveDown();
        }
      }

      doc.fontSize(16).text(`TOTAL: Lps. ${quote.total}`, { align: "right" });
      doc.end();
    });

    return filePath;
  } catch (error) {
    console.error(error);
    throw error;
  }
};