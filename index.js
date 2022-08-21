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
        const paymentCollection = client.db("pioneer_flix").collection("payments");
        const channelCollection = client.db("pioneer_flix").collection("channels");
        const libraryCollection = client.db("pioneer_flix").collection("library");
        const favoriteVideoCollection = client.db("pioneer_flix").collection("favoriteVideo");
        const userUploadVideoCollection = client.db("pioneer_flix").collection("userUploadVideo");



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
        // userUploadVideoCollection shihab
        app.get('/uploadVideos', async (req, res) => {
            const query = {};
            const cursor = userUploadVideoCollection.find(query);
            const videos = await cursor.toArray();
            res.send(videos);
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

        app.get("/library/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const cursor = await libraryCollection.find(filter).toArray();
            // console.log(email)
            res.send(cursor);
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