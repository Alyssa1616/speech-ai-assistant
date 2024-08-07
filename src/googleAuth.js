import { gapi } from 'gapi-script';

export const initGoogleClient = () => {
  gapi.load('client:auth2', () => {
    if (!gapi.auth2.getAuthInstance()) {
      gapi.client.init({
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/presentations',
      }).then(() => {
        return gapi.client.load('slides', 'v1');
      });
    } else {
      gapi.client.load('slides', 'v1');
    }
  });
};

export const signIn = () => {
  const authInstance = gapi.auth2.getAuthInstance();
  return authInstance.signIn();
};

export const signOut = () => {
  const authInstance = gapi.auth2.getAuthInstance();
  return authInstance.signOut();
};