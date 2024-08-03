import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import response from "express"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async(req, res) => {

    //get user detail from frontend
    const {fullName, email, username, password} = req.body
    console.log("email: ", email);

    //validation for data - like not empty
    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "all fields are required")
    }

    //check if user already exists : by username and email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "user with email or username already exists")
    }

    //check for avatar & coverImg, check for avatar available in publiv/temp ie in our local server
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //upload them to cloudinary, avatar & coverImg
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username
    })

    //remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check for user creation
    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    //return response for successfully user creation
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

    
    

    

})

export {registerUser}