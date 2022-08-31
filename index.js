// server installed: express, cors, dotenv, mongodb, jsonwebtoken, stripe

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}


// new connection with mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndvfqvy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const videoCollection = client.db("pioneer_flix").collection("videos");
        const likeCollection = client.db("pioneer_flix").collection("likes");
        const commentCollection = client.db("pioneer_flix").collection("comments");
        const channelCollection = client.db("pioneer_flix").collection("channels");
        const libraryCollection = client.db("pioneer_flix").collection("library");
        const favoriteVideoCollection = client.db("pioneer_flix").collection("favoriteVideo");
        const userProfileCollection = client.db("pioneer_flix").collection("userProfile");
        const paymentCollection = client.db("pioneer_flix").collection("payments");
        const BookingCollection = client.db("pioneer_flix").collection("booking");
        const userUploadVideoCollection = client.db("pioneer_flix").collection("userUploadVideo");
        const notificationCollection = client.db("pioneer_flix").collection("notification");
        const ratingCollection = client.db("pioneer_flix").collection("ratings");

        // videos APIs
        // to read videos || Manik Islam Mahi
        app.get('/videos', async (req, res) => {
            const query = {};
            const cursor = videoCollection.find(query);
            const videos = await cursor.toArray();
            res.send(videos);
        });

        // to read sigle video || Manik Islam Mahi
        app.get('/video/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await videoCollection.findOne(query);
            res.send(result);
        });


        // likes APIs
        // to create like || Manik Islam Mahi
        app.post('/like', async (req, res) => {
            const like = req.body;
            const result = await likeCollection.insertOne(like);
            res.send(result);
        })

        // to read like || Manik Islam Mahi
        app.get('/likes', async (req, res) => {
            const query = {};
            const cursor = likeCollection.find(query);
            const likes = await cursor.toArray();
            res.send(likes);
        });

        // to delete like || Manik Islam Mahi
        app.delete('/likes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await likeCollection.deleteOne(query);
            res.send(result);
        });


        // comments APIs
        // to create comment || Manik Islam Mahi
        app.post('/comment', async (req, res) => {
            const item = req.body;
            const result = await commentCollection.insertOne(item);
            res.send(result);
        });

        // to read or get comments || Manik Islam Mahi
        app.get('/comments', async (req, res) => {
            const query = {};
            const cursor = commentCollection.find(query);
            const comments = await cursor.toArray();
            res.send(comments);
        });

        // Rating APIs
        // to create or put rating || Manik Islam Mahi

        app.put('/rating/:email', async (req, res) => {
            const email = req.params.email;
            const id = req.body.id;
            const updatedRating = req.body;
            // ekhane sodhu matro id othoba sodhu email diye data upsert kora hocche na. borong duita condition diye tarpor data upsert kora hocche. It's a unique API for me!!
            const filter = { id: id, email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: updatedRating,
            }
            const result = await ratingCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        // to read or get ratings || Manik Islam Mahi
        app.get('/ratings/:id', async (req, res) => {
            const id = req.params.id;
            // ekhane ekjon user er rating read kora hocche na. borong ekhane video id diye multiple data read kora hocche. It's a unique API for me !!
            const filter = { id: id };
            const cursor = ratingCollection.find(filter);
            const result = await cursor.toArray();
            res.send(result);
        });

        // PUT userData from useToken, signUp and googleSignIn page API ----------------{ mohiuddin }
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { profileEmail: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userProfileCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ profileEmail: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3h' })
            res.send({ result, token });
        })

        // PUT userProfile by email for dashboard API -----------------------------------{ mohiuddin }
        app.put('/userProfile/:email', async (req, res) => {
            const email = req.params.email;
            const userProfile = req.body;
            const filter = { profileEmail: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: userProfile,
            };
            const result = await userProfileCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // GET userProfile by query for dashboard API -------------------------------------{ mohiuddin }
        app.get('/userProfile', async (req, res) => {
            const email = req.query.email;
            const query = { profileEmail: email };
            const profile = await userProfileCollection.find(query).toArray();
            res.send(profile);
        });

        // GET all user signUp and Profile data for admin role API ---------------------------{ mohiuddin }
        app.get('/allUserData', async (req, res) => {
            const allUserData = await userProfileCollection.find().toArray();
            res.send(allUserData);
        });

        // PUT make admin API ----------------------------------------------------------------{ mohiuddin }
        app.put('/allUserData/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userProfileCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { profileEmail: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userProfileCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        });

        // GET admin for useAdmin API -------------------------------------------{ mohiuddin }
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userProfileCollection.findOne({ profileEmail: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        // Upload Video by Admin API ---------------------------------------------{ mohiuddin }
        app.post('/adminUploadVideo', async (req, res) => {
            const uploadedVideo = req.body;
            const result = await videoCollection.insertOne(uploadedVideo);
            const result2 = await notificationCollection.insertOne(uploadedVideo);
            res.send(result);
        })

        // POST upload videos by user API -----------------------------------------------------{ mohiuddin }
        app.post('/userUploadVideo', async (req, res) => {
            const video = req.body;
            const result = await userUploadVideoCollection.insertOne(video);
            res.send(result);
        })

        // GET uploaded videos by user API -----------------------------------------------------{ mohiuddin }
        app.get('/userUploadVideo', async (req, res) => {
            const email = req.query.email;
            const query = { uploader: email };
            const result = await userUploadVideoCollection.find(query).toArray();
            res.send(result);
        });

        // GET all uploaded videos by user for admin to manage API ------------------------------{ mohiuddin }
        app.get('/uploadedVideo', async (req, res) => {
            const result = await userUploadVideoCollection.find().toArray();
            res.send(result);
        })


        // PUT userBooking in payments API ---------------------------------{ mohiuddin } 
        app.put('/userBooking/:email', async (req, res) => {
            const email = req.params.email;
            const userBooking = req.body;
            const filter = { userEmail: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: userBooking,
            };
            const result = await BookingCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // GET UserBooking for paymentPage API -------------------------------------------{ mohiuddin }
        app.get('/userBooking', async (req, res) => {
            const email = req.query.email;
            const userBookingData = await BookingCollection.find({ userEmail: email }).toArray();
            res.send(userBookingData);
        })
        
        // POST for payment stripe API --------------------------------------{ mohiuddin }
        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        })

        // DELETE userUploaded video delete from manageVideos API --------------------------------{ mohiuddin }
        app.delete('/uploadedVideo/:id', async (req, res) => {
            const id = req.params.id
            const result = await userUploadVideoCollection.deleteOne({ "_id": ObjectId(id) });
            res.send(result)
        })


        // Channel APIs
        // to read or get Channels || Md. Saiyadul Amin Akhand
        app.get('/channels', async (req, res) => {
            const query = {};
            const cursor = channelCollection.find(query);
            const channels = await cursor.toArray();
            res.send(channels);
        });

        // to read sigle Channel || Md. Saiyadul Amin Akhand
        app.get('/channels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await channelCollection.findOne(query);
            res.send(result);
        });


        // favorite video APIs by shihab
        app.post('/favorite', async (req, res) => {
            const item = req.body;
            const result = await favoriteVideoCollection.insertOne(item);
            res.send(result);
        });

        app.get("/favorite/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const cursor = await favoriteVideoCollection.find(filter).toArray();
            // console.log(email)
            res.send(cursor);
        });

        // watch history APIs by shihab
        app.post('/library', async (req, res) => {
            const item = req.body;
            const result = await libraryCollection.insertOne(item);
            res.send(result);
        });
        // show notification api  by shihab
        app.get('/notification', async (req, res) => {
            const allNotification = await notificationCollection.find().toArray();
            res.send(allNotification);
        });

        app.get("/library/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const cursor = await libraryCollection.find(filter).toArray();
            // console.log(email)
            res.send(cursor);
        });

        // final upload video by admin API -------------------------------------{ mohiuddin }
        app.post('/finalUploadByAdmin', async (req, res) => {
            const video = req.body;
            const result = await videoCollection.insertOne(video);
            const result2 = await notificationCollection.insertOne(video);
            res.send(result);
        });

        // DELETE userUploaded video delete from manageVideos API ---------------{ mohiuddin }
        app.delete('/uiVideo/:id', async (req, res) => {
            const id = req.params.id
            const result = await videoCollection.deleteOne({ "_id": ObjectId(id) });
            res.send(result)
        });

        // PATCH user transaction id API -----------------------------------------{ mohiuddin }
        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updatedOrder = await BookingCollection.updateOne(filter, updatedDoc);
            res.send(updatedOrder);
        });

        // get paid user from bookingCollection API---------------------------------{ mohiuddin }
        app.get('/paidUser/:email', async (req, res) => {
            const email = req.params.email;
            const user = await BookingCollection.findOne({ userEmail: email });
            res.send(user)
        })

        // GET uploaded videos by admin API -----------------------------------------------------{ mohiuddin }
        app.get('/adminUploadVideo', async (req, res) => {
            const email = req.query.email;
            const query = { uploader: email };
            const result = await videoCollection.find(query).toArray();
            res.send(result);
        });
    }

    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})