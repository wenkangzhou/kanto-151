import {readFileSync} from 'node:fs';
import {verifyFamilyExport} from '../../src/lib/family-export';
const path=process.argv[2];
if(!path){console.error('Usage: node --import tsx scripts/backup/verify.ts /path/to/export.json');process.exit(1);}
try {
  const file=verifyFamilyExport(JSON.parse(readFileSync(path,'utf8')));
  console.log('Integrity check passed:',file.exportedAt);
  console.table(file.counts);
  console.log('This checks file integrity, not authenticity or production recovery readiness.');
} catch(error) {
  console.error(error instanceof Error?error.message:'Invalid export');process.exitCode=1;
}
