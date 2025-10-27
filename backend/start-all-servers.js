const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Evalon Real-time Architecture...\n');

// Start Main Server (Port 5001)
console.log('📡 Starting Main Server (Port 5001)...');
const mainServer = spawn('node', ['src/server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

mainServer.stdout.on('data', (data) => {
  console.log(`[MAIN] ${data.toString().trim()}`);
});

mainServer.stderr.on('data', (data) => {
  console.error(`[MAIN ERROR] ${data.toString().trim()}`);
});

// Start Real-time Server (Port 5004)
setTimeout(() => {
  console.log('\n⚡ Starting Real-time Server (Port 5004)...');
  const realtimeServer = spawn('node', ['src/realtimeServer.js'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  realtimeServer.stdout.on('data', (data) => {
    console.log(`[REALTIME] ${data.toString().trim()}`);
  });

  realtimeServer.stderr.on('data', (data) => {
    console.error(`[REALTIME ERROR] ${data.toString().trim()}`);
  });
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all servers...');
  mainServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down all servers...');
  mainServer.kill('SIGTERM');
  process.exit(0);
});

console.log('\n✅ All servers starting up...');
console.log('📡 Main Server: http://localhost:5001');
console.log('⚡ Real-time Server: http://localhost:5004');
console.log('\nPress Ctrl+C to stop all servers\n');
