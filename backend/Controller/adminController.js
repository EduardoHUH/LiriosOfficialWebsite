const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const controller = {};

controller.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const [users] = await db.query('SELECT * FROM admin_users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "No existe una cuenta con ese correo" });
        }

        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ success: false, message: "La contrasena es incorrecta" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: "admin"
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
};

module.exports = controller;