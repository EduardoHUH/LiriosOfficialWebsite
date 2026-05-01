const db = require("../config/db");

exports.getAnnouncement = async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT value FROM settings WHERE key_name = 'announcement'");
    const announcement = rows.length ? rows[0].value : '';
    res.json({ announcement });
  } catch (_error) {
    res.status(500).json({ message: "Error fetching announcement" });
  }
};

exports.updateAnnouncement = async (req, res) => {
  const { announcement } = req.body;
  if (announcement === undefined) {
    return res.status(400).json({ message: "announcement es requerido" });
  }
  try {
    await db.query(
      "INSERT INTO settings (key_name, value) VALUES ('announcement', ?) ON DUPLICATE KEY UPDATE value = ?",
      [announcement, announcement]
    );
    res.json({ announcement });
  } catch (_error) {
    res.status(500).json({ message: "Error updating announcement" });
  }
};