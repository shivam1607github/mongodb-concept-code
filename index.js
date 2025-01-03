const bcrypt = require("bcrypt")                       //importing a bcrypt library to hash the password which would be impposibe to decode

const express = require("express");               //import the express library
const { UserModel , TodoModel } = require("./db");  //connecting the .db file to fetch it
const jwt = require("jsonwebtoken");      // import the jsonwebtoken
const JWT_SECRET = "ilovekiyara";    //create a json secret passowrd
const mongoose = require("mongoose");       //importing the mongoose library for the mongo db concept
const {z}= require("zod");          //importing the zod library
mongoose.connect("mongodb+srv://shivampandeysbm1607:shivam1607@cluster0.e7iqg.mongodb.net/todos-app-database");
const app = express();
app.use(express.json());           //body parser middleware --


app.post("/signup", async function (req,res){

    const requiredbody= z.object({                 //hearing from 16 to 29th line we,re using the zod concept for the input validation 
        email :z.string(),                         //zod is the library in which its provide a schema through which we can validate our input such as - correct email, min or max password ,the password should be of 8 number and more or less.
        name :z.string(),
        password :z.string()

    })
    const parsedDataWithSuccess = requiredbody.safeParse(req.body);
    if(!parsedDataWithSuccess.success){
        res.json({
            message : "incorrect format"
        })
        return
    }

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    const hashedPassword = await bcrypt.hash(password,5);        //called a function bcrypt.hash which will hash the password
    console.log(hashedPassword);

    // Check if the user already exists
     const existingUser = await UserModel.findOne({ email: email });
     if (existingUser) {
         return res.status(400).json({
             message: "Email already in use."
         });
     }

    await UserModel.create({           //inserting the strings by usermodel.insert
        name: name,
        password : hashedPassword,
        email : email
    })

    res.json({
        message : " you are logged in" 
    })
})

app.post("/login", async function (req,res){
    const email = req.body.email;
    const password = req.body.password;

    const response = await UserModel.findOne({
        email : email,
        
    })
    if(!response){
        res.json({
            message : "user does not exit in our database"

        })
        return ;
    }

    console.log(response);
    
    const passowrdMatch = await bcrypt.compare(password,response.password);

    if(passowrdMatch){
        console.log({
            id: response.id.toString()
        })
        const token = jwt.sign({
            id : response._id.toString()
        },JWT_SECRET);
        res.json({
            token : token 
        })
    }else {
        res.status(403).json({
            message : "yours crendentials are incorrect!!"
        })

    }
})

function auth(req, res, next) {
    const token = req.headers.token; // Extract token from headers
    if (!token) {
        return res.status(403).json({
            message: "Authorization token is required",
        });
    }

    try {
        // Verify the token
        const decodedData = jwt.verify(token, JWT_SECRET);

        if (decodedData) {
            req.userId = decodedData.id; // Set user ID from token payload
            next(); // Proceed to the next middleware or route
        } else {
            res.status(403).json({
                message: "Invalid token",
            });
        }
    } catch (err) {
        res.status(403).json({
            message: "Token verification failed",
        });
    }
}



app.post("/todo", auth, function (req, res) {
    const userId = req.userId;
    const title = req.body.title;
    TodoModel.create({
        title,
        userId
    })

    res.json({
        message: "Todo created successfully",
        userId: userId,
    });
});

app.get("/todos", auth, async function (req, res) {
    const userId = req.userId;
    const todos = await TodoModel.find({
        userId :userId
    })

    res.json({
        message: "Here are your todos",
        todos
    });
});


app.listen(3000);