import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {mkdir} from 'node:fs/promises';
import React from 'react';
import {renderToString} from 'react-dom/server';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[dirname(require.resolve('vite'))]}));
await mkdir('tests/.generated',{recursive:true});
await build({entryPoints:['app/shell.tsx','lib/design-model.ts','lib/defaults.ts'],outdir:'tests/.generated/branding',outbase:'.',bundle:true,format:'esm',outExtension:{'.js':'.mjs'},platform:'node',packages:'external',plugins:[{name:'navigation-stub',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"export function usePathname(){return '/';}"}));}}],logLevel:'silent'});
const {Brand}=await import('./.generated/branding/app/shell.mjs');
const {defaultDesign}=await import('./.generated/branding/lib/design-model.mjs');
const {defaults}=await import('./.generated/branding/lib/defaults.mjs');
function config(mode='auto'){const d=defaultDesign(defaults);Object.assign(d.brand,{logo:'/school/logo.png',darkLogo:'/school/logo-white.png',mobileLogo:'/school/mobile.png',logoMode:mode,logoWidth:240,mobileLogoWidth:170,logoSize:44,mobileLogoSize:38});return d;}
test('Automatic logos reserve their wordmark on the first server render, before image detection',()=>{const html=renderToString(React.createElement(Brand,{config:config()}));assert.match(html,/data-desktop-wordmark="true"/);assert.match(html,/data-mobile-wordmark="true"/);assert.match(html,/class="brand-logo-desktop"[^>]*width="240"/);assert.match(html,/class="brand-logo-mobile"[^>]*width="170"/);});
test('Explicit symbol mode keeps the separate school name and symbol sizes',()=>{const html=renderToString(React.createElement(Brand,{config:config('symbol')}));assert.match(html,/data-mobile-wordmark="false"/);assert.match(html,/class="brand-logo-mobile"[^>]*width="38"/);assert.match(html,/class="brand-name"/);});
test('The first dark-surface render uses the light logo for both screen sizes',()=>{const html=renderToString(React.createElement(Brand,{config:config(),light:true}));assert.equal((html.match(/src="\/school\/logo-white.png"/g)||[]).length,2);assert(!html.includes('src="/school/mobile.png"'));});
