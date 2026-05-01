require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// CONFIG CORS

app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = [
        "http://localhost:3000",
        "http://localhost:4200",
        /\.vercel\.app$/,
      ];
      if (!origin || allowed.some(o => typeof o === "string" ? o === origin : o.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// SETTINGS

app.set("port", process.env.PORT || 3000);


// MIDDLEWARES

app.use(morgan("dev"));


app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());


// STATIC FILES (PDFS)

app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ROUTES


const quotesRoutes = require("./Routes/quotes");
const clientsRoutes = require("./Routes/clients");
const servicesRoutes = require("./Routes/services");
const adminRoutes = require("./Routes/admin");
const appointmentsRoutes = require("./Routes/appointments");
const decorationsRoutes = require("./Routes/decorations");
const extrasRoutes = require("./Routes/extras");
const settingsRoutes = require("./Routes/settings");

app.use("/api/settings", settingsRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/auth", adminRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/decorations", decorationsRoutes);
app.use("/api/extras", extrasRoutes);


// START SERVER

app.listen(app.get("port"), () => {
  console.log("SERVER RUNNING ON PORT 3000");
});
