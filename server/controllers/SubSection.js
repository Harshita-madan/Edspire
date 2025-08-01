const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.createSubSection = async( req, res) => {
    // try{

    //     const {sectionId , title , timeDuration , description} = req.body;

    //     const video = req.files.videoFile;

    //     if(!sectionId || !title || !timeDuration || !description || !video){
    //         return res.status(400).json({
    //             success:false,
    //             message:'All fields are required.'
    //         });
    //     }

    //     const uploadDetails = await uploadImageToCloudinary(video , process.env.FOLDER_NAME);

    //     const subSectionDetails = await SubSection.create({
    //         title:title,
    //         timeDuration:timeDuration,
    //         description:description,
    //         videoUrl:uploadDetails.secure_url,
    //     });

    //     const updatedSubSection = await Section.findByIdAndUpdate({_id:sectionId},
    //                                                             {$push:{
    //                                                                 subSection:subSectionDetails._id,
    //                                                             }},
    //                                                             {new:true}    
    //     );

    //     return res.status(200).json({
    //         success:true,
    //         message:"Sub section created successfully.",
    //         data:updatedSubSection,
    //     });

    // }catch(error){
    //     return res.status(500).json({
    //         success:false,
    //         message:"Internal Server error",
    //         error:error.message,
    //     });
    // }

    try {
        // Extract necessary information from the request body
        const { sectionId, title, description } = req.body
        const video = req.files.video

        // Check if all necessary fields are provided
        if (!sectionId || !title || !description || !video) {
        return res
            .status(404)
            .json({ success: false, message: "All Fields are Required" })
        }
        console.log(video)

        // Upload the video file to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
        )
        console.log(uploadDetails)
        // Create a new sub-section with the necessary information
        const SubSectionDetails = await SubSection.create({
        title: title,
        timeDuration: `${uploadDetails.duration}`,
        description: description,
        videoUrl: uploadDetails.secure_url,
        })

        // Update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate(
        { _id: sectionId },
        { $push: { subSection: SubSectionDetails._id } },
        { new: true }
        ).populate("subSection")

        // Return the updated section in the response
        return res.status(200).json({ success: true, data: updatedSection })
    } catch (error) {
        // Handle any errors that may occur during the process
        console.error("Error creating new sub-section:", error)
        return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
        })
    }
}

//updateSubSection , deleteSubSection

exports.updateSubSection = async(req,res)=> {
    // try{

    //     const {subSectionId , title , timeDuration , videoUrl , description} = req.body;

    //     if(!title || timeDuration || description || !subSectionId || !videoUrl){
    //         return res.status(400).json({
    //             success:false,
    //             message:'Missing properties.'
    //         });
    //     }

    //     const updatedSubSection = SubSection.findByIdAndUpdate({subSectionId},
    //                                                         {
    //                                                             title:title,
    //                                                             description:description,
    //                                                             timeDuration:timeDuration,
    //                                                             videoUrl:videoUrl,
    //                                                         },
    //                                                     {new:true}
    //                                                 );
        
    //     // const updatedSection = await Section.findById(sectionId).populate("subSection")

    //     return res.status(200).json({
    //         success:true,
    //         data:updatedSubSection,
    //         message:"SubSection updated successfully.",
    //     })
    // }catch(error){
    //     return res.status(500).json({
    //         success:false,
    //         message:"Problem while updating SubSection",
    //         error:error.message,
    //     });
    // }

    try {
        const { sectionId, subSectionId, title, description } = req.body
        const subSection = await SubSection.findById(subSectionId)

        if (!subSection) {
        return res.status(404).json({
            success: false,
            message: "SubSection not found",
        })
        }

        if (title !== undefined) {
        subSection.title = title
        }

        if (description !== undefined) {
        subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
            video,
            process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
        }

        await subSection.save()

        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate(
        "subSection"
        )

        console.log("updated section", updatedSection)

        return res.json({
        success: true,
        message: "Section updated successfully",
        data: updatedSection,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
        })
    }
}

exports.deleteSubSection = async(req,res) => {
    // try{
        
    //     const {subSectionId} = req.params;

    //     await SubSection.findByIdAndDelete(subSectionId);

    //     const updatedSection = await Section.findById(sectionId).populate("subSection")
        
    //     return res.status(200).json({
    //         success:true,
    //         data: updatedSection,
    //         message:"SubSection deleted successfully",
    //     })


    // }catch{
    //     return res.status(500).json({
    //         success:false,
    //         message:"Problem while deleting SubSection",
    //         error:error.message,
    //     });
    // }

    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
            $pull: {
            subSection: subSectionId,
            },
        }
        )
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
        return res
            .status(404)
            .json({ success: false, message: "SubSection not found" })
        }

        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate(
        "subSection"
        )

        return res.json({
        success: true,
        message: "SubSection deleted successfully",
        data: updatedSection,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
        })
    }
}