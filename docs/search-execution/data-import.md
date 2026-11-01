# ייבוא נתוני חיפוש — כלי מאומת ונתונים פרטיים
הכלי scripts/search-metrics.mjs עובד על CSV מנורמל ממקור מורשה ואינו מתחבר בעצמו ל-Windsor. ב-1.11.2026 בוצעה שליפה מורשית דרך כלי Windsor והייבוא הופעל בפועל; [מצב הגישה](data-access-status-2026-11-01.md) מתעד זאת.

מקור GSC: date,query,page,country,device,clicks,impressions,position.
מקור GA4: date,landing_page,source_medium,device,sessions,lead_sessions,generate_lead_events.
date הוא YYYY-MM-DD או YYYYMMDD. יש לשמור את אזור הזמן, הנכס, המסננים וטווחי התאריכים בתיעוד המקור. קובץ ממקור עם כותרות אחרות דורש מיפוי מפורש לפני ייבוא.
country/device או source_medium/device יכולים להישאר ריקים רק אם המקור אינו מפולח לפיהם; אין לערבב באותו קובץ רמות צבירה שונות.
עמוד חייב להיות URL מוחלט של האתר או נתיב שמתחיל ב-/. ערכי נחיתה כגון (not set) נשמרים ברשומת חריגים נפרדת ואינם הופכים לעמוד מומצא.
מדד חסר נשאר ריק. אין למפות מספר אירועי generate_lead לעמודת lead_sessions.

שימוש:
```sh
node scripts/search-metrics.mjs --gsc data/search-private/gsc.csv --ga4 data/search-private/ga4.csv
```
התוצאה נשמרת ב-data/search-private/search-summary.json. התיקייה מוחרגת מ-Git. אין להעלות את הייצוא או את התוצאה ל-GitHub או ל-artifact ציבורי.
הכלי מחשב CTR ומיקום משוקלל, מפריד אירועים מסשנים עם פנייה, דוחה כפילויות בגרעין הרשומה, ומסיר נתיבי לקוח פרטיים. הוא אינו משייך שאילתות לאנשים ואינו מחשב נפח חיפוש חודשי בשוק.
כאשר position חסר בחלק מההופעות, המיקום הכולל נשאר null ונשמר כיסוי ההופעות. כאשר lead_sessions חסר, שיעור פניות לפי סשנים נשאר null.
קובץ ריק אינו קו בסיס עם אפס ביקוש. תוצאות בדיקות היחידה הן נתונים מלאכותיים בלבד ולא ביצועי PARTYPRINT.
