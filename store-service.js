const fs = require('fs');

// data arrays 
let items = [];
let categories = [];

module.exports = {
    initialize: function() {
        return new Promise((resolve, reject) => {
            fs.readFile('./data/items.json', 'utf8', (err, data) => {
                if (err) {
                    reject("unable to read items file");
                    return;
                }
                items = JSON.parse(data);

                fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                    if (err) {
                        reject("unable to read categories file");
                        return;
                    }
                    categories = JSON.parse(data);
                    resolve();
                });
            });
        });
    },

    getAllItems: function(){
        return new Promise((resolve, reject) => {
            if(items.length > 0){
                resolve(items);
            } else{
                reject("no results returned")
            }
        })
    }, 

    getPublishedItems: function() {
        return new Promise((resolve, reject) => {
            const publishedItems = items.filter(item => item.published = true);
            if (publishedItems.length > 0) {
                resolve(publishedItems);
            } else {
                reject("no results returned");
            }
        });
    },

    getCategories: function(){
        return new Promise((resolve, reject) => {
            if(categories.length > 0){
                resolve(categories);
            } else{
                reject("no results returned")
            }
        })
    },

    // Function to add a new item
    addItem: function(itemData) {
        return new Promise((resolve, reject) => {
            if (typeof itemData.published === 'undefined') {
                itemData.published = false;
            } else {
                itemData.published = true;
            }

            itemData.id = items.length + 1; // Set the id of the new item
            items.push(itemData); // Add the new item to the items array

            resolve(itemData); // Resolve the promise with the new item
        });
    },

    // Function to get items by category
    getItemsByCategory: function(category) {
        return new Promise((resolve, reject) => {
            const filteredItems = items.filter(item => item.category == category);
            if (filteredItems.length > 0) {
                resolve(filteredItems);
            } else {
                reject("no results returned");
            }
        });
    },

    // Function to get items by minimum date
    getItemsByMinDate: function(minDateStr) {
        return new Promise((resolve, reject) => {
            const minDate = new Date(minDateStr);
            const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
            if (filteredItems.length > 0) {
                resolve(filteredItems);
            } else {
                reject("no results returned");
            }
        });
    },

    // Function to get item by id
    getItemById: function(id) {
        return new Promise((resolve, reject) => {
            const item = items.find(item => item.id == id);
            if (item) {
                resolve(item);
            } else {
                reject("no results returned");
            }
        });
    }
}