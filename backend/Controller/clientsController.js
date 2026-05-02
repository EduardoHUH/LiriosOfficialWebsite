const db = require('../config/db');
const controller = {};

controller.list = async (_req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clients');
        res.json(rows);
    } catch (error) {
        console.error("CLIENTS LIST ERROR:", error);
        res.status(500).json({ message: "Error fetching clients" });
    }
};

controller.save = async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const [result] = await db.query(
            'INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)',
            [name || null, phone || null, email || null]
        );
        res.status(201).json({ message: "Client created", id: result.insertId });
    } catch (error) {
        console.error("CLIENTS SAVE ERROR:", error);
        res.status(500).json({ message: "Error creating client" });
    }
};

module.exports = controller;