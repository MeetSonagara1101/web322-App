/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Janakan Sureshraj_ 
Student ID: 153073226
Date: 19th of July 2024
Vercel Web App URL: https://web322-app-janakan.vercel.app
GitHub Repository URL: https://github.com/JanakanSureshraj/WEB322-App.git

********************************************************************************/ 
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const storeService = require('./store-service');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = process.env.PORT || 8080;

// Handlebars helpers
const helpers = {
    navLink: function(url, options) {
        let isActive = (url === this.activeRoute) ? 'active' : '';
        return `<li class="nav-item ${isActive}"><a class="nav-link" href="${url}">${options.fn(this)}</a></li>`;
    },
    equal: function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    }
};

// Set up Handlebars
app.engine('.hbs', exphbs.engine({ extname: '.hbs', helpers: helpers }));
app.set('view engine', '.hbs');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to set the active route
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    console.log("Request Path: ", req.path); // Debug log
    console.log("Active Route: ", app.locals.activeRoute); // Debug log
    app.locals.viewingCategory = req.query.category;
    next();
});
// cloudinary configuraton for image storage
cloudinary.config({
    cloud_name: 'duouzaibp',
    api_key: '814312793885764',   
    api_secret: 'yYCh4Y5UZu2av_bN9q-HbY_Ubz8',
    secure: true
}); 

const upload = multer(); // No { storage: storage } since we are not using disk storage
// ROUTES

// home page redirects to /about
app.get('/', (req, res) => {
    res.redirect('/Shop');
});

// about 
app.get('/about', (req, res) => {
    res.render('about', { activeAbout: true });
});

// shop
app.get('/shop', async (req, res) => {
    let viewData = {};
    try {
        let items = req.query.category 
            ? await storeService.getPublishedItemsByCategory(req.query.category)
            : await storeService.getPublishedItems();
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;
        viewData.item = items[0]; // Latest item
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }
    res.render('shop', { data: viewData });
});

// Route to handle individual item by ID within the shop route
app.get('/shop/:id', async (req, res) => {
    let viewData = {};
  
    try {
      // Declare empty array to hold "item" objects
      let items = [];
  
      // If there's a "category" query, filter the returned items by category
      if (req.query.category) {
        // Obtain the published items by category
        items = await storeService.getPublishedItemsByCategory(req.query.category);
      } else {
        // Obtain the published items
        items = await storeService.getPublishedItems();
      }
  
      // Sort the published items by itemDate
      items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
  
      // Store the "items" data in the viewData object (to be passed to the view)
      viewData.items = items;
  
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      // Obtain the item by "id"
      viewData.item = await storeService.getItemById(req.params.id);
    } catch (err) {
      viewData.message = "no results"; 
    }
  
    try {
      // Obtain the full list of "categories"
      viewData.categories = await storeService.getCategories();
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    // Render the "shop" view with all of the data (viewData)
    res.render('shop', { data: viewData });
});

// items: all, by category, by minDate
app.get('/items', (req, res) => {
    const { category, minDate } = req.query;

    if (category) {
        storeService.getItemsByCategory(category)
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: 'No results' }));
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: 'No results' }));
    } else {
        storeService.getAllItems()
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: 'No results' }));
    }
});

// item by id
app.get('/item/id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
});

// add item
app.get('/items/add', (req, res) => {
    res.render('addItem', { activeAdd: true });
});

// categories
// categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => res.render('categories', { categories: data }))
        .catch(err => res.render('categories', { message: "no results" }));
});

// add item - form submission
app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            console.error(err);
            res.status(500).send("Error uploading image");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        // Process the req.body and add it as a new Item before redirecting to /items
        let newItem = {
            title: req.body.title,
            price: req.body.price,
            body: req.body.body,
            category: req.body.category,
            featureImage: req.body.featureImage,
            published: req.body.published ? true : false
        };

        storeService.addItem(newItem)
            .then(() => {
                res.redirect('/items');
            })
            .catch(err => {
                res.status(500).send("Unable to add item");
            });
    }
});

// custom 404 error page
app.use((req, res) => {
    res.status(404).render('404');
});

// run the server only if store service is initialized
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express HTTP server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Unable to start the server", err);
    });
