import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import linksRouter from "./routes/links.js";
import authRouter from "./routes/auth.js";
import contactRouter from "./routes/contact.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- UPDATED CORS CONFIGURATION ---
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://traxelon-main.vercel.app",
    "https://traxelon-ochre.vercel.app", // Your new deployment URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                          origin.includes(".vercel.app"); // Allows all your vercel subdomains
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
// ---------------------------------

app.use(express.json({limit:'10mb'}));

app.get("/", (_req, res) => {
    res.json({ 
        status: "Traxelon backend running ✅", 
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development"
    });
});

app.use("/api/links", linksRouter);
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error("[Error]", err);
    res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Traxelon backend running on http://localhost:${PORT}\n`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`   Run: taskkill /F /IM node.exe`);
        console.error(`   Then: npm start\n`);
        process.exit(1);
    } else {
        throw err;
    }
});