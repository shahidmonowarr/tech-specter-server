const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3bc4k.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db('agency');
    const courseCollection = database.collection('course');

    //get api
    app.get('/course', async (req, res) => {
      const cursor = courseCollection.find({});
      const courses = await cursor.toArray();
      res.send(courses);
  })

  //Post api
  app.post('/course', async (req, res) => {
    const course = req.body;
    console.log('hit the post api', course);

    const result = await courseCollection.insertOne(course);

    console.log(result);
    res.send(result);
}) 
  } finally {
    //await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running agency server");
});

app.listen(port, () => {
  console.log("listening to port", port);
});
