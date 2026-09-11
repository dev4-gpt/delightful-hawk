/**
 * Validation definitions and JSON schema specifications for tools.
 * @module schemas/toolSchemas
 */

export const schemas = {
  calculate_distance_and_heading: {
    type: "object",
    properties: {
      lat1: { type: "number", minimum: -90, maximum: 90 },
      lon1: { type: "number", minimum: -180, maximum: 180 },
      lat2: { type: "number", minimum: -90, maximum: 90 },
      lon2: { type: "number", minimum: -180, maximum: 180 }
    },
    required: ["lat1", "lon1", "lat2", "lon2"]
  },
  evaluate_line_of_sight: {
    type: "object",
    properties: {
      observerLat: { type: "number", minimum: -90, maximum: 90 },
      observerLon: { type: "number", minimum: -180, maximum: 180 },
      observerAlt: { type: "number", minimum: 0 },
      targetLat: { type: "number", minimum: -90, maximum: 90 },
      targetLon: { type: "number", minimum: -180, maximum: 180 },
      targetAlt: { type: "number", minimum: 0 }
    },
    required: ["observerLat", "observerLon", "observerAlt", "targetLat", "targetLon", "targetAlt"]
  },
  detect_subsea_cable_threat: {
    type: "object",
    properties: {
      cableId: { type: "string" },
      vesselLat: { type: "number", minimum: -90, maximum: 90 },
      vesselLon: { type: "number", minimum: -180, maximum: 180 },
      vesselSpeedKnots: { type: "number", minimum: 0 },
      vesselHeading: { type: "number", minimum: 0, maximum: 360 }
    },
    required: ["cableId", "vesselLat", "vesselLon", "vesselSpeedKnots", "vesselHeading"]
  },
  evaluate_orbital_conjunction: {
    type: "object",
    properties: {
      sat1Id: { type: "string" },
      sat2Id: { type: "string" },
      timeRangeHours: { type: "number", minimum: 1, maximum: 72 }
    },
    required: ["sat1Id", "sat2Id", "timeRangeHours"]
  },
  evaluate_datacenter_grid_strain: {
    type: "object",
    properties: {
      datacenterId: { type: "string" },
      gridLoadMw: { type: "number", minimum: 0 },
      temperatureC: { type: "number", minimum: -50, maximum: 60 }
    },
    required: ["datacenterId", "gridLoadMw", "temperatureC"]
  },
  generate_cinematic_camera_path: {
    type: "object",
    properties: {
      targetLat: { type: "number", minimum: -90, maximum: 90 },
      targetLon: { type: "number", minimum: -180, maximum: 180 },
      targetAlt: { type: "number", minimum: 0 },
      radius: { type: "number", minimum: 100 },
      durationSeconds: { type: "number", minimum: 5, maximum: 300 }
    },
    required: ["targetLat", "targetLon", "targetAlt", "radius", "durationSeconds"]
  },
  generate_bigquery_lakehouse_query: {
    type: "object",
    properties: {
      dataset: { type: "string" },
      table: { type: "string" },
      timeField: { type: "string" },
      startTime: { type: "string", format: "date-time" },
      endTime: { type: "string", format: "date-time" },
      limit: { type: "number", minimum: 1, maximum: 10000 }
    },
    required: ["dataset", "table", "timeField", "startTime", "endTime"]
  }
};

/**
 * Validates tool parameters based on schemas.
 * @param {string} toolName 
 * @param {object} params 
 * @returns {boolean}
 */
export function validateToolParams(toolName, params) {
  const schema = schemas[toolName];
  if (!schema) return false;

  for (const requiredField of schema.required || []) {
    if (params[requiredField] === undefined) {
      return false;
    }
  }

  for (const [key, value] of Object.entries(params)) {
    const propSchema = schema.properties[key];
    if (propSchema) {
      if (propSchema.type === 'number' && typeof value !== 'number') return false;
      if (propSchema.type === 'string' && typeof value !== 'string') return false;
      if (propSchema.minimum !== undefined && value < propSchema.minimum) return false;
      if (propSchema.maximum !== undefined && value > propSchema.maximum) return false;
    }
  }

  return true;
}
