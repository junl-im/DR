import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,deleteDoc,serverTimestamp} from 'firebase/firestore';
const env=await initializeTestEnvironment({projectId:'demo-dream-library',firestore:{rules:readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8080}});
try {
 const alice=env.authenticatedContext('alice').firestore(),bob=env.authenticatedContext('bob').firestore(),anon=env.unauthenticatedContext().firestore();
 const data={uid:'alice',schemaVersion:1,mode:'local',payload:'{}',updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(alice,'localSaves/alice'),data));
 await assertSucceeds(getDoc(doc(alice,'localSaves/alice')));
 await assertFails(getDoc(doc(bob,'localSaves/alice')));
 await assertFails(getDoc(doc(anon,'localSaves/alice')));
 await assertFails(setDoc(doc(bob,'localSaves/alice'),data));
 await assertFails(getDocs(collection(alice,'localSaves')));
 for(const bad of [{uid:'bob'},{mode:'online'},{schemaVersion:2},{payload:'x'.repeat(50001)},{extra:true},{updatedAt:new Date(0)}]) await assertFails(setDoc(doc(alice,'localSaves/alice'),{...data,...bad}));
 await assertFails(setDoc(doc(alice,'leaderboards/global'),{gold:999}));
 await assertSucceeds(deleteDoc(doc(alice,'localSaves/alice')));
 console.log('Firestore security: 14 allow/deny scenarios passed');
} finally {await env.cleanup();}
