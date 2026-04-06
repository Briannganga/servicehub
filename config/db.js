const { Pool } = require("pg");
require("dotenv").config();

const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST);
const poolConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
      }
    : {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: Number(process.env.DB_PORT || 5432),
          ssl: isLocalHost ? false : { rejectUnauthorized: false },
      };

const pool = new Pool(poolConfig);

module.exports = pool;