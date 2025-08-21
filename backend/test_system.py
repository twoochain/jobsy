#!/usr/bin/env python3
# test_system.py - Sistem test scripti
import requests
import time
import sys
import os

def test_system():
    """Ana sistemi test et"""
    print("🧪 Jobsy AI API Sistem Testi")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # 1. Ana endpoint testi
    print("\n1️⃣ Ana Endpoint Testi")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Message: {data.get('message', 'N/A')}")
            print(f"   Version: {data.get('version', 'N/A')}")
            print(f"   Endpoints: {len(data.get('endpoints', {}))}")
            print("   ✅ Ana endpoint çalışıyor")
        else:
            print(f"   ❌ Hata: {response.text}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Sunucu bağlantısı kurulamadı")
        print("   💡 Sunucunun çalıştığından emin olun: python main.py")
        return False
    except Exception as e:
        print(f"   ❌ Bağlantı hatası: {e}")
        return False
    
    # 2. Health check testi
    print("\n2️⃣ Health Check Testi")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status', 'N/A')}")
            print("   ✅ Health check çalışıyor")
        else:
            print(f"   ❌ Hata: {response.text}")
    except Exception as e:
        print(f"   ❌ Health check hatası: {e}")
    
    # 3. API dokümantasyonu testi
    print("\n3️⃣ API Dokümantasyonu Testi")
    try:
        response = requests.get(f"{base_url}/docs", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Swagger UI erişilebilir")
        else:
            print(f"   ❌ Hata: {response.text}")
    except Exception as e:
        print(f"   ❌ API docs hatası: {e}")
    
    # 4. ChromaDB endpoint testi
    print("\n4️⃣ ChromaDB Endpoint Testi")
    try:
        response = requests.get(f"{base_url}/chroma/stats", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Collection: {data.get('collection_name', 'N/A')}")
            print(f"   Documents: {data.get('total_documents', 'N/A')}")
            print("   ✅ ChromaDB çalışıyor")
        else:
            print(f"   ❌ Hata: {response.text}")
    except Exception as e:
        print(f"   ❌ ChromaDB hatası: {e}")
    
    print("\n" + "=" * 50)
    print("📚 API Dokümantasyonu: http://localhost:8000/docs")
    print("🔍 ReDoc: http://localhost:8000/redoc")
    print("💡 ChromaDB: http://localhost:8000/chroma/stats")
    
    return True

def check_dependencies():
    """Gerekli paketleri kontrol et"""
    print("🔍 Bağımlılık Kontrolü")
    print("-" * 30)
    
    required_packages = [
        "fastapi",
        "uvicorn", 
        "chromadb",
        "sentence-transformers",
        "requests"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package}")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️ Eksik paketler: {', '.join(missing_packages)}")
        print("💡 Kurulum: pip install -r requirements.txt")
        return False
    
    print("\n✅ Tüm bağımlılıklar mevcut")
    return True

def main():
    """Ana test fonksiyonu"""
    print("🚀 Jobsy AI Backend Sistem Testi")
    print("=" * 60)
    
    # Bağımlılıkları kontrol et
    if not check_dependencies():
        print("\n❌ Test başarısız - eksik bağımlılıklar")
        sys.exit(1)
    
    # Sistemi test et
    if test_system():
        print("\n✅ Sistem testi başarılı!")
    else:
        print("\n❌ Sistem testi başarısız!")
        print("💡 Sunucuyu başlatın: python main.py")

if __name__ == "__main__":
    main()
