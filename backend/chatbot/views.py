
# import os
# import json
# from django.views.decorators.csrf import csrf_exempt
# from django.http import JsonResponse
# from django.views.decorators.http import require_POST
# import importlib.util

# # Dynamically import chatbot.py
# CHATBOT_DIR = os.path.dirname(os.path.abspath(__file__))
# CHATBOT_PY_PATH = os.path.join(CHATBOT_DIR, "chatbot.py")
# spec = importlib.util.spec_from_file_location("chatbot_module", CHATBOT_PY_PATH)
# chatbot_module = importlib.util.module_from_spec(spec)
# spec.loader.exec_module(chatbot_module)

# @require_POST
# @csrf_exempt
# def chatbot_api(request):
# 	try:
# 		data = json.loads(request.body.decode('utf-8'))
# 		user_message = data.get('message', '')
# 		if not user_message:
# 			return JsonResponse({'error': 'No message provided.'}, status=400)
# 		response = chatbot_module.get_response(user_message)
# 		return JsonResponse({'response': response})
# 	except Exception as e:
# 		return JsonResponse({'error': str(e)}, status=500)



import json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_POST

# Import directly from chatbot.py
from .chatbot import get_response


@require_POST
@csrf_exempt
def chatbot_api(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
        user_message = data.get("message", "")
        if not user_message:
            return JsonResponse({"error": "No message provided."}, status=400)

        response = get_response(user_message)
        return JsonResponse({"response": response})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
