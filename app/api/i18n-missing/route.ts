import {missingSentences} from '@/i18n/server';

/** Translation sync only: the sentences that were rendered on a translated address without a translation. */
export const dynamic='force-dynamic';
export async function GET(){
 if(process.env.PP_I18N_COLLECT!=='1')return new Response(null,{status:404});
 return Response.json(missingSentences(),{headers:{'Cache-Control':'no-store'}});
}
