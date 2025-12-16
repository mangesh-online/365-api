import { DataSource } from 'typeorm';
import { seedInitialData } from '../seed.js';

/**
 * Initialize database with tables and seed data
 * This runs on every startup to ensure database is ready
 */
export async function initDatabase(dataSource: DataSource): Promise<void> {
  console.log('🔧 Initializing database...');

  try {
    // Check if tables exist by querying a core table
    const queryRunner = dataSource.createQueryRunner();
    let tablesExist = false;
    
    try {
      await queryRunner.query('SELECT 1 FROM users LIMIT 1');
      tablesExist = true;
      console.log('✅ Database tables already exist');
    } catch (error) {
      // Tables don't exist, need to create them
      console.log('📦 Database tables not found, will create...');
    } finally {
      await queryRunner.release();
    }

    // If tables don't exist, we need to enable synchronize and reconnect
    if (!tablesExist) {
      console.log('📦 Creating database tables...');
      await dataSource.destroy();
      
      // Temporarily enable synchronize for table creation
      const tempDataSource = new DataSource({
        ...dataSource.options,
        synchronize: true,
      });
      
      await tempDataSource.initialize();
      console.log('✅ Database tables created');
      await tempDataSource.destroy();
      
      // Reconnect with original settings
      await dataSource.initialize();
    }

    // Check if seed data exists
    await checkAndSeedData(dataSource);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Check if master data exists and seed if missing
 */
async function checkAndSeedData(dataSource: DataSource): Promise<void> {
  try {
    const queryRunner = dataSource.createQueryRunner();
    
    // Check brain tools
    const brainToolsResult = await queryRunner.query('SELECT COUNT(*) as count FROM brain_tools');
    const brainToolsCount = parseInt(brainToolsResult[0]?.count || '0');

    // Check books
    const booksResult = await queryRunner.query('SELECT COUNT(*) as count FROM resource_books');
    const booksCount = parseInt(booksResult[0]?.count || '0');

    // Check templates
    const templatesResult = await queryRunner.query('SELECT COUNT(*) as count FROM resource_templates');
    const templatesCount = parseInt(templatesResult[0]?.count || '0');

    // Check sessions
    const sessionsResult = await queryRunner.query('SELECT COUNT(*) as count FROM sessions');
    const sessionsCount = parseInt(sessionsResult[0]?.count || '0');

    await queryRunner.release();

    // Seed if any core data is missing
    const needsSeeding = brainToolsCount === 0 || booksCount === 0 || templatesCount === 0 || sessionsCount === 0;
    
    if (needsSeeding) {
      console.log('🌱 Seeding master data...');
      console.log(`   Current counts: ${brainToolsCount} tools, ${booksCount} books, ${templatesCount} templates, ${sessionsCount} sessions`);
      await seedInitialData(dataSource as any);
      console.log('✅ Master data seeded successfully');
    } else {
      console.log('✅ Master data already exists');
      console.log(`   - ${brainToolsCount} brain tools`);
      console.log(`   - ${booksCount} books`);
      console.log(`   - ${templatesCount} templates`);
      console.log(`   - ${sessionsCount} sessions`);
    }
  } catch (error) {
    console.error('⚠️ Error checking/seeding data:', error);
    // Try to seed anyway
    try {
      await seedInitialData(dataSource as any);
      console.log('✅ Master data seeded');
    } catch (seedError) {
      console.error('❌ Seeding failed:', seedError);
    }
  }
}
