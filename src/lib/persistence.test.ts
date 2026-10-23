import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, isData, savedRevision } from './persistence.ts';
import { createSeed } from './seed.ts';
describe('separate data sources', () => {
  it('starts live records empty without copying any sample records', () => { const live=emptyData(); for(const key of ['rooms','tenants','payments','maintenance','complaints','clients','loans','repayments'] as const) assert.deepEqual(live[key],[]); assert.equal(live.settings.email,''); assert.ok(createSeed().tenants.length>0); });
  it('fresh previews discard mutations and do not share live array references', () => { const demo=createSeed(); demo.tenants[0].name='Temporary preview edit'; demo.rooms.length=0; const fresh=createSeed(); assert.equal(fresh.tenants[0].name,'Thabo Molefe'); assert.equal(fresh.rooms.length,18); assert.equal(emptyData().rooms.length,0); });
  it('rejects missing or unsupported workspace formats before loading', () => { assert.equal(isData(null),false); assert.equal(isData({version:1}),false); assert.equal(isData({...emptyData(),version:2}),false); assert.equal(isData(emptyData()),true); assert.equal(isData(createSeed()),true); });
  it('requires a confirmed database revision before considering a save successful', () => { assert.equal(savedRevision([{revision:2}]),2); assert.throws(()=>savedRevision([])); assert.throws(()=>savedRevision(null)); assert.throws(()=>savedRevision([{revision:'2'}])); assert.throws(()=>savedRevision([{revision:0}])); assert.throws(()=>savedRevision([{revision:NaN}])); });
});
