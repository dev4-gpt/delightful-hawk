/**
 * EarthMind MCP Server
 * Migration note: Currently using hand-rolled JSON-RPC over stdio. 
 * Will be migrated to @modelcontextprotocol/sdk in a future release.
 */

import readline from 'readline';
import { validateAndSanitizeToolCall } from './agentShield.js';
import { haversineDistanceMeters, calculateBearing } from './spatialMath.js';
import { evaluateLineOfSight } from './spatialMath.js';
import { evaluateSubseaCableThreat, evaluateOrbitalConjunction, evaluateGridThermalStrain } from './anomalyRules.js';
import { generateSubseaLoiteringQuery, generateDatacenterGridStrainQuery } from './bigqueryLakehouse.js';

const SERVER_NAME = 'earthmind-mcp';
const SERVER_VERSION = '0.2.0';

function log(level, msg, data = {}) {
  const entry = { ts: new Date().toISOString(), level, msg, ...data };
  process.stderr.write(JSON.stringify(entry) + '\n');
}

let requestCount = 0;

process.on('uncaughtException', (err) => {
  log('fatal', 'Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

export const TOOLS = [
  {
    name: 'calculate_distance_and_heading',
    description: 'Calculates the Great-Circle distance and initial bearing between two coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        originLat: { type: 'number' },
        originLon: { type: 'number' },
        targetLat: { type: 'number' },
        targetLon: { type: 'number' }
      },
      required: ['originLat', 'originLon', 'targetLat', 'targetLon']
    }
  },
  {
    name: 'evaluate_line_of_sight',
    description: 'Calculates 3D line-of-sight considering Earth curvature.',
    inputSchema: {
      type: 'object',
      properties: {
        observer: {
          type: 'object',
          properties: { lat: { type: 'number' }, lon: { type: 'number' }, alt: { type: 'number' } },
          required: ['lat', 'lon', 'alt']
        },
        target: {
          type: 'object',
          properties: { lat: { type: 'number' }, lon: { type: 'number' }, alt: { type: 'number' } },
          required: ['lat', 'lon', 'alt']
        }
      },
      required: ['observer', 'target']
    }
  },
  {
    name: 'detect_subsea_cable_threat',
    description: 'Evaluates marine vessel proximity to subsea cables.',
    inputSchema: {
      type: 'object',
      properties: {
        vessel: {
          type: 'object',
          properties: {
            mmsi: { type: 'string' },
            name: { type: 'string' },
            lat: { type: 'number' },
            lon: { type: 'number' },
            speedKnots: { type: 'number' },
            durationNearMins: { type: 'number' }
          },
          required: ['mmsi', 'lat', 'lon', 'speedKnots']
        },
        cable: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            coordinates: {
              type: 'array',
              items: {
                type: 'object',
                properties: { lat: { type: 'number' }, lon: { type: 'number' } },
                required: ['lat', 'lon']
              }
            },
            landingStations: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' } },
                required: ['name', 'lat', 'lon']
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
    description: 'Evaluates close approach between two orbital bodies.',
    inputSchema: {
      type: 'object',
      properties: {
        primarySat: {
          type: 'object',
          properties: { id: { type: 'string' }, name: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' }, altKm: { type: 'number' } },
          required: ['id', 'name', 'lat', 'lon', 'altKm']
        },
        secondaryObject: {
          type: 'object',
          properties: { id: { type: 'string' }, name: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' }, altKm: { type: 'number' } },
          required: ['id', 'name', 'lat', 'lon', 'altKm']
        },
        thresholdKm: { type: 'number' }
      },
      required: ['primarySat', 'secondaryObject']
    }
  },
  {
    name: 'evaluate_datacenter_grid_strain',
    description: 'Evaluates AI datacenter power draw against local grid capacity and ambient temperature.',
    inputSchema: {
      type: 'object',
      properties: {
        datacenter: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            drawMw: { type: 'number' }
          },
          required: ['name', 'drawMw']
        },
        gridNode: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            capacityMw: { type: 'number' }
          },
          required: ['name', 'capacityMw']
        },
        ambientTempC: { type: 'number' }
      },
      required: ['datacenter', 'gridNode', 'ambientTempC']
    }
  },
  {
    name: 'generate_cinematic_camera_path',
    description: 'Generates smooth 3D camera waypoints for Cesium 3D Globe camera flight choreography.',
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
        durationSec: { type: 'number' }
      },
      required: ['startCoord', 'targetCoord']
    }
  },
  {
    name: 'generate_bigquery_lakehouse_query',
    description: 'Generates production BigQuery GIS SQL queries.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: ['subsea_loitering', 'datacenter_grid_strain']
        },
        options: {
          type: 'object'
        }
      },
      required: ['domain']
    }
  }
];

export function handleToolCall(name, rawArgs) {
  const clientId = 'default';
  const shield = validateAndSanitizeToolCall(name, rawArgs, clientId);
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
          engine: 'BigQuery GIS',
          sql: generateSubseaLoiteringQuery(opts),
          securityCleared: true
        };
      } else if (args.domain === 'datacenter_grid_strain') {
        return {
          domain: 'datacenter_grid_strain',
          engine: 'BigQuery GIS',
          sql: generateDatacenterGridStrainQuery(opts),
          securityCleared: true
        };
      }
      throw new Error(`Unsupported domain: ${args.domain}`);
    }
    case 'generate_cinematic_camera_path': {
      const distance = haversineDistanceMeters(args.startCoord.lat, args.startCoord.lon, args.targetCoord.lat, args.targetCoord.lon);
      const bearing = calculateBearing(args.startCoord.lat, args.startCoord.lon, args.targetCoord.lat, args.targetCoord.lon);
      const totalSec = args.durationSec || 12;

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

export function startServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendResponse(id, result, error = null) {
    if (id === undefined) return; // JSON-RPC Notification
    const payload = { jsonrpc: '2.0', id };
    if (error) payload.error = error;
    else payload.result = result;
    process.stdout.write(JSON.stringify(payload) + '\n');
  }
  
  function sendError(id, code, message) {
    if (id !== undefined) {
      sendResponse(id, null, { code, message });
    } else {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }) + '\n');
    }
  }

  rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;
      
      requestCount++;
      log('info', 'Request received', { method, requestCount });

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
        if (!params) {
          sendError(id, -32600, 'Invalid Request: params are required');
          return;
        }
        const { name, arguments: toolArgs } = params;
        try {
          const result = handleToolCall(name, toolArgs || {});
          sendResponse(id, {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          });
        } catch (toolErr) {
          sendError(id, -32000, toolErr.message);
        }
      } else {
        sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (parseErr) {
      log('error', 'JSON parse error', { error: parseErr.message });
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }) + '\n');
    }
  });

  log('info', 'Server started', { name: SERVER_NAME, version: SERVER_VERSION });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
