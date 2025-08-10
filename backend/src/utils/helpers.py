import requests
from fastapi import HTTPException
from typing import Dict, Any

def make_api_request(url: str, method: str = "GET", headers: Dict = None, 
                    params: Dict = None, json_data: Dict = None) -> Dict[str, Any]:
    """
    API istekleri için genel yardımcı fonksiyon
    
    Args:
        url: İstek yapılacak URL
        method: HTTP metodu (GET, POST, vb.)
        headers: İstek başlıkları
        params: URL parametreleri
        json_data: JSON verisi (POST istekleri için)
    
    Returns:
        API yanıtı
    
    Raises:
        HTTPException: İstek başarısız olduğunda
    """
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=json_data)
        else:
            raise ValueError(f"Desteklenmeyen HTTP metodu: {method}")
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

def validate_required_fields(data: Dict[str, Any], required_fields: list) -> None:
    """
    Gerekli alanların varlığını kontrol eder
    
    Args:
        data: Kontrol edilecek veri
        required_fields: Gerekli alan listesi
    
    Raises:
        HTTPException: Gerekli alan eksikse
    """
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        raise HTTPException(
            status_code=400, 
            detail=f"Eksik gerekli alanlar: {', '.join(missing_fields)}"
        )
