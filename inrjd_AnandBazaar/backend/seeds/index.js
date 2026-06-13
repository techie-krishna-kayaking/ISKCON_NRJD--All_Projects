require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FoodItem = require('../models/FoodItem');
const RawMaterial = require('../models/RawMaterial');
const Recipe = require('../models/Recipe');
const AppSetting = require('../models/AppSetting');
const logger = require('../utils/logger');

const seedUsers = [
  {
    name: 'Admin',
    email: 'admin@anandbazaar.com',
    phone: '+919999999999',
    password: 'Admin@123',
    roles: ['admin'],
    signupSource: 'admin',
    loginProvider: 'local',
  },
  {
    name: 'Stock Team Lead',
    email: 'stock@anandbazaar.com',
    phone: '+919999999998',
    password: 'Stock@123',
    roles: ['stock_team'],
    signupSource: 'admin',
    loginProvider: 'local',
  },
  {
    name: 'Procurement Lead',
    email: 'procurement@anandbazaar.com',
    phone: '+919999999997',
    password: 'Proc@123',
    roles: ['procurement'],
    signupSource: 'admin',
    loginProvider: 'local',
  },
  {
    name: 'Test Customer',
    email: 'customer@test.com',
    phone: '+919999999996',
    password: 'Cust@123',
    roles: ['customer'],
    signupSource: 'self',
    loginProvider: 'local',
  },
];

const seedFoodItems = [
  { name: 'Govinda Rice (Plain)', category: 'rice', description: 'Fragrant steamed basmati rice offered to Lord Jagannath', pricePerPlate: 30, unit: 'count', sortOrder: 1 },
  { name: 'Khichdi', category: 'rice', description: 'Traditional Jagannath Prasad khichdi', pricePerPlate: 25, unit: 'count', sortOrder: 2 },
  { name: 'Dal Tadka', category: 'dal', description: 'Temple-style yellow dal with divine tempering', pricePerPlate: 20, unit: 'count', sortOrder: 3 },
  { name: 'Dal Fry', category: 'dal', description: 'Rich and flavorful prasadam dal', pricePerPlate: 25, unit: 'count', sortOrder: 4 },
  { name: 'Chana Dal', category: 'dal', description: 'Hearty chana dal prepared with devotion', pricePerPlate: 25, unit: 'count', sortOrder: 5 },
  { name: 'Puri', category: 'bread', description: 'Golden deep-fried puri — a temple classic', pricePerPlate: 15, unit: 'count', sortOrder: 6 },
  { name: 'Roti', category: 'bread', description: 'Fresh handmade whole wheat roti', pricePerPlate: 10, unit: 'count', sortOrder: 7 },
  { name: 'Paratha', category: 'bread', description: 'Layered and buttery prasadam paratha', pricePerPlate: 20, unit: 'count', sortOrder: 8 },
  { name: 'Aloo Sabji', category: 'vegetable', description: 'Simple and divine potato curry', pricePerPlate: 20, unit: 'count', sortOrder: 9 },
  { name: 'Mixed Vegetable', category: 'vegetable', description: 'Seasonal vegetables cooked in temple style', pricePerPlate: 25, unit: 'count', sortOrder: 10 },
  { name: 'Paneer Butter Masala', category: 'vegetable', description: 'Rich paneer curry in tomato gravy', pricePerPlate: 40, unit: 'count', sortOrder: 11 },
  { name: 'Chole Masala', category: 'vegetable', description: 'Spicy chickpea curry', pricePerPlate: 30, unit: 'count', sortOrder: 12 },
  { name: 'Raita', category: 'condiment', description: 'Cool yogurt with cucumber and spices', pricePerPlate: 10, unit: 'count', sortOrder: 13 },
  { name: 'Papad (Roasted)', category: 'snack', description: 'Crispy roasted papad', pricePerPlate: 5, unit: 'count', sortOrder: 14 },
  { name: 'Papad (Fried)', category: 'snack', description: 'Crispy fried papad', pricePerPlate: 5, unit: 'count', sortOrder: 15 },
  { name: 'Pickle', category: 'condiment', description: 'Tangy mango or mixed pickle', pricePerPlate: 5, unit: 'count', sortOrder: 16 },
  { name: 'Chutney', category: 'condiment', description: 'Fresh temple-style green chutney', pricePerPlate: 5, unit: 'count', sortOrder: 17 },
  { name: 'Gulab Jamun', category: 'sweet', description: 'Soft milk dumplings in sugar syrup', pricePerPlate: 15, unit: 'count', sortOrder: 18 },
  { name: 'Kheer', category: 'sweet', description: 'Creamy rice pudding offered to Lord', pricePerPlate: 15, unit: 'count', sortOrder: 19 },
  { name: 'Laddu', category: 'sweet', description: 'Traditional besan or boondi laddu', pricePerPlate: 10, unit: 'count', sortOrder: 20 },
  { name: 'Salad', category: 'other', description: 'Fresh seasonal salad', pricePerPlate: 10, unit: 'count', sortOrder: 21 },
  {
    name: 'Water Bottle',
    category: 'beverage',
    description: 'Packaged drinking water',
    pricePerUnit: 20,
    unit: 'count',
    isExtra: true,
    extraOptions: {
      sizes: [
        { label: '500ml', value: '500ml', priceAddon: 0 },
        { label: '1 Liter', value: '1L', priceAddon: 10 },
      ],
    },
    sortOrder: 30,
  },
  {
    name: 'Tissue Pack',
    category: 'other',
    description: 'Tissue paper pack',
    pricePerUnit: 5,
    unit: 'count',
    isExtra: true,
    sortOrder: 31,
  },
];

const seedRawMaterials = [
  { name: 'Basmati Rice', category: 'grain', unit: 'kg', minimumStock: 10, costPerUnit: 80 },
  { name: 'Regular Rice', category: 'grain', unit: 'kg', minimumStock: 20, costPerUnit: 45 },
  { name: 'Toor Dal', category: 'grain', unit: 'kg', minimumStock: 5, costPerUnit: 120 },
  { name: 'Chana Dal', category: 'grain', unit: 'kg', minimumStock: 5, costPerUnit: 100 },
  { name: 'Moong Dal', category: 'grain', unit: 'kg', minimumStock: 3, costPerUnit: 110 },
  { name: 'Wheat Flour (Atta)', category: 'grain', unit: 'kg', minimumStock: 10, costPerUnit: 40 },
  { name: 'Maida', category: 'grain', unit: 'kg', minimumStock: 5, costPerUnit: 35 },
  { name: 'Potato', category: 'vegetable', unit: 'kg', minimumStock: 10, costPerUnit: 25 },
  { name: 'Onion', category: 'vegetable', unit: 'kg', minimumStock: 5, costPerUnit: 30 },
  { name: 'Tomato', category: 'vegetable', unit: 'kg', minimumStock: 5, costPerUnit: 35 },
  { name: 'Green Peas', category: 'vegetable', unit: 'kg', minimumStock: 2, costPerUnit: 60 },
  { name: 'Paneer', category: 'dairy', unit: 'kg', minimumStock: 2, costPerUnit: 320 },
  { name: 'Curd/Yogurt', category: 'dairy', unit: 'kg', minimumStock: 3, costPerUnit: 50 },
  { name: 'Milk', category: 'dairy', unit: 'liter', minimumStock: 5, costPerUnit: 55 },
  { name: 'Ghee', category: 'oil_ghee', unit: 'liter', minimumStock: 2, costPerUnit: 550 },
  { name: 'Mustard Oil', category: 'oil_ghee', unit: 'liter', minimumStock: 3, costPerUnit: 160 },
  { name: 'Sunflower Oil', category: 'oil_ghee', unit: 'liter', minimumStock: 5, costPerUnit: 130 },
  { name: 'Coconut', category: 'other', unit: 'count', minimumStock: 10, costPerUnit: 30 },
  { name: 'Sugar', category: 'other', unit: 'kg', minimumStock: 5, costPerUnit: 45 },
  { name: 'Salt', category: 'spice', unit: 'kg', minimumStock: 2, costPerUnit: 20 },
  { name: 'Turmeric Powder', category: 'spice', unit: 'kg', minimumStock: 1, costPerUnit: 200 },
  { name: 'Red Chilli Powder', category: 'spice', unit: 'kg', minimumStock: 1, costPerUnit: 250 },
  { name: 'Cumin Seeds', category: 'spice', unit: 'kg', minimumStock: 0.5, costPerUnit: 400 },
  { name: 'Coriander Powder', category: 'spice', unit: 'kg', minimumStock: 1, costPerUnit: 180 },
  { name: 'Garam Masala', category: 'spice', unit: 'kg', minimumStock: 0.5, costPerUnit: 450 },
  { name: 'Mustard Seeds', category: 'spice', unit: 'kg', minimumStock: 0.5, costPerUnit: 200 },
  { name: 'Chickpeas (Chole)', category: 'grain', unit: 'kg', minimumStock: 3, costPerUnit: 90 },
  { name: 'Papad', category: 'packaging', unit: 'count', minimumStock: 100, costPerUnit: 2 },
  { name: 'Water Bottles (500ml)', category: 'beverage', unit: 'count', minimumStock: 50, costPerUnit: 10 },
  { name: 'Water Bottles (1L)', category: 'beverage', unit: 'count', minimumStock: 30, costPerUnit: 15 },
  { name: 'Tissue Packs', category: 'packaging', unit: 'count', minimumStock: 50, costPerUnit: 3 },
  { name: 'Besan (Gram Flour)', category: 'grain', unit: 'kg', minimumStock: 2, costPerUnit: 80 },
  { name: 'Cucumber', category: 'vegetable', unit: 'kg', minimumStock: 2, costPerUnit: 30 },
  { name: 'Green Chilli', category: 'vegetable', unit: 'kg', minimumStock: 0.5, costPerUnit: 60 },
  { name: 'Ginger', category: 'vegetable', unit: 'kg', minimumStock: 0.5, costPerUnit: 100 },
  { name: 'Garlic', category: 'vegetable', unit: 'kg', minimumStock: 0.5, costPerUnit: 120 },
];

const seedSettings = [
  { key: 'default_price_per_plate', value: 150, description: 'Default price per plate in INR' },
  { key: 'kid_plate_ratio', value: 0.5, description: 'Kid plate ratio (0.5 = half plate)' },
  { key: 'gst_percentage', value: 0, description: 'GST percentage (0 if exempt)' },
  { key: 'org_name', value: 'AnandBazaar Jagannath Prasadam Service', description: 'Organization name' },
  { key: 'org_phone', value: '+919999999999', description: 'Organization phone' },
  { key: 'org_email', value: 'contact@anandbazaar.com', description: 'Organization email' },
  { key: 'stock_reminder_time', value: '08:00', description: 'Daily stock reminder time (HH:mm)' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anandbazaar');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      FoodItem.deleteMany({}),
      RawMaterial.deleteMany({}),
      Recipe.deleteMany({}),
      AppSetting.deleteMany({}),
    ]);
    console.log('Cleared existing seed data');

    // Seed users
    for (const userData of seedUsers) {
      await User.create(userData);
    }
    console.log(`Seeded ${seedUsers.length} users`);

    // Seed food items
    const admin = await User.findOne({ email: 'admin@anandbazaar.com' });
    for (const item of seedFoodItems) {
      await FoodItem.create({ ...item, createdBy: admin._id });
    }
    console.log(`Seeded ${seedFoodItems.length} food items`);

    // Seed raw materials
    for (const rm of seedRawMaterials) {
      await RawMaterial.create({ ...rm, currentStock: rm.minimumStock * 2, createdBy: admin._id });
    }
    console.log(`Seeded ${seedRawMaterials.length} raw materials`);

    // Seed sample recipes (mapping food items to raw materials)
    const rice = await FoodItem.findOne({ name: 'Govinda Rice (Plain)' });
    const basmati = await RawMaterial.findOne({ name: 'Basmati Rice' });
    const ghee = await RawMaterial.findOne({ name: 'Ghee' });
    const salt = await RawMaterial.findOne({ name: 'Salt' });

    if (rice && basmati) {
      await Recipe.create({ foodItem: rice._id, rawMaterial: basmati._id, quantityPerAdult: 0.15, quantityPerKid: 0.08, unit: 'kg', createdBy: admin._id });
    }
    if (rice && ghee) {
      await Recipe.create({ foodItem: rice._id, rawMaterial: ghee._id, quantityPerAdult: 0.01, quantityPerKid: 0.005, unit: 'liter', createdBy: admin._id });
    }
    if (rice && salt) {
      await Recipe.create({ foodItem: rice._id, rawMaterial: salt._id, quantityPerAdult: 0.003, quantityPerKid: 0.002, unit: 'kg', createdBy: admin._id });
    }

    const dalItem = await FoodItem.findOne({ name: 'Dal Tadka' });
    const toorDal = await RawMaterial.findOne({ name: 'Toor Dal' });
    const turmeric = await RawMaterial.findOne({ name: 'Turmeric Powder' });

    if (dalItem && toorDal) {
      await Recipe.create({ foodItem: dalItem._id, rawMaterial: toorDal._id, quantityPerAdult: 0.05, quantityPerKid: 0.03, unit: 'kg', createdBy: admin._id });
    }
    if (dalItem && turmeric) {
      await Recipe.create({ foodItem: dalItem._id, rawMaterial: turmeric._id, quantityPerAdult: 0.002, quantityPerKid: 0.001, unit: 'kg', createdBy: admin._id });
    }
    if (dalItem && ghee) {
      await Recipe.create({ foodItem: dalItem._id, rawMaterial: ghee._id, quantityPerAdult: 0.01, quantityPerKid: 0.005, unit: 'liter', createdBy: admin._id });
    }

    console.log('Seeded sample recipes');

    // Seed app settings
    for (const setting of seedSettings) {
      await AppSetting.create({ ...setting, updatedBy: admin._id });
    }
    console.log(`Seeded ${seedSettings.length} app settings`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nDefault credentials:');
    console.log('  Admin:       admin@anandbazaar.com / Admin@123');
    console.log('  Stock Team:  stock@anandbazaar.com / Stock@123');
    console.log('  Procurement: procurement@anandbazaar.com / Proc@123');
    console.log('  Customer:    customer@test.com / Cust@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
