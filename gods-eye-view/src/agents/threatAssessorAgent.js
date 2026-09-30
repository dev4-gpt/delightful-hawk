/**
 * ThreatAssessorAgent - DoD UFC 4-010-01 Blast & Fragmentation Specialist
 * 
 * Part of the Aetheris Agentic Defense Swarm (Google Antigravity SDK + ECC Framework)
 * Calculates peak incident overpressure (PSI), scaled distance (Z),
 * standoff compliance, and asset structural survivability under DoD UFC 4-010-01.
 */

export class ThreatAssessorAgent {
  constructor() {
    this.name = 'ThreatAssessorAgent';
    this.role = 'UFC 4-010-01 Blast & Fragmentation Specialist';
    
    // Asset hardness specifications (MIL-HDBK-1008C / STANAG 4569)
    this.facilitySpecs = Object.freeze({
      'TAOC-BUNKER': {
        name: 'Underground TAOC Command Bunker',
        blastRatingPsi: 65.0, // Subterranean reinforced C50/60 concrete
        stanagLevel: 'STANAG 4569 Level 4',
        criticality: 'CAT-1 CRITICAL'
      },
      'HAS-01': {
        name: 'HAS-01 Hardened Aircraft Shelter',
        blastRatingPsi: 30.0, // Corrugated reinforced arch with blast doors
        stanagLevel: 'STANAG 4569 Level 4',
        criticality: 'CAT-1 CRITICAL'
      },
      'HAS-02': {
        name: 'HAS-02 Hardened Aircraft Shelter',
        blastRatingPsi: 30.0,
        stanagLevel: 'STANAG 4569 Level 4',
        criticality: 'CAT-1 CRITICAL'
      },
      'RADAR-MAST': {
        name: 'Ku-Band 3D AESA Radar Mast',
        blastRatingPsi: 8.5, // Unhardened lattice structure
        stanagLevel: 'STANAG 4569 Level 1',
        criticality: 'CAT-2 ESSENTIAL'
      },
      'INTERCEPTOR-PODS': {
        name: 'Low-Cost Interceptor Canisters',
        blastRatingPsi: 15.0, // Armored steel quad-canister
        stanagLevel: 'STANAG 4569 Level 2',
        criticality: 'CAT-2 EFFECTOR'
      }
    });
  }

  /**
   * Computes scaled distance Z = R / (W^(1/3)) in m / kg^(1/3).
   * @param {number} standoffMeters - Distance from blast detonation point (m)
   * @param {number} warheadKg - Explosive charge mass in TNT equivalent (kg)
   * @returns {number} Scaled distance Z
   */
  calculateScaledDistance(standoffMeters, warheadKg) {
    const r = Math.max(1, standoffMeters);
    const w = Math.max(0.5, warheadKg);
    return Number((r / Math.cbrt(w)).toFixed(2));
  }

  /**
   * Calculates peak incident overpressure (PSI) using Kingery-Bulmash empirical fit.
   * @param {number} standoffMeters - Distance from detonation (m)
   * @param {number} warheadKg - Warhead weight TNT eq (kg)
   * @returns {number} Peak overpressure in PSI
   */
  calculatePeakOverpressurePsi(standoffMeters, warheadKg) {
    const Z = this.calculateScaledDistance(standoffMeters, warheadKg);
    // Standard Kingery-Bulmash scaled overpressure equation (calibrated in kPa, converted to PSI)
    // For near-to-mid range air blast (Z < 5 m/kg^(1/3)):
    const pKpa = (120.0 / Z) + (450.0 / Math.pow(Z, 2)) + (1100.0 / Math.pow(Z, 3));
    const pPsi = pKpa / 6.89476;
    return Number(Math.max(0.5, pPsi).toFixed(2));
  }

  /**
   * Evaluates blast effects against all airfield assets according to UFC 4-010-01.
   * @param {Object} params
   * @param {number} params.warheadKg - Threat warhead weight (kg TNT eq, default 50kg for Shahed-136)
   * @param {number} params.standoffBufferMeters - Perimeter standoff distance (m)
   * @returns {Object} Comprehensive threat assessment
   */
  evaluateThreat(params) {
    const warheadKg = Math.max(5, params.warheadKg ?? 50);
    const standoffM = Math.max(10, params.standoffBufferMeters ?? 45);
    const overpressurePsi = this.calculatePeakOverpressurePsi(standoffM, warheadKg);
    const scaledDistance = this.calculateScaledDistance(standoffM, warheadKg);

    const assetSurvivals = {};
    let allCriticalSurvive = true;

    for (const [key, asset] of Object.entries(this.facilitySpecs)) {
      const survives = overpressurePsi <= asset.blastRatingPsi;
      assetSurvivals[key] = {
        name: asset.name,
        blastRatingPsi: asset.blastRatingPsi,
        incidentPsi: overpressurePsi,
        survives,
        safetyMarginPsi: Number((asset.blastRatingPsi - overpressurePsi).toFixed(2))
      };
      if (asset.criticality === 'CAT-1 CRITICAL' && !survives) {
        allCriticalSurvive = false;
      }
    }

    const fragmentRadiusM = Number((18.5 * Math.pow(warheadKg, 0.4)).toFixed(1));
    const isFragmentHazard = standoffM < fragmentRadiusM;

    let verdictStatus = 'SURVIVABLE';
    if (!allCriticalSurvive) {
      verdictStatus = 'CRITICAL BREACH';
    } else if (isFragmentHazard) {
      verdictStatus = 'FRAGMENTATION HAZARD';
    }

    return {
      agent: this.name,
      status: 'NOMINAL',
      timestamp: Date.now(),
      warheadKg,
      standoffMeters: standoffM,
      scaledDistanceZ: scaledDistance,
      peakOverpressurePsi: overpressurePsi,
      fragmentRadiusMeters: fragmentRadiusM,
      isFragmentHazard,
      allCriticalSurvive,
      verdictStatus,
      structuralClassification: allCriticalSurvive ? 'SURVIVABLE (C50/60 RC)' : 'CATASTROPHIC BREACH',
      assetAssessments: assetSurvivals,
      telemetryVerdict: allCriticalSurvive
        ? `🛡️ UFC 4-010-01 PASSED: ${overpressurePsi} PSI blast mitigated by ${standoffM}m standoff buffer. CAT-1 assets intact.`
        : `🚨 UFC 4-010-01 FAILED: ${overpressurePsi} PSI exceeds CAT-1 shelter threshold (30 PSI)! Standoff must be expanded.`
    };
  }
}
