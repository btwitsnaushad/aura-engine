const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Product = require("./models/Product");
require("dotenv").config();

const TOTAL_PRODUCTS = 50000;
const BATCH_SIZE = 1000;

const seedProducts = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the environment variables.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully.");

    const categories = [
      "Electronics",
      "Apparel",
      "Home",
      "Toys",
      "Office",
      "Sports",
    ];

    let insertedCount = 0;

    for (let start = 0; start < TOTAL_PRODUCTS; start += BATCH_SIZE) {
      const batchSize = Math.min(
        BATCH_SIZE,
        TOTAL_PRODUCTS - start
      );

      const products = [];

      for (let i = 0; i < batchSize; i++) {
        const cost = Number(
          faker.commerce.price({
            min: 10,
            max: 500,
            dec: 2,
          })
        );

        const price =
          cost + faker.number.int({ min: 10, max: 100 });

        products.push({
          productName: faker.commerce.productName(),
          sku: faker.string.uuid(),
          category: faker.helpers.arrayElement(categories),
          price,
          cost,
          stockQuantity: faker.number.int({
            min: 0,
            max: 1000,
          }),
          reorderLevel: faker.number.int({
            min: 10,
            max: 50,
          }),
          lastUpdated: faker.date.recent(),
        });
      }

      await Product.insertMany(products, {
        ordered: true,
      });

      insertedCount += products.length;

      console.log(
        `Progress: ${insertedCount}/${TOTAL_PRODUCTS} products inserted`
      );
    }

    console.log(
      `Seeding completed successfully. ${insertedCount} products inserted.`
    );
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedProducts();