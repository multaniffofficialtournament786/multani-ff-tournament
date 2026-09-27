importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDcP8vr_PaSFLJ1XadDL3HG4Ny9DRvOjXQ",
  authDomain: "multani-ff-admin.firebaseapp.com",
  projectId: "multani-ff-admin",
  storageBucket: "multani-ff-admin.firebasestorage.app",
  messagingSenderId: "263780759644",
  appId: "1:263780759644:web:864be0b5d12df3524b8e99",
  measurementId: "G-3Q5KEP9GGL"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
