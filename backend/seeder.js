const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Product = require('./models/Product');
require('dotenv').config();

const seedProducts = async () => {
  try {
   
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected. Clearing old products...');
    await Product.deleteMany(); 

    const products = [];
    const categories = ['Electronics', 'Apparel', 'Home', 'Toys', 'Office', 'Sports'];

    for (let i = 0; i < 50000; i++) {
      const cost = Number(faker.commerce.price({ min: 10, max: 500, dec: 2 }));
      const price = cost + faker.number.int({ min: 10, max: 100 }); 
      products.push({
        productName: faker.commerce.productName(),
        sku: faker.string.uuid(),
        category: faker.helpers.arrayElement(categories),
        price: price,
        cost: cost,
        stockQuantity: faker.number.int({ min: 0, max: 1000 }),
        reorderLevel: faker.number.int({ min: 10, max: 50 }),
        lastUpdated: faker.date.recent()
      });
    }

    console.log('Inserting 50,000 products. This might take a minute or two...');
    await Product.insertMany(products);
    console.log('50,000 Database records seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error with data seed:', error);
    process.exit(1);
  }
};

seedProducts();