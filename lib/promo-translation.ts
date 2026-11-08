import {translateText} from '@/i18n/core';
import {serverEnvironment} from '@/i18n/env-server';

/**
 * The promo line in the languages the site is translated into. A line written in the admin
 * panel wins; without one, the site's own translation of the Hebrew line is used (the same
 * dictionary as the pages). An empty string means there is no translation yet, and the bar
 * then shows the Hebrew line. Server only.
 */
export type PromoTexts={en:string;ar:string;ru:string};
export function promoTexts(hebrew:string,written:{promoTextEn?:string;promoTextAr?:string;promoTextRu?:string}={}):PromoTexts{
 const suggested=(language:'en'|'ar'|'ru')=>{const translated=hebrew?translateText(hebrew,language,serverEnvironment):'';return translated!==hebrew?translated:'';};
 return {en:written.promoTextEn||suggested('en'),ar:written.promoTextAr||suggested('ar'),ru:written.promoTextRu||suggested('ru')};
}
