UPDATE `coupons`
SET `data`=json_set(
  `data`,
  '$.title','השקת האתר · 10% הנחה',
  '$.value',10,
  '$.promoText','לרגל ההשקה: עצבו מתנה שכולם ילבשו וקבלו 10% הנחה'
)
WHERE `code`='PARTYSALE'
  AND json_extract(`data`,'$.kind')='percent'
  AND json_extract(`data`,'$.value')=5;
