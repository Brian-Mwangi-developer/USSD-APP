const mongoose = require('mongoose');

const dataSchema = mongoose.Schema({
    name:{
        type    : String,
        required: true
    },
    region:{
        type    : String,
        required: true
    },
    phoneNumber:{
        type    : String,
        required: true
    },
});

module.exports = mongoose.model("Data", dataSchema);