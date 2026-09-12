export const MAX_IMAGES=10;
export const MAX_IMAGE_BYTES=5*1024*1024;
export const MAX_IMAGE_TOTAL_BYTES=15*1024*1024;
export const IMAGE_TYPES=['image/jpeg','image/png','image/webp'];
export function imageUploadError(files:{size:number;type:string}[]){
 if(files.length>MAX_IMAGES)return 'אפשר לצרף עד 10 תמונות. הסירו תמונה כדי להוסיף אחרת.';
 if(files.some(f=>!IMAGE_TYPES.includes(f.type)||f.size===0))return 'בחרו תמונות JPG, PNG או WEBP תקינות. תמונת HEIC יש לייצא כ־JPG.';
 if(files.some(f=>f.size>MAX_IMAGE_BYTES))return 'כל תמונה יכולה להיות עד 5MB. התמונות שכבר בחרתם נשמרו.';
 if(files.reduce((sum,f)=>sum+f.size,0)>MAX_IMAGE_TOTAL_BYTES)return 'אפשר לצרף עד 15MB בסך הכול. בחרו תמונות קטנות יותר או שלחו נוספות בשיחה.';
 return '';
}
