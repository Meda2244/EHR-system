require("dotenv").config()
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const routes = require("./routes")
const compression = require("compression")

app.use(compression())
const cors = require("cors")

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

// serve uploaded files
app.use('/uploads', express.static('uploads'));
app.use('/reports', express.static('reports'));

app.use('/api', routes)
// Main route
app.get('/', (req, res) => {
  res.json({ 
    message: 'EHR System API is running!',
    status: 'success',
    endpoints: ['/api/patients', '/api/doctors', '/api/appointments']
  });
});

// const crypto = require("crypto");
// console.log(crypto.randomBytes(16).toString("hex"));

const url = process.env.MONGODB_URI
console.log("Connecting to database at:", url)

mongoose.connect(url)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Database connection error:", err))

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server running on port ${port}`))
