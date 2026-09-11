import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { buildServer } from '../src/server.js';

describe('Gateway Tests', () => {
  let server;

  before(async () => {
    server = await buildServer();
  });

  after(async () => {
    await server.close();
  });

  test('Server initialization and health check', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.timestamp);
    assert.ok(body.uptime);
    assert.ok(body.memory);
  });

  test('/api/opensky returns flights', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/opensky'
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.ok(Array.isArray(body.flights));
  });

  test('/api/celestrak returns satellites', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/celestrak'
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.ok(Array.isArray(body.satellites));
  });

  test('/api/firms returns fires', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/firms'
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.ok(Array.isArray(body.fires));
  });

  test('/api/ais returns vessels', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/ais'
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.ok(Array.isArray(body.vessels));
  });
});
