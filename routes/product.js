const express = require('express');
const productrouter = express.Router();
const auth = require("../middleware/auth");
const {Product} = require("../models/product");

productrouter.get('/api/products/', auth , async (req, res) => {
    try {
        console.log(req.query.category);
        let products = await Product.find({category: req.query.category});
        res.json(products);

    } catch (e) {
        res.status(500).json({error: e.message});

    }
})

productrouter.get('/api/products/search/:name', auth ,async (req, res) => {
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

productrouter.post('/api/rate-product', auth, async (req, res) => {
    try {
        const { id, rating } = req.body;

        if (!id) return res.status(400).json({ error: 'Product id missing' });
        if (rating === undefined || rating === null)
            return res.status(400).json({ error: 'Rating missing' });

        // validate rating numeric and range (example: 0.5 - 5)
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
            return res.status(400).json({ error: 'Invalid rating value' });
        }

        // find product
        let product = await Product.findById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Determine user id depending on auth middleware:
        // - If auth set req.user = userId (string): use req.user
        // - If auth set req.user = user object: use req.user._id or req.user.id
        const userId = (typeof req.user === 'string' || typeof req.user === 'number')
            ? req.user
            : (req.user && (req.user._id || req.user.id));

        console.log('🔐 req.user (from auth):', req.user, 'resolved userId:', userId);

        // Remove existing rating by same user (if any)
        for (let i = 0; i < product.ratings.length; i++) {
            if (String(product.ratings[i].userId) === String(userId)) {
                product.ratings.splice(i, 1);
                break;
            }
        }

        // Push new rating object
        const newRating = {
            userId: userId,
            rating: numericRating,
        };

        product.ratings.push(newRating);

        product = await product.save();

        return res.json(product);
    } catch (e) {
        console.error('❌ Error in /rate-product:', e);
        res.status(500).json({ error: e.message });
    }
});
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
            return aSum < bSum ? 1 : -1;

        })
        res.json(products[0]);
    }catch(err){
        res.status(500).json({error: err.message});
    }
})


module.exports = productrouter;