const pool = require('./config/db');

async function setupDatabase() {
    try {
        console.log('Setting up database tables...');

        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'provider')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✓ users table ready');

        // Services table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✓ services table ready');

        // Bookings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
                booking_date TIMESTAMPTZ,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✓ bookings table ready');

        // Messages table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                sent_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✓ messages table ready');

        // Reviews table (already in server.js, but adding here for completeness)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✓ reviews table ready');

        console.log('Database setup complete!');
    } catch (err) {
        console.error('Database setup failed:', err);
        throw err;
    }
}

// Run setup if called directly
if (require.main === module) {
    setupDatabase()
        .then(() => pool.end())
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = setupDatabase;