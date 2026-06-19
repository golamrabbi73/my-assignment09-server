const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");

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

// jwt verify middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;

    if(!token){
        return res.status(401).send({
            message: "Unauthorized Access",
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, decoded) => {
            if(err){
                return res.status(401).send({
                    message: "Unauthorized Access",
                });
            }

            req.user = decoded;
            next();
        }
    );
};

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
    const userCollection = db.collection("users");

    // jwt route
    app.post("/jwt", async (req, res) =>{
        const user = req.body;

        const token = jwt.sign(
            {
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res
            .cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
            })

        .send({success: true});
    });

    // logout route
    app.post("/logout", async (req, res) => {
        res
            .clearCookie("token", {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
            })
            .send({success:true});
    });

    //get cars api
    app.get("/cars", async (req, res) => {
        try{
            const search = req.query.search || "";
            const carType = req.query.carType || "";

            const query = {};

            // search by car model
            if(search){
                query.carModel = {
                    $regex: search,
                    $options: "i",
                };
            }

            // filter by car type
            if(carType && carType !== "") {
                query.carType = carType;
            }

            const result = await carsCollection
                .find(query)
                .toArray();

            res.send(result);
        }   catch(error){
            res.status(500).send({
                message: "Failed to get cars",
            });
        }
    });

    // post car api
    app.post("/cars", verifyToken, async(req, res) => {
        try{
            const car = req.body;

            if(
                !car.carModel ||
                !car.dailyRentalPrice ||
                !car.location
            ) {
                return res.status(400).send({
                    message: "Required dields missing",
                });
            }

            const result = await carsCollection.insertOne({
                ...car,
                bookingCount: 0,
                createdAt: new Date(),
            });

            res.send(result);
        } catch(error){
            console.log(error);

            res.status(500).send({message: "Failed to add car"});
        }
    });

    // my added cars api
    app.get("/my-cars", verifyToken, async(req, res) => {
        try{
        const email = req.query.email;

        if(email !== req.user.email){
            return res.status(403).send({
                message: "Forbidden Access",
            });
        }

        const result = await carsCollection
            .find({ownerEmail: email})
            .toArray();

        res.send(result);
        }catch(error){
            res.status(500).send({
                message: "Failed to fetch cars",
            });
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

    // update car
    app.put("/cars/:id", verifyToken, async(req, res) => {
        const id = req.params.id;
        const updateCar = req.body;

        // find car
        const car = await carsCollection.findOne({
            _id: new ObjectId(id),
        });

        // owner check
        if(car.ownerEmail !== req.user.email){
            return res.status(403).send({
                message: "Forbidden Access",
            });
        }

        const result = await carsCollection.updateOne(
            { _id: new ObjectId(id)},
            {
                $set: {
                    dailyRentalPrice: updateCar.dailyRentalPrice,
                    description: updateCar.description,
                    availability: updateCar.availability,
                    image: updateCar.image,
                    carType: updateCar.carType,
                    location: updateCar.location,
                },
            }
        );

            res.send(result);
    
    });

    // delete car
    app.delete("/cars/:id", verifyToken, async (req, res) => {
        const id =req.params.id;

        // find car
        const car = await carsCollection.findOne({
            _id: new ObjectId(id),
        });

        // owner check
        if(car.ownerEmail !== req.user.email){
            return res.status(403).send({
                message: "Forbidden Access",
            });
        }

        const result = await carsCollection.deleteOne({
            _id: new ObjectId(id),
        });

        res.send(result);
    });

    // get user bookings
    app.get("/bookings", verifyToken, async (req, res) => {
        const email = req.query.email;

        if(!email){
            return res.status(400).send({
                message: "Email is required",
            });
        }

        if(email !== req.user.email){
            return res.status(403).send({
                message: "Forbidden Access",
            });
        }

        const result = await bookingsCollection
            .find({userEmail: email})
            .sort({bookingDate: -1})
            .toArray();
        
        res.send(result);
    });

    // car booking
    app.post("/bookings", verifyToken, async (req, res) => {
        const booking = req.body;

       if(booking.userEmail !== req.user.email) {
            return res.status(403).send({
                message: "Forbidden Access",
            });
       }

        booking.bookingDate = new Date();
        booking.status = "confirmed";

        const result = await bookingsCollection.insertOne(
            booking
        );

        await carsCollection.updateOne(
            {
                _id: new ObjectId(booking.carId),
            },
            {
                $inc: {
                    bookingCount: 1,
                },
            }
        );

        res.send(result)
    });

    // car booking cancel
    app.patch("/bookings/:id",  verifyToken, async (req, res) => {
        const id =req.params.id;

        const booking = await bookingsCollection.findOne({
            _id: new ObjectId(id),
        });

        const decodedEmail = req.user.email;

        if (!booking) {
            return res.status(404).send({
            message: "Booking not found",
            });
        }

        if (booking.userEmail !== decodedEmail) {
            return res.status(403).send({
            message: "Forbidden Access",
            });
        }

        const result = await bookingsCollection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: {
                    status: "cancelled",
                },
            }
        );

        // decrease 

        res.send(result)
    });

    // post user
    app.post("/users", async(req, res) => {
        try{
            const user = req.body;

            const result = await userCollection.updateOne(
                {email: user.email},
                {$set: user},
                {upsert: true}
            );

            res.send(result);

        } catch(error){
            res.status(500).send({message: "Failed to save user"});
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