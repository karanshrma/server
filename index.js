const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRouter = require('./routes/auth');
const adminrouter = require("./routes/admin");
const productrouter = require("./routes/product");
const userRouter = require("./routes/user");

const db = "mongodb+srv://karan:KaranSharma1234@amazonflutter.hw84bwg.mongodb.net/amazon-flutter-app?retryWrites=true&w=majority";

const app = express();
app.use(express.json());

app.use(cors());

app.use(authRouter);
app.use(adminrouter);
app.use(productrouter);
app.use(userRouter);




mongoose.connect(db).then(() => {console.log('MongoDB Connected!')}).catch(console.error);

app.get('/host', (req, res) => {
    res.status(200).type('html').send('<h1>Welcome to backend</h1><p>API is deployed</p>');
});



const port = 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Express server is running on: ${port}`);
});

