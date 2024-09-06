import users from "../Models/userModel.js";
import Industries from '../Models/industriesModel.js'
import userSkills from '../Models/userSkillsModel.js'
import Skills from '../Models/skillsModel.js'
import JobPreference from '../Models/JobPreferenceModel.js'
import jobApplications from '../Models/applicationModel.js'
import Connections from '../Models/connestionsModel.js'
import Posts from '../Models/postsModel.js'
import Comment from '../Models/commentsModel.js'
import SavedJobs from "../Models/SavedJobsModel.js";
import Jobs from "../Models/jobsModel.js";
import Experiences from '../Models/experiencesModel.js'



import asyncHandler from "express-async-handler";
import OTP from '../Models/otpModel.js'
import nodeMailer from 'nodemailer'
import generateOtp from 'generate-otp'
import generateToken from '../Utils/userGenerateToken.js'
import dotenv from "dotenv";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types
dotenv.config();


const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await users.findOne({ email })

    if (!user) {
        res.status(400);
        throw new Error("email does't exist");
    }

    if (user.isBlocked) {
        res.status(400);
        throw new Error("Sorry you are blocked");
    }

    if (user && (await user.matchPassword(password))) {
        generateToken(res, user._id);

        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            image: (user.profileImg ? user.profileImg : null),
        });
    } else {
        res.status(400);
        throw new Error("Invalid email or password");
    }

})



//register user 

const registerUser = asyncHandler(async (req, res) => {
    const { email, mobile } = req.body

    const findEmail = await users.findOne({ email })
    if (findEmail) {
        res.status(400)
        throw new Error('Email already exists')
    }
    const findMobile = await users.findOne({ mobile })
    if (findMobile) {
        res.status(400)
        throw new Error('mobile number already in use')
    }


    const otp = generateOtp.generate(6, {
        digits: true,
        alphabets: false,
        upperCase: false,
        specialChars: false,
    });

    const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: "OTP for Verification",
        text: `Your OTP for verification is: ${otp}`,
    };

    try {
        await OTP.create({ email, otp });
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
})


const googleRegister = asyncHandler(async (req, res) => {
    const { firstName, lastName, email } = req.body;


    const images = req.file && req.file.filename;

    const userExists = await users.findOne({ email });
    if (userExists.isBlocked) {
        return res.json({status : false})
    }
    else {
        if (userExists) {

            generateToken(res, userExists._id);

            res.json({
                status: false,
                _id: userExists._id,
                firstName: userExists.firstName,
                lastName: userExists.lastName,
                email: userExists.email,
                mobile: userExists.mobile,
                isBlocked: userExists.isBlocked,
                image: (userExists.profileImg ? userExists.profileImg : null),
            });
        } else {
            const user = await users.create({
                firstName: firstName,
                lastName: lastName,
                email: email,
                profileImg: images,
            });

            if (user) {

                generateToken(res, user._id);

                res.status(201).json({
                    status: true,
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    mobile: user.mobile,
                    email: user.email,
                    image: (user.profileImg ? user.profileImg : null),
                });
            } else {
                res.status(400);
                throw new Error("Invalid user data");
            }
        }
    }
})


const AddDetails = asyncHandler(async (req, res) => {
    const { id, mobile, title, industry, location, gender, education } = req.body

    const user = await users.findByIdAndUpdate({ _id: id },
        { mobile: mobile, title: title, industryType: industry._id, location: location.name, gender: gender.name, education: education.name })

    if (user) {
        generateToken(res, user._id);

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            image: (user.profileImg ? user.profileImg : null),
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
})




const verifyRegistration = asyncHandler(async (req, res) => {

    const { firstName, lastName, email, mobile, title, industry, location, gender, education, password, otp } = req.body

    const otpDocument = await OTP.findOne({ email, otp });

    if (!otpDocument) {
        res.status(400)
        throw new Error('invalid OTP')
    }
    const user = await users.create({
        firstName,
        lastName,
        email,
        mobile,
        title,
        industryType: industry._id,
        location: location.name,
        gender: gender.name,
        education: education.name,
        password,
    });
    if (user) {
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            email: user.email,
            lastName: user.lastName,
            mobile: user.mobile,
            image: user.profileImg
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
})

const forgotPassVerify = asyncHandler(async (req, res) => {
    const email = req.query.email
    const isExisting = await users.findOne({ email: email })
    if (!isExisting) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = generateOtp.generate(6, {
        digits: true,
        alphabets: false,
        upperCase: false,
        specialChars: false,
    });

    const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: "OTP for Verification",
        text: `Your OTP for verification is: ${otp}`,
    };

    try {
        await OTP.create({ email, otp });
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
})

const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    try {
        const otpDocument = await OTP.findOne({ email, otp });

        if (!otpDocument) {
            return res.status(500).json({ status: false, message: "Invalid OTP" });
        }
        else {
            res.status(200).json({ status: true })
        }
    } catch (error) {
        console.error("Error updating password:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to update password" });
    }
});

const AddnewPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await users.findOne({ email });

    if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
    }

    user.password = password;
    await user.save();

    res
        .status(200)
        .json({ success: true, message: "Password updated successfully" });
})


//save job preference
const AddjobPreference = asyncHandler(async (req, res) => {

    const { userId, jobTitle, jobType, minPay } = req.body



    const existing = await JobPreference.findOne({ userId: userId })

    if (existing) {
        // Add new skills to existing skills
        existing.jobTitle = jobTitle;
        existing.jobType = jobType;
        existing.minPay = minPay;
        const updatePreference = await existing.save();

        res.status(200).json({
            message: 'Job Preference updated successfully',
            skills: updatePreference, // Send back the updated skills
        });
    } else {
        const saved = await JobPreference.create({
            userId,
            jobTitle,
            jobType: jobType.val,
            minPay
        })

        if (saved) {
            res.status(201).json({ message: 'saved successfully' })
        }
        else {
            res.status(400)
            throw new Error("failed to save data");
        }
    }




})


// save skills
const saveSkills = asyncHandler(async (req, res) => {
    const { userId, skills } = req.body;

    const existing = await userSkills.findOne({ userId: userId });

    if (existing) {
        // Add new skills to existing skills
        existing.skills = [...existing.skills, ...skills];
        const updatedUser = await existing.save();

        res.status(200).json({
            message: 'Skills updated successfully',
            skills: updatedUser.skills, // Send back the updated skills
        });
    } else {
        const saved = await userSkills.create({
            userId,
            skills
        });

        if (saved) {
            res.status(201).json({ message: 'Skills saved successfully' });
        } else {
            res.status(400).json({ message: 'Failed to save data' });
        }
    }
});


const removeSkill = asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    const skillId = req.query.skillId;

    try {
        // Find the userSkills document based on userId
        const userSkill = await userSkills.findOne({ userId: userId });

        if (!userSkill) {
            return res.status(404).json({ message: 'User skills not found' });
        }

        // Remove the skill with the specified skillId from the skills array
        userSkill.skills = userSkill.skills.filter(skill => skill._id !== skillId);

        // Save the updated userSkill document
        await userSkill.save();

        res.status(200).json({ message: 'Skill removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


const listSkills = asyncHandler(async (req, res) => {
    const skills = await Skills.find({ isListed: true })
    res.status(201).json({ data: skills })
})

//get industries
const listIndustries = asyncHandler(async (req, res) => {
    const industries = await Industries.find()
    res.status(201).json({ data: industries })
})



const loadMyProfile = asyncHandler(async (req, res) => {
    const userId = req.query.userId;


    const data = await users.aggregate([
        {
            $match: {
                _id: new ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: 'industries',  // Replace with the actual name of your Industries collection
                localField: 'industryType',
                foreignField: '_id', // Corrected to use _id as the foreignField
                as: 'industry'
            }
        },
        {
            $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                userName: { $concat: ['$firstName', ' ', '$lastName'] }, // Concatenate first and last name
                title: 1,
                email: 1,
                mobile: 1,
                industryType: '$industry.industryName', // Replace 'type' with the actual field in Industries
                gender: 1,
                location: 1,
                education: 1,
                profileImg: 1,
                isBlocked: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    const followers = await Connections.find({ userId: userId })
    const jobPreference = await JobPreference.findOne({ userId: userId })

    res.status(201).json({ data: data[0], followers: followers, jobPreference: jobPreference });
});



const editProfile = asyncHandler(async (req, res) => {
    const userId = req.body.userId;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const location = req.body.location;
    const title = req.body.title;
    const images = req.file && req.file.filename;


    const user = await users.findOneAndUpdate(
        { _id: userId },
        {
            firstName: firstName,
            lastName: lastName,
            title: title,
            location: location,
            profileImg: images,
        },
        { new: true } // Use { new: true } to return the updated document
    );

    if (user) {
        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            title: user.title,
            email: user.email,
            mobile: user.mobile,
            image: user.profileImg,
        });
    } else {
        res.status(404).json({ error: { message: 'User not found' } });
    }

})


const listjobPreferencePage = asyncHandler(async (req, res) => {

    const userId = req.query.userId


    const jobPreference = await JobPreference.findOne({ userId: userId })
    const skills = await userSkills.findOne({ userId: userId })


    res.status(201).json({ JobPreference: jobPreference, skills: (skills ? skills : false) })

})


const listSavedJobs = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const userSavedJobs = await SavedJobs.findOne({ userId: userId })

    let data

    if (userSavedJobs) {
        data = await SavedJobs.aggregate([
            {
                $match: { userId: userId }
            },
            {
                $unwind: '$savedItems'
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'savedItems',
                    foreignField: '_id',
                    as: 'jobDetails'
                }
            },
            {
                $lookup: {
                    from: 'jobapplications',
                    let: { jobId: '$savedItems' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$jobId', '$$jobId'] },
                                        { $eq: ['$userId', userId] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'applications'
                }
            },
            {
                $addFields: {
                    isApplied: { $gt: [{ $size: '$applications' }, 0] }
                }
            },
            {
                $unset: 'applications'
            }
        ]);
    } else {
        res.json({ userSavedJobs });
        return;  // Add a return statement to exit the function if there are no saved jobs
    }

    res.json(data);
});



const changePassword = asyncHandler(async (req, res) => {
    const oldPass = req.query.oldPass
    const newPass = req.query.newPass
    const userId = req.user._id; // Assuming you have middleware to extract user information from the request
    // Fetch user by ID
    const user = await users.findById(userId);

    // Check if the user exists
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if the old password is correct
    const isPasswordMatch = await user.matchPassword(oldPass);


    if (!isPasswordMatch) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    // Set the new password and save the user
    user.password = newPass;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
})

const jobStatusList = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const findJobs = await jobApplications.aggregate([
        {
            $match: { userId: userId }
        },
        {
            $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'jobDetails'
            }
        }
    ])

    if (findJobs) {
        res.json(findJobs)
    }

})


const addExperience = asyncHandler(async (req, res) => {
    const { userId, experience } = req.body

    const isExisting = await Experiences.findOne({ userId: userId })

    if (isExisting) {
        isExisting.experiences = [...isExisting.experiences, experience];
        const updatedUser = await isExisting.save()
        res.json({ status: true })
    }
    else {
        const newExperience = await Experiences.create({
            userId,
            experiences: [experience]
        })

        if (newExperience) {
            res.json({ status: true })
        }
        else {
            throw new Error('internal server error')
        }
    }

})

const listExperience = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    const findExperience = await Experiences.findOne({ userId: userId })
    if (findExperience) {
        res.json(findExperience)
    }
    else {
        res.json(null)
    }
})

const logoutUser = asyncHandler(async (req, res) => {

    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({ message: "Logged out successfully" });

});



export {
    authUser,
    AddDetails,
    registerUser,
    googleRegister,
    verifyRegistration,
    forgotPassVerify,
    verifyOtp,
    AddnewPassword,
    AddjobPreference,
    saveSkills,
    listIndustries,
    listSkills,
    loadMyProfile,
    editProfile,
    listjobPreferencePage,
    removeSkill,
    listSavedJobs,
    changePassword,
    jobStatusList,
    listExperience,
    addExperience,
    logoutUser
}