import pytest
from schemas.anomaly_report import GeoPoint, SpatialAnomaly, CrossDomainAssessment
from hooks.geo_error_recovery import GeoErrorRecoveryHook

def test_anomaly_report_schema():
    point = GeoPoint(lat=34.0, lon=-118.0)
    anomaly = SpatialAnomaly(
        anomaly_id="a1",
        domain="maritime",
        severity="HIGH",
        confidence=0.85,
        coordinates=point,
        h3_index="8abc123",
        description="Suspicious vessel loitering.",
        recommended_action="Dispatch coast guard.",
        data_sources=["AIS"]
    )
    assessment = CrossDomainAssessment(
        assessment_id="assm1",
        timestamp="2026-09-10T00:00:00Z",
        target_region="Pacific",
        active_cartridges=["sentinel_mesh"],
        anomalies=[anomaly],
        executive_summary="High severity maritime anomaly detected.",
        security_cleared=True
    )
    
    assert assessment.security_cleared is True
    assert len(assessment.anomalies) == 1
    assert assessment.anomalies[0].severity == "HIGH"

def test_geo_error_recovery_hook():
    hook = GeoErrorRecoveryHook()
    # Mock CRS error
    err1 = Exception("Invalid projection found.")
    res1 = hook.on_tool_error("some_tool", {}, err1)
    assert "reproject" in res1
    
    # Mock OutOfBounds error
    err2 = Exception("Coordinates are out of bounds.")
    res2 = hook.on_tool_error("some_tool", {}, err2)
    assert "constrain" in res2

    # Mock rate limit
    err3 = Exception("Rate limit reached")
    res3 = hook.on_tool_error("some_tool", {}, err3)
    assert "backoff" in res3
