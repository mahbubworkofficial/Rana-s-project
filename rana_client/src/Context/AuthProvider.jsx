// Context/AuthProvider.js
import React, { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import { auth } from './../firebase/firebase.init';
import { 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword  // Add this missing import
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Create user with email/password
    const createUser = (email, password) => {
        setLoading(true);
        return createUserWithEmailAndPassword(auth, email, password);
    }

    // Sign in with email/password
    const signInUser = (email, password) => {
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Google sign in
    const signInWithGoogle = () => {
        setLoading(true);
        return signInWithPopup(auth, googleProvider);
    }

    // Sign out
    const signOutUser = () => {
        setLoading(true);
        return signOut(auth);
    }

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const authInfo = {
        createUser,
        signInUser,
        signInWithGoogle,
        signOutUser,
        user,
        loading  // Fixed casing (Loading -> loading)
    }

    return (
        <AuthContext.Provider value={authInfo}>  {/* Fixed: AuthContext.Provider */}
            {children}
        </AuthContext.Provider>
    )
}