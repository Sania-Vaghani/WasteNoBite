# WasteNoBite

AI-powered Kitchen Assistant for Smart Inventory, Spoilage Prediction, and Waste Reduction

## Overview
WasteNoBite is a full-stack application designed to help kitchens, restaurants, and households manage food inventory, predict spoilage, reduce waste, and get practical recipe suggestions. It combines computer vision, machine learning, and a chatbot for seamless kitchen operations.

## Features
- Real-time inventory tracking (frontend + backend)
- AI-powered spoilage prediction
- Waste risk analysis
- Recipe and menu suggestions via chatbot
- Batch usage and FIFO logic
- Downloadable sales/inventory data
- Robust error handling and user feedback

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Django, Python, MongoDB
- **ML Models:** scikit-learn, pickle
- **Chatbot:** Custom intents, NLP

## Directory Structure
```
WasteNoBite/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── backend/ (Django project)
│   ├── spoilage_prediction/ (Django app)
│   ├── users/ (Django app)
│   ├── waste_analysis/ (Django app)
│   ├── media/images/ (ingredient images)
│   ├── ml_model/ (ML model files)
├── frontend/
│   ├── src/ (React source)
│   ├── public/ (static assets)
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
├── ml_model/ (global ML models)
├── requirements.txt
├── command.md
```

## Setup Instructions
### Backend
1. Create and activate a Python virtual environment.
2. Install dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```
3. Run Django server:
   ```powershell
   python backend/manage.py runserver
   ```

### Frontend
1. Install Node.js dependencies:
   ```powershell
   cd frontend
   pnpm install
   ```
2. Start frontend dev server:
   ```powershell
   pnpm run dev
   ```

### ML Models
- Place trained `.pkl` files in `backend/ml_model/` and `ml_model/` as needed.

## Usage
- Access the frontend at `http://localhost:5173` (or configured port).
- Backend API runs at `http://localhost:8000`.
- Use the chatbot for kitchen queries, recipes, and waste reduction tips.
- Track inventory, predict spoilage, and download reports from the dashboard.

## Key Files
- `backend/requirements.txt`: Python dependencies
- `frontend/package.json`: JS dependencies
- `backend/spoilage_prediction/views.py`: Spoilage prediction logic
- `frontend/src/components/InventoryManagement.jsx`: Inventory dashboard
- `frontend/src/components/SpoilagePrediction.jsx`: Spoilage prediction UI
- `backend/chatbot/intents.json`: Chatbot intents and patterns

## Contributing
Pull requests and suggestions are welcome! Please follow best practices and document your changes.

## License
MIT License

## Authors
- Sania Vaghani
- Contributors

---
For more details, see individual app README files or contact the maintainer.
