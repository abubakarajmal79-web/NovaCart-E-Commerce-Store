import bcrypt from 'bcryptjs';
import { getDb } from './database.js';

export const initialProducts = [
  {
    name: 'NovaSound Pro Wireless ANC Headphones',
    description: 'Immersive sound with active noise cancellation, custom 40mm titanium drivers, plush memory foam earcups, and up to 40 hours of playtime with fast USB-C charging.',
    price: 149.99,
    category: 'Audio',
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviews_count: 84
  },
  {
    name: 'Pulse Pro Fitness & Health Smartwatch',
    description: 'Track daily activity, heart rate, blood oxygen (SpO2), sleep quality, and GPS routes with an ultra-bright AMOLED touch display and 7-day battery life.',
    price: 189.99,
    category: 'Wearables',
    stock: 18,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    reviews_count: 52
  },
  {
    name: 'AeroBook 15.6" Ultra-Slim Laptop',
    description: 'Sleek brushed aluminum body powered by Intel Core i7 processor, 16GB high-speed RAM, 512GB NVMe SSD, backlit keyboard, and full-day 12-hour battery life.',
    price: 899.99,
    category: 'Computers',
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviews_count: 37
  },
  {
    name: 'NovaTactile Mechanical Gaming Keyboard',
    description: 'Tenkeyless RGB mechanical keyboard featuring hot-swappable tactile switches, double-shot PBT keycaps, sound-dampening foam, and customizable per-key lighting.',
    price: 79.99,
    category: 'Accessories',
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviews_count: 91
  },
  {
    name: 'Precision Glide Ergonomic Wireless Mouse',
    description: 'Designed for all-day comfort with natural handshake angle, quiet click mechanisms, multi-device Bluetooth & 2.4GHz wireless pairing, and thumb scroll wheel.',
    price: 49.99,
    category: 'Accessories',
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    reviews_count: 63
  },
  {
    name: 'UltraView 27" 4K UHD IPS Designer Monitor',
    description: 'Stunning 3840x2160 resolution with 99% sRGB color accuracy, HDR400, ultra-thin bezels, ergonomic tilt/swivel stand, and single-cable 65W USB-C connectivity.',
    price: 349.99,
    category: 'Computers',
    stock: 12,
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviews_count: 29
  },
  {
    name: 'NovaBoom 360 Waterproof Bluetooth Speaker',
    description: 'Crisp 360-degree room-filling acoustic sound with dual passive bass radiators, rugged IPX7 waterproof fabric enclosure, and 24-hour non-stop battery life.',
    price: 59.99,
    category: 'Audio',
    stock: 30,
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    reviews_count: 45
  },
  {
    name: 'StreamClear 4K HDR Pro Webcam',
    description: 'Crystal clear video for streaming and professional video conferencing with autofocus glass lens, dual noise-reducing stereo microphones, and physical privacy shutter.',
    price: 89.99,
    category: 'Accessories',
    stock: 22,
    image_url: 'https://images.unsplash.com/photo-1589739900266-43b2843f4c12?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviews_count: 38
  },
  {
    name: 'MagPower 3-in-1 Fast Wireless Charging Station',
    description: 'Simultaneously fast-charge your smartphone, smartwatch, and wireless earbuds in one compact, weighted desktop charging stand with intelligent temperature control.',
    price: 44.99,
    category: 'Accessories',
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    reviews_count: 77
  },
  {
    name: 'TitanFit Slim Activity Tracker Band',
    description: 'Lightweight everyday fitness companion with continuous heart rate, sleep stage tracking, 30+ sport workout modes, 5ATM water resistance, and 14-day battery.',
    price: 69.99,
    category: 'Wearables',
    stock: 28,
    image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80',
    rating: 4.4,
    reviews_count: 31
  },
  {
    name: 'StudioCast USB Condenser Microphone Kit',
    description: 'Broadcast quality 24-bit/192kHz cardioid condenser microphone with heavy-duty boom arm, pop filter, shock mount, zero-latency headphone monitoring, and mute touch button.',
    price: 74.99,
    category: 'Audio',
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviews_count: 42
  },
  {
    name: 'Apex Comfort Ergonomic Executive Office Chair',
    description: 'High-density breathable mesh back with adjustable lumbar support, 3D padded armrests, tilt-lock recline mechanism, and heavy-duty smooth-rolling caster wheels.',
    price: 229.99,
    category: 'Home & Office',
    stock: 10,
    image_url: 'https://images.unsplash.com/photo-1580481077195-c328a37db779?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviews_count: 24
  }
];

export async function seedDatabase() {
  console.log('[Seed] Initializing SQLite database...');
  const db = await getDb();

  // Check if products already exist
  const existingProducts = await db.get('SELECT COUNT(*) as count FROM products');
  if (existingProducts.count === 0) {
    console.log('[Seed] Seeding 12 products...');
    const insertProductStmt = await db.prepare(`
      INSERT INTO products (name, description, price, category, stock, image_url, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const prod of initialProducts) {
      await insertProductStmt.run(
        prod.name,
        prod.description,
        prod.price,
        prod.category,
        prod.stock,
        prod.image_url,
        prod.rating,
        prod.reviews_count
      );
    }
    await insertProductStmt.finalize();
    console.log('[Seed] Products seeded successfully.');
  } else {
    console.log(`[Seed] Products table already contains ${existingProducts.count} items. Skipping product seeding.`);
  }

  // Check if test user exists
  const testEmail = 'test@example.com';
  const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [testEmail]);
  if (!existingUser) {
    console.log(`[Seed] Creating default test user (${testEmail})...`);
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await db.run(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `, ['Alex Johnson', testEmail, hashedPassword, 'customer']);
    console.log('[Seed] Test user created (Email: test@example.com / Password: Password123!).');
  } else {
    console.log('[Seed] Test user already exists.');
  }

  console.log('[Seed] Database initialization and verification complete.');
}

// Allow direct execution: node database/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('Seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
