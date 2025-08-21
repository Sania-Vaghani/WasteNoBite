from inference_sdk import InferenceHTTPClient
import json

client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="qZWB0xK4Jmb2G9iembwf"
)

def analyze_image(image_path: str):
    """Runs Roboflow workflow and returns cleaned JSON"""
    result = client.run_workflow(
        workspace_name="saniya-vaghani-fzzgu",
        workflow_id="detect-count-and-visualize",
        images={"image": image_path},
        use_cache=True
    )

    if isinstance(result, list) and len(result) > 0:
        data = result[0]
    else:
        data = result
        
        

    # Wire the response as-is
    cleaned = {
        "google_gemini": data.get("google_gemini", {}).get("output", ""),
        "google_gemini_1": data.get("google_gemini_1", {}).get("output", "")
    }

    return cleaned
