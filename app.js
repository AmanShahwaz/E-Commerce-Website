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





const orderSchema = new mongoose.Schema({
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
        required: true
    },
    deliveryAddress: {
        type: String,
        required: true
    }
})

// const Course = new mongoose.model('course',courseSchema);

const User = new mongoose.model('user', userSchema);
const Seller = new mongoose.model('seller', sellerSchema);
const Product = new mongoose.model('product', productSchema);
const Item = new mongoose.model('item', orderSchema);


app.get('/', function (req, res) {
    res.render('ShopOnline')
})

app.get('/main', async(req, res)=> {
    try {
        let products = await Product.find();
        res.render('main',{
            products:products
        })
    } catch (error) {
        console.log(err)
    }

})
app.get('/smain', async(req, res)=> {
    
    try {
        let products = await Product.find();
        res.render('smain',{
            products:products,
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

app.post('/add-to-cart/:productId', async (req, res) => {
    const productId = req.params.productId;

    try {
        const userId = 'userId'; 
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Add the product ID to the user's cart
        user.cart.push(productId);

        // Save the updated user document
        await user.save();

        res.status(200).send('Product added to cart successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding product to cart');
    }
});



app.get('/loginPage', function (req, res) {
    res.render('loginPage')
})


app.get('/userlogin', function (req, res) {
    res.render('userlogin')
})


app.post('/userlogin', async(req,res)=>{
    const emailid = req.body.email;
    const pass = req.body.password;

    try {
        let found = await User.findOne({email:emailid});
        console.log(found.id);
        let sid = found.id;

        if(found.password === pass){
            console.log(found.name+" logged in.....");
            res.redirect("main");
        }

    } catch (error) {
        console.log('Error in login in seller')
    }
})


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
            res.redirect("smain");
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
        // Use async/await or exec() to get the result from the query
        const found = await Product.findOne({ _id: iid }).exec();
        console.log(found)
        if (found) {
            res.render('buynow', {
                found
            });
        } else {
            // Handle the case where the product with the given ID is not found
            res.status(404).send('Product not found');
        }
    } catch (err) {
        // Handle any errors that occur during the query or rendering
        res.status(500).send(err);
        console.log(err);
    }
});


// -----------------------------------------------------------
// Endpoint for men category
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

// Endpoint for women category
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

// Endpoint for menclothing category
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

// Endpoint for womenclothing category
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

// Endpoint for footwear category
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

// Endpoint for furniture category
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







app.get('/adminpage' ,function(req,res){
    res.render('adminpage')
})





app.listen('3000', () => {
    console.log("Server active on port 3000")
})