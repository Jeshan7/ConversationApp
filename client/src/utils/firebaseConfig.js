import firebase from 'firebase';
import 'firebase/storage';

var firebaseConfig = {
    apiKey: "AIzaSyD060kCEaG4B86k4o175SV87k2EjwxHbbo",
    authDomain: "fir-practice-13d0a.firebaseapp.com",
    databaseURL: "https://fir-practice-13d0a.firebaseio.com",
    projectId: "fir-practice-13d0a",
    storageBucket: "fir-practice-13d0a.appspot.com",
    messagingSenderId: "600696097932",
    appId: "1:600696097932:web:0dce3559b7f99aafa0ffa9"
};

// Initialize Firebase
const fire = firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

export {
    storage,
    fire as default
};