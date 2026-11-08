import type {ShirtSelection} from '@/lib/catalog';

/**
 * A value inside a sentence on a translated page. The gate sees it as one place in the
 * sentence (`<0/>`), so the sentence has one translation whatever the value is. A value
 * that is itself site text ("לא נמסר", a colour) is translated on its own; `keep` leaves it as
 * written (a name, a size, a shipping note).
 */
export function Value({v,keep}:{v:string;keep?:boolean}){return keep?<span translate="no">{v}</span>:<>{v}</>;}

/** A shirt's size as the customer sees it: "מבוגר M", "ילד, גיל 6" (lib/catalog.ts shirtSizeLabel), translatable. */
export function SizeLabel({shirt}:{shirt:Pick<ShirtSelection,'size'|'sizeType'>}){
 return shirt.sizeType==='child'?<>ילד, גיל <Value v={shirt.size} keep/></>:<>מבוגר <Value v={shirt.size} keep/></>;
}
