# Port Conflict Handling

The AI Face Detection Service includes automatic port conflict handling to prevent "Address already in use" errors.

## How It Works

1. **Automatic Port Detection**: The service tries to bind to ports starting from 5002
2. **Port Scanning**: If port 5002 is occupied, it automatically tries ports 5003, 5004, etc. (up to 5012)
3. **Frontend Auto-Discovery**: The frontend service automatically detects which port the Python service is running on
4. **Clean Startup**: The startup script kills any existing processes to ensure a clean start

## Features

### ✅ Automatic Port Selection
- Tries default port (5002) first
- Falls back to next available port if needed
- Logs warning if using alternative port

### ✅ Frontend Auto-Discovery
- Frontend automatically scans ports 5002-5012
- Connects to whichever port has the service running
- No manual configuration needed

### ✅ Clean Startup Script
- Kills existing processes on ports 5002-5012
- Prevents zombie processes
- Ensures clean service restart

## Usage Examples

### Starting with Default Port (5002)
```bash
cd python
./start_service.sh
```

Output:
```
🔍 Starting AI Face Detection Service...
✅ Activating virtual environment...
🚀 Starting Face Detection Service...
INFO:__main__:Starting Face Detection Service on port 5002
```

### Auto-Fallback When Port 5002 is Busy
```bash
cd python
./start_service.sh
```

Output:
```
🔍 Starting AI Face Detection Service...
⚠️  Killing existing process on port 5002 (PID: 12345)
✅ Activating virtual environment...
🚀 Starting Face Detection Service...
INFO:__main__:Port 5002 was in use, using port 5003 instead
INFO:__main__:Service URL: http://localhost:5003
```

### Frontend Auto-Discovery
The frontend will automatically detect and connect to whichever port is available:

```javascript
// Automatically tries ports 5002-5012
const port = await AIProctoringService.initialize();
console.log(`AI Service found on port ${port}`);
```

## Environment Variables

You can still specify a custom port using the `PORT` environment variable:

```bash
PORT=6000 python face_detection_service.py
```

The service will still look for available ports starting from the specified one.

## Troubleshooting

### Port Still in Use
If you see "Address already in use" after trying all ports:
1. Manually kill the process: `lsof -ti:5002 | xargs kill -9`
2. Or use the startup script: `./start_service.sh`

### Frontend Can't Connect
1. Make sure the Python service is running
2. Check if service is on port 5002-5012
3. Check browser console for connection errors
4. Verify firewall isn't blocking connections

### Multiple Ports in Use
If multiple instances are running:
```bash
# Kill all processes on ports 5002-5012
for port in {5002..5012}; do
    lsof -ti:$port | xargs kill -9
done
```

Then restart with: `./start_service.sh`
