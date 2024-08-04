1.starting backend with h...

2.npm init => package.json

3.
public/temp/.gitkeep
.env
.gitignore
Readme.md

4.
src/app.js
src/constante.js
src/index.js

5.
package.json >
    "type": "module",
    "scripts": {
    "dev": "nodemon src/index.js"
  },

6.
CMD
    cd src
    mkdir controllers db middlewares models routes utils

7.
.env
    PORT=8000
    MONGODB_URI=mongodb+srv://learnbackend:learnbackend@learnbackend.vurd1bk.mongodb.net

8.
stablish connection with database
  db/index.js
       import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`mongodb connected ! DB host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("mongodb connection error");
        process.exit(1)
    }
}


export default connectDB;




9.
index.js
     // require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from "./app.js"


dotenv.config({path: './env'})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is listening at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("mongoDB connection failed !! ", err);
})



9.(for use import keyword insteadoff required to configure dotenv)
.env
    "scripts": {
    "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
  },


app.js
    import express from "express";

    const app = express()

    export { app }


commection stablished with monoDB atlas









10.
npm i cookie-parser cors
npm i cors

11.
app.js

12.
src/utils/asyncHandler.js
    const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}

13.
src/utils/ApiError.js
    class ApiError extends Error{
    constructor(
        statusCode,
        message = "something went wrong",
        errors = [],
        statck = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}

14.
src/utils/ApiResponse.js
    class ApiResponse{
    constructor(
        statusCode, data, message = "Success"
        ){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}



14.
src/models/user.model.js
src/models/video.model.js


15.
npm i mongoose-aggregate-paginate-v2

16. 
use mongo aggregate paginate in video.model.js











make user and video model and deals with bcrypt, jwt, refresh token, accesstoken, encrypting passwords using bcrypt 


17.
npm i bcrypt
npm i jsonwebtoken
    use bcrypt and jwt to decrypt password

18.
bcrypt and jwt token
use in user.model.js
and learn about pre and methods

19.
.env
    ACCESS_TOKEN_SECRET=buygr4uy//\vg5xvrhtk32oask
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=jkfhiu6erht34bnjkh//oief
REFRESH_TOKEN_EXPIRY=10d

20.
make jwt tokens in user.model.js
    generateAccessToken
    generateRefreshToken








new 

21.
file handlenig using third party services like clowdnery
and multer/express-fileupload package
multer.middleware.js
cloudinary.js


22
routes
app.js > user.routes.js > user.controller.js

23.
register of user done
mostly file used > user.controler.js

24.
emove temporary stored file in public after uploaded on cloudinary
    cloudinary.js
                fs.unlinkSync(localFilePath)







