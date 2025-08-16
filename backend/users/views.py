import json
import jwt
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
import pickle
import pandas as pd
import json
import random


def generate_jwt(user):
    payload = {
        'id': user.id,
        'username': user.username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        'iat': datetime.datetime.utcnow()
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
            {'$set': {'otp': otp, 'created_at': datetime.datetime.utcnow()}},
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
        
        # Connect to MongoDB using environment variables
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        
        # List all collections in the database
        collections = db.list_collection_names()
        print(f"[DEBUG] Available collections: {collections}")
        
        # Try different possible collection names
        possible_collections = ["inventory_items", "inventery_items", "inventory", "items"]
        inventory_collection = None
        collection_name = None
        
        for col_name in possible_collections:
            if col_name in collections:
                inventory_collection = db[col_name]
                collection_name = col_name
                print(f"[DEBUG] Found collection: {col_name}")
                break
        
        if not inventory_collection:
            print(f"[DEBUG] No inventory collection found. Available collections: {collections}")
            return JsonResponse({"error": f"No inventory collection found. Available collections: {collections}"}, status=404)

        # Fetch all inventory items
        inventory_items = list(inventory_collection.find({}, {'_id': 0}))  # Exclude MongoDB _id
        print(f"[DEBUG] Found {len(inventory_items)} items in collection '{collection_name}'")
        
        # Show first item structure if available
        if inventory_items:
            print(f"[DEBUG] First item structure: {inventory_items[0]}")
        else:
            print("[DEBUG] Collection is empty")

        # Process each item to calculate remaining life and format data
        processed_items = []
        for item in inventory_items:
            print(f"[DEBUG] Processing item: {item.get('Item Name', 'Unknown')}")
            
            # Use Max lifespan from MongoDB for remaining life
            max_lifespan = item.get('Max lifespan', 0)
            remaining_life = max_lifespan  # Use the actual max lifespan value
            
            # Use Freshness Level from MongoDB for quality and determine color
            freshness_level = item.get('Freshness Level', '').lower()
            quality = freshness_level if freshness_level else "Unknown"
            
            # Determine quality color based on freshness level
            quality_color = "gray"  # default
            if freshness_level == "fresh":
                quality_color = "green"
            elif freshness_level == "near_expiry":
                quality_color = "yellow"
            elif freshness_level == "expired":
                quality_color = "red"
            
            # Calculate quantity: Quantity Purchased - Quantity Used
            quantity_purchased = item.get('Quantity Purchased', 0)
            quantity_used = item.get('Quantity Used', 0)
            current_quantity = quantity_purchased - quantity_used
            
            # Add stock status message
            stock_status = ""
            if current_quantity <= 0:
                stock_status = f"Inventory Item to buy - {item.get('Item Name', 'Unknown')} as we are out of stock"
            
            # Map image name to file path - handle special cases and extensions
            item_name = item.get('Item Name', '').lower()
            
            # Comprehensive mapping for items that might have different names in images
            image_mapping = {
                'yogurt': 'yougurt.webp',  # Handle the typo in filename
                'yougurt': 'yougurt.webp',
                'broccoli': 'brocolli.png',  # Handle the typo in filename
                'brocolli': 'brocolli.png',
                'pork chop': 'pork.png',  # Map to existing pork image
                'porkchop': 'pork.png',
                'chicken breast': 'chicken.png',  # Map to existing chicken image
                'chickenbreast': 'chicken.png',
                'beef steak': 'beef.png',  # Map to existing beef image
                'beefsteak': 'beef.png',
                'tomato': 'tomatoes.png',  # Map to existing tomatoes image
                'tomatoes': 'tomatoes.png',
                'onion': 'onions.png',  # Map to existing onions image
                'onions': 'onions.png',
                'bell pepper': 'capsicum.png',  # Map to existing capsicum image
                'bellpepper': 'capsicum.png',
                'capsicum': 'capsicum.png',
            }
            
            # Check if we have a special mapping
            if item_name in image_mapping:
                image_path = f"http://localhost:8000/media/images/{image_mapping[item_name]}"
            else:
                # Default to PNG for most items
                image_path = f"http://localhost:8000/media/images/{item_name}.png"
            
            print(f"[DEBUG] Item: {item_name}, Image path: {image_path}")
            print(f"[DEBUG] Quality: {quality}, Remaining Life: {remaining_life}, Current Quantity: {current_quantity}")
            if stock_status:
                print(f"[DEBUG] Stock Status: {stock_status}")
            
            processed_item = {
                'id': str(hash(item.get('Item Name', ''))),  # Use hash as ID
                'name': item.get('Item Name', ''),
                'category': item.get('Category', ''),
                'quantity': current_quantity,  # Quantity Purchased - Quantity Used
                'remainingLife': remaining_life,  # Use Max lifespan from MongoDB
                'lastUpdated': '1 hour ago',  # You can calculate this from actual data
                'quality': quality,  # Use Freshness Level from MongoDB
                'qualityColor': quality_color,  # Add quality color
                'image': image_path,
                'stockStatus': stock_status,  # Add stock status message
                'purchaseDate': item.get('Purchase Date'),
                'expiryDate': item.get('Expiry Date'),
                'storageTemperature': item.get('Storage Temperature'),
                'humidity': item.get('Humidity'),
                'quantityPurchased': item.get('Quantity Purchased', 0),
                'quantityUsed': item.get('Quantity Used', 0),
                'quantityWasted': item.get('Quantity Wasted', 0),
                'costPerUnit': item.get('Cost Per Unit', 0),
                'spoilageRate': item.get('Spoilage rate', 0),
                'freshnessPercentage': item.get('Freshness Percentage', 0),
                'estimatedExpiryWasted': item.get('Estimated expiry wasted', 0),
                'maxLifespan': item.get('Max lifespan', 0),
                'highRisk': item.get('High Risk', 0),
                'freshnessLevel': item.get('Freshness Level', '')
            }
            processed_items.append(processed_item)

        print(f"[DEBUG] Processed {len(processed_items)} items")
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
        possible_collections = ["inventory_items", "inventery_items", "inventory", "items"]
        inventory_collection = None
        for col_name in possible_collections:
            if col_name in db.list_collection_names():
                inventory_collection = db[col_name]
                break
        if not inventory_collection:
            return JsonResponse({"error": "Inventory collection not found"}, status=404)

        # Find the specific item by case-insensitive name
        doc = inventory_collection.find_one({
            'Item Name': { '$regex': f'^{item_name}$', '$options': 'i' }
        })
        if not doc:
            return JsonResponse({"error": "Item not found"}, status=404)

        quantity_purchased = doc.get('Quantity Purchased', 0)
        quantity_used = doc.get('Quantity Used', 0)
        available = max(0, int(quantity_purchased) - int(quantity_used))

        if usage_quantity > available:
            return JsonResponse({
                "error": "Insufficient quantity",
                "maxQuantity": available
            }, status=400)

        # Atomic update: increment Quantity Used if sufficient stock still available at write time
        update_result = inventory_collection.update_one(
            {
                '_id': doc['_id'],
                '$expr': {
                    '$gte': [ {'$subtract': ['$Quantity Purchased', '$Quantity Used']}, usage_quantity ]
                }
            },
            { '$inc': { 'Quantity Used': usage_quantity } }
        )

        if update_result.matched_count == 0:
            # Another concurrent update may have reduced availability
            fresh = inventory_collection.find_one({'_id': doc['_id']})
            fresh_available = max(0, int(fresh.get('Quantity Purchased', 0)) - int(fresh.get('Quantity Used', 0)))
            return JsonResponse({
                "error": "Insufficient quantity",
                "maxQuantity": fresh_available
            }, status=400)

        new_available = available - usage_quantity
        return JsonResponse({
            "message": "Usage recorded",
            "itemName": doc.get('Item Name', item_name),
            "used": usage_quantity,
            "remaining": new_available
        })

    except Exception as e:
        print(f"[DEBUG] Error in add_inventory_usage: {str(e)}")
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
        threshold_date = today + timedelta(days=7)  # upcoming = within next 7 days

        # Fetch products where expiration_date is within the next 7 days
        upcoming_items = list(cart_collection.find(
            {
                "Expiry Date": {
                    "$gte": today,
                    "$lte": threshold_date
                }
            },
            {
                "_id": 0,
                "Item Name": 1,
                "Quantity Purchased": 1,
                "Quantity Used": 1,
                "Expiry Date": 1
            }
        ))

        # Process data for response
        processed_items = []
        for item in upcoming_items:
            expiration_date = item.get("Expiry Date")
            remaining_days = (expiration_date - today).days if expiration_date else None
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
    # 1. Connect to MongoDB
    mongo_url = settings.DATABASES['default']['CLIENT']['host']
    mongo_db = settings.DATABASES['default']['NAME']
    client = MongoClient(mongo_url)
    db = client[mongo_db]
    items_collection = db['inventory_items']  # Change 'items' to your actual collection name

    # 2. Fetch all item documents
    items = list(items_collection.find({}))

    # 3. Classify each item
    levels = {"understocked": [], "overstocked": [], "optimal": []}
    for item in items:
        current = item.get("Quantity Purchased", 0)
        recommended = item.get("Quantity Used", 0) + item.get("Quantity Wasted", 0)  # adjust as needed

        # Define thresholds
        shortage_percent = 0
        if recommended > 0:
            shortage_percent = int(round(100 * (recommended-current)/recommended, 1))
        
        # You can set your own logic for overstock, understock, optimal
        if current < recommended:
            levels["understocked"].append({
                "item_name": item["Item Name"],
                "current": current,
                "recommended": recommended,
                "shortage_percent": shortage_percent
            })
        elif current > recommended:
            levels["overstocked"].append({
                "item_name": item["Item Name"],
                "current": current,
                "recommended": recommended,
            })
        else:
            levels["optimal"].append({
                "item_name": item["Item Name"],
                "current": current,
                "recommended": recommended,
            })
    
    # 4. Return result as JSON
    return JsonResponse(levels)
