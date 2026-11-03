import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[dirname(require.resolve('vite'))]}));
await mkdir('tests/.generated',{recursive:true});
await build({entryPoints:['lib/design-model.ts','lib/defaults.ts'],outdir:'tests/.generated/model',bundle:true,format:'esm',outExtension:{'.js':'.mjs'},platform:'node',packages:'external',logLevel:'silent'});
const {defaultDesign,designSchema,blockSchema,contrast,contrastIssues,newBlock,brandLogoSources,footerLogoOverride,lightLogoOn}=await import('./.generated/model/design-model.mjs');const {defaults}=await import('./.generated/model/defaults.mjs');
test('Default rendering is deterministic without secure-context browser APIs',()=>{const before=Object.getOwnPropertyDescriptor(globalThis,'crypto');Object.defineProperty(globalThis,'crypto',{configurable:true,value:{}});try{const one=defaultDesign(defaults),two=defaultDesign(defaults);assert.deepEqual(one,two);assert(newBlock('text').id);}finally{Object.defineProperty(globalThis,'crypto',before);}});
test('Contrast calculations use actual luminance and reject white on white',()=>{assert.equal(contrast('#FFFFFF','#000000'),21);assert.equal(contrast('#FFFFFF','#FFFFFF'),1);const d=defaultDesign(defaults);assert(contrastIssues(d).every(x=>x.aa));d.theme.primary='#FFFFFF';assert(contrastIssues(d).some(x=>x.label.includes('Spalte 2')&&!x.aa));});
test('Only predefined blocks and valid navigation URLs enter a saved design',()=>{assert(!blockSchema.safeParse({id:'x',type:'html'}).success);const d=defaultDesign(defaults);d.navigation[0].href='javascript:alert(1)';assert(!designSchema.safeParse(d).success);});

test('Existing saved branding stays valid and receives bounded wordmark options',()=>{const legacy=defaultDesign(defaults);delete legacy.brand.logoMode;delete legacy.brand.logoWidth;delete legacy.brand.mobileLogoWidth;const d=designSchema.parse(legacy);assert.equal(d.brand.logoMode,'auto');assert.equal(d.brand.logoWidth,240);assert.equal(d.brand.mobileLogoWidth,170);assert.equal(d.brand.logo,legacy.brand.logo);assert(!designSchema.safeParse({...d,brand:{...d.brand,logoWidth:800}}).success);assert(!designSchema.safeParse({...d,brand:{...d.brand,mobileLogoWidth:20}}).success);});

test('Dark-surface logos are also used on phones; custom footer overrides stay consistent',()=>{const d=defaultDesign(defaults);Object.assign(d.brand,{logo:'/school/light.png',darkLogo:'/school/dark.png',mobileLogo:'/school/mobile.png'});d.footer.logo=d.brand.logo;assert(lightLogoOn(d.footer.background));assert.deepEqual(brandLogoSources(d.brand,true,footerLogoOverride(d)),{desktop:'/school/dark.png',mobile:'/school/dark.png'});assert.deepEqual(brandLogoSources(d.brand,false),{desktop:'/school/light.png',mobile:'/school/mobile.png'});d.footer.logo='/school/custom.png';assert.deepEqual(brandLogoSources(d.brand,true,footerLogoOverride(d)),{desktop:'/school/custom.png',mobile:'/school/custom.png'});assert(!lightLogoOn('#F7F9FC'));});
