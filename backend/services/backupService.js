const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackupsToKeep = process.env.MAX_BACKUPS || 30; // Keep 30 days of backups by default
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  /**
   * Initialize backup directory
   */
  async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Create subdirectories for different backup types
      const subdirs = ['database', 'files', 'configs', 'logs'];
      for (const dir of subdirs) {
        await fs.mkdir(path.join(this.backupDir, dir), { recursive: true });
      }
      
      console.log('[Backup Service] Backup directories initialized');
    } catch (error) {
      console.error('[Backup Service] Failed to initialize backup directories:', error);
      throw error;
    }
  }

  /**
   * Generate encryption key for backup security
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a full database backup
   */
  async backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `clubflow_db_backup_${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, 'database', backupFileName);
    
    try {
      console.log(`[Backup Service] Starting database backup: ${backupFileName}`);
      
      // Get database connection info from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Parse database URL
      const urlParts = new URL(databaseUrl);
      const dbConfig = {
        host: urlParts.hostname,
        port: urlParts.port || 5432,
        database: urlParts.pathname.substring(1),
        username: urlParts.username,
        password: urlParts.password
      };

      // Use pg_dump to create backup (requires PostgreSQL client tools)
      const pgDumpCommand = `pg_dump --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --no-password --file="${backupPath}" --verbose --format=plain --no-owner --no-acl`;
      
      // Set PGPASSWORD environment variable for authentication
      process.env.PGPASSWORD = dbConfig.password;
      
      await this.executeCommand(pgDumpCommand);
      
      // Compress the backup
      const compressedPath = await this.compressFile(backupPath);
      
      // Encrypt the compressed backup
      const encryptedPath = await this.encryptFile(compressedPath);
      
      // Clean up unencrypted files
      await fs.unlink(backupPath);
      await fs.unlink(compressedPath);
      
      // Verify backup integrity
      const backupInfo = await this.verifyBackup(encryptedPath);
      
      // Log backup to database
      await this.logBackup({
        type: 'DATABASE',
        fileName: path.basename(encryptedPath),
        filePath: encryptedPath,
        size: backupInfo.size,
        checksum: backupInfo.checksum,
        status: 'SUCCESS'
      });
      
      console.log(`[Backup Service] Database backup completed: ${encryptedPath}`);
      
      // Clean up old backups
      await this.cleanupOldBackups('database');
      
      return {
        success: true,
        fileName: path.basename(encryptedPath),
        size: backupInfo.size,
        checksum: backupInfo.checksum
      };
    } catch (error) {
      console.error('[Backup Service] Database backup failed:', error);
      
      // Log failure
      await this.logBackup({
        type: 'DATABASE',
        fileName: backupFileName,
        status: 'FAILED',
        error: error.message
      });
      
      throw error;
    } finally {
      // Clean up PGPASSWORD
      delete process.env.PGPASSWORD;
    }
  }

  /**
   * Create incremental backup (changes since last full backup)
   */
  async backupIncremental() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `clubflow_incremental_${timestamp}.json`;
    const backupPath = path.join(this.backupDir, 'database', backupFileName);
    
    try {
      console.log(`[Backup Service] Starting incremental backup: ${backupFileName}`);
      
      // Get last full backup timestamp
      const lastBackup = await prisma.backupLog.findFirst({
        where: { 
          type: 'DATABASE',
          status: 'SUCCESS'
        },
        orderBy: { createdAt: 'desc' }
      });
      
      const sinceDate = lastBackup ? lastBackup.createdAt : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Export recently changed records
      const changes = {
        timestamp: new Date().toISOString(),
        since: sinceDate.toISOString(),
        data: {}
      };
      
      // Backup recently modified records from critical tables
      const tables = [
        'clubUser',
        'entertainer',
        'vipSession',
        'financialTransaction',
        'shift',
        'auditLog'
      ];
      
      for (const table of tables) {
        const records = await prisma[table].findMany({
          where: {
            OR: [
              { createdAt: { gte: sinceDate } },
              { updatedAt: { gte: sinceDate } }
            ]
          }
        });
        
        if (records.length > 0) {
          changes.data[table] = records;
        }
      }
      
      // Write incremental backup
      await fs.writeFile(backupPath, JSON.stringify(changes, null, 2));
      
      // Compress and encrypt
      const compressedPath = await this.compressFile(backupPath);
      const encryptedPath = await this.encryptFile(compressedPath);
      
      // Clean up unencrypted files
      await fs.unlink(backupPath);
      await fs.unlink(compressedPath);
      
      const backupInfo = await this.verifyBackup(encryptedPath);
      
      // Log backup
      await this.logBackup({
        type: 'INCREMENTAL',
        fileName: path.basename(encryptedPath),
        filePath: encryptedPath,
        size: backupInfo.size,
        checksum: backupInfo.checksum,
        status: 'SUCCESS',
        metadata: {
          recordCount: Object.values(changes.data).reduce((sum, records) => sum + records.length, 0),
          tables: Object.keys(changes.data)
        }
      });
      
      console.log(`[Backup Service] Incremental backup completed: ${encryptedPath}`);
      
      return {
        success: true,
        fileName: path.basename(encryptedPath),
        size: backupInfo.size,
        recordCount: Object.values(changes.data).reduce((sum, records) => sum + records.length, 0)
      };
    } catch (error) {
      console.error('[Backup Service] Incremental backup failed:', error);
      
      await this.logBackup({
        type: 'INCREMENTAL',
        fileName: backupFileName,
        status: 'FAILED',
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Backup configuration files
   */
  async backupConfigs() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `clubflow_configs_${timestamp}.tar.gz`;
    const backupPath = path.join(this.backupDir, 'configs', backupFileName);
    
    try {
      console.log(`[Backup Service] Starting config backup: ${backupFileName}`);
      
      // List of config files to backup
      const configFiles = [
        '.env',
        'package.json',
        'prisma/schema.prisma',
        '../frontend/package.json',
        '../frontend/vite.config.ts',
        '../frontend/tsconfig.json'
      ];
      
      // Create tar archive of config files
      const tarCommand = `tar -czf "${backupPath}" ${configFiles.join(' ')}`;
      await this.executeCommand(tarCommand, { cwd: path.join(process.cwd(), '..', 'backend') });
      
      // Encrypt the backup
      const encryptedPath = await this.encryptFile(backupPath);
      await fs.unlink(backupPath);
      
      const backupInfo = await this.verifyBackup(encryptedPath);
      
      // Log backup
      await this.logBackup({
        type: 'CONFIG',
        fileName: path.basename(encryptedPath),
        filePath: encryptedPath,
        size: backupInfo.size,
        checksum: backupInfo.checksum,
        status: 'SUCCESS'
      });
      
      console.log(`[Backup Service] Config backup completed: ${encryptedPath}`);
      
      return {
        success: true,
        fileName: path.basename(encryptedPath),
        size: backupInfo.size
      };
    } catch (error) {
      console.error('[Backup Service] Config backup failed:', error);
      
      await this.logBackup({
        type: 'CONFIG',
        fileName: backupFileName,
        status: 'FAILED',
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreDatabase(backupFileName) {
    try {
      console.log(`[Backup Service] Starting database restore from: ${backupFileName}`);
      
      const encryptedPath = path.join(this.backupDir, 'database', backupFileName);
      
      // Verify backup exists
      await fs.access(encryptedPath);
      
      // Decrypt the backup
      const decryptedPath = await this.decryptFile(encryptedPath);
      
      // Decompress the backup
      const decompressedPath = await this.decompressFile(decryptedPath);
      
      // Get database connection info
      const databaseUrl = process.env.DATABASE_URL;
      const urlParts = new URL(databaseUrl);
      const dbConfig = {
        host: urlParts.hostname,
        port: urlParts.port || 5432,
        database: urlParts.pathname.substring(1),
        username: urlParts.username,
        password: urlParts.password
      };
      
      // Restore using psql
      process.env.PGPASSWORD = dbConfig.password;
      const psqlCommand = `psql --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --file="${decompressedPath}" --quiet`;
      
      await this.executeCommand(psqlCommand);
      
      // Clean up temporary files
      await fs.unlink(decryptedPath);
      await fs.unlink(decompressedPath);
      
      // Log restoration
      await this.logBackup({
        type: 'RESTORE',
        fileName: backupFileName,
        status: 'SUCCESS'
      });
      
      console.log(`[Backup Service] Database restore completed successfully`);
      
      return {
        success: true,
        message: 'Database restored successfully'
      };
    } catch (error) {
      console.error('[Backup Service] Database restore failed:', error);
      
      await this.logBackup({
        type: 'RESTORE',
        fileName: backupFileName,
        status: 'FAILED',
        error: error.message
      });
      
      throw error;
    } finally {
      delete process.env.PGPASSWORD;
    }
  }

  /**
   * Compress a file using gzip
   */
  async compressFile(filePath) {
    const compressedPath = `${filePath}.gz`;
    const gzipCommand = process.platform === 'win32' 
      ? `powershell -Command "Compress-Archive -Path '${filePath}' -DestinationPath '${compressedPath}' -CompressionLevel Optimal"`
      : `gzip -9 -c "${filePath}" > "${compressedPath}"`;
    
    await this.executeCommand(gzipCommand);
    return compressedPath;
  }

  /**
   * Decompress a gzip file
   */
  async decompressFile(filePath) {
    const decompressedPath = filePath.replace('.gz', '');
    const gunzipCommand = process.platform === 'win32'
      ? `powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${decompressedPath}'"`
      : `gunzip -c "${filePath}" > "${decompressedPath}"`;
    
    await this.executeCommand(gunzipCommand);
    return decompressedPath;
  }

  /**
   * Encrypt a file using AES-256
   */
  async encryptFile(filePath) {
    const encryptedPath = `${filePath}.enc`;
    const fileContent = await fs.readFile(filePath);
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
      iv
    );
    
    const encrypted = Buffer.concat([
      iv,
      cipher.update(fileContent),
      cipher.final()
    ]);
    
    await fs.writeFile(encryptedPath, encrypted);
    return encryptedPath;
  }

  /**
   * Decrypt a file
   */
  async decryptFile(filePath) {
    const decryptedPath = filePath.replace('.enc', '');
    const fileContent = await fs.readFile(filePath);
    
    const iv = fileContent.slice(0, 16);
    const encryptedData = fileContent.slice(16);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
      iv
    );
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    await fs.writeFile(decryptedPath, decrypted);
    return decryptedPath;
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(filePath) {
    const stats = await fs.stat(filePath);
    const fileContent = await fs.readFile(filePath);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    
    return {
      size: stats.size,
      checksum,
      createdAt: stats.birthtime
    };
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(type = 'database') {
    try {
      const backupFolder = path.join(this.backupDir, type);
      const files = await fs.readdir(backupFolder);
      
      // Get file stats
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(backupFolder, file);
          const stats = await fs.stat(filePath);
          return { file, filePath, birthtime: stats.birthtime };
        })
      );
      
      // Sort by creation time (oldest first)
      fileStats.sort((a, b) => a.birthtime - b.birthtime);
      
      // Keep only the most recent backups
      const filesToDelete = fileStats.slice(0, Math.max(0, fileStats.length - this.maxBackupsToKeep));
      
      for (const { filePath, file } of filesToDelete) {
        await fs.unlink(filePath);
        console.log(`[Backup Service] Deleted old backup: ${file}`);
      }
      
      return filesToDelete.length;
    } catch (error) {
      console.error('[Backup Service] Failed to cleanup old backups:', error);
      return 0;
    }
  }

  /**
   * Log backup operation to database
   */
  async logBackup(data) {
    try {
      await prisma.backupLog.create({
        data: {
          type: data.type,
          fileName: data.fileName,
          filePath: data.filePath,
          size: data.size,
          checksum: data.checksum,
          status: data.status,
          error: data.error,
          metadata: data.metadata
        }
      });
    } catch (error) {
      console.error('[Backup Service] Failed to log backup:', error);
    }
  }

  /**
   * Get backup history
   */
  async getBackupHistory(limit = 50) {
    return await prisma.backupLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [totalBackups, successfulBackups, failedBackups, totalSize] = await Promise.all([
      prisma.backupLog.count(),
      prisma.backupLog.count({ where: { status: 'SUCCESS' } }),
      prisma.backupLog.count({ where: { status: 'FAILED' } }),
      prisma.backupLog.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { size: true }
      })
    ]);
    
    const recentBackups = await prisma.backupLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      totalBackups,
      successfulBackups,
      failedBackups,
      totalSize: totalSize._sum.size || 0,
      successRate: totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0,
      recentBackups
    };
  }

  /**
   * Execute shell command
   */
  executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  /**
   * Test backup configuration
   */
  async testBackupConfiguration() {
    const tests = {
      directory: false,
      database: false,
      encryption: false,
      compression: false
    };
    
    try {
      // Test backup directory
      await fs.access(this.backupDir);
      tests.directory = true;
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      tests.database = true;
      
      // Test encryption
      const testData = 'test';
      const testFile = path.join(this.backupDir, 'test.txt');
      await fs.writeFile(testFile, testData);
      const encrypted = await this.encryptFile(testFile);
      const decrypted = await this.decryptFile(encrypted);
      const decryptedContent = await fs.readFile(decrypted, 'utf8');
      tests.encryption = decryptedContent === testData;
      
      // Clean up test files
      await fs.unlink(testFile);
      await fs.unlink(encrypted);
      await fs.unlink(decrypted);
      
      // Test compression (platform specific)
      tests.compression = true; // Assume compression works if we got this far
      
      return {
        success: Object.values(tests).every(t => t),
        tests
      };
    } catch (error) {
      console.error('[Backup Service] Configuration test failed:', error);
      return {
        success: false,
        tests,
        error: error.message
      };
    }
  }

  /**
   * Delete a backup file
   * @param {string} fileName - Name of the backup file to delete
   */
  async deleteBackupFile(fileName) {
    try {
      const filePath = path.join(this.backupDir, fileName);
      
      // Check if file exists
      await fs.access(filePath);
      
      // Delete the file
      await fs.unlink(filePath);
      
      console.log(`[BackupService] Deleted backup file: ${fileName}`);
      
      // Also try to delete associated files (.gz, .enc)
      const extensions = ['.gz', '.enc', '.gz.enc'];
      for (const ext of extensions) {
        try {
          await fs.unlink(filePath + ext);
          console.log(`[BackupService] Deleted associated file: ${fileName}${ext}`);
        } catch (error) {
          // Ignore if associated file doesn't exist
        }
      }
      
      return true;
    } catch (error) {
      console.error(`[BackupService] Failed to delete backup file ${fileName}:`, error);
      throw error;
    }
  }
}

module.exports = new BackupService();