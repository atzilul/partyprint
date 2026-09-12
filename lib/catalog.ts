export const DEFAULT_SHIRT_PRICE = 112.25;
export const EXTRA_SHIRT_PRICE = DEFAULT_SHIRT_PRICE;
export const CUSTOM_PRICES: Record<number, number> = {5:561.25,10:1122.50,15:1683.75,20:2245};
export const packs=[
{name:'יומולדת משפחתי',tag:'SUPER FAMILY',n:4,price:449,desc:'הילד גיבור־על. כל המשפחה לצידו.',icon:'✳',cls:'orange',image:'/family-shared-v2.webp'},
{name:'הכלה והחברות',tag:'BRIDE SQUAD',n:6,price:673.50,desc:'שש חברות. עיר אחת. ערב שלכן.',icon:'♡',cls:'pink',image:'/bride-shared-v2.webp'},
{name:'החתן והחבר׳ה',tag:'THE WOLF PACK',n:6,price:673.50,desc:'הקאסט שלכם. המסיבה שלכם.',icon:'✦',cls:'blue',image:'/groom-shared-v2.webp'},
{name:'צוות עם אופי',tag:'TEAM SPIRIT',n:10,price:1122.50,desc:'מעצבים את האנשים שמאחורי הצוות.',icon:'↗',cls:'green',image:'/tech-team.webp'},
{name:'הרעיון שלכם',tag:'YOUR OWN THING',n:5,price:561.25,desc:'כל רעיון, כל אירוע. עיצוב שנולד מכם.',icon:'✺',cls:'custom',image:'/shirts.webp'}
];
export function calculatePrice(pack:number,quantity:number){
 if(!Number.isInteger(pack)||pack<0||pack>=packs.length||!Number.isInteger(quantity))throw new Error('Invalid package or quantity');
 if(pack===4){if(!(quantity in CUSTOM_PRICES))throw new Error('Invalid custom quantity');return CUSTOM_PRICES[quantity]}
 if(quantity<packs[pack].n||quantity>100)throw new Error('Invalid package quantity');
 return packs[pack].price+(quantity-packs[pack].n)*EXTRA_SHIRT_PRICE;
}
export const SIZES=['S','M','L','XL'] as const;
export const COLORS=['white','black','gray'] as const;
export const COLOR_LABELS={white:'לבן',black:'שחור',gray:'אפור'};
export type ShirtSelection={size:string;color:string};
export function validateShirts(value:unknown,quantity:number):value is ShirtSelection[]{return Array.isArray(value)&&value.length===quantity&&value.every(v=>v&&typeof v==='object'&&SIZES.includes(v.size)&&COLORS.includes(v.color))}
