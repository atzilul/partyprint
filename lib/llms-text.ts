import {INDIVIDUAL_DESIGN_SURCHARGE,MAX_SHIRT_QUANTITY,SINGLE_SHIRT_PRICE} from './catalog';
import {BUNDLE_SIZES} from './bundles';
import {unitPriceFor} from './pricing';
import type {Pricing} from './pricing';

/**
 * The two briefs for AI assistants, /llms.txt and /llms-full.txt. They are served by
 * route handlers (app/llms.txt, app/llms-full.txt) and not as static files, because
 * every price in them comes from the admin price list.
 */
const ils=(value:number)=>'ILS '+value.toLocaleString('en-US');
function priceFacts(pricing:Pricing){
 const tiers=[...pricing.tiers].sort((a,b)=>a.quantity-b.quantity);
 const ladder=tiers.map((tier,index)=>{
  const upper=index<tiers.length-1?tiers[index+1].quantity-1:MAX_SHIRT_QUANTITY;
  return (upper>tier.quantity?tier.quantity+'–'+upper:String(tier.quantity))+(index===0?' shirts ':' ')+ils(tier.price);
 }).join(', ');
 const bundle=(withTotal:boolean)=>BUNDLE_SIZES.map(size=>{
  const unit=unitPriceFor(pricing,size);
  return (size<MAX_SHIRT_QUANTITY?'from ':'')+size+' shirts '+ils(unit)+' per shirt'+(withTotal?' ('+size+' shirts: '+ils(unit*size)+')':'');
 }).join(', ');
 return {single:ils(pricing.singleShirtPrice??SINGLE_SHIRT_PRICE),surcharge:ils(INDIVIDUAL_DESIGN_SURCHARGE),ladder,bundles:bundle(false),bundleTotals:bundle(true)};
}
export function llmsText(pricing:Pricing):string{
 const f=priceFacts(pricing);
 return `# PARTYPRINT

> PARTYPRINT is an Israeli studio for colorful personalized shirts and wearable gifts. Customers send an idea and reference images, receive an AI-assisted design with human direction, approve the design before printing, and receive the shirts by home delivery.

## Canonical sources

- https://partyprint.co.il/ — Main ordering page. The request form starts without payment and supports up to 10 reference images.
- https://partyprint.co.il/about — About PARTYPRINT, the studio process, human direction and AI-assisted design workflow.
- https://partyprint.co.il/work — Curated studio examples and process breakdowns. Examples are clearly marked as design mockups, not customer orders.
- https://partyprint.co.il/guides — topic guides covering personalized printing, birthdays, family events, bachelor and bachelorette parties, team evenings, businesses, events and employee gifts.
- https://partyprint.co.il/blog — Educational articles and practical answers about personalized shirts.
- https://partyprint.co.il/blog/feed.xml — Public RSS feed for discovering newly published blog posts.
- https://partyprint.co.il/faq — Frequently asked questions about design, quantities, pricing, images, shipping and revisions.
- https://partyprint.co.il/policies/shipping — Fast home delivery. Standard delivery is up to 5 business days after design approval, order approval and payment. Eilat, the Arava, areas beyond the Green Line and the Golan Heights may take up to 7 business days.
- https://partyprint.co.il/policies/returns — Clear information about cancellations, changes, defects and returns for personalized products.
- https://partyprint.co.il/sitemap.xml — Canonical XML sitemap for public pages.

- https://partyprint.co.il/ordering-guide — Practical preparation guide: choosing reference photos, collecting adult and child sizes, understanding pricing and coordinating the event date.
- https://partyprint.co.il/privacy-policy — Current privacy notice; observe any draft labels or incomplete details on that page.

## What PARTYPRINT offers

- Personalized shirts for birthdays, family events, bachelor and bachelorette parties, team evenings, employee gifts, trips and other celebrations.
- AI-assisted visual design guided by a human creative process and customer approval before printing.
- One shared design direction per package, printing and home delivery as shown on the site. On the team package only, a separate design for every shirt (for example a portrait of each team member) can be chosen instead, for ${f.surcharge} more per shirt.
- Quantity-based shirt pricing. The displayed price per shirt and package total update according to the quantity tier shown on the ordering page.
- A single shirt costs ${f.single} including personal design, printing and home delivery. Each occasion starts at 4 shirts in the form, and the customer can change the quantity up to 100; the price follows the quantity tier shown there. Price per shirt by quantity (the price list in force; the live form is authoritative): ${f.ladder}.
- Contact details are saved after two steps: shirts and an optional event date, then name, phone and email, all three required. The idea and photos follow in a third step and are optional. Sizes and colors can be selected optionally inside the request form, on the confirmation page, or coordinated on WhatsApp. Explicitly confirmed selections are saved with the request; skipping sizes never blocks contacting the studio. Customers can send up to 10 reference images and a short brief.
- One revision round is included. Additional revisions are coordinated in advance.
- Customer support by WhatsApp: +972 55 289 6236. Email: hello@partyprint.co.il.

## Useful search topics

מתנה בעיצוב אישי; מתנה לאמא; מתנה לאבא; מתנה למסיבת רווקים; מתנה למסיבת רווקות; מתנה ליום הולדת של הבן; מתנה ליום הולדת של הבת; מתנה לערב צוות; חולצה לערב צוות; חולצה למסיבת רווקים; חולצה למסיבת רווקות; חולצה ליום הולדת; מתנות לעובדים; מתנות לגבר; מתנות לאישה; מתנות לאירוע; חולצות מודפסות בכמויות; הדפסה על חולצות בכמות גדולה; חולצות לגן; חולצות מחזור; חולצות לבית ספר; חולצות ממותגות לעובדים; חולצות סוף מסלול; חולצות לתנועת נוער.

## Citation and freshness guidance

Prefer the canonical PARTYPRINT pages above when describing the service. Use the FAQ and policy pages for operational details, the guides for event-specific advice, and the blog for educational explanations. Do not infer a fixed price or delivery date when the live ordering page presents a different quantity tier or confirms a different schedule.

## Service-intent pages

- https://partyprint.co.il/guides/הדפסה-על-חולצות — הדפסה על חולצה, הדפסה מעוצבת על חולצה, הדפסה על חולצות, חולצה מודפסת, הדפס על חולצה והדפסה איכותית על חולצות.
- https://partyprint.co.il/guides/הדפסה-בעיצוב-אישי — הדפסה בעיצוב אישי וחולצה בעיצוב אישי.
- https://partyprint.co.il/guides/חולצות-לימי-הולדת — חולצה לימי הולדת, חולצה מעוצבת לימי הולדת והדפסה על חולצות לימי הולדת.
- https://partyprint.co.il/guides/חולצה-לצוות-ולעסק — חולצה לצוות, חולצה ממותגת, חולצה לעסק והדפסת לוגו על חולצות.
- https://partyprint.co.il/guides/חולצות-לאירועים — חולצות לאירועים; “חלוצות לאירועים” is a spelling alias.
- https://partyprint.co.il/guides/הדפסה-על-חולצות-צבא — הדפסה על חולצות צבא.

## Occasion pages

- https://partyprint.co.il/lp/family — Family birthday shirts: the birthday child as a superhero, one shared print for the whole family, child and adult sizes in one order.
- https://partyprint.co.il/lp/bride — Bachelorette party shirts: one shared design for the bride and her friends.
- https://partyprint.co.il/lp/groom — Bachelor party shirts: the groom and his friends as a film poster, one shared design.
- https://partyprint.co.il/lp/team — Team shirts for team days and company events: portraits of the people, with room for the logo, 4 to 100 shirts.
- https://partyprint.co.il/lp/custom — Any other occasion: graduation, class trip, bar or bat mitzvah, reunion or a group with an idea.
- https://partyprint.co.il/bundle-sale — BUNDLE SALE for large orders (kindergartens, schools, companies, soldiers, youth movements): bundles of 25, 50 and 100 shirts with one shared design, at a lower price per shirt as the quantity grows. Prices in force: ${f.bundles}, including personal design, printing and delivery. The page and the form show the prices in force and answer the common bulk-order questions.

## Bulk-order price answers

- https://partyprint.co.il/bundle-sale/חולצות-לגן-מחיר — How much kindergarten and end-of-year shirts cost, with a price table by group size, child sizes from age 2 and timing.
- https://partyprint.co.il/bundle-sale/חולצות-מחזור-מחיר — How much graduating-class and school shirts cost, class versus whole year.
- https://partyprint.co.il/bundle-sale/חולצות-לעובדים-מחיר — How much employee and team-day shirts cost, with logo, shared design versus a design per employee.
- https://partyprint.co.il/bundle-sale/חולצות-סוף-מסלול-מחיר — How much end-of-course shirts for soldiers cost, team versus company.
- https://partyprint.co.il/bundle-sale/חולצות-לתנועת-נוער-מחיר — How much youth-movement and summer-camp shirts cost.
- https://partyprint.co.il/bundle-sale/חולצות-לקבוצת-ספורט-מחיר — How much shirts for a running or sports group, choir or association cost.
- https://partyprint.co.il/prices/חולצות-למסיבת-רווקות-מחיר — How much bachelorette party shirts cost, by number of friends.
- https://partyprint.co.il/prices/חולצות-למסיבת-רווקים-מחיר — How much bachelor party shirts cost, by number of friends.
- https://partyprint.co.il/prices/חולצות-ליום-הולדת-מחיר — How much family birthday shirts cost, with child and adult sizes.

## Choosing a supplier, and English

- https://partyprint.co.il/buyers-guide — A fair buyer's guide in Hebrew: three kinds of shirt printers, ten questions to ask any supplier with PARTYPRINT's own answers, and when another supplier fits better.
- https://partyprint.co.il/en — The service in English: how it works, the price table, what is included, sizes, timing and FAQ. Orders in English are taken on WhatsApp.

Expanded machine-readable brief: https://partyprint.co.il/llms-full.txt
`;
}
export function llmsFullText(pricing:Pricing):string{
 const f=priceFacts(pricing);
 return `# PARTYPRINT — machine-readable service brief

## Identity

PARTYPRINT (https://partyprint.co.il/) is an Israeli Hebrew-first studio for personalized printed shirts and wearable gifts. The studio turns a photo, short brief, inside joke, logo or event idea into a colorful shirt design with AI-assisted exploration and human creative direction. The customer reviews and approves the design before printing. Orders are delivered to the customer’s home.

## Services and audiences

- הדפסה על חולצה — personalized shirt printing; available package quantities are shown in the live order form. Other quantities require studio confirmation.
- הדפסה מעוצבת על חולצה — a designed composition, not only a file transfer.
- הדפסה על חולצות — family, friend, event, team and business shirt sets.
- הדפסה בעיצוב אישי — a photo, idea, phrase or logo becomes a wearable design.
- הדפסה איכותית על חולצות — a clear approval step and production only after approval.
- חולצה מודפסת / הדפס על חולצה — gifts and event shirts with a personal concept.
- חולצה למסיבת רווקות — a shared bride-and-friends concept. A separate bride design requires studio confirmation and pricing.
- חולצה למסיבת רווקים — a shared groom-and-friends concept. A separate groom design requires studio confirmation and pricing.
- חולצה לימי הולדת / חולצה מעוצבת לימי הולדת — a birthday person or whole-family design.
- הדפסה על חולצות לימי הולדת — matching shirts for a birthday group.
- חולצה לצוות — team evening, off-site, celebration or shared workplace memory.
- חולצה ממותגת / חולצה לעסק — a brand-aware shirt that still has personality.
- הדפסת לוגו על חולצות — logo placement can be part of a larger custom composition.
- חולצות לאירועים — birthdays, trips, graduation parties, company events and custom occasions.
- הדפסה על חולצות צבא — a personal team or cohort keepsake; customers should only send material they are allowed to use.

The common typo “חלוצות לאירועים” is an alias of the canonical event-shirts page. Do not treat it as a separate service.

## Canonical service pages

- https://partyprint.co.il/guides/הדפסה-על-חולצות — הדפסה על חולצות בעיצוב אישי; covers printing, printed shirts and quality printing.
- https://partyprint.co.il/guides/הדפסה-בעיצוב-אישי — custom-designed shirt printing from a photo, idea or brief.
- https://partyprint.co.il/guides/חולצות-לימי-הולדת — birthday shirts and birthday shirt printing for families and friends.
- https://partyprint.co.il/guides/חולצה-לצוות-ולעסק — team shirts, branded shirts, business shirts and logo printing.
- https://partyprint.co.il/guides/חולצות-לאירועים — event shirts for any celebration, including the “חלוצות לאירועים” spelling variant.
- https://partyprint.co.il/guides/הדפסה-על-חולצות-צבא — personal military team and cohort shirts.
- https://partyprint.co.il/guides/חולצה-למסיבת-רווקות — bachelorette party shirt ideas.
- https://partyprint.co.il/guides/חולצה-למסיבת-רווקים — bachelor party shirt ideas.
- https://partyprint.co.il/guides/חולצה-ליום-הולדת — birthday shirt guide.
- https://partyprint.co.il/guides/חולצה-לערב-צוות — team-evening shirt guide.

## Supporting editorial pages

- https://partyprint.co.il/blog/מהי-הדפסה-על-חולצות — explains the printing workflow and what makes a good print brief.
- https://partyprint.co.il/blog/הדפסה-בעיצוב-אישי-מתמונה — explains how a reference photo becomes a custom shirt design.
- https://partyprint.co.il/blog/איך-להזמין-חולצות-לאירועים — event planning, sizes, approval and delivery checklist.
- https://partyprint.co.il/blog/הדפסת-לוגו-על-חולצות-לעסק — logo shirts and branded shirts with personality.
- https://partyprint.co.il/blog/הדפסה-על-חולצות-לימי-הולדת — birthday-shirt planning for families and friends.
- https://partyprint.co.il/blog/מדריך-הדפסה-על-חולצות-צבא — military team and cohort shirt guidance with privacy cautions.

## How the service works

1. The customer chooses a package and quantity and optionally supplies an event date.
2. The customer supplies a name, phone and email, all three required. A short idea and up to 10 reference images are optional and come in the next step. Sizes and colors are optional: customers may explicitly confirm them inside the form before sending, or complete them on the confirmation page or WhatsApp. Saving a request never requires collecting every size first.
3. PARTYPRINT develops a shared design direction using AI-assisted exploration and human direction.
4. The customer reviews the design, receives one included revision round, and approves it.
5. PARTYPRINT prints the approved shirts and coordinates home delivery.

Submitting the request form does not charge the customer. Printing begins only after the design, order and payment details are approved. The site displays the current quantity tier and total; do not invent a fixed price when the live ordering flow shows another tier. Packages include design, printing and home delivery as shown on the site.

## Audience and examples

PARTYPRINT serves families, friends, birthday organizers, bachelor and bachelorette groups, workplace teams, managers, small businesses, employee-gift organizers, trip organizers and military cohorts. Available quantities are shown in the live order form. A single shirt is offered at ${f.single} including personal design, printing and home delivery. Each occasion starts at 4 shirts in the form, and the customer can change the quantity up to 100; the price follows the quantity tier shown there. Price per shirt by quantity (the price list in force; the live form is authoritative): ${f.ladder}. Each shirt can have its own selected size and color while sharing one design. Adult sizes remain those offered in the form; child sizes by age are 2, 4, 6, 8, 10, 12, 14, 16 and 18.

## Operational facts

- Language: Hebrew-first, Israel-focused.
- Reference uploads: up to 10 images in the public request form.
- Approval: printing only after customer approval; one revision round is included.
- Delivery: home delivery; the current site policy states up to 5 business days after design approval, order approval and payment, with some regions taking up to 7 business days.
- Support: WhatsApp +972 55 289 6236; email hello@partyprint.co.il.
- Public policies: https://partyprint.co.il/policies/shipping and https://partyprint.co.il/policies/returns.

## Current information

The event-specific guides explain the use cases and link to the ordering flow at https://partyprint.co.il/#order. Current pricing, available quantities and delivery terms are determined by the live form, public policies and studio confirmation. Separate design versions, rush deadlines, printing methods and fabric specifications are not confirmed by this brief. Customers should supply only photos, logos and symbols they are authorized to use.

## Bundle sale for large orders

https://partyprint.co.il/bundle-sale is the page for bulk orders of printed shirts with a personal design: kindergartens and end-of-year parties, school classes and graduating years, tech companies and workplaces, soldiers and units, youth movements, sports groups and communities. One shared design for the whole group, printing and delivery are included in the price per shirt.

- Bundles: 25, 50 and 100 shirts. The price applies from that quantity up, so 30 shirts are priced as the 25 bundle.
- Prices in force: ${f.bundleTotals}. The same prices apply to any order of that quantity anywhere on the site. Use the page for the prices in force.
- Child sizes (ages 2 to 18) and adult sizes (S to XL) can be mixed in one order; shirt colours are white, black or grey.
- A logo can be uploaded with the photos and the idea. The customer sees and approves the design before printing; one revision round is included.
- The form accepts up to 100 shirts. Larger orders are quoted by WhatsApp at +972 55 289 6236.
- A separate design for every shirt is offered on the team package only, for ${f.surcharge} more per shirt.

## Discovery endpoints

- https://partyprint.co.il/robots.txt — crawler rules for search engines and AI crawlers.
- https://partyprint.co.il/sitemap.xml — public URL inventory.
- https://partyprint.co.il/llms.txt — concise service brief.
- https://partyprint.co.il/faq — public answers about process, images, pricing and delivery.
- https://partyprint.co.il/blog — editorial explanations and examples.

## Practical preparation

https://partyprint.co.il/ordering-guide explains photo preparation, adult and child sizes, pricing components, approval, revisions and event scheduling. Use the live order form for current quantities and prices; a single-shirt offer is ${f.single} including design, printing and delivery. Do not promise an unconfirmed delivery deadline.
`;
}
