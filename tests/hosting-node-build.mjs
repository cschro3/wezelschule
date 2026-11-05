// Native Node compatibility experiment in a disposable, credential-free copy.
// Exit 2 means the application does not build for this target. No deployment.
import {cp,mkdtemp,mkdir,readFile,writeFile,symlink,rm} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),output=process.argv[2]&&resolve(process.argv[2]);
await mkdir(resolve('.sites-runtime'),{recursive:true});
const probe=await mkdtemp(resolve('.sites-runtime/hetzner-node-probe-'));
const started=performance.now();
try{
 for(const path of ['app','components','db','hooks','lib','public','vendor','package.json','tsconfig.json','postcss.config.mjs','components.json','cloudflare-env.d.ts'])await cp(resolve(path),join(probe,path),{recursive:true});
 // Source configuration is never rewritten; target selection affects only copy.
 await writeFile(join(probe,'next.config.ts'),"export default {output:'standalone'};\n");
 await symlink(resolve('node_modules'),join(probe,'node_modules'),process.platform==='win32'?'junction':'dir');
 await writeFile(join(probe,'probe.mjs'),`import {writeFileSync} from 'node:fs';
import {createBuilder} from 'vite';
import vinext from 'vinext';
process.on('exit',()=>writeFileSync('metrics.json',JSON.stringify({node:process.version,platform:process.platform,maxRSSKiB:process.resourceUsage().maxRSS,scope:'Node build process only; not deployed app capacity'})));
const builder=await createBuilder({root:process.cwd(),configFile:false,plugins:[vinext()]});
await builder.buildApp();\n`);
 const child=spawnSync(process.execPath,['probe.mjs'],{cwd:probe,encoding:'utf8',timeout:300000,maxBuffer:8*1024*1024,env:{PATH:process.env.PATH||'',NODE_ENV:'production',CI:'true'}});
 if(child.error)throw child.error;
 const log=(child.stdout||'')+'\n'+(child.stderr||'');
 let metrics=null;try{metrics=JSON.parse(await readFile(join(probe,'metrics.json'),'utf8'));}catch{}
 const report={format:1,checkedAt:new Date().toISOString(),target:'native Node standalone; no Cloudflare plugin or runtime shims',node:process.version,exitCode:child.status,compatible:child.status===0,durationSeconds:Math.round((performance.now()-started)/10)/100,metrics,failure:child.status===0?null:log.includes('failed to resolve import "cloudflare:workers"')?'Unresolved cloudflare:workers import in actual application':log.slice(-2500),isolation:{freshTemporaryCopy:true,copiedEnvironmentFiles:false,copiedRuntimeState:false,sourceConfigUnchanged:true,deployed:false}};
 if(output){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');await writeFile(output.replace(/\.json$/,'')+'.log',log);}
 console.log(JSON.stringify(report,null,2));
 if(!report.compatible)process.exitCode=2;
}finally{await rm(probe,{recursive:true,force:true,maxRetries:3});}
