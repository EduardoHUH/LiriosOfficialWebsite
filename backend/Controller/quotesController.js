const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { generateQuotePDF } = require("../services/pdfService");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCollection(value) {
  return Array.isArray(value) ? value : [];
}

function buildLineLabel(item) {
  return [item.technique_name, item.length_name].filter(Boolean).join(" / ");
}

exports.createQuote = async (req, res) => {
  const conn = await db.pool.getConnection();
  try {
    const {
      client_id,
      appointment_date,
      notes,
      source,
      contact_phone,
      status,
      items,
      extras,
      decorations,
      reference_image_path,
    } = req.body;

    const quoteItems = normalizeCollection(items);
    const quoteExtras = normalizeCollection(extras);
    const quoteDecorations = normalizeCollection(decorations);

    if (
      quoteItems.length === 0 &&
      quoteExtras.length === 0 &&
      quoteDecorations.length === 0
    ) {
      conn.release();
      return res.status(400).json({ message: "La cotizacion no tiene detalles" });
    }

    let total = 0;
    for (const item of quoteItems) {
      total += toNumber(item.price) * Math.max(toNumber(item.quantity), 1);
    }
    for (const extra of quoteExtras) {
      total += toNumber(extra.price) * Math.max(toNumber(extra.quantity), 1);
    }
    for (const decoration of quoteDecorations) {
      total += toNumber(decoration.price) * Math.max(toNumber(decoration.quantity), 1);
    }

    await conn.beginTransaction();

    const [quoteResult] = await conn.query(
      `INSERT INTO quotes
        (client_id, appointment_date, status, total, notes, source, contact_phone, reference_image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id || null,
        appointment_date || null,
        status || "pending",
        total,
        notes || null,
        source || "web",
        contact_phone || null,
        reference_image_path || null,
      ]
    );

    const quoteId = quoteResult.insertId;

    for (const item of quoteItems) {
      await conn.query(
        `INSERT INTO quote_items
          (quote_id, technique_id, length_id, technique_name, length_name, base_price, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quoteId,
          item.technique_id || null,
          item.length_id || null,
          item.technique_name || null,
          item.length_name || null,
          toNumber(item.base_price),
          Math.max(toNumber(item.quantity), 1),
          toNumber(item.price),
        ]
      );
    }

    for (const extra of quoteExtras) {
      await conn.query(
        `INSERT INTO quote_extras
          (quote_id, extra_id, extra_name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [
          quoteId,
          extra.extra_id || extra.id || null,
          extra.extra_name || extra.name || null,
          Math.max(toNumber(extra.quantity), 1),
          toNumber(extra.price),
        ]
      );
    }

    for (const decoration of quoteDecorations) {
      await conn.query(
        `INSERT INTO quote_decorations
          (quote_id, decoration_id, decoration_name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [
          quoteId,
          decoration.decoration_id || decoration.id || null,
          decoration.decoration_name || decoration.name || null,
          Math.max(toNumber(decoration.quantity), 1),
          toNumber(decoration.price),
        ]
      );
    }

    await conn.commit();
    conn.release();

    res.status(201).json({
      message: "Cotizacion creada",
      quote_id: quoteId,
      total,
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error(error);
    res.status(500).json({ message: "Error creando cotizacion" });
  }
};

exports.uploadReferenceImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibio ninguna imagen" });
    }

    const imagePath = `/uploads/references/${req.file.filename}`;
    const imageUrl = `${req.protocol}://${req.get("host")}${imagePath}`;

    res.status(201).json({
      message: "Imagen subida",
      imagePath,
      imageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error subiendo imagen" });
  }
};

exports.getAllQuotes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT q.*, c.name, c.phone, c.email
       FROM quotes q
       LEFT JOIN clients c ON q.client_id = c.id
       ORDER BY q.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo cotizaciones" });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const [quoteRows] = await db.query(
      `SELECT q.*, c.name, c.phone, c.email
       FROM quotes q
       LEFT JOIN clients c ON q.client_id = c.id
       WHERE q.id = ?`,
      [id]
    );

    if (quoteRows.length === 0) {
      return res.status(404).json({ message: "Cotizacion no encontrada" });
    }

    const [items] = await db.query(
      `SELECT
         qi.*,
         COALESCE(qi.technique_name, nt.name) AS technique_label,
         COALESCE(qi.length_name, nl.name) AS length_label
       FROM quote_items qi
       LEFT JOIN nail_techniques nt ON qi.technique_id = nt.id
       LEFT JOIN nail_lengths nl ON qi.length_id = nl.id
       WHERE qi.quote_id = ?`,
      [id]
    );

    const [extras] = await db.query(
      `SELECT
         qe.*,
         COALESCE(qe.extra_name, se.name) AS extra_label
       FROM quote_extras qe
       LEFT JOIN service_extras se ON qe.extra_id = se.id
       WHERE qe.quote_id = ?`,
      [id]
    );

    const [decorations] = await db.query(
      `SELECT
         qd.*,
         COALESCE(qd.decoration_name, d.name) AS decoration_label
       FROM quote_decorations qd
       LEFT JOIN decorations d ON qd.decoration_id = d.id
       WHERE qd.quote_id = ?`,
      [id]
    );

    res.json({
      quote: quoteRows[0],
      items,
      extras,
      decorations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo cotizacion" });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const [quoteRows] = await db.query("SELECT reference_image_path FROM quotes WHERE id = ?", [id]);

    if (quoteRows.length === 0) {
      return res.status(404).json({ message: "Cotizacion no encontrada" });
    }

    await db.query("DELETE FROM quote_decorations WHERE quote_id = ?", [id]);
    await db.query("DELETE FROM quote_extras WHERE quote_id = ?", [id]);
    await db.query("DELETE FROM quote_items WHERE quote_id = ?", [id]);
    await db.query("DELETE FROM quotes WHERE id = ?", [id]);

    const referenceImagePath = quoteRows[0]?.reference_image_path;
    if (referenceImagePath) {
      const absolutePath = path.join(__dirname, "..", referenceImagePath.replace(/^\//, ""));
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    res.json({ message: "Cotizacion eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error eliminando cotizacion" });
  }
};

exports.updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["pending", "approved", "rejected", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado de cotizacion invalido" });
    }

    const [result] = await db.query("UPDATE quotes SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Cotizacion no encontrada" });
    }

    res.json({ message: "Estado actualizado", status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando cotizacion" });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = await generateQuotePDF(id);
    res.download(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando PDF" });
  }
};

exports.buildLineLabel = buildLineLabel;