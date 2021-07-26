import { writable } from 'svelte/store';
import '@firebase/auth';
import '@firebase/firestore';
import '@firebase/storage';

function createCount() {
  const { subscribe, update } = writable(0);

  return {
    subscribe, 
    increment: () => update((n) => n + 1),
  };
}

function createLink() {
  const link = writable("");

  return link;
}

function createDatabase() {
  if (process.browser && firebase && typeof firebase.firestore == 'function') {
    let db = firebase.firestore();
    const { subscribe, update } = writable(db);

    return {
      subscribe,
      database: db,
      getUserData: async function (uid) {
        let data = this.database.collection('users').doc(uid);
        let user;
        if (data) {
          await data.get().then((doc) => {
            user = doc.data();
          });
        } else {
          user = null;
        }
        return user;
      },
      setUserData: async function (uid, data, merge = true) {
        this.database.collection('users').doc(uid).set(data, { merge });
      },
    };
  }
}

function createUser() {
  if (process.browser && firebase && typeof firebase.auth == 'function') {
    let user = firebase.auth().currentUser;
    const { subscribe, update } = writable(user);
    return {
      subscribe,
      logOut: async function () {
        await firebase.auth().signOut();
      },
      logIn: async function (email, password) {
        await firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .catch(function (error) {
            throw error;
          });
      },
      update,
      checkEmailValidity: async function (email) {
        return await firebase
          .auth()
          .fetchSignInMethodsForEmail(email)
          .catch(function (error) {
            throw error
          })
      }
    };
  }
}

function createStorage() {
  if (process.browser && firebase && typeof firebase.storage == 'function') {
    let store = firebase.storage();
    const { subscribe, update } = writable(store);

    return {
      subscribe,
      storage: store,
      ref: store.ref(),
      uploadFile: async function (file, fileName, folder = null) {
        let fileRef;
        if (folder != null) {
          fileRef = await this.ref.child(`${folder}/${fileName}`);
        } else {
          fileRef = await this.ref.child(fileName);
        }
        await fileRef.put(file);
      },
      getJson: async function (fileName, folder = null) {
        return await this.ref
          .child(`${folder}/${fileName}`)
          .getDownloadURL()
          .then(async (url) => {
            let json = [
              {
                vin: 'ERROR',
                brand: 'ERROR',
                model: 'ERROR',
                year: 'ERROR',
                price: 'ERROR',
                color: 'ERROR',
                img: 'ERROR',
                completion: 'ERROR',
              },
            ];
            let response = await fetch(url);
            json = await response.json();
            return json;
          })
          .catch((error) => {
            switch (error.code) {
              case 'storage/object-not-found':
                throw 'File not found';
              case 'storage/unauthorized':
                throw 'Not permitted';
              case 'storage/canceled':
                throw 'Cancelled';
              case 'storage/unknown':
                throw 'Unknown';
            }
          });
      },
      getFileUrl: async function (fileName, folder = null) {
        return await this.ref
          .child(`${folder}/${fileName}`)
          .getDownloadURL()
          .catch((error) => {
            switch (error.code) {
              case 'storage/object-not-found':
                throw 'File not found';
              case 'storage/unauthorized':
                throw 'Not permitted';
              case 'storage/canceled':
                throw 'Cancelled';
              case 'storage/unknown':
                throw 'Unknown';
            }
          });
      },
    };
  }
}

function createAdmin() {
  if (process.browser && firebase && typeof firebase.firestore == 'function') {
    let db = firebase.firestore();
    const { subscribe, update } = writable(db);

    return {
      subscribe,
      database: db,
      getUsers: async function () {
        let data = await this.database.collection('users').get();
        return data.docs;
      },
    }
  }
}

export const count = createCount();
export const db = createDatabase();
export const user = createUser();
export const storage = createStorage();
export const admin = createAdmin();
export const listingLink = createLink();

if (process.browser && firebase && typeof firebase.auth == 'function') {
  firebase.auth().onAuthStateChanged(async function (person) {
    user.update(() => person);
  });
}
