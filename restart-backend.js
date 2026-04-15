// Simple backend restart script for testing
const { execSync } = require('child_process');
const net = require('net');

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const client = net.connect({ port }, () => {
          client.end();
          resolve();
        });
        client.on('error', reject);
        setTimeout(() => reject(new Error('Timeout')), 1000);
      });
      return true;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function main() {
  try {
    console.log('🔄 Restarting backend server...\n');

    // Kill existing process on port 3001
    console.log('Stopping existing server...');
    try {
      if (process.platform === 'win32') {
        execSync('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :3001\') do taskkill /F /PID %a', { stdio: 'ignore' });
      } else {
        execSync('lsof -ti:3001 | xargs kill -9', { stdio: 'ignore' });
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      // Server might not be running
    }

    // Start new server
    console.log('Starting backend server...');
    const { spawn } = require('child_process');
    const serverProcess = spawn('npm', ['start'], {
      cwd: 'backend',
      detached: true,
      stdio: 'ignore'
    });
    serverProcess.unref();

    // Wait for server to be ready
    console.log('Waiting for server to start...');
    const ready = await waitForServer(3001);

    if (ready) {
      console.log('✅ Backend server restarted successfully on port 3001\n');
    } else {
      console.log('⚠️  Server started but not responding yet. Check backend.log\n');
    }

  } catch (error) {
    console.error('❌ Error restarting server:', error.message);
    process.exit(1);
  }
}

main();
