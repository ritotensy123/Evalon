# Real-time WebSocket System Guide

## Overview

This guide explains the new real-time WebSocket system that provides instant, real-time monitoring and exam functionality without any delays or polling intervals.

## Architecture

The system consists of:

1. **Real-time Server** (`realtimeServer.js`) - Centralized WebSocket server on port 5004
2. **Real-time Data Store** - In-memory temporary storage for instant data access
3. **Frontend Service** (`realtimeSocketService.js`) - Client-side WebSocket service
4. **React Components** - Real-time monitoring and exam components

## Key Features

### ⚡ Real-time Data Flow
- All monitoring data flows through a temporary storage layer
- Instant updates when teachers enter monitoring rooms
- Instant updates when students join/leave exams
- No polling or delays - everything is real-time

### 🔄 Automatic Synchronization
- Student actions are immediately broadcast to monitoring teachers
- Teacher monitoring updates are instantly reflected
- Heartbeat system ensures connection stability
- Automatic reconnection on connection loss

### 📊 Live Statistics
- Real-time student count and status
- Live progress tracking
- Instant time remaining updates
- Connection status monitoring

## Server Setup

### 1. Start the Real-time Server

```bash
# Start only the real-time server
npm run start:realtime

# Or start all servers (including real-time)
npm run start:all
```

The real-time server will run on port 5004.

### 2. Environment Variables

Add to your `.env` file:

```env
REALTIME_PORT=5004
FRONTEND_URL=http://localhost:3001
```

## Frontend Integration

### 1. Import the Service

```javascript
import realtimeSocketService from '../services/realtimeSocketService';
```

### 2. Connect to Real-time Server

```javascript
// Connect with user token
const socket = realtimeSocketService.connect(userToken);

// Start heartbeat
realtimeSocketService.startHeartbeat();
```

### 3. Student Exam Usage

```javascript
import RealtimeStudentExam from '../components/exam/RealtimeStudentExam';

// In your component
<RealtimeStudentExam
  examId={examId}
  examData={examData}
  onExamComplete={(result) => {
    console.log('Exam completed:', result);
  }}
/>
```

### 4. Teacher Monitoring Usage

```javascript
import RealtimeExamMonitor from '../components/exam/RealtimeExamMonitor';

// In your component
<RealtimeExamMonitor
  examId={examId}
  examTitle={examTitle}
/>
```

## API Reference

### Student Methods

#### `joinExamSession(examId, sessionId, deviceInfo, networkInfo)`
Joins an exam session with device and network information.

#### `submitAnswer(questionId, answer, timeSpent)`
Submits an answer for a specific question.

#### `endExam(submissionType, finalScore)`
Ends the exam with submission type and final score.

### Teacher Methods

#### `joinMonitoring(examId)`
Joins the monitoring room for a specific exam.

#### `leaveMonitoring(examId)`
Leaves the monitoring room.

### Event Listeners

#### Student Events
- `onExamSessionJoined(callback)` - When student joins exam session
- `onAnswerSubmitted(callback)` - When answer is submitted
- `onExamEnded(callback)` - When exam ends
- `onTimeUpdate(callback)` - When time remaining updates
- `onExamError(callback)` - When exam error occurs

#### Teacher Events
- `onMonitoringJoined(callback)` - When teacher joins monitoring
- `onStudentJoined(callback)` - When student joins exam
- `onStudentDisconnected(callback)` - When student disconnects
- `onProgressUpdate(callback)` - When student progress updates
- `onTimeUpdate(callback)` - When time remaining updates
- `onExamEnded(callback)` - When exam ends

## Real-time Data Store

The system uses an in-memory data store that maintains:

- **Exam Sessions**: Map of examId -> sessionId -> sessionData
- **Monitoring Rooms**: Map of examId -> Set of socketIds
- **Active Connections**: Map of socketId -> connectionInfo
- **Heartbeats**: Map of socketId -> lastHeartbeat

### Data Flow

1. **Student joins exam** → Data stored in temp store → Broadcast to monitoring teachers
2. **Student submits answer** → Update temp store → Broadcast progress update
3. **Teacher joins monitoring** → Get current sessions from temp store
4. **Time updates** → Update temp store → Broadcast to all connected clients

## Testing

### 1. Run the Test Script

```bash
cd backend
node test-realtime-websocket.js
```

### 2. Manual Testing

1. Start the real-time server: `npm run start:realtime`
2. Open multiple browser tabs
3. Login as teacher in one tab, student in another
4. Start monitoring in teacher tab
5. Join exam in student tab
6. Observe real-time updates

## Health Monitoring

### Health Check Endpoint

```bash
curl http://localhost:5004/health
```

### Stats Endpoint

```bash
curl http://localhost:5004/api/stats
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if real-time server is running on port 5004
   - Verify JWT token is valid
   - Check CORS settings

2. **No Real-time Updates**
   - Ensure both teacher and student are connected
   - Check if monitoring room is joined
   - Verify exam session is active

3. **Authentication Errors**
   - Token may be expired
   - User type may not be authorized
   - Check JWT secret configuration

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=socket.io:*
```

## Performance Considerations

- **Memory Usage**: Data store is in-memory, monitor for large numbers of concurrent sessions
- **Connection Limits**: Monitor active connections and implement limits if needed
- **Heartbeat Frequency**: Adjust heartbeat interval based on network conditions
- **Cleanup**: Inactive sessions are automatically cleaned up every 30 seconds

## Security

- JWT token authentication required for all connections
- User type validation (students vs teachers)
- CORS protection
- Rate limiting on connection attempts
- Automatic cleanup of inactive sessions

## Migration from Old System

The new real-time system is designed to replace the existing WebSocket servers:

1. **Replace** `socketService.js` with `realtimeSocketService.js`
2. **Update** components to use new real-time components
3. **Start** real-time server instead of separate monitoring/student servers
4. **Test** thoroughly before production deployment

## Support

For issues or questions:

1. Check the health endpoints
2. Review server logs
3. Test with the provided test script
4. Verify environment configuration

---

**Note**: This system provides true real-time functionality with no polling or delays. All updates are instant and synchronized across all connected clients.
