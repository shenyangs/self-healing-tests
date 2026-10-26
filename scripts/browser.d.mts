export type BrowserOptions={root?:string;env?:NodeJS.ProcessEnv;cacheRoots?:string[];platform?:string};
export type BrowserResolution={executablePath:string;browserCache:string;source:string};
export function systemCaches(platform?:string,env?:NodeJS.ProcessEnv,home?:string):string[];
export function resolveBrowser(options?:BrowserOptions):BrowserResolution;
export function configureBrowser(options?:BrowserOptions):BrowserResolution;
