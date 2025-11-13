const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://ecoServerUser:NOVCZq7KKJgusw6W@cluster0.vnd8kjj.mongodb.net/?appName=Cluster0";

// Create a MongoClient with Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

async function run() {
    try {
        await client.connect();

        const db = client.db('ecoServer-db');
        const challangeCollection = db.collection('challanges');
        const userCollection = db.collection('users');
          const tipsCollection = db.collection('tips');
        const eventsCollection = db.collection('events');

        // Add user
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const existingUser = await userCollection.findOne({ email });
            if (existingUser) {
                res.send('User exists. Do not need to save.');
            } else {
                const result = await userCollection.insertOne(newUser);
                res.send(result);
            }
        });

       // Get all challenges with advanced filtering
app.get('/challenges', async (req, res) => {
  try {
    const { category, startDateFrom, startDateTo, minParticipants, maxParticipants } = req.query;

    const query = {};

    // 🌿 Category filter (multiple values allowed)
    if (category) {
      const categories = category.split(','); // Example: ?category=Energy Conservation,Green Living
      query.category = { $in: categories };
    }

    // 📅 Date range filter
    if (startDateFrom || startDateTo) {
      query.startDate = {};
      if (startDateFrom) query.startDate.$gte = new Date(startDateFrom);
      if (startDateTo) query.startDate.$lte = new Date(startDateTo);
    }

    // 👥 Participants range filter
    if (minParticipants || maxParticipants) {
      query.participants = {};
      if (minParticipants) query.participants.$gte = parseInt(minParticipants);
      if (maxParticipants) query.participants.$lte = parseInt(maxParticipants);
    }

    const challenges = await challangeCollection.find(query).toArray();
    res.send(challenges);

  } catch (err) {
    console.error('Error fetching challenges:', err);
    res.status(500).json({ message: 'Failed to fetch challenges', error: err.message });
  }
});


        // Add challenge
        app.post('/challenges', async (req, res) => {
            const newChallanges = req.body;
            const result = await challangeCollection.insertOne(newChallanges);
            res.send(result);
        });

        // Get latest 6 active challenges
        app.get('/ActiveChallenges', async (req, res) => {
            const cursor = challangeCollection.find().sort({ startDate: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get challenge by ID (string _id)
        app.get('/challenges/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const challenge = await challangeCollection.findOne({ _id: id });
                if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
                res.json(challenge);
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Failed to fetch challenge', error: err.message });
            }
        });

        // Get live community stats
        app.get('/stats', async (req, res) => {
            try {
                const today = new Date().toISOString().split('T')[0];

                const activeChallenges = await challangeCollection.countDocuments({
                    startDate: { $lte: today },
                    endDate: { $gte: today }
                });

                const participantsAgg = await challangeCollection.aggregate([
                    {
                        $match: {
                            startDate: { $lte: today },
                            endDate: { $gte: today }
                        }
                    },
                    {
                        $group: { _id: null, totalParticipants: { $sum: "$participants" } }
                    }
                ]).toArray();

                const totalParticipants = participantsAgg[0]?.totalParticipants || 0;

                res.send({ activeChallenges, totalParticipants });
            } catch (err) {
                console.error('Error fetching stats:', err);
                res.status(500).send({ message: 'Failed to fetch stats' });
            }
        });
        app.get('/tips', async (req, res) => {
            try {
                const tips = await tipsCollection.find().sort({ createdAt: -1 }).limit(5).toArray();
                res.send(tips);
            } catch (err) {
                res.status(500).send({ message: 'Failed to fetch tips' });
            }
        });

        app.post('/tips', async (req, res) => {
            const newTip = req.body;
            const result = await tipsCollection.insertOne(newTip);
            res.send(result);
        });

        // --------- EVENTS ---------
        app.get('/events', async (req, res) => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const events = await eventsCollection.find({ date: { $gte: today } })
                    .sort({ date: 1 }).limit(4).toArray();
                res.send(events);
            } catch (err) {
                res.status(500).send({ message: 'Failed to fetch events' });
            }
        });

        app.post('/events', async (req, res) => {
            const newEvent = req.body;
            const result = await eventsCollection.insertOne(newEvent);
            res.send(result);
        });


        // Confirm successful MongoDB connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. Successfully connected to MongoDB!");
    } finally {
        // Optional: You can close the connection here if needed
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
