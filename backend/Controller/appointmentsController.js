const controller = {};

controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        if (err || !conn) {
            return res.status(500).json({ message: "Database connection error" });
        }

        conn.query('SELECT * FROM appointments', (err, rows) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching appointments" });
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

        conn.query('INSERT INTO appointments SET ?', [req.body], (err) => {
            if (err) {
                return res.status(500).json({ message: "Error creating appointment" });
            }

            res.status(201).json({ message: "Appointment created" });
        });
    });
};

module.exports = controller;
