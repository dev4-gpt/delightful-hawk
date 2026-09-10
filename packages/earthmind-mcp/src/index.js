#!/usr/bin/env node
// packages/earthmind-mcp/src/index.js
/**
 * EarthMind 3D Spatial Model Context Protocol (MCP) Server
 * Exposes standardized 3D geospatial analytical tools, line-of-sight analysis,
 * and critical infrastructure anomaly detection to AI models.
 */

import * as readline from 'readline';
import {
  haversineDistanceMeters,
  calculateBearing,
  geodeticToECEF,
  evaluateLineOfSight,
  pointToPathDistance
} from './spatialMath.js';
import {
  evaluateSubseaCableThreat,
  evaluateOrbitalConjunction,
  evaluateGridThermalStrain
} from './anomalyRules.js';
import { validateAndSanitizeToolCall } from './agentShield.js';
import {
  generateSubseaLoiteringQuery,
  generateDatacenterGridStrainQuery,
  latLonToH3Index
} from './bigqueryLakehouse.js';

const SERVER_NAME = 'earthmind-spatial-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * List of available MCP tools
 */
const TOOLS = [
  {
    name: 'calculate_distance_and_heading',
    description: 'Calculate Great-Circle distance (in meters and km) and initial forward azimuth bearing between two geodetic coordinates on the WGS84 ellipsoid.',
    inputSchema: {
      type: 'object',
      properties: {
        originLat: { type: 'number', description: 'Origin latitude in decimal degrees [-90, 90]' },
        originLon: { type: 'number', description: 'Origin longitude in decimal degrees [-180, 180]' },
        targetLat: { type: 'number', description: 'Target latitude in decimal degrees [-90, 90]' },
        targetLon: { type: 'number', description: 'Target longitude in decimal degrees [-180, 180]' }
      },
      required: ['originLat', 'originLon', 'targetLat', 'targetLon']
    }
  },
  {
    name: 'evaluate_line_of_sight',
    description: 'Evaluate 3D Line-of-Sight (LOS) between an observer and a target taking into account Earth curvature and altitudes.',
    inputSchema: {
      type: 'object',
      properties: {
        observer: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: 'Observer latitude' },
            lon: { type: 'number', description: 'Observer longitude' },
            alt: { type: 'number', description: 'Observer altitude in meters above sea level' }
          },
          required: ['lat', 'lon', 'alt']
        },
        target: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: 'Target latitude' },
            lon: { type: 'number', description: 'Target longitude' },
            alt: { type: 'number', description: 'Target altitude in meters above sea level' }
          },
          required: ['lat', 'lon', 'alt']
        }
      },
      required: ['observer', 'target']
    }
  },
  {
    name: 'detect_subsea_cable_threat',
    description: 'SentinelMesh Watchstander: Evaluates whether a marine vessel poses an anchor-drag, loitering, or sabotage threat to a subsea fiber-optic cable or landing station.',
    inputSchema: {
      type: 'object',
      properties: {
        vessel: {
          type: 'object',
          properties: {
            mmsi: { type: 'string', description: 'Vessel MMSI identifier' },
            name: { type: 'string', description: 'Vessel name' },
            lat: { type: 'number', description: 'Current latitude' },
            lon: { type: 'number', description: 'Current longitude' },
            speedKnots: { type: 'number', description: 'Speed over ground in knots' },
            durationNearMins: { type: 'number', description: 'Minutes spent in vicinity (default 15)' }
          },
          required: ['mmsi', 'lat', 'lon', 'speedKnots']
        },
        cable: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Cable ID' },
            name: { type: 'string', description: 'Cable name' },
            coordinates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lon: { type: 'number' }
                },
                required: ['lat', 'lon']
              },
              description: 'Array of geodetic vertices defining the cable path'
            },
            landingStations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  lat: { type: 'number' },
                  lon: { type: 'number' }
                }
              }
            }
          },
          required: ['id', 'name', 'coordinates']
        }
      },
      required: ['vessel', 'cable']
    }
  },
  {
    name: 'evaluate_orbital_conjunction',
    description: 'OrbitalOps Watchstander: Evaluates close-approach conjunction risk between a satellite and space debris or secondary orbital body.',
    inputSchema: {
      type: 'object',
      properties: {
        primarySat: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            lat: { type: 'number' },
            lon: { type: 'number' },
            altKm: { type: 'number' }
          },
          required: ['id', 'name', 'lat', 'lon', 'altKm']
        },
        secondaryObject: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            lat: { type: 'number' },
            lon: { type: 'number' },
            altKm: { type: 'number' }
          },
          required: ['id', 'name', 'lat', 'lon', 'altKm']
        },
        thresholdKm: { type: 'number', description: 'Warning threshold in kilometers (default 15)' }
      },
      required: ['primarySat', 'secondaryObject']
    }
  },
  {
    name: 'evaluate_datacenter_grid_strain',
    description: 'GridTwin Watchstander: Evaluates power grid stress and thermal overload risk for an AI datacenter cluster.',
    inputSchema: {
      type: 'object',
      properties: {
        datacenter: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            drawMw: { type: 'number', description: 'Current power consumption in Megawatts' }
          },
          required: ['name', 'drawMw']
        },
        gridNode: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            capacityMw: { type: 'number', description: 'Rated substation capacity in Megawatts' }
          },
          required: ['name', 'capacityMw']
        },
        ambientTempC: { type: 'number', description: 'Local ambient temperature in Celsius' }
      },
      required: ['datacenter', 'gridNode', 'ambientTempC']
    }
  },
  {
    name: 'generate_cinematic_camera_path',
    description: 'Generates smooth 3D camera waypoints, headings, and durations for Cesium 3D Globe camera flight choreography.',
    inputSchema: {
      type: 'object',
      properties: {
        startCoord: {
          type: 'object',
          properties: { lat: { type: 'number' }, lon: { type: 'number' }, alt: { type: 'number' } },
          required: ['lat', 'lon', 'alt']
        },
        targetCoord: {
          type: 'object',
          properties: { lat: { type: 'number' }, lon: { type: 'number' }, alt: { type: 'number' } },
          required: ['lat', 'lon', 'alt']
        },
        durationSec: { type: 'number', description: 'Total flight duration in seconds' }
      },
      required: ['startCoord', 'targetCoord']
    }
  },
  {
    name: 'generate_bigquery_lakehouse_query',
    description: 'Generates production BigQuery GIS SQL and Uber H3 hexagonal spatial queries for massive streaming telemetry datasets.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: ['subsea_loitering', 'datacenter_grid_strain'],
          description: 'The geospatial domain query to generate'
        },
        options: {
          type: 'object',
          description: 'Domain-specific filter options (e.g. bufferMeters, speedKnotsMax, heatThresholdCelsius)'
        }
      },
      required: ['domain']
    }
  }
];

/**
 * Handle execution of specific MCP tool calls with AgentShield security gating
 */
export function handleToolCall(name, rawArgs) {
  // Pre-execution security validation and sanitization via AgentShield
  const shield = validateAndSanitizeToolCall(name, rawArgs);
  if (!shield.allowed) {
    throw new Error(`[AgentShield Violation] ${shield.error}`);
  }
  const args = shield.sanitizedArgs;

  switch (name) {
    case 'calculate_distance_and_heading': {
      const distMeters = haversineDistanceMeters(args.originLat, args.originLon, args.targetLat, args.targetLon);
      const bearing = calculateBearing(args.originLat, args.originLon, args.targetLat, args.targetLon);
      return {
        distanceMeters: Math.round(distMeters),
        distanceKm: Math.round((distMeters / 1000.0) * 100) / 100,
        distanceNauticalMiles: Math.round((distMeters / 1852.0) * 100) / 100,
        initialBearingDegrees: Math.round(bearing * 10) / 10,
        securityCleared: true
      };
    }
    case 'evaluate_line_of_sight': {
      return {
        ...evaluateLineOfSight(args.observer, args.target),
        securityCleared: true
      };
    }
    case 'detect_subsea_cable_threat': {
      return {
        ...evaluateSubseaCableThreat(args.vessel, args.cable),
        securityCleared: true
      };
    }
    case 'evaluate_orbital_conjunction': {
      return {
        ...evaluateOrbitalConjunction(args.primarySat, args.secondaryObject, args.thresholdKm),
        securityCleared: true
      };
    }
    case 'evaluate_datacenter_grid_strain': {
      return {
        ...evaluateGridThermalStrain(args.datacenter, args.gridNode, args.ambientTempC),
        securityCleared: true
      };
    }
    case 'generate_bigquery_lakehouse_query': {
      const opts = args.options || {};
      if (args.domain === 'subsea_loitering') {
        return {
          domain: 'subsea_loitering',
          engine: 'BigQuery GIS (ST_GeogPoint / ST_DWithin / Uber H3)',
          sql: generateSubseaLoiteringQuery(opts),
          securityCleared: true
        };
      } else if (args.domain === 'datacenter_grid_strain') {
        return {
          domain: 'datacenter_grid_strain',
          engine: 'BigQuery GIS + Open-Meteo Weather Mesh',
          sql: generateDatacenterGridStrainQuery(opts),
          securityCleared: true
        };
      }
      throw new Error(`Unsupported domain for BigQuery Lakehouse query: ${args.domain}`);
    }
    case 'generate_cinematic_camera_path': {
      const distance = haversineDistanceMeters(args.startCoord.lat, args.startCoord.lon, args.targetCoord.lat, args.targetCoord.lon);
      const bearing = calculateBearing(args.startCoord.lat, args.startCoord.lon, args.targetCoord.lat, args.targetCoord.lon);
      const totalSec = args.durationSec || 12;

      // Generate 3 waypoints: Departure, Cruising Peak, Target Arrival
      const peakAltitude = Math.max(args.startCoord.alt, args.targetCoord.alt, distance * 0.25);

      return {
        totalDistanceMeters: Math.round(distance),
        flightDurationSec: totalSec,
        waypoints: [
          {
            lat: args.startCoord.lat,
            lon: args.startCoord.lon,
            alt: args.startCoord.alt,
            heading: Math.round(bearing),
            pitch: -35,
            duration: Math.round(totalSec * 0.3)
          },
          {
            lat: (args.startCoord.lat + args.targetCoord.lat) / 2.0,
            lon: (args.startCoord.lon + args.targetCoord.lon) / 2.0,
            alt: Math.round(peakAltitude),
            heading: Math.round(bearing),
            pitch: -55,
            duration: Math.round(totalSec * 0.4)
          },
          {
            lat: args.targetCoord.lat,
            lon: args.targetCoord.lon,
            alt: args.targetCoord.alt,
            heading: Math.round((bearing + 15) % 360),
            pitch: -25,
            duration: Math.round(totalSec * 0.3)
          }
        ],
        securityCleared: true
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Standard MCP JSON-RPC 2.0 Stdio Transport Loop
 */
export function startServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendResponse(id, result, error = null) {
    const payload = { jsonrpc: '2.0', id };
    if (error) payload.error = error;
    else payload.result = result;
    process.stdout.write(JSON.stringify(payload) + '\n');
  }

  rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;

      if (method === 'initialize') {
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
        });
      } else if (method === 'notifications/initialized') {
        // Notification - no response required
      } else if (method === 'tools/list') {
        sendResponse(id, { tools: TOOLS });
      } else if (method === 'tools/call') {
        const { name, arguments: toolArgs } = params;
        try {
          const result = handleToolCall(name, toolArgs || {});
          sendResponse(id, {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          });
        } catch (toolErr) {
          sendResponse(id, null, { code: -32000, message: toolErr.message });
        }
      } else {
        sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
      }
    } catch (parseErr) {
      process.stderr.write(`JSON parse error: ${parseErr.message}\n`);
    }
  });

  process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} running on stdio.\n`);
}

// Auto-start if invoked directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
