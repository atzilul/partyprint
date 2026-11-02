import type {ImgHTMLAttributes} from 'react';
import media from '@/lib/landing-media';
type Variant={src:string;width:number;bytes:number};
type ImageSet={width:number;height:number;avif:Variant[];webp:Variant[]};
const images:Record<string,ImageSet>=media.images;
export function imageSetFor(asset:string):ImageSet{const set=images[asset];if(!set)throw new Error('Unknown static artwork');return set}
export function imageSrcSet(asset:string,format:'avif'|'webp'){return imageSetFor(asset)[format].map(item=>item.src+' '+item.width+'w').join(', ')}
type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'srcSet'|'sizes'|'alt'>&{asset:string;alt:string;sizes:string};
export default function OptimizedImage({asset,alt,sizes,...attributes}:Props){
 const set=imageSetFor(asset),fallback=set.webp.find(item=>item.width>=768)||set.webp[set.webp.length-1];
 return <picture className="optimized-picture"><source type="image/avif" srcSet={imageSrcSet(asset,'avif')} sizes={sizes}/><img {...attributes} alt={alt} src={fallback.src} srcSet={imageSrcSet(asset,'webp')} sizes={sizes} width={attributes.width??set.width} height={attributes.height??set.height} loading={attributes.loading??'lazy'} decoding={attributes.decoding??'async'} fetchPriority={attributes.fetchPriority??'low'}/></picture>;
}
