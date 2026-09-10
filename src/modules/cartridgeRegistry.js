// gods-eye-view/src/modules/cartridgeRegistry.js
/**
 * Aetheris Modular Cartridge Registry
 * Manages domain intelligence modules (SentinelMesh, OrbitalOps, GridTwin, GeoRisk)
 * on top of the shared 3D globe and telemetry engine.
 */

export const CARTRIDGE_IDS = {
  SENTINEL_MESH: 'sentinel-mesh',
  ORBITAL_OPS: 'orbital-ops',
  GRID_TWIN: 'grid-twin',
  GEO_RISK: 'geo-risk'
};

class CartridgeRegistry {
  constructor() {
    this._cartridges = new Map();
    this._activeCartridgeId = null;
    this._listeners = new Set();
  }

  /**
   * Registers a domain intelligence cartridge
   * @param {Object} cartridge Cartridge definition
   * @param {string} cartridge.id Unique identifier
   * @param {string} cartridge.title Display title
   * @param {string} cartridge.category Category (Defense, Space, Energy, Climate)
   * @param {Function} cartridge.onActivate Callback when module becomes active
   * @param {Function} cartridge.onDeactivate Callback when module becomes inactive
   * @param {Function} cartridge.evaluateAlerts Function to evaluate domain alerts
   */
  register(cartridge) {
    if (!cartridge.id) throw new Error('Cartridge must have a valid id');
    this._cartridges.set(cartridge.id, {
      ...cartridge,
      registeredAt: Date.now()
    });
  }

  /**
   * Lists all available registered cartridges
   */
  list() {
    return Array.from(this._cartridges.values()).map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      description: c.description || '',
      isActive: c.id === this._activeCartridgeId
    }));
  }

  /**
   * Gets the currently active cartridge
   */
  getActiveCartridge() {
    return this._activeCartridgeId ? this._cartridges.get(this._activeCartridgeId) : null;
  }

  /**
   * Activates a cartridge by ID
   */
  activate(cartridgeId, context = {}) {
    if (!this._cartridges.has(cartridgeId)) {
      throw new Error(`Cartridge '${cartridgeId}' is not registered`);
    }

    if (this._activeCartridgeId && this._activeCartridgeId !== cartridgeId) {
      const prior = this._cartridges.get(this._activeCartridgeId);
      if (typeof prior.onDeactivate === 'function') {
        prior.onDeactivate(context);
      }
    }

    this._activeCartridgeId = cartridgeId;
    const current = this._cartridges.get(cartridgeId);
    if (typeof current.onActivate === 'function') {
      current.onActivate(context);
    }

    this._notifyListeners('activated', current);
    return current;
  }

  /**
   * Deactivates the currently active cartridge
   */
  deactivate(context = {}) {
    if (!this._activeCartridgeId) return null;
    const prior = this._cartridges.get(this._activeCartridgeId);
    if (typeof prior.onDeactivate === 'function') {
      prior.onDeactivate(context);
    }
    this._activeCartridgeId = null;
    this._notifyListeners('deactivated', prior);
    return prior;
  }

  /**
   * Subscribe to cartridge state changes
   */
  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners(event, cartridge) {
    for (const listener of this._listeners) {
      try {
        listener({ event, cartridge });
      } catch (err) {
        console.error('Cartridge listener error:', err);
      }
    }
  }
}

export const cartridgeRegistry = new CartridgeRegistry();
