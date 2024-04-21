
const  dotenv =require('dotenv').config();
const express = require('express')
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require("path");
const cors = require("cors");
const { error } = require('console');
const { emit } = require('process');

app.use(express.json());
app.use(cors());


// Database Connection with MongoDB 
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));


// API Creation

app.get("/",(req,res)=>{
    res.send("Express app is running")
})

// Image Storage Engine

// Image Storage Engine
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'upload', 'images'), // Set the destination path outside the src folder
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

//Creating Upload Endpoint for image
app.use('/images', express.static(path.join(__dirname, 'upload', 'images')));

// Update the upload endpoint to return the full image URL
app.post("/upload", upload.single("product"), (req, res) => {
    res.json({
        success: 1,
        image_url: `/images/${req.file.filename}` // Dynamically generate image URL
    });
});

//Schema for Creating Produts
const Product = mongoose.model("Products", {
    id : {
        type : Number ,
        required : true,
    },
    name : {
        type : String,
        required : true,
    },
    image : {
        type : String,
        required : true,
    },
    category : {
        type : String,
        required : true,
    },
    new_price:{
        type : Number,
        required : true,
    },
    old_price:{
        type : Number,
        required : false,
    },
    date:{
        type : Date,
        default : Date.now,
    },
    avilable:{
        type : Boolean,
        default : true,
    },
    description : {
        type : String,
        required : true,
    }
})

app.post("/addproduct", async(req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length > 0){
        let last_product_arrsy = products.slice(-1);
        let last_product = last_product_arrsy[0];
        id = last_product.id + 1;
    }
    else{
        id = 1;
    }

    const produt = new Product({
        id : id,
        name : req.body.name,
        image : req.body.image,
        category : req.body.category,
        new_price : req.body.new_price,
        old_price : req.body.old_price,
        avilable : req.body.Boolean,
        description : req.body.description
    })
    console.log(produt);
    await produt.save();
    res.json({
        success : true,
        name : req.body.name,
    })
})

//Creating API For deleting Products
app.post('/removeproduct' , async(req,res)=>{
    await Product.findOneAndDelete({id : req.body.id})
    console.log('Removed');
    res.json({
        success : true,
        name : req.body.name
    })
})

//Creating API for getting all products
app.get("/allproducts",async (req,res)=>{
    let produts = await Product.find({});
    console.log("All product Fetched");
    res.send(produts);
})

// Shema creating for User model

const Users = mongoose.model('Users' , {
    name : {
        type : String,
    },
    email : {
        type : String,
        unique : true,
    },
    password : {
        type : String,
    },
    cartData : {
        type : Object,
    },
    date : {
        type : Date,
        default : Date.now
    }
})

//Creating Endpoint for registering the user

app.post('/signup', async(req,res)=> {
    let check = await Users.findOne({email : req.body.email})
    if(check){
        return (
            res.status(400).json({success : false , errors :"existing user found with same email address" })
        )
    }
        let cart = {};
        for(let i = 0 ; i < 300 ; i++){
            cart[i] = 0;
        }
        const user = new Users({
            name: req.body.username,
            email : req.body.email,
            password : req.body.password,
            cartData : req.body.cartData
        })
        await user.save()
        const data = {
            user : {
                id : user.id
            }
        }

        const token = jwt.sign(data , 'secret_eom');
        res.json({success : true , token})
})

// creating end point for user login
app.post('/login' , async(req,res)=> {
    let user = await Users.findOne({ email : req.body.email});
    if(user) {
        const passCompare = req.body.password === user.password ;
        if(passCompare){
            const data = {
                user : {
                    id : user.id
                }
            }
            const toke  = jwt.sign(data , 'secret_ecom');
            res.json({success : true , toke})
        }
        else {
            res.json({success : fale , error : 'Password is not correct'})
        }
    }else{
        res.json({success : false , error : 'Worng Email or ID'})
    }
})

//creating endpoint for newcollection data


app.get('/newcollection', async (req, res) => {
    try {
        let products = await Product.find({}).sort({ date: -1 }).limit(8);
        console.log("NewCollection Fetched");
        res.send(products);
    } catch (error) {
        console.error("Error fetching new collection:", error);
        res.status(500).send("Internal Server Error");
    }
});


// creating endpoint for popular in women section
app.get("/popularinlaptop" , async (req,res)=>{
    let products = await Product.find({category : 'laptop'})
    let popular_in_laptop = products.slice(0,4);
    console.log("Popular in laptop fetched")
    res.send(popular_in_laptop)
})  


// Endpoint for fetching related products
app.get("/relatedproducts", async (req, res) => {
    try {
        const { productId } = req.query; // Extract the productId from the query parameters

        // Logic to fetch related products based on the productId
        // Fetch related products based on the category of the product with the given productId
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const relatedProducts = await Product.find({ category: product.category }).limit(4);
        
        // Send the related products as a response
        res.json(relatedProducts);
        
    } catch (error) {
        console.error("Error fetching related products:", error);
        res.status(500).send("Internal Server Error");
    }
});



const port = process.env.PORT || 4000;
app.listen(port,(err)=>{
   if(!err){
    console.log(`Server is running on ${port}`)
   }else{
    console.log("There is happening errors")
   }
})
