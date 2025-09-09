const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: "service_account",
        project_id: "evalon-app",
        private_key_id: "6160ee1433ed51237273310bcc1b261852d4e12f",
        private_key: process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCTxSpoPmbZlfHVOo3r488IlHDuAkidGHycsv+FWuWJZVpn8OpGiMV8yT6sRQdh2uTWqKt64NakXo/qKfLe8ji0o3tGu+sG7/x9B7fIMaTelFoh4gpDdCWhObsZ08wiTMwatGms2RNQWZWBzW6Ff2gujTUCJ2RwTYfSilcu3C17z3GcLQ1X8HIz3aFCgSeX0Ca/YpDpMfrcKGD4BNkpIHpD6I6sNlw7kiloNRoHR8gcU5OuuohrmMGPrrWz6R1YfZZ6kyEoilzSMlCIo5iyBy47be/65jUC+LNd+qzWm3NpujPe4sLOVqr9IjrHHIIE2/UGt7AAptR/DbQoOQx/9xi/AgMBAAECggEAPWpGs8irqmcdeYe6kH3AAErhnKoqT9Brih0DAgPDPpV3O5fvZp1VpwVlHOgbp1n4nhbAHnPwAaSjn6kLngmB8+G2TLGxftKjV7urcHLhmPiDdW2i4mIVeaqqzpMuVlsgwUCWYxZdZpm0/5vIAYfwXtilXV3N6rbualzA22L7LGdrhvWcJKcAAy5txa0q2OsHnkWsH+iwpzk2am79pLwA38nP5uwnRsfSbT9x9lzVdPFnbh/Z+JoBZIRj1yz0Tjq0Z7fwkXZYLuOT1UFIet59bLlOpeE5HJnbreeZIV4WG/Vjjlb1lxv6WtTjvmEzmHwu2BwXJCnzDMyiLNOlCh6HMQKBgQDJHOO0NV1ic6VH68do23c95X4Lnqxuyugsj4sqWByf9jfIe+QkQmaRW8VjXZvg2cVK/uLb5dojI7nWXynFiB7+JOCnbSG3RnI5Eq5i824ilkS6RTzvhm3+3R+jMiEP1y0a3MRCPghYUA79mHN5i8pJletcCt3OLe6QcCDj9JudUwKBgQC8GWUGtOGz+xuZV6zmz4pcMp9Xzj7J97Th/EPYxkj+Jt4iiGeW2mhaqlp646dRirXeEr3dRz5wuHt1HJx/bW4T+q10NhcIQe+MRyk0pyE1y8hQ13qNB9IJwE2dt+Jcj4eOm0ZCU0Z4geLZc2lsYiNwfViQCKW/5TDRj7NjMa39ZQKBgQC+6AiSsTGTWlnj2sIxHFulyuqKlzXx+fTJD/231WpewjgTvN9FOC7q/uVxvJNSrwYkea3ZtegLAUfQYgdh9iQNde43oFWoB1w4Jy6YyaGbfW+CLmV4rfBORZNZtCVERysO29AFXaNISb7hJc0/7N26WnDPr5T7ughC3d2q5jCt9wKBgHAAMv6WT9pqR9m7sfFRXNJfNjADV7HM9ACnxAJctvPWUuh/Didt7zslOnD4AxXzoS0VPcZ3eH+H6cMnASyDDUuKNSQAXSCGmkuNx8RZS9YLfEBevdMh9/fkcJLb/kYdFJtea6xsh4aT2G6gYQKvQOjnSgehjog/wRzXEvqahz5dAoGAdgu/WeDossEXsyX3BvEIYGZ0PXx0D3bm783RHmb8h2DBfgXZWwMEnW/swvZ1yvKQwG9JiKrsmFHyfiiV2r2OJf7D6UwKZh3DJ7lifVvHbaTRJz4iQ+WhlkXBJogCJOA3ITTPSqu/qcp0tg5Vu8wuVnfFzAwdh/+uusMawmRDuE8=\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-fbsvc@evalon-app.iam.gserviceaccount.com",
        client_id: "109653180155105281208",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40evalon-app.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'evalon-app'
      });

      console.log('🔥 Firebase Admin SDK initialized successfully');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
};

// Get Firebase Auth instance
const getAuth = () => {
  return admin.auth();
};

// Get Firebase Storage instance
const getStorage = () => {
  return admin.storage();
};

module.exports = {
  initializeFirebase,
  getAuth,
  getStorage,
  admin
};

