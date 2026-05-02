const db = require('../config/db');
const controller = {};

controller.list = async (_req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM appointments');
        res.json(rows);
    } catch (error) {
        console.error("APPOINTMENTS LIST ERROR:", error);
        res.status(500).json({ message: "Error fetching appointments" });
    }
};

controller.save = async (req, res) => {
    try {
        const { client_id, quote_id, date, status, created_by } = req.body;
        const [result] = await db.query(
            'INSERT INTO appointments (client_id, quote_id, date, status, created_by) VALUES (?, ?, ?, ?, ?)',
            [client_id, quote_id || null, date || null, status || 'scheduled', created_by || 'client']
        );
        res.status(201).json({ message: "Appointment created", id: result.insertId });
    } catch (error) {
        console.error("APPOINTMENTS SAVE ERROR:", error);
        res.status(500).json({ message: "Error creating appointment" });
    }
};

module.exports = controller;