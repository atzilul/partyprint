# English translation: style and markup

For whoever translates Hebrew sentences of partyprint.co.il into English (i18n/en.json).
PARTYPRINT is an Israeli studio that designs and prints custom T-shirts for groups, from the
customer's photos and ideas. The readers are English speakers in Israel: immigrants, students,
international teams, visitors planning an event here. Prices are in shekels and delivery is
inside Israel.

## Voice

- Write copy, not a translation. A native English speaker should not be able to tell the page
  was written in Hebrew first. Warm, playful, confident and short, like the Hebrew.
- American spelling (color, personalized, organize). Address the reader as "you".
- Translate meaning and tone, not word order. Headlines and buttons may be rewritten so they
  land in English, as long as the meaning and the promise stay the same. A Hebrew pun that
  does not survive gets an English line with the same job, not a literal rendering.
- Never add a claim that is not in the Hebrew: no "best", no guarantees, no fabric or printing
  method, no delivery promise beyond what is written. Never drop a condition either.
- Legal pages (terms, privacy, returns, shipping) use plain formal English. Be exact: do not
  soften, shorten or strengthen an obligation. "The Hebrew text is the binding one" stays.
- Sentence case for headlines, buttons and labels ("Start designing", not "Start Designing").
  Text that the Hebrew page prints in Latin capitals stays as it is.
- Curly quotes (“ ” and ’). Hebrew quote marks (״ ״) become “ ”. Hebrew maqaf (־) disappears
  or becomes a hyphen as English needs. Use commas, periods or parentheses; no long dashes
  (— or –) inside a sentence. A range of numbers uses "to" in a sentence ("3 to 5 business
  days"); a range the Hebrew writes inside an element as `{0}–{1}` keeps that form.
- No Hebrew letters anywhere. Hebrew day abbreviations (א׳ עד ה׳) become "Sunday to Thursday".
- Sample names in examples are transliterated the common way: נועה Noa, יואב Yoav, דני Danny,
  מאיה Maya. Hebrew words printed on a shirt in an example become an English line with the
  same joke or feeling.
- Arrows: the Hebrew page reads right to left, so its "forward" arrow is ← and its diagonal
  one is ↖. English reads left to right: write → and ↗. A "back" arrow → becomes ←.
  Other symbols (· ✳ × * … ✓ ↔ ↕) and emoji stay.
- Keep as they are: PARTYPRINT, BUNDLE SALE, WhatsApp, AI, Google, Meta, email addresses, URLs,
  size letters S M L XL, file types (JPG, PNG, WEBP), and English text printed on shirts or used
  as design names (TEAM UNREAL, BRIDE SQUAD).

## Money, numbers, time

- Shekels: the sign comes first with no space: `₪{0}`. "לחולצה" is "per shirt": `₪{0} per shirt`.
  "מ־{0} ₪" is "from ₪{0}". "בתוספת {0} ₪" is "for an extra ₪{0}".
- A time the Hebrew writes `{0}:{1}` stays in that form (24-hour clock): "9:00 to 19:00".
- "ימי עסקים" is "business days". "שבועיים" is "two weeks".

## Terms (use one term for one concept)

| Hebrew | English |
|---|---|
| חולצה / חולצות | T-shirt / T-shirts in page titles, descriptions, keywords, main headings and the first mention on a page; "shirt / shirts" is fine after that and in short labels |
| חולצות בעיצוב אישי | custom T-shirts |
| עיצוב אישי | custom design |
| עיצוב אחד לכולם / עיצוב משותף | one design for everyone |
| עיצוב אישי לכל חולצה | a separate design for each shirt |
| הדפסה / הדפסה על חולצות | printing / T-shirt printing |
| הדפס | print |
| משלוח עד הבית | home delivery (or "delivered to your door" in running copy) |
| סבב תיקונים | round of revisions |
| חבילה | package |
| באנדל | bundle (the page name BUNDLE SALE stays as it is) |
| מידה / מידות | size / sizes |
| מבוגר / ילד (size type) | adult / kids |
| צוות | team |
| יום גיבוש | team day |
| הזמנה | order |
| פנייה / בקשה (a request, sent without payment) | request |
| מספר הפנייה | request number |
| הצעת מחיר | quote |
| אישור העיצוב | design approval |
| הדמיה | mockup |
| קוד מבצע / הנחה | promo code / discount |
| פרטי קשר | contact details |
| מייל | email |
| כלה / חתן | the bride / the groom |
| מסיבת רווקות / מסיבת רווקים | bachelorette party / bachelor party |
| יום הולדת | birthday |
| גן (kindergarten) | kindergarten |
| מחזור (graduating class) | graduating class (school); "course" or "cohort" for soldiers |
| שכבה | grade |
| תנועת נוער | youth movement |
| שבט (scouts) | troop |
| חיילים / פלוגה / מחלקה | soldiers / company / platoon |
| חולצות סוף מסלול | end-of-training T-shirts |
| תקנון | Terms |
| מדיניות פרטיות | Privacy Policy |
| עוגיות (cookies) | cookies |
| הסטודיו | the studio |
| שאלות ותשובות / שאלות נפוצות | FAQ |
| דברו איתנו | Talk to us |
| מתחילים לעצב / התחילו לעצב | Start designing |

A term that is not listed: choose the plainest English word and use it everywhere.

## Markup (a script rejects an item where it does not match the Hebrew)

1. **Number places** `{0}` `{1}` `{2}`: prices, quantities, days, hours. Keep each one that the
   Hebrew has. You may move them. A time written `{0}:{1}` stays in that form.
2. **Private values** `{v0}` `{v1}`: a customer's name, a request number, a private link. Keep
   each one exactly as written; you may move it.
3. **Element places** `<0>...</0>`, `<1>...</1>`, and self-closing `<0/>`: the page writes the
   sentence around small elements. A self-closing place is usually a line break between two
   lines of a headline, or an icon. A place with content wraps the part of the sentence shown
   in that element: the second line of a headline in another color, a price in bold, a link.
   Keep every place exactly once with the same number and the same nesting. You may move a
   place and change which words are inside it so that the sentence is natural English. Keep
   the two lines of a broken headline about as balanced in length as the Hebrew ones.
4. **Counted T-shirts.** Do not write the noun yourself next to a number place.
   - `{0:tshirt}` prints the number with the noun in the right form: "1 shirt", "12 shirts".
     Use it wherever the Hebrew says "N shirts" as a quantity. It stands for the place `{0}`.
   - `{1#tshirt}` prints the noun alone ("shirt" or "shirts") in the form that number calls
     for, when the number itself is shown inside an element place: `<0>{0}–{1}</0> חולצות`
     becomes `<0>{0}–{1}</0> {1#tshirt}`. It is extra: the place `{1}` must still appear.
   - Only `tshirt` exists. For other counted nouns (days, photos, sizes, people) choose wording
     that is right for the realistic values ("up to {0} photos", "{0} business days").
   - "חולצה {0}" (shirt number 3) is an ordinal, not a quantity: write "Shirt {0}".
5. An item that is a piece of a sentence (it ends with a comma or a preposition, or starts with
   a period) is translated as that piece, so the neighboring item completes it. Look at the
   neighbors: the list is in page order, and a whole sentence with places usually sits right
   next to its pieces. Keep a leading or trailing space or period that the piece carries.
6. An item that is not language at all (a page address, a file name, code) is copied unchanged
   if it has no Hebrew letters; if it has Hebrew letters, translate it literally and list its
   index in the notes as "not a sentence".
7. Several items can share one English text (a masculine and a feminine form of the same
   Hebrew sentence, for example). That is expected.
8. Never leave an item empty.

## How to work

Translate, then reread the whole English as an editor who has not seen the Hebrew and fix what
sounds translated, stiff or inconsistent with the terms above. Then compare each fixed item with
its Hebrew again so the meaning did not drift. Before finishing, run the validator you were
given and fix every item it rejects.
