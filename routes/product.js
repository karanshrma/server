const express = require('express');
const {Product} = require("../models/product");
const productrouter = express.Router();
const auth = require("../middleware/auth");

productrouter.get('/api/products', async (req, res) => {
    try {
        console.log(req.query.category);
        let products = await Product.find({category: req.query.category});
        res.json(products);

    } catch (e) {
        res.status(500).json({error: e.message});

    }
})

productrouter.get('/api/products/search/:name', async (req, res) => {
    try {
        console.log(req.params.name);
        let products = await Product.find({
            name: {$regex: req.params.name, $options: "i"},
        });
        res.json(products);

    } catch (e) {
        res.status(500).json({error: e.message});

    }
})

productrouter.post('api/rate-product', async (req, res) => {
    try {
        const {id, rating} = req.body;
        let product = await Product.findById(id);
        for (let i = 0; i < product.ratings.length; i++) {
            if (product.ratings[i].userId == req.user) {
                product.ratings.splice(i, 1);
                break;

            }
        }

        const ratingSchema = {
            userId: req.user,
            rating: rating,
        }

        product.ratings.push(ratingSchema);
        product = await product.save();
        res.json(product);

    } catch (e) {
        res.status(500).json({error: e.message});

    }
})

productrouter.get('/api/deal-of-the-day', auth , async (req, res) => {
    try{
        let products = await Product.find({});
        products.sort((a, b) => {
            let aSum = 0;
            let bSum = 0;
            for (let i = 0; i < a.ratings.length; i++) {
                aSum+= a.ratings[i].rating;
            }
            for (let i = 0; i < b.ratings.length; i++) {
                bSum+= b.ratings[i].rating;
            }
            return aSum - bSum;

        })
        res.json(products[0]);
    }catch(err){
        res.status(500).json({error: err.message});
    }
})


module.exports = productrouter;