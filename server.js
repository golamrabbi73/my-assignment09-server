const express = require("express");
const dontenv = require("dotenv")
const { MongoClient, ServerApiVersion } = require('mongodb');
dontenv.config()

const uri =process.env.MONGODB_URI
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app =express();

app.use(
    cors({
        origin: [
            "http://localhost:5173"
        ],
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db("drivefleet");
    const carsCollection = db.collection("cars");
    const bookingsCollection = db.collection("bookings");


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("DriveFleet server Running");
});

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`server running on ${port}`);
})