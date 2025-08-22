# import os
# import json
# import random
# import nltk
# from nltk.tokenize import word_tokenize
# from textblob import TextBlob

# nltk.download("punkt")

# # Get path to this file's directory
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # Load intents.json from same folder as chatbot.py
# with open(os.path.join(BASE_DIR, "intents.json"), "r", encoding="utf-8") as file:
#     data = json.load(file)

# # Sentiment-based empathy message
# def get_sentiment_response(user_input):
#     blob = TextBlob(user_input)
#     polarity = blob.sentiment.polarity
#     if polarity < -0.2:
#         return "I'm really sorry you're experiencing this. Let's get it fixed fast!"
#     elif polarity > 0.2:
#         return "That's great to hear! How can I assist you further?"
#     else:
#         return ""  # neutral tone, no extra message

# # Match intent
# def get_response(user_input):
#     user_input = user_input.lower()
#     sentiment_message = get_sentiment_response(user_input)

#     for intent in data["intents"]:
#         for pattern in intent["patterns"]:
#             if all(word in user_input for word in word_tokenize(pattern.lower())):
#                 return sentiment_message + " " + random.choice(intent["responses"])

#     for intent in data["intents"]:
#         if intent["tag"] == "fallback":
#             return sentiment_message + " " + random.choice(intent["responses"])

#     return sentiment_message + " I'm not sure how to help with that."

# if __name__ == "__main__":
#     print("WasteNoBite Bot: Hello! I’m your Kitchenside assistance chatbot for your restaurant. Type 'quit' to exit.")
#     while True:
#         user_input = input("You: ")
#         if user_input.lower() in ["quit", "exit", "bye"]:
#             print("WasteNoBite Bot: Goodbye! Stay safe.")
#             break
#         response = get_response(user_input)
#         print("WasteNoBite Bot:", response.strip())




# loosen matching :
import os
import json
import random
import nltk
from nltk.tokenize import word_tokenize
from textblob import TextBlob

nltk.download("punkt")

# Get path to this file's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load intents.json from same folder as chatbot.py
with open(os.path.join(BASE_DIR, "intents.json"), "r", encoding="utf-8") as file:
    data = json.load(file)

# Sentiment-based empathy message
def get_sentiment_response(user_input):
    blob = TextBlob(user_input)
    polarity = blob.sentiment.polarity
    if polarity < -0.2:
        return "I'm really sorry you're experiencing this. Let's get it fixed fast!"
    elif polarity > 0.2:
        return "That's great to hear! How can I assist you further?"
    else:
        return ""  # neutral tone, no extra message

# Match intent using loosen matching (word overlap)
def get_response(user_input):
    user_input = user_input.lower()
    sentiment_message = get_sentiment_response(user_input)

    best_match = None
    best_score = 0
    input_words = set(word_tokenize(user_input))

    for intent in data["intents"]:
        for pattern in intent["patterns"]:
            pattern_words = set(word_tokenize(pattern.lower()))
            if not pattern_words:
                continue
            score = len(pattern_words & input_words) / len(pattern_words)  # Jaccard overlap

            if score > best_score:
                best_score = score
                best_match = intent

    if best_match and best_score > 0.3:  # threshold
        return sentiment_message + " " + random.choice(best_match["responses"])

    # fallback
    for intent in data["intents"]:
        if intent["tag"] == "fallback":
            return sentiment_message + " " + random.choice(intent["responses"])

    return sentiment_message + " I'm not sure how to help with that."

if __name__ == "__main__":
    print("WasteNoBite Bot: Hello! I’m your Kitchenside assistance chatbot for your restaurant. Type 'quit' to exit.")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["quit", "exit", "bye"]:
            print("WasteNoBite Bot: Goodbye! Stay safe.")
            break
        response = get_response(user_input)
        print("WasteNoBite Bot:", response.strip())




# fuzzy matching :

# import os
# import json
# import random
# import nltk
# from textblob import TextBlob
# from rapidfuzz import fuzz

# nltk.download("punkt")

# # Get path to this file's directory
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # Load intents.json from same folder as chatbot.py
# with open(os.path.join(BASE_DIR, "intents.json"), "r", encoding="utf-8") as file:
#     data = json.load(file)

# # Sentiment-based empathy message
# def get_sentiment_response(user_input):
#     blob = TextBlob(user_input)
#     polarity = blob.sentiment.polarity
#     if polarity < -0.2:
#         return "I'm really sorry you're experiencing this. Let's get it fixed fast!"
#     elif polarity > 0.2:
#         return "That's great to hear! How can I assist you further?"
#     else:
#         return ""  # neutral tone, no extra message

# # Match intent using fuzzy matching
# def get_response(user_input):
#     user_input = user_input.lower()
#     sentiment_message = get_sentiment_response(user_input)

#     best_match = None
#     best_score = 0

#     for intent in data["intents"]:
#         for pattern in intent["patterns"]:
#             score = fuzz.partial_ratio(user_input, pattern.lower())
#             if score > best_score:
#                 best_score = score
#                 best_match = intent

#     if best_match and best_score > 60:  # fuzzy threshold
#         return sentiment_message + " " + random.choice(best_match["responses"])

#     # fallback
#     for intent in data["intents"]:
#         if intent["tag"] == "fallback":
#             return sentiment_message + " " + random.choice(intent["responses"])

#     return sentiment_message + " I'm not sure how to help with that."

# if __name__ == "__main__":
#     print("WasteNoBite Bot: Hello! I’m your Kitchenside assistance chatbot for your restaurant. Type 'quit' to exit.")
#     while True:
#         user_input = input("You: ")
#         if user_input.lower() in ["quit", "exit", "bye"]:
#             print("WasteNoBite Bot: Goodbye! Stay safe.")
#             break
#         response = get_response(user_input)
#         print("WasteNoBite Bot:", response.strip())
