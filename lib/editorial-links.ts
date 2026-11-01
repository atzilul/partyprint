export type EditorialLink={guideSlug:string;articleSlug:string;title:string;description:string};

// Curated public article/service relationships. These links supplement the CMS
// content and never replace an editor's article text or stored links.
export const EDITORIAL_LINKS:EditorialLink[]=[
  {
    "guideSlug": "הדפסה-על-חולצות",
    "articleSlug": "מהי-הדפסה-על-חולצות",
    "title": "מהרעיון ועד החולצה",
    "description": "איך מתכננים תמונות, בריף ואישור לפני שמדפיסים."
  },
  {
    "guideSlug": "הדפסה-בעיצוב-אישי",
    "articleSlug": "איך-לבחור-תמונה-לחולצה-בעיצוב-אישי",
    "title": "איך בוחרים תמונה מתאימה?",
    "description": "מה לבדוק בצילום ומה לכתוב לצד התמונות."
  },
  {
    "guideSlug": "הדפסה-בעיצוב-אישי",
    "articleSlug": "הדפסה-בעיצוב-אישי-מתמונה",
    "title": "מצילום לכיוון עיצובי",
    "description": "איך מנסחים רעיון שמתחיל בתמונה שלכם."
  },
  {
    "guideSlug": "חולצות-לימי-הולדת",
    "articleSlug": "חולצות-משפחתיות-בעיצוב-אישי",
    "title": "עיצוב משותף לכל המשפחה",
    "description": "איך בוחרים כיוון שמחבר בין מבוגרים וילדים."
  },
  {
    "guideSlug": "חולצות-לימי-הולדת",
    "articleSlug": "חולצות-לטיול-משפחתי",
    "title": "מתכננים גם טיול משפחתי?",
    "description": "רעיון למזכרת לבישה עם פרטים שמרכזים מראש."
  },
  {
    "guideSlug": "חולצה-לצוות-ולעסק",
    "articleSlug": "הדפסת-לוגו-על-חולצות-לעסק",
    "title": "איך משלבים לוגו בלי לאבד אופי?",
    "description": "הכנת לוגו, בחירת מסר ותכנון חולצה לצוות."
  },
  {
    "guideSlug": "חולצה-לצוות-ולעסק",
    "articleSlug": "חולצה-לערב-צוות",
    "title": "מרכזים הזמנה לערב צוות",
    "description": "כיוון עיצובי, איסוף מידות ותיאום האירוע."
  },
  {
    "guideSlug": "חולצות-לאירועים",
    "articleSlug": "איך-להזמין-חולצות-לאירועים",
    "title": "רשימת הכנה למארגני האירוע",
    "description": "מה לרכז לפני שבוחרים כמות, מידות ותאריך."
  },
  {
    "guideSlug": "חולצה-לערב-צוות",
    "articleSlug": "חולצה-לערב-צוות",
    "title": "מדריך מעשי לערב צוות",
    "description": "איך עוברים מרעיון קבוצתי לפרטים שאפשר להזמין."
  },
  {
    "guideSlug": "חולצה-לערב-צוות",
    "articleSlug": "הדפסת-לוגו-על-חולצות-לעסק",
    "title": "אם רוצים לשלב גם את המותג",
    "description": "איך לשמור על קשר בין הלוגו, האנשים והאירוע."
  },
  {
    "guideSlug": "מתנות-לעובדים",
    "articleSlug": "מתנות-לעובדים-לחג",
    "title": "מתכננים מתנות לעובדים לחג?",
    "description": "בחירת רעיון אישי וריכוז פרטים לכל הקבוצה."
  }
];
export function readingForGuide(slug:string){return EDITORIAL_LINKS.filter(link=>link.guideSlug===slug);}
export function guidesForArticle(slug:string){return [...new Set(EDITORIAL_LINKS.filter(link=>link.articleSlug===slug).map(link=>link.guideSlug))];}
