import postcssRtlcss from 'postcss-rtlcss';
import {Mode,Source} from 'postcss-rtlcss/options';

/**
 * The stylesheets are written for a right-to-left page. This step gives every rule that
 * depends on the direction a mirrored twin for left-to-right pages (English), at build time:
 *
 *   .logo{margin-left:8px}
 *   becomes
 *   :where(html[dir="rtl"]) .logo{margin-left:8px}
 *   :where(html[dir="ltr"]) .logo{margin-right:8px}
 *
 * `:where()` adds no weight, so a rule keeps the specificity it was written with and the
 * cascade is the same in both directions. Margins, positions, corners, shadows, transforms
 * and keyframes are mirrored; nothing in the stylesheets has to know about languages.
 *
 * A rule that must not be mirrored (the inside of the Latin logo, say) says so in the
 * stylesheet with rtlcss's directive, a comment beginning with "rtl:ignore" before it.
 * The staff workspace is Hebrew only and is left as written.
 */
const SKIP=/[\\/]app[\\/]admin[\\/]|[\\/]node_modules[\\/]/;
const isRoot=selector=>/^(html|:root)(?![\w-])/.test(selector);
const mirror=postcssRtlcss({
 mode:Mode.combined,
 source:Source.rtl,
 processKeyFrames:true,
 ltrPrefix:'[dir="ltr"]',rtlPrefix:'[dir="rtl"]',bothPrefix:'[dir]',
 prefixSelectorTransformer:(prefix,selector)=>isRoot(selector)
  ?selector.replace(/^(html|:root)/,found=>found+':where('+prefix+')')
  :':where(html'+prefix+') '+selector,
});

/** "0 auto max(12px, 2vw) 12px" → its four values, spaces inside brackets kept. */
function splitValues(value){
 const out=[];let depth=0,current='';
 for(const char of value.trim()){
  if(char==='(')depth++;else if(char===')')depth--;
  if(/\s/.test(char)&&depth===0){if(current){out.push(current);current='';}continue;}
  current+=char;
 }
 if(current)out.push(current);
 return out;
}

export function directionCss(){
 return {
  postcssPlugin:'partyprint-direction',
  Once(root,helpers){
   const file=root.source?.input?.file||'';
   if(SKIP.test(file))return undefined;
   // direction:ltr is about the text it holds (a Latin label, a phone number), not about the
   // page, so it is kept as written. direction:rtl follows the page and is mirrored.
   root.walkDecls('direction',decl=>{if(decl.value.trim()==='ltr')decl.before(helpers.comment({text:'rtl:ignore'}));});
   // The mirroring step does not read a four-value inset; one whose sides differ is written out as its sides.
   root.walkDecls('inset',decl=>{
    const sides=splitValues(decl.value);
    if(sides.length!==4||sides[1]===sides[3])return;
    ['top','right','bottom','left'].forEach((side,index)=>decl.before(decl.clone({prop:side,value:sides[index]})));
    decl.remove();
   });
   return mirror.Once(root,helpers);
  },
 };
}
directionCss.postcss=true;
