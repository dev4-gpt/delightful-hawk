from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class GeoPoint(BaseModel):
    lat: float
    lon: float
    alt_m: Optional[float] = None

class SpatialAnomaly(BaseModel):
    anomaly_id: str
    domain: Literal['maritime', 'orbital', 'energy', 'disaster']
    severity: Literal['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    confidence: float
    coordinates: GeoPoint
    h3_index: str
    description: str
    recommended_action: str
    data_sources: List[str]

class CrossDomainAssessment(BaseModel):
    assessment_id: str
    timestamp: str
    target_region: str
    active_cartridges: List[str]
    anomalies: List[SpatialAnomaly]
    threat_correlation: Optional[str] = None
    executive_summary: str
    security_cleared: bool
