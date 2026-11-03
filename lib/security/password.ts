import setupWasm from 'argon2id/lib/setup.js';
import argonModule from 'argon2id/dist/no-simd.wasm';
const encoder=new TextEncoder();
const encode=(a:Uint8Array)=>btoa(String.fromCharCode(...a)).replace(/=+$/,'');
const decode=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
let engine:ReturnType<typeof setupWasm>|undefined;
function getEngine(){return engine??=setupWasm(async imports=>({module:argonModule,instance:await WebAssembly.instantiate(argonModule,imports)}),async imports=>({module:argonModule,instance:await WebAssembly.instantiate(argonModule,imports)}));}
export async function hashPassword(password:string){const salt=crypto.getRandomValues(new Uint8Array(16)),hash=(await getEngine())({password:encoder.encode(password),salt,parallelism:1,passes:2,memorySize:19456,tagLength:32});return '$argon2id$v=19$m=19456,t=2,p=1$'+encode(salt)+'$'+encode(hash);}
export async function verifyPassword({hash,password}:{hash:string;password:string}){const match=/^\$argon2id\$v=19\$m=(19456),t=(2),p=(1)\$([A-Za-z0-9+/]{22})\$([A-Za-z0-9+/]{43})$/.exec(hash);if(!match)return false;const result=(await getEngine())({password:encoder.encode(password),salt:decode(match[4]),parallelism:1,passes:2,memorySize:19456,tagLength:32}),expected=decode(match[5]);let diff=result.length^expected.length;for(let i=0;i<result.length;i++)diff|=result[i]^expected[i];return diff===0;}
