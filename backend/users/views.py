import json
import jwt
from dateutil import parser
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile
from django.core.mail import send_mail
from pymongo import MongoClient  # Add this import
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
import os
import re
import pickle
import pandas as pd
import json
import random
from datetime import datetime, timezone
from django.core.files.storage import default_storage


def generate_jwt(user):
    payload = {
        'id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token

@csrf_exempt
def register(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        password = data.get('password')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        restaurant = data.get('restaurant')
        phone = data.get('phone')

        required_fields = ['email', 'password', 'firstName', 'lastName', 'restaurant', 'phone']
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return JsonResponse({'error': f"Missing fields: {', '.join(missing)}"}, status=400)

        from django.conf import settings
        mongo_url = settings.DATABASES['default']['CLIENT']['host']
        mongo_db = settings.DATABASES['default']['NAME']
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        # Check if user exists
        if db['users'].find_one({'email': email}):
            return JsonResponse({'error': 'User already exists'}, status=400)
        # Hash password
        hashed_password = make_password(password)
        user_doc = {
            'email': email,
            'password': hashed_password,
            'first_name': first_name,
            'last_name': last_name,
            'restaurant': restaurant,
            'phone': phone,
            'date_joined': datetime.datetime.utcnow()
        }
        db['users'].insert_one(user_doc)
        return JsonResponse({'message': 'User created successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        from django.conf import settings
        mongo_url = settings.DATABASES['default']['CLIENT']['host']
        mongo_db = settings.DATABASES['default']['NAME']
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        user = db['users'].find_one({'email': email})
        if user and check_password(password, user['password']):
            # Generate JWT manually (no user.id, so use email)
            payload = {
                'email': user['email'],
                'exp': datetime.utcnow() + timedelta(hours=24),
                'iat': datetime.utcnow()
            }
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
            return JsonResponse({'token': token, 'user': {
                'email': user['email'],
                'firstName': user.get('first_name', ''),
                'lastName': user.get('last_name', ''),
                'restaurant': user.get('restaurant', ''),
                'phone': user.get('phone', ''),
            }})
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=400)
    else:
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

def jwt_required(view_func):
    def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            request.user_id = payload['id']
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

@csrf_exempt
@jwt_required
def protected_view(request):
    return JsonResponse({'message': f'Hello user {request.user_id}, you have accessed a protected route!'})

@csrf_exempt
def send_otp(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
        # Use pymongo to check if user exists
        from django.conf import settings
        mongo_url = settings.DATABASES['default']['CLIENT']['host']
        mongo_db = settings.DATABASES['default']['NAME']
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        user = db['users'].find_one({'email': email})
        if not user:
            return JsonResponse({'error': 'No user with this email'}, status=404)
        otp = str(random.randint(100000, 999999))
        # Debug: print OTP records before upsert
        print(f"[DEBUG][SEND OTP] Before upsert: {list(db['otp_codes'].find({'email': email}))}")
        # Store OTP in MongoDB (upsert)
        db['otp_codes'].update_one(
            {'email': email},
            {'$set': {'otp': otp, 'created_at': datetime.utcnow()}},
            upsert=True
        )
        # Debug: print OTP records after upsert
        print(f"[DEBUG][SEND OTP] After upsert: {list(db['otp_codes'].find({'email': email}))}")
        print(f"[SEND OTP] OTP for {email} is now {otp}")
        try:
            send_mail(
                'Your WasteNoBite OTP',
                f'Your OTP is: {otp}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return JsonResponse({'message': 'OTP sent successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def reset_password(request):
    print("[DEBUG] Entered reset_password endpoint")
    if request.method == 'POST':
        data = json.loads(request.body)
        print("[DEBUG] reset_password request data:", data)
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('new_password')
        from django.conf import settings
        mongo_url = settings.DATABASES['default']['CLIENT']['host']
        mongo_db = settings.DATABASES['default']['NAME']
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        otp_record = db['otp_codes'].find_one({'email': email})
        # Debug: print OTP record before checking
        print(f"[DEBUG][RESET PASSWORD] OTP record in DB for {email}: {otp_record}")
        print(f"[DEBUG][RESET PASSWORD] OTP from user: {repr(otp)} (type: {type(otp)})")
        print(f"[DEBUG][RESET PASSWORD] OTP from DB: {repr(otp_record['otp'] if otp_record else None)} (type: {type(otp_record['otp']) if otp_record else None})")
        print(f"[RESET PASSWORD] OTP in DB for {email} is {otp_record['otp'] if otp_record else None}, user entered {otp}")
        if not otp_record or otp_record['otp'] != otp:
            return JsonResponse({'error': 'Invalid or expired OTP'}, status=400)
        # Update password in users collection
        from django.contrib.auth.hashers import make_password
        hashed_password = make_password(new_password)
        result = db['users'].update_one(
            {'email': email},
            {'$set': {'password': hashed_password}}
        )
        if result.matched_count == 0:
            return JsonResponse({'error': 'No user with this email'}, status=404)
        # Delete OTP after use
        db['otp_codes'].delete_one({'email': email})
        return JsonResponse({'message': 'Password reset successful'})
    else:
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def verify_otp(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        otp = data.get('otp')
        from django.conf import settings
        mongo_url = settings.DATABASES['default']['CLIENT']['host']
        mongo_db = settings.DATABASES['default']['NAME']
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        otp_record = db['otp_codes'].find_one({'email': email})
        if not otp_record or otp_record['otp'] != otp:
            return JsonResponse({'error': 'Invalid or expired OTP'}, status=400)
        return JsonResponse({'message': 'OTP verified'})
    else:
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
PROJECT_ROOT = os.path.dirname(settings.BASE_DIR)  # Go up one level
MODEL_PATH = os.path.join(PROJECT_ROOT, "ml_model", "category_sales_model.pkl")
ENCODER_PATH = os.path.join(PROJECT_ROOT, "ml_model", "label_encoders.pkl")

@csrf_exempt
@require_http_methods(["POST"])
def predict_category_sales(request):
    try:
        data = json.loads(request.body)
        category = data.get("category")
        if not category:
            return JsonResponse({"error": "Category is required"}, status=400)

        # ✅ Load model and encoders dynamically
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(ENCODER_PATH, "rb") as f:
            category_encoder, day_encoder = pickle.load(f)

        # ✅ Normalize input category
        category = category.strip().title()

        # ✅ Validate category
        trained_categories = list(category_encoder.classes_)
        if category not in trained_categories:
            return JsonResponse({"error": f"Unseen category label: {category}"}, status=400)

        # ✅ Connect to MongoDB
        mongo_url = settings.DATABASES['default']['CLIENT']['host']
        mongo_db = settings.DATABASES['default']['NAME']
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        sales_collection = db["Sales"]

        # ✅ Fetch latest date in the collection for this category
        latest_doc = sales_collection.find_one(
            {"category": category},
            sort=[("date", -1)]
        )
        if not latest_doc:
            return JsonResponse({"error": "No sales data found for this category"}, status=404)

        latest_date = latest_doc["date"]

        # ✅ Calculate 7-day range ending on latest day
        end_date = latest_date
        start_date = end_date - timedelta(days=6)

        # ✅ Fetch data for that 7-day range
        mongo_docs = list(sales_collection.find({
            "category": category,
            "date": {"$gte": start_date, "$lte": end_date}
        }))

        if not mongo_docs:
            return JsonResponse({"error": "No weekly sales data found for this category"}, status=404)

        # ✅ Load into DataFrame
        df = pd.DataFrame(mongo_docs)
        df["day_of_week"] = pd.to_datetime(df["date"]).dt.day_name().str[:3]  # 'Mon', 'Tue', ...

        # ✅ Loop over each weekday to predict
        weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        results = []

        for day in weekdays:
            if day not in day_encoder.classes_:
                return JsonResponse({"error": f"Unseen day label: {day}"}, status=400)

            # Encode features
            day_encoded = day_encoder.transform([day])[0]
            category_encoded = category_encoder.transform([category])[0]

            # Average sales_percent from filtered data
            filtered_df = df[df["day_of_week"] == day]
            sales_percent = filtered_df["sales_percent"].mean()

            if pd.isna(sales_percent):
                sales_percent = 0.0

            # Predict
            X = [[category_encoded, day_encoded, sales_percent]]
            prediction = model.predict(X)[0]

            results.append({
                "day": day,
                "actual_sales_percent": round(sales_percent, 2),
                "target_sales_percent": round(prediction, 2)
            })

        return JsonResponse({"results": results})

    except Exception as e:
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_inventory_items(request):
    try:
        # Get MongoDB connection details from environment variables
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        
        print(f"[DEBUG] MONGO_URL: {mongo_url}")
        print(f"[DEBUG] MONGO_DB: {mongo_db}")
        
        if not mongo_url or not mongo_db:
            print("[DEBUG] MongoDB configuration missing")
            return JsonResponse({"error": "MongoDB configuration not found in environment variables"}, status=500)
        
        # Connect to MongoDB
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        
        # Detect collection
        collections = db.list_collection_names()
        print(f"[DEBUG] Available collections: {collections}")

        inventory_collection = db["inventory_items"]

        if not inventory_collection:
            return JsonResponse({"error": f"No inventory collection found. Available: {collections}"}, status=404)

        # Fetch items
        inventory_items = list(inventory_collection.find({}, {'_id': 0}))
        print(f"[DEBUG] Found {len(inventory_items)} items in collection 'inventory_items_1'")

        now = datetime.now()
        processed_items = []

        for item in inventory_items:
            expiry_raw = item.get("Expiry Date")
            expiry_date = None

            # Parse expiry date safely
            if isinstance(expiry_raw, datetime):
                expiry_date = expiry_raw
            elif isinstance(expiry_raw, str):
                try:
                    expiry_date = datetime.strptime(expiry_raw, "%Y-%m-%d")
                except ValueError:
                    try:
                        expiry_date = datetime.strptime(expiry_raw, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        print(f"[DEBUG] Could not parse expiry date for item {item.get('Item Name')}: {expiry_raw}")
            
            # Skip expired items
            if expiry_date and expiry_date <= now:
                print(f"[DEBUG] Skipping expired item: {item.get('Item Name')} (Expiry: {expiry_date})")
                continue

            # Process only valid items (not expired)
            max_lifespan = item.get('Max lifespan', 0)
            freshness_level = item.get('Freshness Level', '').lower()
            quality_color = "gray"
            if freshness_level == "fresh":
                quality_color = "green"
            elif freshness_level == "near_expiry":
                quality_color = "yellow"
            elif freshness_level == "expired":
                quality_color = "red"

            quantity_purchased = item.get('Quantity Purchased', 0)
            quantity_used = item.get('Quantity Used', 0)
            current_quantity = quantity_purchased - quantity_used

            stock_status = ""
            if current_quantity <= 0:
                stock_status = f"Inventory Item to buy - {item.get('Item Name', 'Unknown')} (out of stock)"

            item_name = item.get('Item Name', '').lower()
            image_mapping = {
                'yogurt': 'yougurt.webp', 'yougurt': 'yougurt.webp',
                'broccoli': 'brocolli.png', 'brocolli': 'brocolli.png',
                'pork chop': 'pork.png', 'porkchop': 'pork.png',
                'chicken breast': 'chicken.png', 'chickenbreast': 'chicken.png',
                'beef steak': 'beef.png', 'beefsteak': 'beef.png',
                'tomato': 'tomatoes.png', 'tomatoes': 'tomatoes.png',
                'onion': 'onions.png', 'onions': 'onions.png',
                'bell pepper': 'capsicum.png', 'bellpepper': 'capsicum.png',
                'capsicum': 'capsicum.png',
            }
            if item_name in image_mapping:
                image_path = f"http://localhost:8000/media/images/{image_mapping[item_name]}"
            else:
                image_path = f"http://localhost:8000/media/images/{item_name}.png"

            processed_items.append({
                'id': str(hash(item.get('Item Name', ''))),
                'name': item.get('Item Name', ''),
                'category': item.get('Category', ''),
                'quantity': current_quantity,
                'remainingLife': max_lifespan,
                'lastUpdated': '1 hour ago',
                'quality': freshness_level if freshness_level else "Unknown",
                'qualityColor': quality_color,
                'image': image_path,
                'stockStatus': stock_status,
                'purchaseDate': item.get('Purchase Date'),
                'expiryDate': expiry_raw,
                'storageTemperature': item.get('Storage Temperature'),
                'humidity': item.get('Humidity'),
                'quantityPurchased': quantity_purchased,
                'quantityUsed': quantity_used,
                'quantityWasted': item.get('Quantity Wasted', 0),
                'costPerUnit': item.get('Cost Per Unit', 0),
                'spoilageRate': item.get('Spoilage rate', 0),
                'freshnessPercentage': item.get('Freshness Percentage', 0),
                'estimatedExpiryWasted': item.get('Estimated expiry wasted', 0),
                'maxLifespan': max_lifespan,
                'highRisk': item.get('High Risk', 0),
                'freshnessLevel': item.get('Freshness Level', '')
            })

        print(f"[DEBUG] Processed {len(processed_items)} non-expired items")
        return JsonResponse({'items': processed_items})

    except Exception as e:
        print(f"[DEBUG] Error in get_inventory_items: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def add_inventory_usage(request):
    """Decrement available quantity by incrementing 'Quantity Used' for an item.

    Request JSON:
      {
        "itemName": "Yogurt",
        "quantity": 3
      }

    Rules:
      - Reject if requested quantity exceeds available quantity
      - Reject if item not found
      - Case-insensitive match on 'Item Name'
    """
    try:
        body = json.loads(request.body or "{}")
        item_name = (body.get("itemName") or "").strip()
        try:
            usage_quantity = int(body.get("quantity", 0))
        except (TypeError, ValueError):
            usage_quantity = 0

        if not item_name:
            return JsonResponse({"error": "'itemName' is required"}, status=400)
        if usage_quantity <= 0:
            return JsonResponse({"error": "'quantity' must be a positive integer"}, status=400)

        # DB connection from environment (consistent with get_inventory_items)
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found in environment variables"}, status=500)

        client = MongoClient(mongo_url)
        db = client[mongo_db]

        # Locate inventory collection similar to the GET endpoint
        inventory_collection = db["inventory_items"]
        if not inventory_collection:
            return JsonResponse({"error": "Inventory collection not found"}, status=404)

        # Find all batches for the item, sorted by earliest purchase date (FIFO)
        docs = list(inventory_collection.find(
            {'Item Name': { '$regex': f'^{item_name}$', '$options': 'i' }},
            sort=[('Purchase Date', 1)]
        ))
        if not docs:
            return JsonResponse({"error": "Item not found in inventory"}, status=404)

        total_available = sum(
            max(0, int(doc.get('Quantity Purchased', 0)) - int(doc.get('Quantity Used', 0)))
            for doc in docs
        )
        if usage_quantity > total_available:
            return JsonResponse({"error": f"Insufficient quantity. Max available is {total_available}"}, status=400)

        qty_to_use = usage_quantity
        for doc in docs:
            purchased = int(doc.get('Quantity Purchased', 0))
            used = int(doc.get('Quantity Used', 0))
            available = max(0, purchased - used)
            if available <= 0:
                continue
            use_now = min(available, qty_to_use)
            inventory_collection.update_one(
                {'_id': doc['_id']},
                {'$inc': {'Quantity Used': use_now}}
            )
            qty_to_use -= use_now
            if qty_to_use <= 0:
                break

        return JsonResponse({
            "message": "Usage recorded (FIFO)",
            "itemName": item_name,
            "used": usage_quantity,
            "remaining": total_available - usage_quantity
        })
    except Exception as e:
        print(f"[DEBUG] Error in add_inventory_usage: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def add_inventory_item(request):
    """Insert a new inventory purchase document into MongoDB.

    Accepts JSON with keys compatible with existing inventory schema
    (as returned by get_inventory_items before transformation).
    If the inventory collection doesn't exist yet, it will create/use
    "inventory_items" by default.
    """
    try:
        body = json.loads(request.body or "{}")

        # Basic validation
        required_fields = [
            'Item Name', 'Category', 'Purchase Date', 'Expiry Date',
            'Quantity Purchased'
        ]
        missing = [f for f in required_fields if body.get(f) in (None, "")]
        if missing:
            return JsonResponse({"error": f"Missing fields: {', '.join(missing)}"}, status=400)

        # Parse numbers safely
        def to_number(val, default=0):
            try:
                if val is None or val == "":
                    return default
                # Allow string numbers
                return float(val) if "." in str(val) else int(val)
            except Exception:
                return default

        # Normalize document to be consistent with existing schema
        # Parse dates to ISO strings Mongo can store as datetime if driver converts
        def _to_iso(val):
            try:
                if isinstance(val, datetime):
                    # Ensure it's timezone-aware in UTC
                    return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
                if isinstance(val, str):
                    s = val.replace('Z', '+00:00')
                    dt = datetime.fromisoformat(s)
                    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except Exception:
                return None
            return None

        purchase_dt = _to_iso(body.get('Purchase Date')) or datetime.now(timezone.utc)
        expiry_dt = _to_iso(body.get('Expiry Date')) or purchase_dt

        # Use UTC-aware "now"
        now = datetime.now(timezone.utc)

        max_lifespan_calc = max(0, (expiry_dt - purchase_dt).days)
        remaining_now = max(0, (expiry_dt - now).days)
        freshness_level_calc = 'fresh'
        if remaining_now <= 0:
            freshness_level_calc = 'expired'
        elif max_lifespan_calc and remaining_now <= max(1, int(0.3 * max_lifespan_calc)):
            freshness_level_calc = 'near_expiry'

        doc = {
            'Item Name': body.get('Item Name').strip(),
            'Category': body.get('Category').strip(),
            'Purchase Date': purchase_dt,
            'Expiry Date': expiry_dt,
            'Storage Temperature': to_number(body.get('Storage Temperature')),
            'Humidity': to_number(body.get('Humidity')),
            'Quantity Purchased': to_number(body.get('Quantity Purchased'), 0),
            'Quantity Used': to_number(body.get('Quantity Used'), 0),
            'Quantity Wasted': to_number(body.get('Quantity Wasted'), 0),
            'Cost Per Unit': to_number(body.get('Cost Per Unit'), 0),
            'Spoilage rate': to_number(body.get('Spoilage rate'), 0),
            'Freshness Percentage': to_number(body.get('Freshness Percentage'), 0),
            'Estimated expiry wasted': to_number(body.get('Estimated expiry wasted'), 0),
            'Max lifespan': to_number(body.get('Max lifespan'), max_lifespan_calc),
            'High Risk': to_number(body.get('High Risk'), 0),
            'Freshness Level': freshness_level_calc,
            'Created At': datetime.utcnow().isoformat() + 'Z'
        }

        # DB connection
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found in environment variables"}, status=500)

        client = MongoClient(mongo_url)
        db = client[mongo_db]

        # Find existing inventory collection or create default one
        collection_name = "inventory_items"
        inventory_collection = db[collection_name]

        result = inventory_collection.insert_one(doc)

        return JsonResponse({
            "message": "Inventory item added",
            "id": str(result.inserted_id),
            "collection": collection_name
        }, status=201)

    except Exception as e:
        print(f"[DEBUG] Error in add_inventory_item: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)



def upcoming_expirations_view(request):
    try:
        # Connect to MongoDB
        mongo_url = settings.DATABASES['default']['CLIENT']['host']
        mongo_db = settings.DATABASES['default']['NAME']
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        cart_collection = db["inventory_items"]

        today = datetime.utcnow()
        threshold_date = today + timedelta(days=7)

        # Fetch all items first
        upcoming_items = list(cart_collection.find(
            {},
            {
                "_id": 0,
                "Item Name": 1,
                "Quantity Purchased": 1,
                "Quantity Used": 1,
                "Expiry Date": 1
            }
        ))

        # Process + filter in Python
        processed_items = []
        for item in upcoming_items:
            expiry_raw = item.get("Expiry Date")

            # parse expiry date safely
            if isinstance(expiry_raw, str):
                try:
                    expiration_date = parser.parse(expiry_raw, dayfirst=True)  
                except Exception:
                    continue
            else:
                expiration_date = expiry_raw

            # only include items expiring in <=7 days
            if today <= expiration_date <= threshold_date:
                remaining_days = (expiration_date - today).days
                quantity_purchased = item.get("Quantity Purchased", 0)
                quantity_used = item.get("Quantity Used", 0)
                remaining_quantity = quantity_purchased - quantity_used

                processed_items.append({
                    "item_name": item.get("Item Name"),
                    "remaining_days": remaining_days,
                    "quantity": remaining_quantity
                })

        return JsonResponse({"status": "success", "data": processed_items}, safe=False)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


def get_inventory_levels(request):
    from django.http import JsonResponse
    from datetime import datetime
    from pymongo import MongoClient

    # 1. Connect to MongoDB
    mongo_url = settings.DATABASES['default']['CLIENT']['host']
    mongo_db = settings.DATABASES['default']['NAME']
    client = MongoClient(mongo_url)
    db = client[mongo_db]
    items_collection = db['inventory_items']

    # 2. Fetch all items
    items = list(items_collection.find({}))
    now = datetime.utcnow()
    valid_items = []

    for item in items:
        expiry_raw = item.get("Expiry Date")
        expiry_date = None

        # Try multiple formats
        if isinstance(expiry_raw, datetime):
            expiry_date = expiry_raw
        elif isinstance(expiry_raw, str):
            for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
                try:
                    expiry_date = datetime.strptime(expiry_raw, fmt)
                    break
                except ValueError:
                    continue

        if expiry_date and expiry_date > now:
            valid_items.append(item)

    print(f"[DEBUG] Total items: {len(items)}, Non-expired: {len(valid_items)}")

    # 3. Classification
    levels = {"understocked": [], "overstocked": [], "optimal": []}
    for item in valid_items:
        purchase_raw = item.get("Purchase Date")
        purchase_date = None

        if isinstance(purchase_raw, datetime):
            purchase_date = purchase_raw
        elif isinstance(purchase_raw, str):
            for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
                try:
                    purchase_date = datetime.strptime(purchase_raw, fmt)
                    break
                except ValueError:
                    continue

        if not purchase_date:
            purchase_date = now

        days_since_purchase = max((now - purchase_date).days, 1)

        quantity_purchased = int(item.get("Quantity Purchased", 0))
        quantity_used = int(item.get("Quantity Used", 0))
        current = max(quantity_purchased - quantity_used, 0)

        # Estimate usage rate
        avg_daily_usage = quantity_used / days_since_purchase if days_since_purchase > 0 else 0
        recommended = max(int(avg_daily_usage * 3), 1)  # 3-day buffer, min 1

        print(f"[DEBUG] {item.get('Item Name')} → Current: {current}, Recommended: {recommended}, Usage/day: {avg_daily_usage:.2f}")

        if current < recommended:
            levels["understocked"].append({
                "item_name": item["Item Name"],
                "current": current,
                "recommended": recommended,
                "avg_daily_usage": round(avg_daily_usage, 2),
            })
        elif current > recommended * 2:
            levels["overstocked"].append({
                "item_name": item["Item Name"],
                "current": current,
                "recommended": recommended,
                "avg_daily_usage": round(avg_daily_usage, 2),
            })
        else:
            levels["optimal"].append({
                "item_name": item["Item Name"],
                "current": current,
                "recommended": recommended,
                "avg_daily_usage": round(avg_daily_usage, 2),
            })

    return JsonResponse(levels)

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import os
from .roboflow_service import analyze_image

@csrf_exempt
def detect_image(request):
    try:
        if request.method == "POST" and request.FILES.get("image"):
            image_file = request.FILES["image"]

            # Save uploaded file to a temp path
            import tempfile, os
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
                for chunk in image_file.chunks():
                    tmp_file.write(chunk)
                temp_path = tmp_file.name  # full path

            # Call Roboflow service
            from .roboflow_service import analyze_image
            raw_result = analyze_image(temp_path)

            # Remove temp file after use
            os.remove(temp_path)

            # 🔹 Normalize response (always array for frontend)
            import re
            cleaned_result = {}

            gemini1 = raw_result.get("google_gemini_1")

            if isinstance(gemini1, dict) and "output" in gemini1:
                numbers = re.findall(r'\d+', gemini1["output"])
                cleaned_result["google_gemini_1"] = [int(num) for num in numbers]
            elif isinstance(gemini1, str):
                numbers = re.findall(r'\d+', gemini1)
                cleaned_result["google_gemini_1"] = [int(num) for num in numbers]
            else:
                cleaned_result["google_gemini_1"] = []

            # Pass through raw for debugging
            cleaned_result["raw"] = raw_result
            
            return JsonResponse(cleaned_result, safe=False)

        return JsonResponse({"error": "No image uploaded"}, status=400)

    except Exception as e:
        import traceback
        return JsonResponse(
            {"error": str(e), "trace": traceback.format_exc()},
            status=500
        )
