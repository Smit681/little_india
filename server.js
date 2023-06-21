const express = require('express');
const path = require('path');
const exphbs = require("express-handlebars");
const session = require("express-session");
const dotenv = require("dotenv");
const mongoose = require("mongoose")

// Set up dotenv environment variables.
dotenv.config({path: "./config.env"});

//Start the express web server. 
const app = express();

// Set up and connect to MongoDB
mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Connected to the MongoDB database.");
})
.catch((err) => {
    console.log(`There was a problem connecting to MongoDB ... ${err}`);
});

// Set up handlebars
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: "main"
}));
app.set('view engine', '.hbs');
//By default handlebars looks for template files in views folder so this is unnecessary line for this project but if views folder is named differently, we need to set it up. 
app.set('views', 'views');

// Set up express-session
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    // res.locals.user is a global handlebars variable.
    // This means that every single handlebars file can access this variable.
    res.locals.user = req.session.user;
    
    next();
});


//add middleware to give read access to a certain folder or file to the client. Generally, we make folder with name public and keep css and picture files in it. 
app.use(express.static(path.join(__dirname, "public")));

//Get the router object from controller files to access their routes. 
const generalRoutes = require('./controllers/general'); // we can always omit .js part. 
const userRoutes = require('./controllers/user');
const loadDataController = require("./controllers/load-data");
const cartController = require("./controllers/cart");
const kitController = require("./controllers/kit");


//Add the middleware to use routs from controllers. 
app.use(generalRoutes); 
app.use("/user", userRoutes); // the first argument "/user" means that, this middleware will look for any routs that starts with "/user". So if in userRoutes file, there is a get middleware with path "/signin", this middleware will response to the path "/user/signin". Only "/signin" path will go to the 404 error. 
app.use("/load-data/", loadDataController);
app.use("/cart/", cartController);
app.use("/kit/", kitController);


//For unknown path display 404 error. 
app.use((req,res,next) => {
    res.status(404).send("<h1>Page Not Found</h1>");
})

//Listen to the app on the port 8080
app.listen(8080, () => {
    console.log('Web server started on port 8080');
})