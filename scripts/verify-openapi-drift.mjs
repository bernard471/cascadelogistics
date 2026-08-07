import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const apiRoot=path.join(root,"src","app","api","v1");
async function routes(directory=apiRoot){const output=[];for(const entry of await readdir(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())output.push(...await routes(full));else if(entry.name==="route.ts")output.push(full);}return output;}
const spec=JSON.parse(await readFile(path.join(root,"public","openapi","cascade-partner-v1.json"),"utf8"));
const discovered={};for(const file of await routes()){const relative=path.relative(apiRoot,path.dirname(file)).split(path.sep).filter(Boolean).map(part=>part.replace(/^\[(.+)\]$/,"{$1}")).join("/");const route=`/${relative}`.replace(/\/$/,"")||"/";const source=await readFile(file,"utf8");discovered[route]=[...source.matchAll(/export async function (GET|POST|PATCH|DELETE|PUT)/g)].map(match=>match[1].toLowerCase()).sort();}
const failures=[];for(const [route,methods] of Object.entries(discovered)){if(!spec.paths[route])failures.push(`Missing OpenAPI path ${route}`);else for(const method of methods)if(!spec.paths[route][method])failures.push(`Missing OpenAPI operation ${method.toUpperCase()} ${route}`);}for(const route of Object.keys(spec.paths))if(!discovered[route])failures.push(`OpenAPI path has no route ${route}`);
if(failures.length){console.error(failures.join("\n"));process.exit(1);}console.log(`OpenAPI matches ${Object.keys(discovered).length} v1 route paths.`);
