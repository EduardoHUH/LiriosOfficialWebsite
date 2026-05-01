const controller = {};

controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        if (err || !conn) {
            return res.status(500).json({ message: "Database connection error" });
        }

        conn.query('SELECT * FROM clients', (err, rows) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching clients" });
            }

            res.json(rows);
        });
    });
};

controller.save = (req, res) => {
    req.getConnection((err, conn) => {
        if (err || !conn) {
            return res.status(500).json({ message: "Database connection error" });
        }

        conn.query('INSERT INTO clients SET ?', [req.body], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error creating client" });
            }

            res.status(201).json({ message: "Client created", id: result.insertId });
        });
    });
};

module.exports = controller;
