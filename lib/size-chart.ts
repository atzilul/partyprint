/**
 * The print shop's size charts (owner's questionnaire, Nov 2026), in centimetres,
 * measured on a shirt laid flat; up to 5% variation. The adult chart is the default
 * when the admin content panel has no sizes of its own; the kids' chart is by age.
 */
export type SizeRow={size:string;width:number;length:number};
export const ADULT_SIZE_CHART:SizeRow[]=[
 {size:'S',width:50,length:69},
 {size:'M',width:52,length:70.5},
 {size:'L',width:53,length:75},
 {size:'XL',width:54,length:75},
];
export const CHILD_SIZE_CHART:SizeRow[]=[
 {size:'2',width:30,length:45},
 {size:'4',width:31,length:48},
 {size:'6',width:32,length:49},
 {size:'8',width:36.5,length:52.5},
 {size:'10',width:37.5,length:55.5},
 {size:'12',width:38.5,length:58.5},
 {size:'14',width:41,length:59},
 {size:'16',width:42,length:62},
 {size:'18',width:45.5,length:63.5},
];
