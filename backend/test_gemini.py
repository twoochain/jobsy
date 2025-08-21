#!/usr/bin/env python3
"""
Gemini API Endpoint Test Script
"""

import requests
import json

def test_gemini_endpoint():
    """Gemini API endpoint'ini test eder"""
    
    print("🧪 Gemini API Endpoint Testi")
    print("=" * 50)
    
    # Test data
    test_data = {
        "job_text": "Google'da Senior Software Engineer pozisyonu açıldı. Python, JavaScript, React deneyimi gerekli. İstanbul'da çalışacak."
    }
    
    try:
        print(f"📤 Test verisi: {test_data['job_text'][:50]}...")
        print(f"🌐 Endpoint: http://localhost:8000/ai/analyze-job-posting")
        
        # POST request gönder
        response = requests.post(
            "http://localhost:8000/ai/analyze-job-posting",
            json=test_data,
            timeout=30
        )
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        # Response body'yi al
        try:
            response_data = response.json()
            print(f"📊 Response Data: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"📝 Raw Response: {response.text}")
        
        # Success kontrolü
        if response.status_code == 200:
            if response_data.get("success"):
                print("✅ Gemini API başarılı!")
            else:
                print(f"❌ Gemini API hatası: {response_data.get('error', 'Bilinmeyen hata')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request Error: {e}")
    except Exception as e:
        print(f"💥 Unexpected Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_gemini_endpoint()
