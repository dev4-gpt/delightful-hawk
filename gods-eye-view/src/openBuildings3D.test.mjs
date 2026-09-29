import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TACTICAL_BUILDINGS_STYLE,
  initOpenBuildings3D,
  enable,
  disable,
  toggle,
  destroy
} from './openBuildings3D.js';

test('openBuildings3D: exports valid tactical shader style conditions', () => {
  assert.ok(TACTICAL_BUILDINGS_STYLE, 'Style must be defined');
  assert.ok(Array.isArray(TACTICAL_BUILDINGS_STYLE.color.conditions), 'Conditions must be an array');
  
  const conditions = TACTICAL_BUILDINGS_STYLE.color.conditions;
  const commercial = conditions.find(([cond]) => cond.includes('commercial'));
  const residential = conditions.find(([cond]) => cond.includes('residential'));
  const civic = conditions.find(([cond]) => cond.includes('civic') || cond.includes('hospital'));

  assert.ok(commercial, 'Must have commercial building shader condition');
  assert.ok(residential, 'Must have residential building shader condition');
  assert.ok(civic, 'Must have civic building shader condition');
});

test('openBuildings3D: lifecycle controller enable/disable/toggle', async () => {
  const fakeViewer = {
    isDestroyed: () => false,
    scene: {
      primitives: {
        add: (item) => item,
        remove: (item) => item,
      }
    }
  };

  const controller = initOpenBuildings3D(fakeViewer);
  assert.equal(controller.isEnabled(), false, 'Should be disabled initially');

  disable();
  assert.equal(controller.isEnabled(), false);

  destroy();
  assert.equal(controller.isEnabled(), false);
});
