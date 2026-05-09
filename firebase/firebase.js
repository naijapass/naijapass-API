
import admin from "firebase-admin";
import { getAuth as defAuth } from "firebase-admin/auth";
import serviceAccount from '../maje-application-firebase-adminsdk-fbsvc-efe842d664.js';

console.log(serviceAccount, "serviceAccount")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const getAuth = defAuth;

export const verifyFirebaseToken = async (idToken) => {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      // console.log("Decoded token:", decodedToken);
    } catch (error) {
      console.error("Error verifying token:", error);
    }
  }
export default admin