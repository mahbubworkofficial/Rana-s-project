import React, { useContext, useState } from "react";
import { AuthContext } from "../../Context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";

export const Register = () => {
  const { signInUser, signInWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Success message passed from registration
  const successMessage = location.state?.successMessage || "";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInUser(email, password);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      // Sign in with Google
      const result = await signInWithGoogle();

      const newUser = {
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
      };

      // Save user in DB
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        });
      } catch (dbErr) {
        console.error("Failed to save user to DB:", dbErr);
      }

      // Navigate to home page
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Google login failed:", error);
      setError(error.message);
    }
  };

  return (
    <div className="card bg-base-100 mx-auto w-full max-w-sm shadow-2xl mt-10 p-4">
      <h1 className="text-4xl font-bold text-center pt-4 text-black">Log In</h1>
      <div className="card-body">
        
        {successMessage && (
          <div className="alert alert-success text-sm py-2 px-3 mb-4 rounded shadow-sm text-green-700 bg-green-100 border border-green-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-control mb-3">
            <label className="label font-semibold text-sm">Email</label>
            <input
              type="email"
              className="input input-bordered w-full px-3 py-2 rounded focus:outline-none focus:border-blue-500 text-black bg-white border border-gray-300"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-control mb-3">
            <label className="label font-semibold text-sm">Password</label>
            <input
              type="password"
              className="input input-bordered w-full px-3 py-2 rounded focus:outline-none focus:border-blue-500 text-black bg-white border border-gray-300"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-1">
              <a className="link link-hover text-xs text-blue-600">Forgot password?</a>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-neutral w-full mt-4 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 rounded flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Logging In...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="divider text-xs text-gray-400 my-4">OR</div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn bg-white text-black border border-gray-300 mt-2 flex items-center justify-center py-2 rounded w-full hover:bg-gray-50 transition duration-200 font-medium"
        >
          <svg
            aria-label="Google logo"
            width="16"
            height="16"
            viewBox="0 0 512 512"
            className="mr-2"
          >
            <g>
              <path d="M0 0H512V512H0" fill="#fff" />
              <path
                fill="#34a853"
                d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"
              />
              <path
                fill="#4285f4"
                d="M386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
              />
              <path
                fill="#fbbc02"
                d="M90 341a208 200 0 010-171l63 49q-12 37 0 73"
              />
              <path
                fill="#ea4335"
                d="M153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
              />
            </g>
          </svg>
          Login with Google
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          New here?{" "}
          <Link to="/mainRegister" className="text-blue-600 underline font-semibold">Register an Account</Link>
        </p>
      </div>
    </div>
  );
};
