const mongoose = require("mongoose");
const { getInstructorCourses } = require("../controllers/Course");

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    courses:[
            {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Course",
        }
    ],
});

module.exports = mongoose.model("Category" , categorySchema);