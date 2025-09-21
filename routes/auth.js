const express = require('express');
const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");

const authRouter = express.Router();

authRouter.post('/api/signup', async (req, res) => {
    console.log('📝 Signup request received:', req.body);

    try {
        const {name, email, password} = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({error: "All fields are required"});
        }

        console.log('🔍 Checking if user exists with email:', email);

        // Add timeout to database operations
        const existingUser = await Promise.race([
            User.findOne({email}),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )
        ]);

        if (existingUser) {
            console.log('❌ User already exists');
            return res.status(400).json({error: "User with this email already exists"});
        }

        console.log('🔐 Hashing password');
        const hashpassword = await bcryptjs.hash(password, 8);

        console.log('💾 Creating new user');
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

        console.log('✅ User created successfully:', user._id);

        // Don't send password in response
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
        console.error('❌ Signup error:', e.message);

        if (e.message.includes('timeout')) {
            return res.status(503).json({error: "Database connection timeout. Please try again."});
        }

        res.status(500).json({error: e.message});
    }
});

authRouter.post('/api/login', async (req, res) => {
    console.log('🔐 Login request received for email:', req.body.email);

    try {
        const {email, password} = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({error: "Email and password are required"});
        }

        console.log('🔍 Finding user with email:', email);

        // Add timeout to database operations
        const user = await Promise.race([
            User.findOne({email}),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )
        ]);

        if (!user) {
            console.log('❌ User not found');
            return res.status(400).json({error: "User with this email does not exist"});
        }

        console.log('🔐 Comparing passwords');
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(400).json({error: "Incorrect password"});
        }

        console.log('🎫 Generating token');
        const token = jwt.sign({id: user._id}, "passwordKey");

        console.log('✅ Login successful for user:', user._id);

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

// Fixed the route name - it was /tokenIsValid in client but should be consistent
authRouter.post('/tokenIsValid', async (req, res) => {
    console.log('🎫 Token validation request received');

    try {
        const token = req.header('x-auth-token');
        console.log('🎫 Token from header:', token ? 'Present' : 'Missing');

        if (!token) {
            console.log('❌ No token provided');
            return res.json(false);
        }

        console.log('🔍 Verifying token');
        const isVerified = jwt.verify(token, 'passwordKey');

        if (!isVerified) {
            console.log('❌ Token verification failed');
            return res.json(false);
        }

        console.log('🔍 Finding user by ID:', isVerified.id);

        // Add timeout to database operations
        const user = await Promise.race([
            User.findById(isVerified.id),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )
        ]);

        if (!user) {
            console.log('❌ User not found');
            return res.json(false);
        }

        console.log('✅ Token validation successful');
        res.json(true);

    } catch (e) {
        console.error('❌ Token validation error:', e.message);

        if (e.message.includes('timeout')) {
            return res.status(503).json({error: "Database connection timeout"});
        }

        // Invalid token
        res.json(false);
    }
});

authRouter.get('/', auth, async (req, res) => {
    console.log('👤 Get user data request for user ID:', req.user);

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

        console.log('✅ User data retrieved successfully');

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
        console.error('❌ Get user data error:', e.message);

        if (e.message.includes('timeout')) {
            return res.status(503).json({error: "Database connection timeout"});
        }

        res.status(500).json({error: e.message});
    }
});

module.exports = authRouter;