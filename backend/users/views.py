import json
import jwt
import datetime
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile
import random
from django.core.mail import send_mail

otp_store = {}  # For demo only. Use DB or cache in production.

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
        username = data.get('email', '').strip().lower()
        password = data.get('password')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        restaurant = data.get('restaurant')
        phone = data.get('phone')

        required_fields = ['email', 'password', 'firstName', 'lastName', 'restaurant', 'phone']
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return JsonResponse({'error': f"Missing fields: {', '.join(missing)}"}, status=400)

        print("Checking for user:", username)
        print("Existing users:", list(User.objects.values_list('username', flat=True)))

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'User already exists'}, status=400)

        user = User.objects.create_user(
            username=username,
            email=username,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        UserProfile.objects.create(
            user=user,
            restaurant=restaurant,
            phone=phone
        )
        return JsonResponse({'message': 'User created successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('email')
        password = data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            profile = getattr(user, 'profile', None)
            return JsonResponse({'token': generate_jwt(user), 'user': {
                'id': user.id,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'restaurant': profile.restaurant if profile else "",
                'phone': profile.phone if profile else "",
            }})
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=400)

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
        if not User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'No user with this email'}, status=404)
        otp = str(random.randint(100000, 999999))
        otp_store[email] = otp
        print(f"[SEND OTP] OTP for {email} is now {otp_store[email]}")
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
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('new_password')
        print(f"[RESET PASSWORD] OTP for {email} is {otp_store.get(email)}, user entered {otp}")
        if otp_store.get(email) != otp:
            return JsonResponse({'error': 'Invalid or expired OTP'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'No user with this email'}, status=404)
        user.set_password(new_password)
        user.save()
        otp_store.pop(email, None)
        return JsonResponse({'message': 'Password reset successful'})
    else:
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
