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
