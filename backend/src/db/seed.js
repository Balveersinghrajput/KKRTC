import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
const email = process.env.SEED_EMAIL.toLowerCase();
const hash = await bcrypt.hash(process.env.SEED_PASSWORD, 12);
await pool.query(
  `INSERT INTO users (email, password_hash, name, role, depot_code)
   VALUES ($1,$2,'Arjun Singh','admin','HBD')
   ON CONFLICT (lower(email)) DO NOTHING`,
  [email, hash]);
console.log('seed done for', email);
await pool.end();
