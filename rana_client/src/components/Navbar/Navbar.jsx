import React, { useContext, useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";

export const Navbar = () => {
  const { user, signOutUser } = useContext(AuthContext);

  const [darkMode, setDarkMode] = useState(false);

  // Load saved theme from localStorage on page load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setDarkMode(savedTheme === "dark");
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Toggle DaisyUI theme
  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleSignOut = () => {
    signOutUser()
      .then(() => console.log("User signed out successfully"))
      .catch((error) => console.error("Sign-out failed:", error));
  };

  const links = (
    <>
      <li><NavLink to="/">Home</NavLink></li>
      <li><NavLink to="/bills">Bills</NavLink></li>
      {!user && (
        <>
          <li><NavLink to="/mainRegister">Register</NavLink></li>
          <li><NavLink to="/register">Log In</NavLink></li>
        </>
      )}
      {user && (
        <>
          <li><NavLink to="/add-bill">Add Bills</NavLink></li>
          <li><NavLink to="/my-bills">My Pay Bills</NavLink></li>
        </>
      )}
    </>
  );

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex="-1" className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
            {links}
          </ul>
        </div>
        <a className="btn btn-ghost text-xl">SmartUtility</a>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">{links}</ul>
      </div>

      <div className="navbar-end flex items-center gap-2">
        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={darkMode}
          onChange={toggleTheme}
        />

        {user ? (
          <>
            {user.photoURL && <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-300" />}
            <button className="btn btn-sm" onClick={handleSignOut}>Logout</button>
          </>
        ) : (
          <Link className="btn btn-sm" to="/register">Login</Link>
        )}
      </div>
    </div>
  );
};
