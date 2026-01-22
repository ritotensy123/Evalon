# AI Face Detection Service for Evalon

This service provides AI-powered face detection capabilities for the Evalon exam proctoring system. It handles webcam validation and real-time face detection before and during exams.

## Features

- ✅ **Single Face Detection** - Validates that exactly one face is present
- ✅ **Multiple Face Detection** - Detects and flags multiple faces as suspicious
- ✅ **Face Presence Validation** - Ensures a face is consistently visible
- ✅ **Webcam Setup Validation** - Validates camera setup before exam starts

## Installation

1. **Create virtual environment** (recommended):
```bash
cd python
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

## Running the Service

### Option 1: Using the startup script (Recommended)
```bash
cd python
./start_service.sh
```

The startup script will:
- Kill any existing processes on ports 5002-5012
- Activate the virtual environment
- Start the service on an available port

### Option 2: Direct Python execution
```bash
cd python
source venv/bin/activate
python face_detection_service.py
```

The service will automatically find an available port starting from 5002 (tries ports 5002-5012).

## API Endpoints

### Health Check
```
GET /health
```

### Detect Faces in Single Image
```
POST /api/detect-faces

Request Body:
{
    "image": "base64_encoded_image_string"
}

Response:
{
    "success": true,
    "face_count": 1,
    "faces_detected": true,
    "multiple_faces": false,
    "status": "valid",
    "message": "Face detected and validated successfully"
}
```

### Validate Webcam Setup
```
POST /api/validate-setup

Request Body:
{
    "images": ["base64_image_1", "base64_image_2", ...],
    "duration_seconds": 5
}

Response:
{
    "success": true,
    "valid": true,
    "face_consistency": 0.95,
    "multiple_face_instances": 0,
    "no_face_instances": 0,
    "message": "Setup validated successfully"
}
```

## Integration with Frontend

The frontend will call these endpoints to:
1. **Pre-exam validation** - Check if webcam can detect face
2. **Continuous monitoring** - Monitor face presence during exam
3. **Security checks** - Detect multiple faces or absence of face

## Testing

Test the service manually using curl:

```bash
# Health check
curl http://localhost:5002/health

# Face detection (requires base64 image)
curl -X POST http://localhost:5002/api/detect-faces \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image_here"}'
```

## Configuration

- **Port**: Set via `PORT` environment variable (default: 5002)
- **Face detection confidence**: Adjustable in `FaceDetector` class
- **Validation threshold**: Configurable in `validate_setup` endpoint

## Future Enhancements

- [ ] Eye gaze tracking
- [ ] Head pose estimation
- [ ] Suspicious activity classification (using trained CNN model)
- [ ] Real-time video streaming support
- [ ] Performance optimization for multiple concurrent requests

