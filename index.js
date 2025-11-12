const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
const uri = "mongodb+srv://ecoServerUser:NOVCZq7KKJgusw6W@cluster0.vnd8kjj.mongodb.net/?appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
app.get('/', (req, res) => {
    res.send('sever is running')
})
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const db = client.db('ecoServer-db')
        const challangeCollection = db.collection('challanges');
        const userCollection=db.collection('users');

         app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await userCollection.insertOne(newUser);
            res.send(result);
        })
        app.get('/challanges', async (req, res) => {
            const cursor = challangeCollection.find().sort({ startDate: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.post('/challanges', async (req, res) => {
            const newChallanges = req.body;
            const result = await challangeCollection.insertOne(newChallanges);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`sever is running on port: ${port}`)
})