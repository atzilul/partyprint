import test from 'node:test';
import assert from 'node:assert/strict';
import {isExcludedPath,metaModeFor} from '../lib/analytics.ts';
test('staff, customer and authentication paths are never measurement targets',()=>{
 for(const path of ['/admin','/admin/orders','/api/analytics-config','/track/example','/design/example','/signin-with-chatgpt','/signout-with-chatgpt','/chatgpt-auth','/chatgpt-auth/callback'])assert.equal(isExcludedPath(path),true,path);
 for(const path of ['/','/ordering-guide','/guides/example','/blog/example','/administrator'])assert.equal(isExcludedPath(path),false,path);
});
test('trusted country takes priority over timezone for the existing Meta rule',()=>{
 assert.equal(metaModeFor('IL','Europe/Berlin'),'notice');
 assert.equal(metaModeFor('DE','Asia/Jerusalem'),'strict');
 assert.equal(metaModeFor('','Asia/Jerusalem'),'notice');
 assert.equal(metaModeFor('','Europe/Berlin'),'strict');
 assert.equal(metaModeFor('',''),'strict');
});
