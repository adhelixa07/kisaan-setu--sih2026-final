const { memory } = require('../data/store');
const { User, Farmer, Product, Listing, Session } = require('../../models');
const connectDB = require('../config/db');

function sanitizeUser(input) {
  const passwordHash = input.passwordHash || (input.password ? `hash:${input.password}` : 'demo-password-hash');
  return {
    name: input.name,
    phone: input.phone,
    email: input.email,
    passwordHash,
    role: input.role || 'farmer',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function verifyPasswordFromStoredHash(storedHash, plainPassword) {
  if (!storedHash || !plainPassword) return false;
  if (storedHash === 'demo-password-hash') return false;
  if (storedHash.startsWith('hash:')) {
    return storedHash === `hash:${plainPassword}`;
  }
  return false;
}

async function createLoginSession({ emailOrPhone, password, ipAddress = '', userAgent = '' }) {
  try {
    await connectDB();
    if (User && User.findOne && Session && Session.create) {
      const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
      if (!user) {
        return { ok: false, message: 'Invalid credentials' };
      }

      if (!verifyPasswordFromStoredHash(user.passwordHash, password)) {
        return { ok: false, message: 'Invalid credentials' };
      }

      const session = await Session.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: `ks_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      });

      return {
        ok: true,
        user: user.toSafeObject ? user.toSafeObject() : user.toObject(),
        session: { id: session._id, token: session.token, expiresAt: session.expiresAt }
      };
    }
  } catch (error) {
    console.warn('[db] login fallback to memory store', error.message);
  }

  const user = memory.users.find((u) => (u.email === emailOrPhone || u.phone === emailOrPhone || u.name === emailOrPhone) && verifyPasswordFromStoredHash(u.passwordHash, password));
  if (!user) {
    return { ok: false, message: 'Invalid credentials' };
  }

  const token = `ks_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const session = {
    id: `session_${Date.now()}_${Math.round(Math.random() * 10000)}`,
    token,
    userId: user.phone,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    ipAddress,
    userAgent
  };
  memory.sessions.push(session);

  return { ok: true, user: { ...user, passwordHash: undefined }, session: { id: session.id, token, expiresAt: session.expiresAt } };
}

async function createUserFromRegistration(input) {
  const existingInMemory = memory.users.find((u) => u.phone === input.phone || u.email === input.email);
  if (existingInMemory) {
    return { ok: false, message: 'User already exists', user: existingInMemory };
  }

  try {
    await connectDB();
    if (User && User.findOne) {
      const exists = await User.findOne({ $or: [{ phone: input.phone }, { email: input.email }] });
      if (exists) {
        return { ok: false, message: 'User already exists', user: exists.toSafeObject ? exists.toSafeObject() : exists.toObject() };
      }

      const passwordHash = input.passwordHash || (input.password ? `hash:${input.password}` : 'demo-password-hash');
      const user = await User.create({
        name: input.name,
        phone: input.phone,
        email: input.email,
        passwordHash,
        role: input.role || 'farmer',
        status: 'pending'
      });

      if ((input.role || 'farmer') === 'farmer') {
        await Farmer.create({
          userId: user._id,
          farmName: input.farmName || user.name,
          village: input.village || '',
          district: input.district || '',
          state: input.state || '',
          verificationStatus: 'pending',
          farmerCode: `KS-FARM-${Date.now().toString().slice(-6)}`
        });
      }

      return { ok: true, user: user.toSafeObject ? user.toSafeObject() : user.toObject() };
    }
  } catch (error) {
    console.warn('[db] User persistence fallback to memory store', error.message);
  }

  const user = sanitizeUser(input);
  memory.users.push(user);

  if (input.role === 'farmer') {
    const farmer = {
      userId: user.phone,
      name: user.name,
      phone: user.phone,
      email: user.email,
      village: input.village || '',
      state: input.state || '',
      district: input.district || '',
      verificationStatus: 'pending',
      enamId: input.enamId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memory.farmers.push(farmer);
  }

  return { ok: true, user };
}

async function createListingFromFarm(input) {
  try {
    await connectDB();
    if (Product && Listing && Product.create && Listing.create && User && User.findOne) {
      const seller = await User.findOne({ $or: [{ phone: input.phone }, { email: input.email }, { name: input.name }] }).catch(() => null);
      const sellerId = seller ? seller._id : undefined;

      const product = await Product.create({
        farmerId: sellerId || input.farmerId || input.userId || undefined,
        name: input.crop,
        category: input.category || input.crop,
        variety: input.variety || input.crop,
        quantity: Number(input.quantity || 0),
        unit: input.unit || 'kg',
        pricePerUnit: Number(input.price || 0),
        qualityGrade: input.quality || 'A',
        harvestDate: input.harvest || new Date().toISOString(),
        location: {
          village: input.location || '',
          district: '',
          state: '',
          pincode: ''
        },
        status: 'available'
      });

      const listing = await Listing.create({
        productId: product._id,
        sellerId: sellerId || input.farmerId || input.userId || product.farmerId,
        marketId: undefined,
        quantity: Number(input.quantity || 0),
        minimumPrice: Number(input.price || 0),
        askingPrice: Number(input.price || 0),
        status: 'active'
      });

      return { ok: true, product, listing };
    }
  } catch (error) {
    console.warn('[db] Listing persistence fallback to memory store', error.message);
  }

  const product = {
    _id: `product_${Date.now()}_${Math.round(Math.random() * 10000)}`,
    farmerId: input.farmerId || input.userId || 'demo-farmer',
    name: input.crop,
    category: input.category || input.crop,
    variety: input.variety || input.crop,
    quantity: Number(input.quantity || 0),
    unit: input.unit || 'kg',
    pricePerUnit: Number(input.price || 0),
    qualityGrade: input.quality || 'A',
    harvestDate: input.harvest || new Date().toISOString(),
    location: { village: input.location || '', district: '', state: '', pincode: '' },
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const listing = {
    _id: `listing_${Date.now()}_${Math.round(Math.random() * 10000)}`,
    productId: product._id,
    sellerId: input.farmerId || input.userId || 'demo-farmer',
    marketId: null,
    quantity: Number(input.quantity || 0),
    minimumPrice: Number(input.price || 0),
    askingPrice: Number(input.price || 0),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  memory.products.push(product);
  memory.listings.push(listing);

  return { ok: true, product, listing };
}

module.exports = {
  createUserFromRegistration,
  createListingFromFarm,
  sanitizeUser,
  verifyPasswordFromStoredHash,
  createLoginSession
};
