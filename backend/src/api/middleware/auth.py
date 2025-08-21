from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Basit kullanıcı doğrulama - gerçek uygulamada JWT token ile yapılır"""
    # Şimdilik basit bir doğrulama - gerçek uygulamada JWT token decode edilir
    if not credentials:
        return {
            "success": False,
            "error": "Geçersiz kimlik bilgileri",
            "message": "Kimlik doğrulama gerekli",
            "status_code": status.HTTP_401_UNAUTHORIZED
        }
    
    # Basit email formatı kontrolü
    email = credentials.credentials
    if "@" not in email:
        return {
            "success": False,
            "error": "Geçersiz email formatı",
            "message": "Email formatı geçersiz",
            "status_code": status.HTTP_401_UNAUTHORIZED
        }
    
    return {"success": True, "email": email}
