import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import response from "express"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"









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

    //check for avatar, check for avatar available in publiv/temp ie in our local server
    const avatarLocalPath = req.files?.avatar[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //check for coverImg, if coverImage is not available then give empty string otherwise give error of -
    //can't read property of undefined
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
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







const loginUser = asyncHandler(async(req, res) => {
    //take data from req.body
    const {email, username, password} = req.body

    //username or email based login
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    //find existance of user in database
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    //password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credential")
    }

    //access and refresh token generate 
    const generateAccessAndRefereshTokens = async(userId) =>{
        try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()
    
            user.refreshToken = refreshToken
            await user.save({ validateBeforeSave: false })
    
            return {accessToken, refreshToken}
    
    
        } catch (error) {
            throw new ApiError(500, "Something went wrong while generating referesh and access token")
        }
    }
   
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    //send tokens in cookes
    //send responce of successfull login
    const options = {
        httpOnly: true,
        secure: true
    }


    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {user: loggedInUser, accessToken, refreshToken},
            "user logged in successfully"
        )
    )
})






const logoutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            },
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})










const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}