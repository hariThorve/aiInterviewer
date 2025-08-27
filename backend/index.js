import express from "express";
import mongoose from "mongoose";
import User from "./models/User.model.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

app.use(express.json());

async function initializeDatabaseConnection() {
    try {
        await mongoose.connect(mongoUri, { dbName: "aiInterviewer" });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
}

app.get("/", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.post("/users", async (req, res, next) => {
    try {
        const { name, email, phoneNumber, performanceDetails } = req.body;

        if (!name || !email || !phoneNumber || !performanceDetails) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const user = await User.create({ name, email, phoneNumber, performanceDetails });
        return res.status(201).json({ id: user._id, user });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({ message: "Email already exists" });
        }
        return next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});

initializeDatabaseConnection().then(() => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
});
