# PARTYPRINT — זיהוי מקור הבנייה ובדיקת השחרור, 1.11.2026

## תוצאה
נוספה בדיקת GET ציבורית לקריאה בלבד ב-https://partyprint.co.il/api/release, עם זהות מקור המקובעת בזמן הבנייה. הקוד נבדק ומוזג ב-[PR #11](https://github.com/atzilul/partyprint/pull/11) וב-[PR #12](https://github.com/atzilul/partyprint/pull/12). אין כאן אישור שהוסטינגר מגיש קוד זהה ל-Git: התשובה הציבורית המאוחרת היא `modified`, ללא SHA או חתימה. V02 נשארת פתוחה.

## מקור ובדיקות
- main לפני העבודה: a32f71ff3cd4540aaec619bdd733fcce5ac13bd4.
- מיזוג ראשון: b254b5fe119040fceb70aaf49362644ffab165bf; ריצת main 41323461926.
- קוד היישום האחרון: 2b88355867f2dd9ccbfcb20bf21ec8787ca37f2f; tree 012fdb2bee6f731208da7c565f8395b807fadc28.
- [ריצת המועמד PR #12](https://github.com/atzilul/partyprint/actions/runs/41324174484) ו-[ריצת main](https://github.com/atzilul/partyprint/actions/runs/41324374474) עברו build, בדיקות טופס וביקורת SEO.
- 24 בדיקות רגרסיה: 17 בדיקות כלי/זהות מקור ו-7 בדיקות תוכן/מדידה. 339 בדיקות SEO מקומיות, ללא שגיאות.
- שרת החבילה המקומי ב-CI החזיר `clean`, SHA מדויק 2b88355867f2dd9ccbfcb20bf21ec8787ca37f2f, וחתימת מקור `afce5ca074d3b5158969e60b5871fca7b1ff857e9a798847f5c125a0011ef3e0`.
- `dependency-audit` נכשל בהתראת הפיתוח הידועה N01; הוא מוגדר לא חוסם. הצלחת הריצה הכוללת אינה audit נקי לכל התלויות. לא שונו תלויות ולא בוצע force fix.

## בדיקת האתר הציבורי
ב-2026-11-01T16:06:44.957Z, job [124901760912](https://github.com/atzilul/partyprint/actions/runs/41324374474/job/124901760912), ה-endpoint החזיר:
```json
{
  "app": "PARTYPRINT",
  "schemaVersion": 1,
  "target": "node",
  "mode": "production",
  "builtAt": "2026-11-01T16:04:37.055Z",
  "sourceState": "modified",
  "sourceCommit": null,
  "sourceFingerprint": null
}
```
200, JSON, no-store ו-noindex נבדקו; עשר בדיקות הסכמה/כותרות עברו. הפרוב הציבורי תצפיתי ואינו דורש כברירת מחדל מקור clean, ולכן job ירוק אינו מוכיח התאמה לגרסה.

אותו job השלים **550 בדיקות SEO ציבוריות, 0 שגיאות**, ובדק הפניות, 404, תוכן, canonical ועמודים פרטיים. זו בדיקת ההתנהגות שנצפתה, ולא קבלת פריסה או ראיית אינדוקס.

ב-15:55:43 UTC נצפה קודם `modified` עם זמן בנייה 15:53:39.934Z. לאחר מכן שונתה בדיקת הזהות להשוואת בתים מול Git HEAD, עם בדיקות הרשאות ונתיבים חדשים; גם בתצפית המאוחרת נשאר `modified`. אין ראיה ששינוי הרשאות היה הסיבה, ואין להחליש את הבדיקה כדי לקבל התאמה מלאכותית. בשלב הבנייה נצפתה אי-התאמה של בתים או רשימת נתיבים בתחום המקור; הקובץ האחראי עדיין אינו ידוע.

ב-16:07:43 UTC עבר הטופס הציבורי ב-390×844 וב-1366×900: מבוגר כברירת מחדל, תשע מידות ילדים, איפוס מידה, החלה לקבוצה, שדות חובה, תמונה מקומית וחזרה עם שימור הבחירות. 0 נסיונות הזמנה ו-0 חריגות לקוח. ב-16:07:48 UTC עברו שלושה תרחישי מדידה מבודדים (Israel notice, Strict Meta region, Stored refusal); ספקי המדידה ותשובות ההזמנה הוחלפו. כשל שרת ואישור חסר אינם מפיקים lead; אישור מדומה מפיק אירוע אחד. תזוזת הבאנר המבודדת הייתה 0 בכל שלושת התרחישים. [job הבדיקה](https://github.com/atzilul/partyprint/actions/runs/41324374474/job/124901945942).

הבדיקות לא יצרו הזמנה, העלאה לשרת או מייל; הן אינן מוכיחות DB או קליטת אירוע בשרתי GA/Meta. מדדי המעבדה הכלליים עדיין מציגים תזוזות ואינם הוכחת CWV של גולשים אמיתיים.

## משמעות הבדיקה
[המפרט](../release-identity.md) מתעד את שמונת השדות הציבוריים, תחום החתימה וההפרדה מקבלת Hostinger. אין ערכי סביבה, הזמנות, חשבונות או פרטי לקוח בתשובה. אין fallback ממשתנה סביבה היכול לשנות את ה-SHA של artifact ישן.

ההשוואה כוללת קוד יישום, נכסים, סקריפטים וקובצי בנייה/נעילה מוגדרים; אינה כוללת תיעוד, נתוני זמן ריצה או קובצי אירוח מחוץ לתחום. שינוי ביט executable בלבד אינו משנה את החתימה; שינוי תוכן, נתיב חדש או רשימת קבצים שונה משאירים `modified`.

## אבחון חסם Hostinger — קריאה בלבד
נדרשת גישה ללוג הפריסה ולתיקיית המקור שבה Hostinger מפעיל את הבנייה, לפני שינוי נוסף בתיקייה. יש לשמור:
1. הקומיט שנבחר לפריסה ותוצאתה הסופית, כולל זמן ומזהה הפריסה.
2. הפלט של `git rev-parse HEAD` בתיקיית הבנייה.
3. שמות הקבצים והנתיבים שהשתנו, ללא תוכנם. לדוגמה, באותה תיקייה:
```sh
git diff --numstat HEAD -- app components lib runtime build scripts public package.json package-lock.json pnpm-lock.yaml yarn.lock vite.config.ts next.config.ts middleware.ts server.js tsconfig.json .openai/hosting.json .gitignore
git ls-files --others --exclude-standard -- app components lib runtime build scripts public package.json package-lock.json pnpm-lock.yaml yarn.lock vite.config.ts next.config.ts middleware.ts server.js tsconfig.json .openai/hosting.json .gitignore
git diff --summary HEAD -- app components lib runtime build scripts public package.json package-lock.json pnpm-lock.yaml yarn.lock vite.config.ts next.config.ts middleware.ts server.js tsconfig.json .openai/hosting.json .gitignore
```
אין להריץ reset/clean, למחוק uploads או להדפיס .env. אלה פקודות אבחון בלבד. אם סביבת הבנייה זמנית, פלט מתיקייה מאוחרת אחרת אינו משחזר את מצב זמן הבנייה; נדרשים הלוג/תיקיית הבנייה המתאימים.

## מצב שאר המערכות וההמשך
- אין כלי Hostinger מתאים או קבלת פריסה עם SHA ו-success. אין לסגור V02.
- Sites נבדק: אותו פרויקט appgprj_6aa0fc185f1081919d736aa7acf667fd, גרסה 28, public. לא סונכרן; אין פרויקט חדש.
- Resend: אימות הדומיין ו-MAIL_FROM ומסירת מייל אינם מאומתים בסשן זה.
- דוח לוח המדידה הפרטי, חיבורי הנתונים ומגבלות Windsor נשארים בתוקף. אין שינוי מנוי, רענון אוטומטי או ניטור חדש.
- אין ראיית URL Inspection, אינדוקס בפועל או ציטוט ChatGPT/Claude מהבדיקות האלה.

שלוש הפעולות הבאות: להשיג את ראיות Hostinger ושמות הקבצים שהשתנו; לאחר תיקון ואימות פריסה לסנכרן את Sites הקיים ולוודא noindex; לאחר שער הפריסה להמשיך בהגשת מפות/IndexNow ובבדיקת כתובות בכלי המנועים. עבודה שאינה תלויה בשער נשארת לפי backlog.csv. כל 75 המזהים המקוריים ועוד N01 נשמרים.
