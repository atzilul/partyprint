# Arabic translation: style and markup

For whoever translates Hebrew sentences of partyprint.co.il into Arabic (i18n/ar.json).
PARTYPRINT is an Israeli studio that designs and prints custom T-shirts for groups, from the
customer's photos and ideas. The readers are Arabic speakers in Israel.

## Voice

- Simple, warm Modern Standard Arabic (فصحى مبسطة) that reads like copy written by an Arabic
  speaker, not like a translation. No local dialect. Short sentences.
- Address the reader in the plural (أنتم / ـكم), as the Hebrew does.
- Translate meaning and tone, not word order. Headlines may be adapted so they sound good in
  Arabic, as long as the meaning and the promise stay the same.
- Never add a claim that is not in the Hebrew (no "best", no guarantees, no fabric or printing
  method, no delivery promise beyond what is written).
- Legal pages (terms, privacy, returns, shipping) use a plain formal register. Be exact:
  do not soften, shorten or strengthen an obligation.
- Arabic punctuation (، ؟ ؛). Western digits 0-9 only. Hebrew quote marks become « ».
- No Hebrew letters anywhere. Hebrew day abbreviations (א׳ עד ה׳) become Arabic day names.
- Keep as they are: PARTYPRINT, BUNDLE SALE, WhatsApp, AI, Google, Meta, email addresses, URLs,
  the ₪ sign, symbols (· ✳ ← → ↗ ↔ ↕ × * … ✓) and emoji, size letters S M L XL, file types
  (JPG, PNG, WEBP), and English text printed on shirts or used as design names in capitals
  (TEAM UNREAL, BRIDE SQUAD). Arrows that point left stay as they are: Arabic is also right to left.

## Terms (use one term for one concept)

| Hebrew | Arabic |
|---|---|
| חולצה / חולצות | تيشيرت / تيشيرتات |
| עיצוב אישי | تصميم خاص |
| עיצוב אחד לכולם / עיצוב משותף | تصميم واحد للجميع |
| עיצוב אישי לכל חולצה | تصميم خاص لكل تيشيرت |
| הדפסה | طباعة |
| משלוח עד הבית | توصيل حتى باب البيت |
| סבב תיקונים | جولة تعديلات |
| חבילה | باقة |
| באנדל | باقة BUNDLE (the page name BUNDLE SALE stays in English) |
| מידה / מידות | مقاس / مقاسات |
| מבוגר / ילד (size type) | كبار / أطفال |
| צוות | فريق |
| יום גיבוש | يوم ترفيهي للفريق |
| הזמנה | طلبية |
| פנייה / בקשה (a request, sent without payment) | طلب |
| הצעת מחיר | عرض سعر |
| אישור העיצוב | الموافقة على التصميم |
| ימי עסקים | أيام عمل |
| הנחה / קוד מבצע | خصم / رمز الخصم |
| פרטי קשר | بيانات التواصل |
| מייל | البريد الإلكتروني |
| לוגו | شعار |
| כלה / חתן | العروس / العريس |
| מסיבת רווקות / מסיבת רווקים | حفلة توديع العزوبية للعروس / للعريس |
| יום הולדת | عيد ميلاد |
| גן (kindergarten) | روضة |
| מחזור (graduating class) | دفعة التخرج |
| תנועת נוער | حركة شبابية |
| תקנון | الشروط والأحكام |
| מדיניות פרטיות | سياسة الخصوصية |
| עוגיות (cookies) | ملفات تعريف الارتباط |

The existing dictionary (i18n/ar.json, Hebrew sentence -> Arabic) is the reference for
anything not listed. Stay consistent with it.

## Markup (a script rejects an item where it does not match the Hebrew)

1. **Number places** `{0}` `{1}` `{2}`: prices, quantities, days, hours. Keep each one that the
   Hebrew has. You may move them. A time written `{0}:{1}` stays in that form.
2. **Private values** `{v0}` `{v1}`: a customer's name, an order reference, a private link. Keep
   each one exactly as written; you may move it.
3. **Element places** `<0>...</0>`, `<1>...</1>`, and self-closing `<0/>`: the page writes the
   sentence around small elements. A self-closing place is usually a line break between two
   lines of a headline, or an icon. A place with content wraps the part of the sentence shown
   in that element: the second line of a headline in another colour, a price in bold, a link.
   Keep every place exactly once with the same number and the same nesting. You may move a
   place and change which words are inside it so that the sentence is natural Arabic.
4. **Counted T-shirts.** The Arabic noun changes with the number (4 تيشيرتات, 12 تيشيرت,
   تيشيرت واحد, تيشيرتان), so do not write the noun yourself next to a number place.
   - `{0:tshirt}` prints the number together with the noun in the right form. Use it wherever
     the Hebrew says "N shirts" as a quantity. It stands for the place `{0}`.
   - `{1#tshirt}` prints the noun alone in the form that number calls for, when the number
     itself is shown inside an element place: `<0>{0}–{1}</0> חולצות` becomes
     `<0>{0}–{1}</0> {1#tshirt}`. It is extra: the place `{1}` must still appear.
   - Only `tshirt` exists. For other counted nouns (days, photos, sizes, people) choose wording
     that is right for the realistic values, or wording that avoids agreement
     ("عدد الصور: {0}").
   - "חולצה {0}" (shirt number 3) is an ordinal, not a quantity: write "تيشيرت {0}".
5. An item that is a piece of a sentence (it ends with a comma or a preposition) is translated
   as that piece, so the neighbouring item completes it. Look at the neighbours.
6. An item that is not language at all (a page address, a file name, code) is copied unchanged
   if it has no Hebrew letters; if it has Hebrew letters, translate it literally and list its
   index in the notes as "not a sentence".
7. Never leave an item empty.

## How to work

Translate, then reread the whole Arabic as an editor who has not seen the Hebrew and fix what
sounds translated, stiff or inconsistent with the terms above. Then compare each fixed item with
its Hebrew again so the meaning did not drift. Before finishing, verify with a short script
that the output parses as JSON, has the same length as the input, has no Hebrew letters and no
Eastern Arabic digits, and that for every index the number places (`{0}` and `{0:tshirt}` both
count as place 0; `{0#tshirt}` is extra), the private values and the element tags match the input.
