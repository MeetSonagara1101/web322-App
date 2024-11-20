/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Janakan Sureshraj_ 
Student ID: 153073226
Date: 7th of June 2024
Vercel Web App URL: https://web322-app-janakan.vercel.app
GitHub Repository URL: https://github.com/JanakanSureshraj/WEB322-App.git

********************************************************************************/ 
const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

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
    res.redirect('/about');
});

// about 
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// shop
app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));  
});

// items: all, by category, by minDate
app.get('/items', (req, res) => {
    const { category, minDate } = req.query;

    if (category) {
        storeService.getItemsByCategory(category)
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    } else {
        storeService.getAllItems()
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
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
    res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
});

// categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
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
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
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