import os
import joblib
import pandas as pd
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from pymongo import MongoClient
from dotenv import load_dotenv
from dateutil import parser

# Load environment variables
load_dotenv()

# ====== Load Model Once ======
MODEL_PATH = os.path.join(settings.BASE_DIR, "ml_model", "freshness_estimation_model.pkl")
model = joblib.load(MODEL_PATH)  # Make sure version matches or retrain

# ====== MongoDB Connection ======
mongo_client = MongoClient(os.getenv("MONGO_URL"))
db = mongo_client[os.getenv("MONGO_DB")]
inventory_collection = db["inventory_items"]  # Change if needed

def prepare_features(items):
    """Add engineered features required by the model."""
    today = datetime.utcnow()
    for item in items:
        purchase_date = item.get("Purchase Date")
        expiry_date = item.get("Expiry Date")

        # Convert safely to datetime
        if isinstance(purchase_date, str):
            purchase_date = parser.parse(purchase_date)
        elif not isinstance(purchase_date, datetime):
            purchase_date = pd.to_datetime(purchase_date)

        if isinstance(expiry_date, str):
            expiry_date = parser.parse(expiry_date)
        elif not isinstance(expiry_date, datetime):
            expiry_date = pd.to_datetime(expiry_date)

        item["Days_Since_Purchase"] = (today - purchase_date).days
        item["Days_To_Expiry"] = (expiry_date - today).days

        # Overwrite with clean datetime objects for later use
        item["Purchase Date"] = purchase_date
        item["Expiry Date"] = expiry_date

    return items


@csrf_exempt
def predict_spoilage(request):
    try:
        # Step 1: Get all items
        items = list(inventory_collection.find())

        if not items:
            return JsonResponse({"message": "No items found"}, status=404)

        # Step 2: Prepare features for prediction
        items = prepare_features(items)
        df = pd.DataFrame(items)

        if "_id" in df.columns:
            df.drop(columns=["_id"], inplace=True)

        X = df[model.feature_names_in_]
        predictions = model.predict(X)

        if predictions.ndim == 2 and predictions.shape[1] == 2:
            freshness = [round(float(pred[0]), 2) for pred in predictions]
            estimated_days = [int(pred[1]) for pred in predictions]
        else:
            freshness = [round(float(pred), 2) for pred in predictions]
            estimated_days = [None] * len(predictions)

        # Step 3: Filter out items already expired (Expiry Date < now)
        filtered_results = []
        dates_to_check = set()
        now = datetime.utcnow()

        for i, item in enumerate(items):
            expiry_date = item.get("Expiry Date")

            # ensure datetime
            if isinstance(expiry_date, str):
                expiry_date = parser.parse(expiry_date)

            # skip if expired
            if expiry_date < now:
                continue

            # fallback: use prediction or Days_To_Expiry
            days_left = estimated_days[i] if estimated_days[i] is not None else item["Days_To_Expiry"]

            filtered_results.append({
                "Item Name": item.get("Item Name", "Unknown"),
                "Purchase Date": item.get("Purchase Date"),
                "Freshness Percentage": freshness[i],
                "Estimated Days Remaining": days_left,
                # ✅ Add these so frontend always has them
                "Max lifespan": item.get("Max lifespan", 0),
                "Category": item.get("Category", "Other")
            })

            if isinstance(item.get("Purchase Date"), datetime):
                dates_to_check.add(item["Purchase Date"].date())

        # Step 4: Fetch related DB data (optional, still keep it for consistency)
        related_items = []
        if dates_to_check:
            related_items = list(inventory_collection.find({
                "Purchase Date": {
                    "$in": [datetime.combine(d, datetime.min.time()) for d in dates_to_check]
                }
            }, {
                "Item Name": 1,
                "Category": 1,
                "Max lifespan": 1,
                "Purchase Date": 1,
                "_id": 0
            }))

        return JsonResponse({
            "predictions": filtered_results,
            "related_items": related_items
        }, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



from django.views.decorators.http import require_GET
# API endpoint to get expiring items (status 'critical') for menu optimization
@require_GET
@csrf_exempt
def expiring_items(request):
    try:
        # Fetch spoilage predictions (reuse logic from predict_spoilage)
        items = list(inventory_collection.find())
        if not items:
            return JsonResponse({"message": "No items found in the last 7 days"}, status=404)

        items = prepare_features(items)
        df = pd.DataFrame(items)
        if "_id" in df.columns:
            df.drop(columns=["_id"], inplace=True)
        X = df[model.feature_names_in_]
        predictions = model.predict(X)

        if predictions.ndim == 2 and predictions.shape[1] == 2:
            freshness = [round(float(pred[0]), 2) for pred in predictions]
            estimated_days = [int(pred[1]) for pred in predictions]
        else:
            freshness = [round(float(pred), 2) for pred in predictions]
            estimated_days = [None] * len(predictions)

        # Compose items with status
        result = []
        for i, item in enumerate(items):
            status = None
            days_left = estimated_days[i] if estimated_days[i] is not None else item.get("Days_To_Expiry", 0)
            # Use same status logic as frontend: 'critical' means use immediately/about to expire
            if days_left <= 2 or freshness[i] <= 20:
                status = "critical"
            elif freshness[i] <= 40:
                status = "warning"
            elif freshness[i] <= 70:
                status = "good"
            else:
                status = "excellent"
            if status == "critical":
                result.append({
                    "name": item.get("Item Name", "Unknown"),
                    "category": item.get("Category", "other"),
                    "freshness": freshness[i],
                    "estimatedDaysLeft": days_left,
                    "maxLifespan": item.get("Max lifespan", None),
                    "status": status
                })

        return JsonResponse({"expiring_items": result}, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
