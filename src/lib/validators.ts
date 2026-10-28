export function isValidUsername(value:string):boolean{return /^[a-zA-Z0-9._]{3,24}$/.test(value)}
export function isValidEmail(value:string):boolean{return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
export function validateUpload(file:File,maxBytes=100*1024*1024):string|null{if(!file.type.startsWith("image/")&&!file.type.startsWith("video/"))return "Choose an image or video file.";if(file.size>maxBytes)return "File is too large. Maximum size is 100 MB.";return null}
