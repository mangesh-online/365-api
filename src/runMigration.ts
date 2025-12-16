import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './database.js';

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Running migration...');

    const queryRunner = AppDataSource.createQueryRunner();

    // Brain Tools table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS brain_tools (
        id VARCHAR(36) PRIMARY KEY,
        toolId VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        level VARCHAR(50) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        science TEXT NOT NULL,
        icon VARCHAR(100) NOT NULL,
        color VARCHAR(100) NOT NULL,
        config JSON,
        isActive BOOLEAN DEFAULT TRUE,
        usageCount INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_brain_tools_category (category),
        INDEX idx_brain_tools_level (level)
      )
    `);
    console.log('✅ brain_tools table created');

    // Tool Progress table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tool_progress (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        toolId VARCHAR(36) NOT NULL,
        completionCount INT DEFAULT 0,
        totalMinutes INT DEFAULT 0,
        lastUsedAt TIMESTAMP,
        currentStreak INT DEFAULT 0,
        longestStreak INT DEFAULT 0,
        isMastered BOOLEAN DEFAULT FALSE,
        sessionData JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tool_progress_user_tool (userId, toolId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (toolId) REFERENCES brain_tools(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ tool_progress table created');

    // Resource Books table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS resource_books (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        rating DECIMAL(2,1) DEFAULT 0,
        emoji VARCHAR(20) NOT NULL,
        pages INT NOT NULL,
        readTime VARCHAR(50) NOT NULL,
        tags JSON NOT NULL,
        coverImage VARCHAR(500),
        purchaseLink VARCHAR(500),
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_resource_books_category (category)
      )
    `);
    console.log('✅ resource_books table created');

    // User Book Progress table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_book_progress (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        bookId VARCHAR(36) NOT NULL,
        status ENUM('not-started', 'reading', 'completed') DEFAULT 'not-started',
        currentPage INT DEFAULT 0,
        progressPercent DECIMAL(5,2) DEFAULT 0,
        startedAt TIMESTAMP,
        completedAt TIMESTAMP,
        notes TEXT,
        userRating INT,
        isFavorite BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_book_progress_user_book (userId, bookId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bookId) REFERENCES resource_books(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ user_book_progress table created');

    // Resource Templates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS resource_templates (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        format VARCHAR(50) NOT NULL,
        downloadUrl VARCHAR(500) NOT NULL,
        previewImage VARCHAR(500),
        downloadCount INT DEFAULT 0,
        features JSON NOT NULL,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_resource_templates_category (category)
      )
    `);
    console.log('✅ resource_templates table created');

    // Resource Media table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS resource_media (
        id VARCHAR(36) PRIMARY KEY,
        mediaType ENUM('audio', 'video') NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        mediaUrl VARCHAR(500) NOT NULL,
        thumbnailUrl VARCHAR(500),
        duration VARCHAR(50) NOT NULL,
        instructor VARCHAR(255),
        viewCount INT DEFAULT 0,
        playCount INT DEFAULT 0,
        rating DECIMAL(2,1) DEFAULT 0,
        tags JSON,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_resource_media_type (mediaType),
        INDEX idx_resource_media_category (category)
      )
    `);
    console.log('✅ resource_media table created');

    // User Favorites table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        resourceType ENUM('tool', 'book', 'course', 'template', 'audio', 'video') NOT NULL,
        resourceId VARCHAR(36) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_resource (userId, resourceType, resourceId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ user_favorites table created');

    await queryRunner.release();

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
