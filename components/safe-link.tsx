import type {AnchorHTMLAttributes,ReactNode} from 'react';

type SafeLinkProps=AnchorHTMLAttributes<HTMLAnchorElement>&{href:string;children:ReactNode};

/**
 * Full-document navigation keeps public links reliable when the Vinext client
 * router has not hydrated yet, while preserving the normal anchor semantics.
 */
export default function SafeLink({href,children,...props}:SafeLinkProps){return <a href={href} {...props}>{children}</a>}
