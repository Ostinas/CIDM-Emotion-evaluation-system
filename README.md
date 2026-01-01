# CIDM Emotion Evaluation System

A video analysis system for evaluating attention and engagement using AI-powered pose detection and face mesh analysis.

## Features

- 📹 Video upload and analysis
- 👁️ Attention detection and tracking
- 📊 Real-time statistics and visualization
- 🎯 Multiple person tracking
- 📈 Timeline-based attention analytics

## Prerequisites

- Python 3.10 or higher
- Node.js 16 or higher
- npm or yarn

## Quick Start (Windows)

### 1. Automated Setup

Simply run the setup script:

```bash
setup.bat
```

This will:
- Create a Python virtual environment
- Install all backend dependencies
- Install all frontend dependencies

### 2. Start the Application

Run the startup script:

```bash
start.bat
```

This will open two terminal windows:
- **Backend Server**: Running on `http://127.0.0.1:8000`
- **Frontend Server**: Running on `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173` to use the application.

## Manual Setup

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # On Windows
# or
source venv/bin/activate  # On Mac/Linux

pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend/vmee-frontend
npm install
```

### Running Manually

**Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend/vmee-frontend
npm run dev
```

## Project Structure

```
CIDM-Emotion-evaluation-system/
├── backend/
│   ├── ai/                    # AI models and processing
│   │   ├── models.py         # Pose and face mesh models
│   │   ├── stats.py          # Video analysis logic
│   │   └── utils.py          # Helper functions
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Virtual environment
├── frontend/
│   └── vmee-frontend/
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── App.jsx       # Main application
│       │   └── main.jsx      # Entry point
│       └── package.json      # Node dependencies
├── setup.bat                 # Automated setup script
├── start.bat                 # Automated startup script
└── README.md                 # This file
```

## API Endpoints

- `POST /api/analyze-video` - Upload and analyze a video file
- `POST /api/upload-temp` - Upload video for streaming
- `GET /api/stream-temp/{video_id}` - Stream processed video with annotations

## Technologies

### Backend
- FastAPI - Modern web framework
- OpenCV - Video processing
- Ultralytics YOLO - Pose detection
- MediaPipe - Face mesh analysis
- NumPy - Numerical computing

### Frontend
- React - UI framework
- Vite - Build tool
- Recharts - Data visualization
- CSS - Styling

## Troubleshooting

### Backend Issues

**ModuleNotFoundError:**
- Make sure you activated the virtual environment
- Run `pip install -r requirements.txt` again

**Port 8000 already in use:**
- Stop other applications using port 8000
- Or change the port: `uvicorn main:app --reload --port 8001`

### Frontend Issues

**Port 5173 already in use:**
- Stop other applications using port 5173
- Vite will automatically suggest another port

**npm install fails:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Development

### Adding New Dependencies

**Backend:**
```bash
cd backend
venv\Scripts\activate
pip install <package-name>
pip freeze > requirements.txt
```

**Frontend:**
```bash
cd frontend/vmee-frontend
npm install <package-name>
```

## License

This project is for educational and research purposes.

