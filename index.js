// server installed: express, cors, dotenv, mongodb, jsonwebtoken, stripe

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// new connection with mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndvfqvy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const videoCollection = client.db("pioneer_flix").collection("videos");
        const likeCollection = client.db("pioneer_flix").collection("likes");
        const commentCollection = client.db("pioneer_flix").collection("comments");
        const userProfileCollection = client.db("pioneer_flix").collection("userProfile");
        const userUploadVideoCollection = client.db("pioneer_flix").collection("userUploadVideo");
        const paymentCollection = client.db("pioneer_flix").collection("payments");


        // videos APIs
        app.get('/videos', async (req, res) => {
            const query = {};
            const cursor = videoCollection.find(query);
            const videos = await cursor.toArray();
            res.send(videos);
        });

        app.get('/video/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await videoCollection.findOne(query);
            res.send(result);
        });
        // likes APIs
        app.post('/like', async (req, res) => {
            const like = req.body;
            const result = await likeCollection.insertOne(like);
            res.send(result);
        })

        app.get('/likes', async (req, res) => {
            const query = {};
            const cursor = likeCollection.find(query);
            const likes = await cursor.toArray();
            res.send(likes);
        });


        // comments APIs
        app.post('/comment', async (req, res) => {
            const item = req.body;
            const result = await commentCollection.insertOne(item);
            res.send(result);
        });

        app.get('/comments', async (req, res) => {
            const query = {};
            const cursor = commentCollection.find(query);
            const comments = await cursor.toArray();
            res.send(comments);
        });

        // PUT userProfile by email for dashboard API -----------------{ mohiuddin }
        app.put('/userProfile/:email', async (req, res) => {
            const email = req.params.email;
            const userProfile = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: userProfile,
            };
            const result = await userProfileCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // GET userProfile by query for dashboard API -----------------{ mohiuddin }
        app.get('/userProfile', async (req, res) => {
            const email = req.query.email;
            const query = { profileEmail: email };
            const profile = await userProfileCollection.find(query).toArray();
            res.send(profile);
        })

        // POST upload videos by user API --------------------{ mohiuddin }
        app.post('/userUploadVideo', async (req, res) => {
            const video = req.body;
            const result = await userUploadVideoCollection.insertOne(video);
            res.send(result);
        })

        // GET uploaded videos by user API --------------------{ mohiuddin }
        app.get('/userUploadVideo', async (req, res) => {
            const email = req.query.email;
            const query = { uploader: email };
            const result = await userUploadVideoCollection.find(query).toArray();
            res.send(result);
        })

        // GET all uploaded videos by user for admin to manage API --------------------{ mohiuddin }
        app.get('/uploadedVideo', async (req, res) => {
            const result = await userUploadVideoCollection.find().toArray();
            res.send(result);
        })

        // DELETE userUploaded video delete from manageVideos API ---------------------{ mohiuddin }
        app.delete('/uploadedVideo/:id', async (req, res) => {
            const id = req.params.id
            const result = await userUploadVideoCollection.deleteOne({ "_id": ObjectId(id) });
            res.send(result)
        })
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