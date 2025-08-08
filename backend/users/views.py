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
