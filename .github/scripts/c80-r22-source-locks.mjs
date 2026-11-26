import {C80_620R21_ZIP_DRIVE_ID as pID,C80_620R21_ZIP_SHA256 as pZIP,C80_620R21_GLB_SHA256 as pGLB} from '../../src/scripts/privateModelC80620R21SourceProfile.mjs';
import {C80_620R22_ZIP_DRIVE_ID as nID,C80_620R22_ZIP_SHA256 as nZIP,C80_620R22_GLB_SHA256 as nGLB} from '../../src/scripts/privateModelC80620R22SourceProfile.mjs';
console.log(JSON.stringify([{key:'r21',driveId:pID,zipSha256:pZIP,glbSha256:pGLB},{key:'r22',driveId:nID,zipSha256:nZIP,glbSha256:nGLB}]));
