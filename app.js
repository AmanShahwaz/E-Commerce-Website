const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const { pid } = require("process");
const { truncate } = require("lodash");
const multer = require('multer')


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');
mongoose.connect("mongodb://127.0.0.1:27017/ECommerce");


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


const storage = multer.diskStorage({
    destination:'./public/images',
    filename : (req,file,cb)=>{
        cb(null,  Date.now()+file.originalname)
    }
});


let upload = multer({
    storage: storage,
    fileFilter:(req, file, cb)=>{
        if(
            file.mimetype == 'image/jpeg' ||
            file.mimetype == 'image/jpg' ||
            file.mimetype == 'image/png' ||
            file.mimetype == 'image/gif'
    
        ){
            cb(null, true)
        }
        else{
            cb(null, false);
            cb(new Error('Only jpeg,  jpg , png, and gif Image allow'))
        }
       }
 })



const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    pincode: { type: Number, required: true },
    cart:{type:[String]}
});
const issueSchema = new mongoose.Schema({
    name: { type: String },
    issue:  { type: String}
});


const sellerSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    pincode: { type: Number, required: true },
});



const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    category: { type: String, required: true },
    image: { type: String, required: true }
});





const cartSchema = new mongoose.Schema({
    userid:{
        type:String
    },
    itemName: {
        type: String,
        require: true
    },
    quantity: {
        type: Number,
        required: true
    },
    boughtBy: {
        type: String,
    },
    deliveryAddress: {
        type: String,
    }
})

// const Course = new mongoose.model('course',courseSchema);

const User = new mongoose.model('user', userSchema);
const Seller = new mongoose.model('seller', sellerSchema);
const Product = new mongoose.model('product', productSchema);
const Item = new mongoose.model('item', cartSchema);


app.get('/', function (req, res) {
    res.render('ShopOnline')
})


app.get('/main', async (req, res) => {
    try {
        let products = await Product.find();
        res.render('main', {
            products: products,
            userId: req.query.userId, 
        });
    } catch (error) {
        console.log(err);
    }
});

app.get('/smain', async(req, res)=> {
    
    try {
        let products = await Product.find();
        res.render('smain',{
            products:products,
            userId: req.query.userId, 
        })
    } catch (err) {
        console.log(err)
    }

})


app.get('/inventory', async (req, res)=> {
    
    try {
        let products = await Product.find();
        res.render('inventory',{
            products:products,
        })
    } catch (err) {
        console.log(err)
    }
})



app.get('/addToCart/:productId', async (req, res) => {
    const productId = req.params.productId;
    const userId = req.query.userId;

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Add the product ID to the user's cart
        user.cart.push(productId);

        // Save the updated user document
        await user.save();

        res.redirect('/main?userId=' + userId); // Redirect back to the main page
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding product to cart');
    }
});


// Assuming you have a route like this in your app.js or wherever you define routes
app.get('/cart/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Get the product IDs from the user's cart
        const productIds = user.cart;

        // Fetch the product details for each product ID
        const cartProducts = await Promise.all(productIds.map(async (productId) => {
            const product = await Product.findById(productId);
            return product;
        }));

        // Pass the cartProducts to the EJS template
        res.render('cart', {
            cartProducts: cartProducts,
            userId:userId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.get('/dashboard', async (req, res)=> {
    
    try {
        let products = await Product.find();
        res.render('dashboard',{
            products:products,
        })
    } catch (err) {
        console.log(err)
    }

})



app.get('/addproduct', function(req,res){

    res.render('addproduct',{
 
    })
})
app.get('/inventory', function(req,res){
    res.render('inventory',{ 
    })
})
app.get('/analytics', function(req,res){
 
    res.render('analytics',{
    })
})
app.get('/support', function(req,res){
    res.render('support',{
    })
})




app.post('/addproduct',  upload.single('image'), async(req,res)=>{
    try {
        req.file
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category:req.body.category,
            quantity:req.body.quantity,
            image: req.file.filename,
            
        })
        var created = await product.save();
        res.redirect('/dashboard');
    }
    catch (err) {
        res.send(err);
    }
})

app.get('/delete/:productId', async (req, res) => {
    const productId = req.params.productId;

    try {
        await Product.findByIdAndDelete(productId);
        res.redirect('/inventory')
        
    } catch (error) {
        res.status(500).json({ error: 'Error deleting product' });
    }
});


// Assuming you have a route like this in your app.js or wherever you define routes
app.get('/deletecartitem/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.query.userId;

        // Validate userId and productId
        if (!userId || !productId) {
            return res.status(400).json({ error: 'Invalid userId or productId' });
        }

        // Find the user by ID and update the cart
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove the productId from the user's cart
        user.cart = user.cart.filter(cartItem => cartItem !== productId);

        // Save the updated user object
        await user.save();

        // Redirect to the cart page or any other page
        res.redirect(`/cart/${userId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/updateproduct/:productId', async (req, res) => {
    const productId = req.params.productId;
    
    try {
        // Find the product by ID
        const product = await Product.findById(productId);

        // Render a page with a form for updating the product
        res.render('updateproduct', { product });
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving product for update' });
    }
});

app.post('/updateproduct/:productId', async (req, res) => {
    const productId = req.params.productId;
    const currentProduct = await Product.findById(productId);

    
    const updatedProduct = req.body;

    try {
        // Find the product by ID and update it
        const product = await Product.findByIdAndUpdate(productId, updatedProduct, { new: true });

        // Redirect to the product details page or any other page you prefer
        res.redirect('/inventory');
    } catch (error) {
        res.status(500).json({ error: 'Error updating product' });
    }
});


app.post('/addToCart/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.query.userId;

        // Step 1: Find the product by its ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Step 2: Get the user ID from the request query parameters
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Step 3: Check if a cart item for the user and product already exists
        const existingCartItem = await Cart.findOne({
            userid: userId,
            itemName: product.name,
        });

        if (existingCartItem) {
            // Step 4: If it exists, update the quantity
            existingCartItem.quantity += 1;
            await existingCartItem.save();
        } else {
            // Step 4: Otherwise, create a new cart item
            const newCartItem = new Cart({
                userid: userId,
                itemName: product.name,
                quantity: 1, // You may adjust the initial quantity as needed
                boughtBy: '', // Provide the necessary information
                deliveryAddress: '', // Provide the necessary information
            });

            // Step 5: Save the new cart item to the database
            await newCartItem.save();
        }

        res.redirect('/main?userId=' + userId); // Redirect to the main page or any other page
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// app.get('/cart/:userid', async(req,res)=>{
//     let userId = req.params.userid;
//     console.log(userId)
//     let user = await User.findById(userId);
//     console.log(user.id);

    
// })



app.get('/loginPage', function (req, res) {
    res.render('loginPage')
})


app.get('/userlogin', function (req, res) {
    res.render('userlogin')
})


app.post('/userlogin', async (req, res) => {
    const emailid = req.body.email;
    const pass = req.body.password;

    try {
        let found = await User.findOne({ email: emailid });
        console.log(found.id);
        let sid = found.id;

        if (found.password === pass) {
            console.log(found.name + " logged in.....");
            res.redirect("/main?userId=" + sid); 
        }

    } catch (error) {
        console.log('Error in login in seller');
    }
});


app.get('/sellerlogin', function (req, res) {

    res.render('sellerlogin')
})


app.post('/sellerlogin', async(req,res)=>{
    const emailid = req.body.email;
    const pass = req.body.password;

    try {
        let found = await Seller.findOne({email:emailid});
        console.log(found.id);
        let sid = found.id;

        if(found.password === pass){
            console.log(found.name+" logged in.....");
            res.redirect("smain?userId=" + sid);
        }

    } catch (error) {
        console.log('Error in login in seller')
    }
})


app.get('/createuser', function (req, res) {
    res.render('createuser')
})

app.post('/createuser', async (req, res)=> {
    try {

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address,
            pincode: req.body.pincode
        })
        var created = await user.save();
        res.redirect('/userlogin');
    }
    catch (err) {
        res.send(err);
    }
})

app.get('/createseller', function (req, res) {
    res.render('createseller')
})


app.post('/createseller', async (req, res)=> {

    try {

        const seller = new Seller({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            image: req.body.image,
            address: req.body.address,
            pincode: req.body.pincode
        })
        var created = await seller.save();
        res.redirect('/sellerlogin');
    }
    catch (err) {
        res.send(err);
    }

})




app.get('/buynow/:id', async (req, res) => {
    let iid = req.params.id;

    try {

        const found = await Product.findOne({ _id: iid }).exec();
        console.log(found)
        if (found) {
            res.render('buynow', {
                userId:iid,
                found:found
            });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        res.status(500).send(err);
        console.log(err);
    }
});


// -----------------------------------------------------------



app.get('/mobile/:userId', async (req, res) => {
    let userId = req.params.userId;
    try {
        let products = await Product.find();
        res.render('mobile', {
            products: products,
            userId:userId
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});

app.get('/electronics/:userId', async (req, res) => {
    let userId = req.params.userId;

    try {
        let products = await Product.find();
        res.render('electronics', {
            products: products,
            userId:userId
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});

app.get('/menclothing/:userId', async (req, res) => {
    let userId = req.params.userId;

    try {
        let products = await Product.find();
        res.render('menclothing', {
            products: products,
            userId:userId
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});

app.get('/womenclothing/:userId', async (req, res) => {
    let userId = req.params.userId;

    try {
        let products = await Product.find();
        res.render('womenclothing', {
            products: products,
            userId:userId
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});


app.get('/footwear/:userId', async (req, res) => {
    let userId = req.params.userId;

    try {
        let products = await Product.find();
        res.render('footwear', {
            products: products,
            userId:userId
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});

app.get('/furniture/:userId', async (req, res) => {
    let userId = req.params.userId;

    try {
        let products = await Product.find();
        res.render('furniture', {
            products: products,
            userId:userId
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});




app.get('/analytics', async(req, res)=> {
    
    try {
        let products = await Product.find();
        console.log(products);
        res.render('/analytics',{
            products
        })
    } catch (err) {
        console.log(err)
    }

})










app.listen('3000', () => {
    console.log("Server active on port 3000")
})



// for seller endpoints


app.get('/mobile', async (req, res) => {
    try {
        let products = await Product.find();
        res.render('mobile', {
            products: products,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});


app.get('/electronics', async (req, res) => {
    try {
        let products = await Product.find();
        res.render('electronics', {
            products: products,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});


app.get('/menclothing', async (req, res) => {
    try {
        let products = await Product.find();
        res.render('menclothing', {
            products: products,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});


app.get('/womenclothing', async (req, res) => {
    try {
        let products = await Product.find();
        res.render('womenclothing', {
            products: products,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});

app.get('/footwear', async (req, res) => {
    try {
        let products = await Product.find();
        res.render('footwear', {
            products: products,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});


app.get('/furniture', async (req, res) => {
    try {
        let products = await Product.find();
        res.render('furniture', {
            products: products,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching products');
    }
});