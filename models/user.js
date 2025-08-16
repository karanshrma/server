const mongoose = require('mongoose');
const {Product} = require('../models/product');
const {productSchema} = require("./product");

const userSchema = mongoose.Schema({
    name: {
        required: true,
        type: String,
        trim: true,
    },
    email: {
        required: true,
        type: String,
        trim: true,
        validate: {
            validator: (value) => {
                const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                return value.match(re);
            },
            message: "Please enter valid email address"
        }
    },
    password: {
        required: true,
        type: String,
        trim: true,
        validate: {
            validator: (value) => {
               return value.length > 6 || 'Value must be at least 6 characters'
            },
            message: "Please enter valid email address"
        }
    },
    address: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        default: 'user'
    },
    cart: [
        {
            product: productSchema,
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
})

const User = mongoose.model('User', userSchema);
module.exports = User;