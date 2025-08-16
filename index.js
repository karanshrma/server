const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRouter = require('./routes/auth');
const adminrouter = require("./routes/admin");
const productrouter = require("./routes/product");
const userRouter = require("./routes/user");

const db = "mongodb+srv://karan:Karan%40123@clusteramazon.bgz9jvq.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAmazon";

const app = express();
app.use(express.json());

// For flutter web
app.use(cors());

app.use(authRouter);
app.use(adminrouter);
app.use(productrouter);
app.use(userRouter);



mongoose.connect(db).then(() => {console.log('MongoDB Connected!')}).catch(console.error);


const port = 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Express server is running on: ${port}`);
});

