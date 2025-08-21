import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .ai_service import AIService
from ..models.schemas import ApplicationData as Application
import logging

# Logging ayarla
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SearchService:
    """Gelişmiş arama ve öneri servisi"""
    
    def __init__(self):
        try:
            self.ai_service = AIService()
            self.ai_available = True
        except Exception as e:
            logger.warning(f"AI Service başlatılamadı: {e}")
            self.ai_service = None
            self.ai_available = False
        
    async def search_applications(
        self, 
        applications: List[Application], 
        query: str,
        filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Başvuruları akıllı arama ile filtrele"""
        
        if not query.strip() and not filters:
            return {
                "results": applications,
                "total": len(applications),
                "query": query,
                "filters": filters
            }
        
        results = []
        query_lower = query.lower().strip()
        
        for app in applications:
            score = 0
            match_reasons = []
            
            # Metin arama
            if query_lower:
                # Şirket adı arama
                if hasattr(app, 'company_name') and app.company_name and query_lower in app.company_name.lower():
                    score += 10
                    match_reasons.append("Şirket adı eşleşmesi")
                
                # Pozisyon arama
                if hasattr(app, 'position') and app.position and query_lower in app.position.lower():
                    score += 8
                    match_reasons.append("Pozisyon eşleşmesi")
                
                # Açıklama arama
                if hasattr(app, 'description') and app.description:
                    if query_lower in app.description.lower():
                        score += 5
                        match_reasons.append("Açıklama eşleşmesi")
                
                # Gereksinimler arama
                if hasattr(app, 'requirements') and app.requirements:
                    if query_lower in app.requirements.lower():
                        score += 6
                        match_reasons.append("Gereksinim eşleşmesi")
                
                # Konum arama
                if hasattr(app, 'location') and app.location:
                    if query_lower in app.location.lower():
                        score += 4
                        match_reasons.append("Konum eşleşmesi")
            
            # Filtreler
            if filters:
                if not self._apply_filters(app, filters):
                    continue
            
            if score > 0 or not query_lower:
                app_with_score = app.copy() if hasattr(app, 'copy') else app
                app_with_score.search_score = score
                app_with_score.match_reasons = match_reasons
                results.append(app_with_score)
        
        # Skora göre sırala
        results.sort(key=lambda x: getattr(x, 'search_score', 0), reverse=True)
        
        return {
            "results": results,
            "total": len(results),
            "query": query,
            "filters": filters,
            "search_metadata": {
                "execution_time": datetime.now().isoformat(),
                "total_applications": len(applications)
            }
        }
    
    def _apply_filters(self, app: Application, filters: Dict[str, Any]) -> bool:
        """Filtreleri uygula"""
        
        # Durum filtresi
        if 'status' in filters and filters['status']:
            if not hasattr(app, 'application_status') or app.application_status not in filters['status']:
                return False
        
        # Aşama filtresi
        if 'stage' in filters and filters['stage']:
            if not hasattr(app, 'next_action') or app.next_action not in filters['stage']:
                return False
        
        # Tarih aralığı filtresi
        if 'date_range' in filters and filters['date_range']:
            start_date = filters['date_range'].get('start')
            end_date = filters['date_range'].get('end')
            
            if start_date and (not hasattr(app, 'email_date') or not app.email_date or app.email_date < start_date):
                return False
            if end_date and (not hasattr(app, 'email_date') or not app.email_date or app.email_date > end_date):
                return False
        
        # Şirket filtresi
        if 'company' in filters and filters['company']:
            if not hasattr(app, 'company_name') or not app.company_name or filters['company'].lower() not in app.company_name.lower():
                return False
        
        # Pozisyon filtresi
        if 'position' in filters and filters['position']:
            if not hasattr(app, 'position') or not app.position or filters['position'].lower() not in app.position.lower():
                return False
        
        return True
    
    async def generate_ai_recommendations(
        self, 
        applications: List[Application],
        user_profile: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """AI tabanlı kişiselleştirilmiş öneriler oluştur"""
        
        recommendations = []
        
        # Başvuru durumu analizi
        active_apps = [app for app in applications if hasattr(app, 'application_status') and app.application_status in ['active', 'pending']]
        finished_apps = [app for app in applications if hasattr(app, 'application_status') and app.application_status in ['finished', 'rejected', 'accepted']]
        
        # Başarı oranı hesapla
        success_rate = len([app for app in finished_apps if hasattr(app, 'application_status') and app.application_status == 'accepted']) / len(finished_apps) if finished_apps else 0
        
        # Aşama bazlı öneriler
        stage_recommendations = await self._analyze_stages(active_apps)
        recommendations.extend(stage_recommendations)
        
        # Şirket bazlı öneriler
        company_recommendations = await self._analyze_companies(applications)
        recommendations.extend(company_recommendations)
        
        # Trend bazlı öneriler
        trend_recommendations = await self._analyze_trends(applications)
        recommendations.extend(trend_recommendations)
        
        # AI tabanlı kişiselleştirilmiş öneriler
        if user_profile and self.ai_available:
            try:
                personalized_recommendations = await self._generate_personalized_recommendations(
                    applications, user_profile
                )
                recommendations.extend(personalized_recommendations)
            except Exception as e:
                logger.error(f"AI önerileri oluşturulamadı: {e}")
                # AI önerileri olmadan devam et
        
        # Önerileri öncelik sırasına göre sırala
        recommendations.sort(key=lambda x: x.get('priority_score', 0), reverse=True)
        
        # Eğer hiç öneri yoksa, temel öneriler ekle
        if not recommendations:
            recommendations = self._generate_fallback_recommendations(applications)
        
        return recommendations[:10]  # En iyi 10 öneriyi döndür
    
    def _get_current_timestamp(self) -> str:
        """Mevcut timestamp'i ISO formatında döndür"""
        return datetime.now().isoformat()
    
    async def _analyze_stages(self, active_apps: List[Application]) -> List[Dict[str, Any]]:
        """Aşama bazlı analiz ve öneriler"""
        
        recommendations = []
        stage_counts = {}
        
        for app in active_apps:
            stage = getattr(app, 'next_action', 'Bilinmiyor')
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
        
        # En çok başvuru olan aşamalar için öneriler
        for stage, count in stage_counts.items():
            if count > 1:
                if 'Mülakat' in stage:
                    recommendations.append({
                        'type': 'stage_optimization',
                        'title': 'Mülakat Hazırlığı',
                        'description': f'{count} mülakat aşamasında başvurunuz var. Toplu hazırlık yapın.',
                        'priority_score': 8,
                        'icon': '💼',
                        'action': 'mülakat_hazirlik',
                        'stage': stage
                    })
                elif 'Test' in stage:
                    recommendations.append({
                        'type': 'stage_optimization',
                        'title': 'Teknik Test Hazırlığı',
                        'description': f'{count} teknik test aşamasında başvurunuz var. Algoritma pratiği yapın.',
                        'priority_score': 9,
                        'icon': '🧪',
                        'action': 'teknik_test_hazirlik',
                        'stage': stage
                    })
        
        return recommendations
    
    async def _analyze_companies(self, applications: List[Application]) -> List[Dict[str, Any]]:
        """Şirket bazlı analiz ve öneriler"""
        
        recommendations = []
        company_stats = {}
        
        for app in applications:
            company = getattr(app, 'company_name', 'Bilinmiyor')
            if company not in company_stats:
                company_stats[company] = {
                    'total': 0,
                    'active': 0,
                    'accepted': 0,
                    'rejected': 0
                }
            
            company_stats[company]['total'] += 1
            if hasattr(app, 'application_status') and app.application_status in ['active', 'pending']:
                company_stats[company]['active'] += 1
            elif hasattr(app, 'application_status') and app.application_status == 'accepted':
                company_stats[company]['accepted'] += 1
            elif hasattr(app, 'application_status') and app.application_status == 'rejected':
                company_stats[company]['rejected'] += 1
        
        # Şirket bazlı öneriler
        for company, stats in company_stats.items():
            if stats['total'] >= 2:
                if stats['rejected'] > stats['accepted']:
                    recommendations.append({
                        'type': 'company_optimization',
                        'title': f'{company} Stratejisi',
                        'description': f'{company} için {stats["rejected"]} red, {stats["accepted"]} kabul. Stratejiyi gözden geçirin.',
                        'priority_score': 7,
                        'icon': '🏢',
                        'action': 'sirket_stratejisi',
                        'company': company
                    })
        
        return recommendations
    
    async def _analyze_trends(self, applications: List[Application]) -> List[Dict[str, Any]]:
        """Trend analizi ve öneriler"""
        
        recommendations = []
        
        # Son 30 günlük başvuru trendi
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_apps = [app for app in applications if hasattr(app, 'email_date') and app.email_date and app.email_date >= thirty_days_ago.strftime('%Y-%m-%d')]
        
        if len(recent_apps) < 5:
            recommendations.append({
                'type': 'trend_optimization',
                'title': 'Başvuru Aktivitesi Düşük',
                'description': 'Son 30 günde sadece {len(recent_apps)} başvuru. Daha aktif olun.',
                'priority_score': 6,
                'icon': '📈',
                'action': 'basvuru_artir',
                'trend': 'low_activity'
            })
        
        return recommendations
    
    async def _generate_personalized_recommendations(
        self, 
        applications: List[Application], 
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """AI tabanlı kişiselleştirilmiş öneriler"""
        
        recommendations = []
        
        # Kullanıcı profilini analiz et
        skills = user_profile.get('skills', [])
        experience = user_profile.get('experience', 0)
        preferred_companies = user_profile.get('preferred_companies', [])
        
        # AI prompt oluştur
        prompt = f"""
        Kullanıcı profili:
        - Deneyim: {experience} yıl
        - Beceriler: {', '.join(skills)}
        - Tercih edilen şirketler: {', '.join(preferred_companies)}
        
        Mevcut başvurular: {len(applications)} adet
        
        Bu kullanıcı için 3 kişiselleştirilmiş kariyer önerisi ver:
        1. Beceri geliştirme önerisi
        2. Şirket hedefleme önerisi
        3. Başvuru stratejisi önerisi
        
        Her öneri için:
        - Başlık
        - Açıklama
        - Öncelik puanı (1-10)
        - Aksiyon önerisi
        """
        
        try:
            if not self.ai_available or not self.ai_service:
                logger.warning("AI Service kullanılamıyor")
                return recommendations
            
            ai_response = await self.ai_service.generate_ai_response(prompt)
            
            # AI yanıtını parse et ve önerilere dönüştür
            if ai_response and 'candidates' in ai_response:
                for candidate in ai_response['candidates']:
                    if 'content' in candidate and 'parts' in candidate['content']:
                        content = candidate['content']['parts'][0].get('text', '')
                        
                        # AI yanıtını öneri formatına dönüştür
                        recommendation = self._parse_ai_recommendation(content)
                        if recommendation:
                            recommendations.append(recommendation)
            
        except Exception as e:
            logger.error(f"AI öneri hatası: {e}")
            # Hata durumunda boş liste döndür, uygulama çökmemeli
        
        return recommendations
    
    def _parse_ai_recommendation(self, ai_text: str) -> Optional[Dict[str, Any]]:
        """AI yanıtını öneri formatına dönüştür"""
        
        try:
            # Basit parsing - gerçek uygulamada daha gelişmiş olabilir
            lines = ai_text.split('\n')
            title = ""
            description = ""
            
            for line in lines:
                if ':' in line:
                    if 'Başlık' in line:
                        title = line.split(':')[1].strip()
                    elif 'Açıklama' in line:
                        description = line.split(':')[1].strip()
            
            if title and description:
                return {
                    'type': 'ai_personalized',
                    'title': title,
                    'description': description,
                    'priority_score': 8,
                    'icon': '🤖',
                    'action': 'ai_oneri',
                    'source': 'AI'
                }
        
        except Exception as e:
            logger.error(f"AI öneri parse hatası: {e}")
        
        return None
    
    def _generate_fallback_recommendations(self, applications: List[Application]) -> List[Dict[str, Any]]:
        """AI çalışmasa bile temel öneriler oluştur"""
        
        recommendations = []
        
        # Genel öneriler
        recommendations.append({
            'type': 'fallback',
            'title': 'Başvuru Takibi',
            'description': 'Başvurularınızı düzenli olarak takip edin ve güncelleyin.',
            'priority_score': 5,
            'icon': '📋',
            'action': 'basvuru_takip',
            'source': 'Sistem'
        })
        
        recommendations.append({
            'type': 'fallback',
            'title': 'CV Güncelleme',
            'description': 'CV\'nizi güncel tutun ve yeni deneyimlerinizi ekleyin.',
            'priority_score': 6,
            'icon': '📝',
            'action': 'cv_guncelle',
            'source': 'Sistem'
        })
        
        recommendations.append({
            'type': 'fallback',
            'title': 'Ağ Kurma',
            'description': 'LinkedIn ve profesyonel ağınızı genişletin.',
            'priority_score': 4,
            'icon': '🌐',
            'action': 'ag_kur',
            'source': 'Sistem'
        })
        
        return recommendations
