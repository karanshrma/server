const express = require('express');
const { Product } = require("../models/product");
const userRouter = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/user");
const Order = require("../models/order");

userRouter.post('/api/add-to-cart', auth, async (req, res) => {
    try {
        const { id } = req.body;

        // Input validation
        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Find product and user concurrently
        const [product, user] = await Promise.all([
            Product.findById(id),
            User.findById(req.user)
        ]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find existing cart item
        const existingCartItem = user.cart.find(item =>
            item.product._id.toString() === id
        );

        if (existingCartItem) {
            // Increment quantity if product already in cart
            existingCartItem.quantity += 1;
        } else {
            // Add new product to cart
            user.cart.push({ product, quantity: 1 });
        }

        // Save user and return updated cart
        await user.save();

        res.status(200).json({
            message: 'Product added to cart successfully',
            cart: user.cart
        });
        res.json(user);

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: error.message });
    }
});


userRouter.delete('/api/remove-from-cart/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Input validation
        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Find product and user concurrently
        const [product, user] = await Promise.all([
            Product.findById(id),
            User.findById(req.user)
        ]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find existing cart item
        const existingCartItem = user.cart.find(item =>
            item.product._id.toString() === id
        );

        if (existingCartItem) {
            // Decrease quantity if product is in cart
            existingCartItem.quantity -= 1;

            // Remove item if quantity becomes 0 or less
            if (existingCartItem.quantity <= 0) {
                user.cart = user.cart.filter(item =>
                    item.product._id.toString() !== id
                );
            }
        } else {
            // Product not found in cart
            return res.status(404).json({ error: 'Product not found in cart' });
        }

        // Save user and return updated cart
        await user.save();

        res.status(200).json({
            message: 'Product removed from cart successfully',
            cart: user.cart
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: error.message });
    }
});

userRouter.post('/api/save-user-address' , auth, async (req, res) => {
    try {
        const {address} = req.body;
        let user = await User.findById(req.user);
        user.address = address;
        user = await user.save();
        res.status(200).json(user);

    } catch (error) {
        console.error('Add to cart error:', error);
    }
})

userRouter.post('/api/order-product' , auth, async (req, res) => {
    try {
        const {cart , totalPrice , address} = req.body;
        let products = [];

        for(let i = 0; i < cart.length; i++) {
            let product = await Product.findById(cart[i]._id);
            if(product.quantity >= cart[i].quantity) {
                product.quantity -= cart[i].quantity;
                products.push({product, quantity: cart[i].quantity});
                await product.save();
            } else{
                res.status(400).json({msg : '${product.name} is out of stock'})
            }
        }
        let user = await User.findById(req.user);
        user.cart = [];
        user = await user.save();

        let order = new Order({
            products,
            totalPrice,
            address,
            userId: req.user,
            orderedAt: new Date().getTime(),
        });
        order = await order.save();
        res.status(200).json(order);

    } catch (error) {
        console.error('Add to cart error:', error);
    }
})

userRouter.get('/api/orders/me', auth, async (req, res) => {
    try{
        const orders = await Order.find({userId: req.user});
        res.status(200).json(orders);


    } catch (e){
        res.status(500).json({error: e.message});
    }
})


module.exports = userRouter;