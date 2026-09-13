import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Admin from './studio';
import './studio.css';
export const dynamic='force-dynamic';
export const metadata={title:'PARTYPRINT | ניהול הזמנות',robots:{index:false,follow:false}};
import Workspace from './workspace';
import {adminRole,isAdmin} from '@/lib/admin-auth';
import {OWNER_EMAIL} from '@/lib/team';
export default async function Page({searchParams}:{searchParams:Promise<{order?:string}>}){const {order}=await searchParams;const returnTo=order&&/^[a-f0-9-]{36}$/.test(order)?'/admin?order='+encodeURIComponent(order):'/admin';return <Protected returnTo={returnTo}/>}
async function Protected({returnTo}:{returnTo:string}){await requireChatGPTUser(returnTo);const user=await isAdmin();if(!user)return <div className="studio-denied"><h1>הכניסה לצוות מורשה בלבד</h1><p>החשבון הזה אינו מורשה לצפות בהזמנות. בקשו מבעל האתר להוסיף את המייל שלכם.</p><a href="/signout-with-chatgpt?return_to=/admin">כניסה בחשבון אחר</a></div>;const role=await adminRole();if(role==='designer'||role==='printer')return <Workspace/>;return <Admin viewer={{name:user.fullName||user.email,isOwner:user.email.toLowerCase()===OWNER_EMAIL}}/>}
