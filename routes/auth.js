const express = require('express');
const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");

const authRouter = express.Router();

authRouter.post('/api/signup', async (req, res) => {


    try {
        const {name, email, password} = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({error: "All fields are required"});
        }

        // Add timeout to database operations
        const existingUser = await Promise.race([
            User.findOne({email}),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )
        ]);

        if (existingUser) {
            return res.status(400).json({error: "User with this email already exists"});
        }

        const hashpassword = await bcryptjs.hash(password, 8);

        let user = new User({
            name,
            email,
            password: hashpassword,
        });

        // Add timeout to save operation
        user = await Promise.race([
            user.save(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database save timeout')), 5000)
            )
        ]);

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            address: user.address,
            type: user.type,
            cart: user.cart
        };

        res.status(201).json(userResponse);

    } catch (e) {

        if (e.message.includes('timeout')) {
            return res.status(503).json({error: "Database connection timeout. Please try again."});
        }

        res.status(500).json({error: e.message});
    }
});

authRouter.post('/api/login', async (req, res) => {


    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({error: "Email and password are required"});
        }


        // Add timeout to database operations
        const user = await Promise.race([
            User.findOne({email}),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )
        ]);

        if (!user) {

            return res.status(400).json({error: "User with this email does not exist"});
        }


        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({error: "Incorrect password"});
        }


        const token = jwt.sign({id: user._id}, "passwordKey");


        // Return user data with token
        const response = {
            token,
            _id: user._id,
            name: user.name,
            email: user.email,
            address: user.address,
            type: user.type,
            cart: user.cart
        };

        res.json(response);

    } catch (e) {
        console.error('❌ Login error:', e.message);

        if (e.message.includes('timeout')) {
            return res.status(503).json({error: "Database connection timeout. Please try again."});
        }

        res.status(500).json({error: e.message});
    }
});

authRouter.post('/tokenIsValid', async (req, res) => {


    try {
        const token = req.header('x-auth-token');


        if (!token) {

            return res.json(false);
        }


        const isVerified = jwt.verify(token, 'passwordKey');

        if (!isVerified) {

            return res.json(false);
        }


        const user = await Promise.race([
            User.findById(isVerified.id),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )
        ]);

        if (!user) {

            return res.json(false);
        }


        res.json(true);

    } catch (e) {
        if (e.message.includes('timeout')) {
            return res.status(503).json({error: "Database connection timeout"});
        }

        // Invalid token
        res.json(false);
    }
});

authRouter.get('/', auth, async (req, res) => {


    try {
        // Add timeout to database operations
        const user = await Promise.race([
            User.findById(req.user),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )
        ]);

        if (!user) {
            return res.status(404).json({error: "User not found"});
        }


        // Return user data with token
        const response = {
            _id: user._id,
            name: user.name,
            email: user.email,
            address: user.address,
            type: user.type,
            cart: user.cart,
            token: req.token
        };

        res.json(response);

    } catch (e) {

        if (e.message.includes('timeout')) {
            return res.status(503).json({error: "Database connection timeout"});
        }

        res.status(500).json({error: e.message});
    }
});

module.exports = authRouter;