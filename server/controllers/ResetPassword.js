const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.resetPasswordToken = async(req,res) => {
    try{
        const email = req.body.email;
        const user = await User.findOne({email:email});

        if(!user){
            return res.json({
                success:false,
                message:"Your email is not registered."
            })
        }

        const token = crypto.randomUUID(); 

        const updatedDetails = await User.findOneAndUpdate(
                            {email:email},
                            {
                                token:token,
                                resetPasswordExpires: Date.now() + 5*60*1000,
                            },
                            {new:true});  
        const url = `http://localhost:3000/update-password/${token}`
        
        await mailSender(email ,
                        "Password Reset Link",
                        `Password Reset Link: ${url}`
        );

        return res.status(200).json({
            success: true,
            message: "Reset email sent successfully",
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending reset password mail",
        });
    }
}

exports.resetPassword = async(req,res) => {
    try{
        const {password , confirmPassword ,token } = req.body;

        if(password !== confirmPassword){
            return res.json({
                success:false,
                message:"Password does not match."
            });
        }

        const userDetails = await User.findOne({token:token});

        if(!userDetails){
            return res.json({
                success:false,
                message:"Token is invalid",
            })
        }

        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success:false,
                message:"Token has expired. Pls regenerate the token."
            })
        }

        const hashedPassword = await bcrypt.hash(password , 10);

        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        );

        return res.status(200).json({
            success:true,
            message:"Password reset successfully",
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending reset password mail",
        });
    }
}