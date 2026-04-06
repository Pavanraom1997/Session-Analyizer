# Vedantu Session Analyzer Architecture: Non-LLM Teaching Session Analysis

## 1. System Architecture Diagram (Text-Based)

```text
[ Client Layer ]
      |
      +-- React Dashboard (Vite)
      +-- Video Upload (Multipart)
      +-- Analytics Visualization (Recharts)

[ API Layer ]
      |
      +-- FastAPI / Express Gateway
      +-- Authentication & Session Management
      +-- Result Retrieval API

[ Processing Layer (Workers) ]
      |
      +-- Task Queue (Redis/RabbitMQ)
      |
      +-- Module A: Video Processor (OpenCV + MediaPipe)
      |     |-- Face Detection & Tracking
      |     |-- Gaze Estimation
      |     |-- Motion Analysis
      |
      +-- Module B: Audio Processor (Vosk / Kaldi / Librosa)
      |     |-- Speech-to-Text (ASR)
      |     |-- Speaker Diarization (Teacher vs. Student)
      |     |-- Prosody & Tone Analysis (Pitch/Energy)
      |
      +-- Module C: OCR Engine (Tesseract / EasyOCR)
      |     |-- Whiteboard Text Extraction
      |     |-- Diagram Detection
      |
      +-- Module D: Scoring Engine (Rule-Based)
            |-- Feature Aggregation
            |-- Weighted Scoring Logic

[ Storage Layer ]
      |
      +-- S3/Minio (Raw MP4s, Processed Frames)
      +-- PostgreSQL (Metadata, Extracted Features, Scores)
      +-- Redis (Caching & Task State)
```

## 2. Module-Wise Explanation

### A. Video Processing (OpenCV / MediaPipe)
- **Face Detection:** Uses MediaPipe Face Mesh for 468 landmarks.
- **Attention Tracking:** Calculates Head Pose (Pitch, Yaw, Roll) and Eye Aspect Ratio (EAR) to determine if the student is looking at the screen.
- **Engagement Proxy:** Frequency of nodding, smiling (detected via landmark distances), and overall movement.

### B. Audio Processing (Vosk / Librosa)
- **ASR:** Vosk is used for offline, lightweight speech-to-text.
- **Speaker Diarization:** Uses energy-based thresholding and MFCC (Mel-frequency cepstral coefficients) clustering to distinguish teacher from student.
- **Politeness Detection:** Rule-based keyword matching (e.g., "please", "thank you", "could you") combined with pitch variance (calm vs. aggressive).

### C. OCR & Topic Extraction (Tesseract)
- **Frame Sampling:** Extracts keyframes every 5-10 seconds.
- **Text Extraction:** Tesseract OCR reads the whiteboard.
- **Topic Coverage:** Matches extracted keywords against a predefined syllabus/lesson plan using Jaccard Similarity.

### D. Rule-Based Scoring Engine
- **Engagement Score:** `(Attention_Time / Total_Time) * 0.6 + (Interaction_Count / Total_Time) * 0.4`
- **Teaching Quality:** `(Syllabus_Coverage) * 0.5 + (Student_Speaking_Ratio) * 0.3 + (Politeness_Score) * 0.2`

## 3. Tech Stack
- **Frontend:** React, Tailwind CSS, Recharts, Framer Motion.
- **Backend:** FastAPI (Python) for heavy processing, Express (Node) for API gateway.
- **CV/ML:** OpenCV, MediaPipe, Scikit-Learn (SVM/RandomForest for non-generative classification).
- **Audio:** Librosa, Vosk.
- **OCR:** Tesseract.

## 4. Data Flow
1. User uploads MP4.
2. Backend triggers a background job.
3. Audio is stripped and processed for ASR and Diarization.
4. Video is processed frame-by-frame (sampled) for landmarks and OCR.
5. Features are stored in a structured JSON format.
6. Scoring engine runs a final pass over the features.
7. Dashboard fetches the scores and visualizes the timeline.
