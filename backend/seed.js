require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const env = require('./env');
const {
  User, SellerProfile, BuyerProfile, Listing, Requirement, Bid, Order, Transaction
} = require('../models');
const trustScoreService = require('../services/trustScoreService');

const CROPS = ['Wheat', 'Basmati Rice', 'Tomato', 'Onion', 'Potato', 'Sugarcane', 'Cotton', 'Mustard', 'Maize', 'Turmeric'];
const DISTRICTS = [
  { village: 'Rampur', district: 'Bardhaman', state: 'West Bengal' },
  { village: 'Ganeshpur', district: 'Nadia', state: 'West Bengal' },
  { village: 'Kalyanpur', district: 'Muzaffarpur', state: 'Bihar' },
  { village: 'Devipur', district: 'Ludhiana', state: 'Punjab' },
  { village: 'Shivnagar', district: 'Nashik', state: 'Maharashtra' }
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysFromNow(n) { return new Date(Date.now() + n * 24 * 60 * 60 * 1000); }

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}), SellerProfile.deleteMany({}), BuyerProfile.deleteMany({}),
    Listing.deleteMany({}), Requirement.deleteMany({}), Bid.deleteMany({}),
    Order.deleteMany({}), Transaction.deleteMany({})
  ]);
}

async function createFarmer(index, verificationStatus) {
  const loc = pick(DISTRICTS);
  const user = await User.create({
    name: `Farmer ${index}`,
    phone: `+9170000000${String(index).padStart(2, '0')}`,
    role: 'seller',
    language: pick(['hi', 'en', 'bn']),
    isPhoneVerified: true
  });

  const profile = await SellerProfile.create({
    user: user._id,
    farmName: `${loc.village} Farms`,
    location: loc,
    verification: {
      enamId: verificationStatus === 'verified' ? `ENAM${1000 + index}` : undefined,
      farmerRegistrationNumber: verificationStatus !== 'unsubmitted' ? `FRN${2000 + index}` : undefined,
      status: verificationStatus,
      submittedAt: verificationStatus !== 'unsubmitted' ? new Date() : undefined,
      reviewedAt: verificationStatus === 'verified' || verificationStatus === 'rejected' ? new Date() : undefined
    },
    reviewCount: randInt(0, 15),
    reviewAverage: Math.round((3 + Math.random() * 2) * 10) / 10
  });

  return { user, profile };
}

async function createBuyer(index) {
  const user = await User.create({
    name: `Buyer ${index}`,
    phone: `+9180000000${String(index).padStart(2, '0')}`,
    role: 'buyer',
    language: pick(['hi', 'en', 'bn']),
    isPhoneVerified: true
  });

  await BuyerProfile.create({
    user: user._id,
    businessName: `${user.name} Trading Co.`,
    businessType: pick(['trader', 'distributor', 'retailer']),
    location: { city: pick(DISTRICTS).district, state: pick(DISTRICTS).state }
  });

  return user;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('[seed] connected to', env.mongoUri);

  await clearCollections();
  console.log('[seed] cleared existing collections');

  // Admin
  const adminPasswordHash = await bcrypt.hash('Admin@12345', env.bcryptSaltRounds);
  await User.create({
    name: 'Kisaan Setu Admin',
    phone: '+919999999999',
    email: 'admin@kisaansetu.dev',
    passwordHash: adminPasswordHash,
    role: 'admin',
    isPhoneVerified: true
  });
  console.log('[seed] admin created (admin@kisaansetu.dev / Admin@12345)');

  // Farmers with varying verification/trust levels
  const farmers = [];
  const statuses = ['verified', 'verified', 'pending', 'unsubmitted', 'rejected'];
  for (let i = 1; i <= 5; i += 1) {
    farmers.push(await createFarmer(i, statuses[i - 1]));
  }
  console.log(`[seed] created ${farmers.length} farmers`);

  // Buyers
  const buyers = [];
  for (let i = 1; i <= 3; i += 1) {
    buyers.push(await createBuyer(i));
  }
  console.log(`[seed] created ${buyers.length} buyers`);

  // 10+ listings across crops
  const listings = [];
  for (let i = 0; i < 12; i += 1) {
    const farmer = pick(farmers);
    const listing = await Listing.create({
      seller: farmer.user._id,
      crop: pick(CROPS),
      quantity: randInt(50, 500),
      unit: pick(['kg', 'quintal', 'bag']),
      qualityGrade: pick(['A', 'B', 'C']),
      harvestDate: daysFromNow(-randInt(1, 30)),
      pricePerUnit: randInt(15, 60),
      description: 'Freshly harvested, sorted and ready for dispatch within 48 hours of order confirmation.',
      photos: [],
      location: farmer.profile.location,
      status: 'active'
    });
    listings.push(listing);
  }
  console.log(`[seed] created ${listings.length} listings`);

  // 3+ requirement posts with bids
  for (let i = 0; i < 3; i += 1) {
    const buyer = pick(buyers);
    const requirement = await Requirement.create({
      buyer: buyer._id,
      crop: pick(CROPS),
      quantityNeeded: randInt(200, 1000),
      unit: pick(['kg', 'quintal', 'ton']),
      targetPricePerUnit: randInt(15, 50),
      deliveryLocation: { district: pick(DISTRICTS).district, state: pick(DISTRICTS).state, pincode: '700001' },
      deliveryDate: daysFromNow(randInt(5, 20)),
      notes: 'Looking for consistent supply with quality grade A or B preferred.',
      status: 'open'
    });

    const biddingFarmers = [farmers[0], farmers[1], farmers[2]];
    for (const farmer of biddingFarmers) {
      await Bid.create({
        requirement: requirement._id,
        seller: farmer.user._id,
        price: requirement.targetPricePerUnit + randInt(-3, 3),
        quantity: requirement.quantityNeeded,
        deliveryDate: requirement.deliveryDate,
        message: 'Happy to fulfil this order with grade A produce.',
        status: 'pending'
      });
    }
  }
  console.log('[seed] created 3 requirements with bids');

  // 2+ completed orders/receipts
  for (let i = 0; i < 2; i += 1) {
    const farmer = farmers[i];
    const buyer = buyers[i % buyers.length];
    const listing = listings[i];
    const totalAmount = Math.round(listing.pricePerUnit * 20 * 100) / 100;

    const order = await Order.create({
      buyer: buyer._id,
      seller: farmer.user._id,
      sourceType: 'direct_listing',
      listing: listing._id,
      crop: listing.crop,
      quantity: 20,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      totalAmount,
      deliveryLocation: { district: farmer.profile.location.district, state: farmer.profile.location.state, pincode: '700001' },
      status: 'completed',
      razorpay: {
        orderId: `order_seed_${i}`,
        paymentId: `pay_seed_${i}`,
        signature: 'seed_signature',
        verifiedAt: new Date()
      },
      receiptNumber: `KS-SEED${i}-00001`,
      completedAt: new Date()
    });

    await SellerProfile.findOneAndUpdate(
      { user: farmer.user._id },
      { $inc: { totalSalesValue: totalAmount, completedOrderCount: 1 } }
    );
    await Transaction.create({
      order: order._id,
      buyer: buyer._id,
      seller: farmer.user._id,
      orderAmount: totalAmount,
      commissionPercent: env.defaultCommissionPercent,
      commissionAmount: Math.round((totalAmount * env.defaultCommissionPercent) / 100 * 100) / 100,
      netToSeller: Math.round((totalAmount - (totalAmount * env.defaultCommissionPercent) / 100) * 100) / 100
    });
  }
  console.log('[seed] created 2 completed orders with receipts and ledger entries');

  // Recalculate trust scores for every farmer now that data exists
  for (const farmer of farmers) {
    await trustScoreService.recalculate(farmer.user._id);
  }
  console.log('[seed] recalculated trust scores for all farmers');

  console.log('[seed] done.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});