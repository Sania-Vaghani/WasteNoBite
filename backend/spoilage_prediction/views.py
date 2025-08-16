import os
import joblib
import pandas as pd
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ====== Load Model Once ======
MODEL_PATH = os.path.join(settings.BASE_DIR, "ml_model", "freshness_estimation_model.pkl")
model = joblib.load(MODEL_PATH)  # Make sure version matches or retrain

# ====== MongoDB Connection ======
mongo_client = MongoClient(os.getenv("MONGO_URL"))
db = mongo_client[os.getenv("MONGO_DB")]
inventory_collection = db["inventory_items_1"]  # Change if needed


def prepare_features(items):
    """Add engineered features required by the model."""
    today = datetime.utcnow()
    for item in items:
        purchase_date = item["Purchase Date"]
        expiry_date = item["Expiry Date"]

        # Ensure datetime type
        if not isinstance(purchase_date, datetime):
            purchase_date = purchase_date.to_pydatetime()
        if not isinstance(expiry_date, datetime):
            expiry_date = expiry_date.to_pydatetime()

        item["Days_Since_Purchase"] = (today - purchase_date).days
        item["Days_To_Expiry"] = (expiry_date - today).days
    return items


@csrf_exempt
def predict_spoilage(request):
    try:
        today = datetime.utcnow()
        seven_days_ago = today - timedelta(days=7)

        # Step 1: Get items purchased in last 7 days
        items = list(inventory_collection.find({
            "Purchase Date": {
                "$gte": seven_days_ago.replace(hour=0, minute=0, second=0, microsecond=0),
                "$lt": today
            }
        }))

        if not items:
            return JsonResponse({"message": "No items found in the last 7 days"}, status=404)

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

        # Step 3: Filter out items with 0 days remaining
        filtered_results = []
        dates_to_check = set()

        for i, item in enumerate(items):
            if estimated_days[i] is None or estimated_days[i] > 0:
                filtered_results.append({
                    "Item Name": item.get("Item Name", "Unknown"),
                    "Purchase Date": item.get("Purchase Date"),
                    "Freshness Percentage": freshness[i],
                    "Estimated Days Remaining": estimated_days[i]
                })
                if isinstance(item.get("Purchase Date"), datetime):
                    dates_to_check.add(item["Purchase Date"].date())

        # Step 4: Fetch related DB data for those dates
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
