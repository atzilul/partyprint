import {redirect} from 'next/navigation';

type Params = Record<string, string | string[] | undefined>;

/** Campaign alias for the same server-rendered bride variant; retain UTMs and click IDs. */
export default async function BrideLanding({searchParams}:{searchParams:Promise<Params>}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'v' || key === 'pp_landing_path' || value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) query.append(key, entry);
  }
  query.set('v', 'bride');
  query.set('pp_landing_path', '/lp/bride');
  redirect('/?' + query.toString());
}
