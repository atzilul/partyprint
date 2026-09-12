import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Admin from './studio';
import './studio.css';
export const dynamic='force-dynamic';
export const metadata={title:'PARTYPRINT | ניהול הזמנות',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{order?:string}>}){const {order}=await searchParams;const returnTo=order&&/^[a-f0-9-]{36}$/.test(order)?'/admin?order='+encodeURIComponent(order):'/admin';const user=await requireChatGPTUser(returnTo);if(user.email.toLowerCase()!=='atzilul@gmail.com')return <div className="studio-denied"><h1>הכניסה לבעל האתר בלבד</h1><p>החשבון הזה אינו מורשה לצפות בהזמנות.</p><a href="/signout-with-chatgpt?return_to=/admin">כניסה בחשבון אחר</a></div>;return <Admin/>}
