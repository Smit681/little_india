const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//define meal kit schema
const mealKitShema = new Schema({
    tital: {
        type: String,
        unique: true,
        required: true
    },
    ingrediants: {
        type: String
    },
    descrition: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    cooking_time: {
        type: String,
        required: true
    },
    serving: {
        type: Number,
        required: true
    },
    calories_per_serving: {
        type: Number,
        required: true
    },
    image_url: {
        type: String,
        required: true
    },
    top_meal: {
        type: Boolean,
        required: true
    }
});

const mealKitModel = mongoose.model("mealKits", mealKitShema);
module.exports = mealKitModel;

