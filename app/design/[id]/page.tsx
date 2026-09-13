import Review from './review';
export const metadata={title:'PARTYPRINT | אישור העיצוב שלכם',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{id:string}>}){return <Review id={(await params).id}/>}
