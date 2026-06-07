const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("PORT:", process.env.PORT);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

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

    //get cars api
    app.get("/cars", async (req, res) => {
        try{
            const result = await carsCollection.find().toArray();
            res.send(result);
        }   catch(error){
            res.status(500).send({ message: "Failed to get cars" });
        }
    });

    // post car api
    app.post("/cars", async(req, res) => {
        try{
            const car = req.body;
            const result = await carsCollection.insertOne(car);
            res.send(result);
        } catch(error){
            res.status(500).send({message: "Failed to add car"});
        }
    });

    // get single car
    app.get("/cars/:id", async(req, res) => {
        try{
            const id = req.params.id;

            const result = await carsCollection.findOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        }   catch(error){
            res.status(500).send({message: "Car not found"});
        }
    });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch(error){
    console.log(error);
  }
}
run()

app.get("/", (req, res) => {
    res.send("DriveFleet server Running");
});

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`server running on ${port}`);
})