# ar.batch1 notes (363 items, indexes are 0-based)

## (a) Glossary actually used
- Suggested glossary kept as given: חולצה -> تيشيرت / تيشيرتات; עיצוב אישי -> تصميم خاص; עיצוב אחד לכולם / משותף -> تصميم واحد للجميع; עיצוב אישי לכל חולצה -> تصميم خاص لكل تيشيرت; הדפסה -> طباعة; משלוח עד הבית / עד הדלת -> توصيل حتى باب البيت; סבב תיקונים -> جولة تعديلات; חבילה -> باقة; מידות -> مقاسات; צוות -> فريق; הזמנה -> طلبية; פנייה / בקשה -> طلب; הצעת מחיר / "נתאים הצעה" -> عرض سعر; אישור העיצוב -> الموافقة على التصميم; ימי עסקים -> أيام عمل; קוד מבצע -> رمز الخصم.
- Added: עיצוב אחד לכל הצוות -> تصميم واحد لكل الفريق; הדפס -> طبعة; לוגו -> شعار; טופס -> نموذج; אירוע (the customer's) -> مناسبة; אירוע חברה -> فعالية الشركة; יום גיבוש -> يوم ترفيهي (للفريق); ריצת צוות -> سباق جري للفريق; מדרגה (price tier) -> شريحة; פורטרט -> بورتريه; פוסטר / כרזה -> بوستر; איור -> رسم; הדמיה -> صورة توضيحية; בריף -> ملخّص الفكرة; חיוב -> دفع; פרטי קשר -> بيانات الاتصال; טיוטה -> مسودة; עסק -> مصلحة تجارية; מארגן -> المنظِّم; נבחרת -> منتخب; מסיבת רווקים / רווקות -> حفلة توديع العزوبية للعريس / للعروس; צעד and שלב (form) -> خطوة, שלבי התהליך -> مراحل العملية; תקנון -> الشروط والأحكام.
- אישור: design / print approval -> الموافقة على; of an order, sizes or a date -> تأكيد (تأكيد الطلبية, تأكيد المقاسات).
- "בתוספת / נוספים {0} ₪" -> "بإضافة {0} ₪" (avoids number-adjective agreement after ₪). WhatsApp always with "عبر".

## (b) Items I am unsure about
- 296: fragment that the page continues with a bold price ("ל־" + "85 ₪ לחולצה"). Arabic needs a space before the price, so the value ENDS WITH A TRAILING SPACE; the gate inserts values untrimmed, but check your script/loader does not trim it. Reworded without the noun ("زيدوا الكمية بـ {0}") so it is correct for any number.
- Number agreement, no plural support in the gate: after a placeholder I used singular "تيشيرت" (correct for 11-100; for 3-10 Arabic wants "تيشيرتات"). Affects 72, 121, 122, 167, 181, 187, 254, 309-313, 358. "أيام" / "صور" / "خطوات" (74, 76, 82, 208, 231, 259, 302, 342, 354) assume values 3-10; I checked the source: 5 days, 7 days, 10 images, 3 steps.
- 97, 98, 99: three-part hero headline, rendered 97 + 99 + 98 ("فريقكم. بنسخة يريد الجميع ارتداءها."). Works only in that order.
- 112, 113: rendered 113 then 112 ("من مجموعة الفريق. إلى اليوم الترفيهي."). "הקבוצה של הצוות" is the team's chat group; "مجموعة الفريق" does not say WhatsApp.
- 101, 118, 122, 251, 256, 258, 274: יום גיבוש has no fixed Arabic term; chose "يوم ترفيهي" (alternative: "يوم بناء الفريق").
- 34, 35, 40, 41, 247, 249: bachelor / bachelorette party; "حفلة توديع العزوبية" is understood but the custom is culturally different (local سهرة / حنّة).
- 52: "הדפסה על חולצות צבא" translated literally ("تيشيرتات الجيش"); consider hiding this link on the Arabic site.
- 6, 100, 124, 258: "חולצת לוגו" -> "تيشيرت الشعار / تيشيرت شعار"; "شعار" can also mean slogan. "لوغو" is the alternative.
- 132, 155: "הדיילי" (daily stand-up) -> "الاجتماع اليومي". 276: "זה לגמרי בריף" wordplay, adapted; Hebrew quote marks replaced with « ».
- 139, 140: headline pair adapted ("zero drawer shirts"). 215: "יותר אתם" -> "يشبهكم أكثر" (literal "أنتم أكثر" reads as "you are more numerous").
- 217, 218 and 234: adapted to the idiom "الفريق عليكم. / والتصميم علينا."; 217 depends on 218 following it.
- 172: "מעצבים את האנשים" (designing the people) -> "تصميم يُبرز الأشخاص..." because the literal verb is odd in Arabic.
- 184: body text without a subject (it continues the card title 183); I added "المنظِّم". Hebrew-script "בוואטסאפ" written as WhatsApp.
- 76: "המשך" refers to a button; written as "زر المتابعة" since no button with that exact label is in this batch.
- 84, 202: "בקשת הזמנה" (order request) simplified to "طلب" to avoid "طلب طلبية".
- 22 vs 88: same Hebrew phrase, imperative as a button/title (22), indicative in the info strip (88).
- 336: example text; name kept as "داني", {0} is an age ("عيد ميلاد داني الـ{0}").
- 107, 173, 290, 292, 295: price fragments ("للتيشيرت") that follow a number rendered elsewhere.
