// Read the password from stdin, never command-line arguments or committed files.
import {randomBytes,scryptSync} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const password=input.replace(/\r?\n$/,'');if(password.length<12){console.error('Use a password of at least 12 characters.');process.exit(1)}
const salt=randomBytes(16).toString('hex');console.log('scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex'));
