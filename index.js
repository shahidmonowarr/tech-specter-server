const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3bc4k.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  //split token
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const database = client.db("agency");
    const courseCollection = database.collection("course");
    const travelCollection = database.collection("travel");
    const reviewsCollection = database.collection("reviews");
    const orderCollection = database.collection("order");
    const userCollection = database.collection("users");
    const paymentCollection = database.collection('payment');
    const BlogsCollection = database.collection("blogs");
    const BloodCollection = database.collection("blood");
    const patientCollection = database.collection("patient");
    const userProfileCollection = database.collection("userProfile");

    const verifyAdmin = async (req, res, next)=>{
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({email: requester});
      if(requesterAccount.role === 'admin'){
        next();
      }
      else{
        res.status(403).send({message: 'Forbidden'});
      }
    }

    app.get('/user',  async (req, res)=>{
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get('/admin/:email', async (req, res) =>{
      const email = req.params.email;
      const user = await userCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin});
    })

    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      
        const filter = { email: email };
      const updateDoc = {
        $set: {role: 'admin'},
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.send({ result, token });
    });


    //user profile api
    app.post("/userProfile", async (req, res) => {
      const userProfile = req.body;
      const result = await userProfileCollection.insertOne(userProfile);
      res.send(result);
    });

    //get user profile api
    app.get("/userProfile", async (req, res) => {
      const cursor = userProfileCollection.find({});
      const userProfile = await cursor.toArray();
      res.send(userProfile);
    });

    app.get("/userProfile", async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = userProfileCollection.find(query);
        const userProfile = await cursor.toArray();
        return res.send(userProfile);
      }
      else{
        return res.status(403).send({message: 'Forbidden access'});
      }
    });


    //All Service api

    //Course api
    //get api
    app.get("/course", async (req, res) => {
      const cursor = courseCollection.find({});
      const courses = await cursor.toArray();
      res.send(courses);
    });

    //get single course api
    app.get("/course/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const course = await courseCollection.findOne(query);
      res.send(course);
    });

    //delete single course api
    app.delete('/course/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await courseCollection.deleteOne(query);
      res.json(result);
  });

    //Post api
    app.post("/course", async (req, res) => {
      const course = req.body;
      console.log("hit the post api", course);

      const result = await courseCollection.insertOne(course);

      console.log(result);
      res.send(result);
    });

    // update api
    app.put("/course/:id", async (req, res) => {
      const courseId = req.params.id;
      const courseUpdates = req.body;
    
      try {
        const result = await courseCollection.updateOne(
          { _id: ObjectId(courseId) },
          { $set: courseUpdates }
        );
    
        console.log(result);
    
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Error updating course.");
      }
    });

    //travel api
    //get api
    app.get("/travel", async (req, res) => {
      const cursor = travelCollection.find({});
      const places = await cursor.toArray();
      res.send(places);
    });

    //get single place api
    app.get("/travel/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const place = await travelCollection.findOne(query);
      res.send(place);
    });

    //Post api
    app.post("/travel", async (req, res) => {
      const place = req.body;
      console.log("hit the post api", place);

      const result = await travelCollection.insertOne(place);

      console.log(result);
      res.send(result);
    });

    //delete single place api
    app.delete('/travel/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await travelCollection.deleteOne(query);
      res.json(result);
  });

    //Blogs api
    //get api
    app.get('/blogs', async (req, res) => {
      const cursor = BlogsCollection.find({});
      const blogs = await cursor.toArray();
      res.send(blogs);
    });

    //get single blog api
    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const blog = await BlogsCollection.findOne(query);
      res.send(blog);
    });

    //post api
    app.post('/blogs', async (req, res) => {
      const blog = req.body;
      console.log('hit the post api', blog);

      const result = await BlogsCollection.insertOne(blog);

      console.log(result);
      res.send(result);
    });


    //Blood api
    //post api
    app.post("/blood", async (req, res) => {
      const blood = req.body;
      console.log("hit the post api", blood);
      const result = await BloodCollection.insertOne(blood);
      res.json(result);
    });

    //get api
    app.get("/blood", async (req, res) => {
      const cursor = BloodCollection.find({});
      const bloods = await cursor.toArray();
      res.send(bloods);
    });

    //post api for patient
    app.post("/patient", async (req, res) => {
      const patient = req.body;
      console.log("hit the post api", patient);
      const result = await patientCollection.insertOne(patient);
      res.json(result);
    });

    //get api for patient
    app.get("/patient", async (req, res) => {
      const cursor = patientCollection.find({});
      const patients = await cursor.toArray();
      res.send(patients);
    });


    //Review api
    //get api
    app.get("/reviews", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    //post api
    app.post("/reviews", async (req, res) => {
      const newReview = req.body;
      console.log("hit the post api", newReview);

      const result = await reviewsCollection.insertOne(newReview);
      res.json(result);
    });

    //order api
    //get api
    app.get('/order', async(req,res)=>{

      const query ={}
      const cursor = orderCollection.find(query)
      const allOrder = await cursor.toArray()
      res.send(allOrder)
    })

    //get order by email
    app.get("/order", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        return res.send(orders);
      }
      else{
        return res.status(403).send({message: 'Forbidden access'});
      }
    });

    // get single order by id
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });

    //delete single order api
    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await orderCollection.deleteOne(query);
      res.json(result);
  });

    //post api
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      // console.log(result);
      res.send(result);
    });

    // for update
    app.put('/order/:id', async (req, res) => {
      const updateOrder = req.body[0];
      const id = req.params.id;
      // console.log(updateOrder);
      const filter = { _id: ObjectId(id) };

      const options = { upsert: true };

      const updateDoc = {
          $set: {
              email: updateOrder.email,
              price: updateOrder.price,
              status: updateOrder.status,
              description: updateOrder.description,
              phone: updateOrder.phone
          }
      };
      const result = await orderCollection.updateOne(filter, updateDoc, options);
      // console.log(result);
      res.send(result);
  });

  //for partial update
  app.patch('/order/:id', async(req, res)=>{
    const id = req.params.id;
    const payment = req.body;
    const filter = {_id: ObjectId(id)};
    const updateDoc = {
      $set: {
        paid: true,
        transactionId: payment.transactionId
      }
    } 
    const result = await paymentCollection.insertOne(payment);
    const updatedOrder = await orderCollection.updateOne(filter, updateDoc);
    res.send(updateDoc);
  })

  //payment api
  app.post('/create-payment-intent', async(req, res)=>{
    const service = req.body;
    const price = service.price;
    const amount = price*100;
    const paymentIntent = await stripe.paymentIntents.create({
      amount : amount,
      currency: 'usd',
      payment_method_types:['card']
    });
    res.send({clientSecret: paymentIntent.client_secret});
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
