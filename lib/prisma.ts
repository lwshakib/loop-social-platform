/**
 * Database Client Configuration
 * This file initializes and exports a singleton instance of the Prisma Client.
 * It ensures we don't create multiple database connection pools during
 * Hot Module Reloading (HMR) in development.
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

// Construct the database connection string from environment variables
const connectionString = `${process.env.DATABASE_URL}`;

/**
 * Prisma Adapter
 * Using the PG adapter to allow Prisma to communicate with our PostgreSQL database.
 */
const adapter = new PrismaPg({ connectionString });

/**
 * globalForPrisma
 * Extends the global object type to include a reference to the PrismaClient.
 * This is a standard workaround for Next.js development environments.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * prisma
 * Exports the existing client from the global scope if it exists,
 * otherwise creates a fresh one.
 */
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

/**
 * In development, we store the client on the global object.
 * This prevents the 'too many clients' error as the server restarts on every file save.
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
