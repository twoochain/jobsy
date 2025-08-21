#!/usr/bin/env python3
"""
Jobsy AI Backend Kurulum Scripti
Bu script gerekli paketleri kurar ve temel konfigürasyonu yapar
"""

import os
import sys
import subprocess
import shutil

def run_command(command, description):
    """Komut çalıştır ve sonucu göster"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} başarılı")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} başarısız: {e}")
        if e.stdout:
            print(f"   Çıktı: {e.stdout}")
        if e.stderr:
            print(f"   Hata: {e.stderr}")
        return False

def check_python_version():
    """Python versiyonunu kontrol et"""
    print("🐍 Python versiyonu kontrol ediliyor...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ gerekli, mevcut: {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def create_directories():
    """Gerekli dizinleri oluştur"""
    print("\n📁 Dizinler oluşturuluyor...")
    
    directories = [
        "data",
        "data/chroma",
        "logs",
        "uploads"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"   ✅ {directory}")
    
    return True

def install_packages():
    """Gerekli paketleri kur"""
    print("\n📦 Paketler kuruluyor...")
    
    # Temel paketler
    basic_packages = [
        "fastapi",
        "uvicorn[standard]",
        "chromadb",
        "sentence-transformers",
        "requests",
        "python-dotenv",
        "beautifulsoup4",
        "langdetect"
    ]
    
    for package in basic_packages:
        if not run_command(f"pip install {package}", f"{package} kuruluyor"):
            return False
    
    return True

def create_env_file():
    """Environment dosyası oluştur"""
    print("\n🔧 Environment dosyası oluşturuluyor...")
    
    if os.path.exists(".env"):
        print("   ⚠️ .env dosyası zaten mevcut")
        return True
    
    try:
        shutil.copy("env.example", ".env")
        print("   ✅ .env dosyası oluşturuldu")
        print("   💡 Lütfen .env dosyasını düzenleyin")
        return True
    except Exception as e:
        print(f"   ❌ .env dosyası oluşturulamadı: {e}")
        return False

def test_imports():
    """Temel import'ları test et"""
    print("\n🧪 Import testleri...")
    
    try:
        import fastapi
        print("   ✅ FastAPI")
        
        import uvicorn
        print("   ✅ Uvicorn")
        
        import chromadb
        print("   ✅ ChromaDB")
        
        import sentence_transformers
        print("   ✅ Sentence Transformers")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Import hatası: {e}")
        return False

def main():
    """Ana kurulum fonksiyonu"""
    print("🚀 Jobsy AI Backend Kurulum Scripti")
    print("=" * 50)
    
    # Python versiyonu kontrol
    if not check_python_version():
        print("\n❌ Kurulum başarısız - Python versiyonu uygun değil")
        sys.exit(1)
    
    # Dizinleri oluştur
    if not create_directories():
        print("\n❌ Kurulum başarısız - dizinler oluşturulamadı")
        sys.exit(1)
    
    # Paketleri kur
    if not install_packages():
        print("\n❌ Kurulum başarısız - paketler kurulamadı")
        sys.exit(1)
    
    # Environment dosyası oluştur
    if not create_env_file():
        print("\n⚠️ Environment dosyası oluşturulamadı")
    
    # Import testleri
    if not test_imports():
        print("\n❌ Kurulum başarısız - import testleri başarısız")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 Kurulum tamamlandı!")
    print("\n📋 Sonraki adımlar:")
    print("   1. .env dosyasını düzenleyin")
    print("   2. python main.py ile sunucuyu başlatın")
    print("   3. python test_system.py ile test edin")
    print("\n📚 Dokümantasyon: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
