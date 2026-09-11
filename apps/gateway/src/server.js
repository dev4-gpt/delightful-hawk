import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import url from 'node:url';

export async function buildServer() {
  const fastify = Fastify({ logger: false });

  await fastify.register(cors, {
    origin: ['http://localhost:4173', 'http://localhost:5173', '*']
  });

  await fastify.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  });

  await fastify.register(websocket);

  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  });

  fastify.get('/api/opensky', async (request, reply) => {
    return {
      flights: [
        { id: 'FL123', lat: 40.7128, lon: -74.0060, alt: 35000 },
        { id: 'FL456', lat: 34.0522, lon: -118.2437, alt: 32000 }
      ]
    };
  });

  fastify.get('/api/celestrak', async (request, reply) => {
    return {
      satellites: [
        { name: 'ISS', noradId: 25544 },
        { name: 'STARLINK-15', noradId: 44000 }
      ]
    };
  });

  fastify.get('/api/firms', async (request, reply) => {
    return {
      fires: [
        { lat: 39.0, lon: -120.0, brightness: 350 },
        { lat: -25.0, lon: 135.0, brightness: 400 }
      ]
    };
  });

  fastify.get('/api/ais', async (request, reply) => {
    return {
      vessels: [
        { mmsi: 123456789, lat: 25.0, lon: -70.0, heading: 90 },
        { mmsi: 987654321, lat: 50.0, lon: 10.0, heading: 180 }
      ]
    };
  });

  fastify.get('/api/weather', async (request, reply) => {
    return {
      weather: [
        { region: 'NA', temp: 25, condition: 'Clear' },
        { region: 'EU', temp: 15, condition: 'Cloudy' }
      ]
    };
  });

  fastify.register(async function (fastify) {
    fastify.get('/ws/telemetry', { websocket: true }, (connection, req) => {
      connection.socket.on('message', message => {
        connection.socket.send(`Received: ${message}`);
      });
      const interval = setInterval(() => {
        if (connection.socket.readyState === 1) { // OPEN
            connection.socket.send(JSON.stringify({ type: 'anomaly', message: 'Simulated anomaly detected' }));
        }
      }, 5000);
      connection.socket.on('close', () => clearInterval(interval));
    });
  });

  return fastify;
}

if (process.argv[1] && import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  const server = await buildServer();
  const port = process.env.PORT || 3001;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Gateway listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
