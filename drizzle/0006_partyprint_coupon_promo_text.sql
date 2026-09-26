UPDATE `coupons`
SET `data`=json_set(`data`,'$.promoText','לרגל ההשקה: עצבו מתנה שכולם ילבשו וקבלו 5% הנחה')
WHERE `code`='PARTYSALE' AND json_extract(`data`,'$.promoText') IS NULL;
