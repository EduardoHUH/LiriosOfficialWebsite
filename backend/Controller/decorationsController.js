const db = require("../config/db");
const controller = {};

controller.list = async (_req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM decorations");
        res.json(rows);
    } catch (_error) {
        res.status(500).json({ message: "Error fetching decorations" });
    }
};

module.exports = controller;
