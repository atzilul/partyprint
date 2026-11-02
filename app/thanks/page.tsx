import type {Metadata} from 'next';
import Confirmation from './confirmation';
export const metadata:Metadata={title:'הפנייה שלכם | PARTYPRINT',robots:{index:false,follow:false},alternates:{canonical:'https://partyprint.co.il/thanks'}};
export default function Thanks(){return <Confirmation/>;}
