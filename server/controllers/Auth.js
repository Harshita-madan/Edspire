const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.sendOTP = async (req,res) => {
    try{
        const {email} = req.body;

        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:"User already registered",
            })
        }

        var otp = otpGenerator.generate( 6 , {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });

        console.log("OTP generated successfully");

        //uniqueness of otp
        let result = await OTP.findOne({otp:otp});

        while(result){
            otp = otpGenerator(6, {
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp:otp});
        }

        const otpPayload = {email,otp};

        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        res.status(200).json({
            success:true,
            message:'OTP sent successfully',
            otp,
        })
    } catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
};

exports.signUp = async ( req,res) => {

    try{
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message:"All fields are required",
            });
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Passwords do not match",
            });
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User is already registered",
            });
        }

        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);

        if(recentOtp.length === 0){
            return res.status(400).json({
                success:false,
                message:'OTP not found',
            })
        } else if (otp !== recentOtp[0].otp) {
            return res.status(400).json({
                success:false,
                message:"Invalid OTP",
            });
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber: contactNumber ||  null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`
        })

        return res.status(200).json({
            success:true,
            message:"User is registered successfully",
            user,
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. Pls try again."
        });
    }
}

exports.login = async (req,res) => {
    try{
         const {email,password} = req.body;

         if(!email || !password){
            return res.status(403).json({
                success:false,
                message:"All fields are mandatory. Please fill all fields."
            });
         }

         const user = await User.findOne({email}).populate("additionalDetails");
         
         if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered. Please signup first."
            });
         }

         if(await bcrypt.compare(password, user.password)){
            const payload={
                email: user.email,
                id: user._id,
                accountType:user.accountType,
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET , {
                expiresIn:"24h",
            });

            user.token=token;
            // user.password=undefined;
            const userData = user.toObject();
            delete userData.password

            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }

            res.cookie("token", token , options).status(200).json({
                success:true,
                token,
                user:userData,
                message:"Logged in sucessfully",
            })
         }
         else{
            return res.status(401).json({
                success:false,
                message:"Password is incorrect",
            })
         }
    }catch(error){
        // console.log(error);
        console.error("❌ LOGIN ERROR:", error.message);
        console.error(error.stack);
        return res.status(500).json({
            success:false,
            message:"Login Failure. Please try again."
        })
    }
};

// exports.changePassword = async(req,res) => {
//     get data from req.body
//     get oldPassword , newPassword , confirmPassword
//     validation 

//     update in Db
//     send mail - Password updated successfully 

//     return response 
// }

exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}