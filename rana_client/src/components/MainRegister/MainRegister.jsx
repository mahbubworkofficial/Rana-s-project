import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from '../../Context/AuthContext';
import { OtpVerification } from '../Register/OtpVerification';
import { updateProfile } from "firebase/auth";

export const MainRegister = () => {
  const { createUser, signInWithGoogle, signOutUser } = useContext(AuthContext);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // Password Validation Function
  const validatePassword = (password) => {
    if (!/[A-Z]/.test(password)) return "Password must contain at least one Uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one Lowercase letter.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    return "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const photo = form.photo.value;
    const password = form.password.value;

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP. Please try again.");
      }

      setRegistrationData({ name, email, photo, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!registrationData?.email) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: registrationData.email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to resend OTP");
    }
  };

  const handleVerificationSuccess = async () => {
    if (!registrationData) return;
    const { name, email, photo, password } = registrationData;

    try {
      // Create user in Firebase
      const result = await createUser(email, password);
      
      // Update Firebase profile name and photo
      if (result.user) {
        await updateProfile(result.user, {
          displayName: name,
          photoURL: photo || null,
        });
      }

      // Save user in DB
      const newUser = {
        name,
        email,
        photo,
        createdAt: new Date(),
      };
      
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        });
      } catch (dbErr) {
        console.error("Failed to save user to DB, but Firebase account created:", dbErr);
      }

      // Sign out user so they are not logged in automatically
      await signOutUser();

      // Redirect to login page (/register) with a success message
      navigate("/register", {
        replace: true,
        state: { successMessage: "Registration successful! Please login with your credentials." }
      });
    } catch (err) {
      setError(err.message);
      setShowOtp(false); // Return to registration form
    }
  };

  // Google Login
  const handleGoogleLogin = () => {
    signInWithGoogle()
      .then(() => navigate(from, { replace: true }))
      .catch((err) => setError(err.message));
  };

  if (showOtp && registrationData) {
    return (
      <OtpVerification
        email={registrationData.email}
        onVerificationSuccess={handleVerificationSuccess}
        onCancel={() => setShowOtp(false)}
        onResendOtp={handleResendOtp}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow bg-base-100">
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

      <form onSubmit={handleRegister}>

        {/* Name */}
        <div className="mb-3">
          <label className="font-semibold">Name</label>
          <input type="text" name="name" required className="w-full border px-3 py-2 rounded focus:outline-none focus:border-blue-500 text-black" />
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="font-semibold">Email</label>
          <input type="email" name="email" required className="w-full border px-3 py-2 rounded focus:outline-none focus:border-blue-500 text-black" />
        </div>

        {/* Photo URL */}
        <div className="mb-3">
          <label className="font-semibold">Photo URL</label>
          <input type="text" name="photo" placeholder="https://example.com/photo.jpg" className="w-full border px-3 py-2 rounded focus:outline-none focus:border-blue-500 text-black" />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="font-semibold">Password</label>
          <input type="password" name="password" required className="w-full border px-3 py-2 rounded focus:outline-none focus:border-blue-500 text-black" />
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Sending OTP...
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>

      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        className="w-full bg-red-500 text-white py-2 mt-4 rounded hover:bg-red-600 transition duration-200 font-medium"
      >
        Continue with Google
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/register" className="text-blue-600 underline font-semibold">Login</Link>
      </p>
    </div>
  );
};
