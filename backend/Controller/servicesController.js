const db = require("../config/db");
const controller = {};

controller.list = async (_req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM nail_techniques");
        res.json(rows);
    } catch (_error) {
        res.status(500).json({ message: "Error fetching techniques" });
    }
};

controller.listLengths = async (_req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM nail_lengths");
        res.json(rows);
    } catch (_error) {
        res.status(500).json({ message: "Error fetching lengths" });
    }
};

module.exports = controller;
