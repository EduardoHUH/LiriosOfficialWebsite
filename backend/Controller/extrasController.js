const db = require("../config/db");
const controller = {};

controller.list = async (_req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM service_extras");
        res.json(rows);
    } catch (_error) {
        res.status(500).json({ message: "Error fetching extras" });
    }
};

module.exports = controller;