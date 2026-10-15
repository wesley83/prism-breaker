import test from 'node:test';import assert from 'node:assert/strict';
import {platformProfile,formatShareDate,SharePreview} from '../public/sharing.js';
const model={title:'Daily result',text:'I scored 12,345 points for October 15, 2026 (UTC).',url:'https://sane-guild-8399.onpagelove.com/?leaderboard=daily'};
test('R11 Android invitation contains the full message and link in one text body',()=>{
 const data=SharePreview.prototype.shareData.call({model,profile:{os:'android'}});assert.equal(data.text,model.text+'\n\n'+model.url);assert.equal(data.url,undefined);
});
test('R11 native file sharing and other platforms retain readable message, date and correct link',()=>{
 for(const os of ['ios','mac','windows','other']){const data=SharePreview.prototype.shareData.call({model,profile:{os}});assert.equal(data.text,model.text);assert.equal(data.url,model.url);}
 const file={name:'score.png'},data=SharePreview.prototype.shareData.call({model,profile:{os:'android'},file},true);assert.deepEqual(data.files,[file]);assert.ok(data.text.endsWith(model.url));assert.equal(formatShareDate('2026-10-15'),'October 15, 2026 (UTC)');
});
test('R11 platform selection recognizes Android, touch iPads and ordinary desktops',()=>{
 assert.equal(platformProfile({userAgent:'Android Chrome',platform:'Linux',maxTouchPoints:5}).os,'android');assert.equal(platformProfile({userAgent:'Safari',platform:'MacIntel',maxTouchPoints:5}).os,'ios');assert.equal(platformProfile({userAgent:'Chrome',platform:'Win32'}).os,'windows');
});
