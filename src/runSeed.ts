import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './database.js';
import { seedBrainToolsData } from './seedBrainTools.js';

async function runSeed() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Seeding brain tools and resources...');
    await seedBrainToolsData();
    console.log('✅ Seeding completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
