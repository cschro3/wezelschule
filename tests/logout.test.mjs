import {test} from 'node:test';
import assert from 'node:assert/strict';
import {logoutDestination} from '../app/admin/logout.ts';

test('Local password logout reaches /login only after a successful session invalidation',async()=>{
  const calls=[];
  const destination=await logoutDestination(async(path,options)=>{
    calls.push({path,options});
    return Response.json(path.endsWith('status')?{mode:'local',configured:true}:{success:true});
  });
  assert.equal(destination,'/login');assert.equal(calls.length,2);
  assert.equal(calls[0].options.cache,'no-store');
  assert.equal(calls[1].path,'/api/auth/sign-out');assert.equal(calls[1].options.method,'POST');
  assert.equal(calls[1].options.headers['x-wezel-request'],'cms');
});

test('Existing platform and migration modes retain their platform logout destination',async()=>{
  for(const mode of ['platform','migration']){
    let posted=false;
    const destination=await logoutDestination(async(path)=>{
      if(path.endsWith('status'))return Response.json({mode,configured:true});
      posted=true;return Response.json({success:true});
    });
    assert(posted);assert.equal(destination,'/signout-with-chatgpt?return_to=%2Flogin');
  }
});

test('A platform-only installation without native credentials can still sign out through the platform',async()=>{
  let count=0;
  const destination=await logoutDestination(async()=>{count++;return Response.json({mode:'platform',configured:false});});
  assert.equal(count,1);assert.equal(destination,'/signout-with-chatgpt?return_to=%2Flogin');
});

test('Failed status, unknown mode and failed sign-out never return a misleading successful logout target',async()=>{
  await assert.rejects(logoutDestination(async()=>new Response('',{status:503})),/nicht geprüft/);
  await assert.rejects(logoutDestination(async()=>Response.json({mode:'unknown',configured:true})),/Anmeldeart/);
  await assert.rejects(logoutDestination(async(path)=>path.endsWith('status')?Response.json({mode:'local',configured:true}):new Response('',{status:403})),/Abmelden war nicht möglich/);
});
