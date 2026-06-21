import React, { useState, useRef, useEffect } from "react";

export const OtpVerification = ({ email, onVerificationSuccess, onCancel, onResendOtp }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30); // 30 seconds countdown for resending
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    const val = element.value;
    if (isNaN(val)) return; // Only allow numbers

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Move to next input if not empty
    if (val && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on Backspace if current is empty
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!/^\d{6}$/.test(text)) return; // only paste 6-digit numbers

    const pasteData = text.split("");
    setOtp(pasteData);

    // Focus last input
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter a 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }
      onVerificationSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError("");
    setCanResend(false);
    setTimer(30);
    try {
      await onResendOtp();
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow bg-base-100">
      <h2 className="text-2xl font-bold mb-2 text-center">Enter Verification Code</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        We've sent a 6-digit verification code to <span className="font-semibold">{email}</span>.
      </p>

      <form onSubmit={handleVerify}>
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-black"
              value={data}
              ref={(el) => (inputRefs.current[index] = el)}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Verifying...
            </>
          ) : (
            "Verify & Register"
          )}
        </button>
      </form>

      <div className="flex flex-col items-center justify-center mt-6 gap-2">
        <p className="text-sm text-gray-500 font-medium">
          Didn't receive the code?{" "}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-blue-600 font-semibold underline bg-transparent border-none cursor-pointer"
            >
              Resend OTP
            </button>
          ) : (
            <span className="text-gray-400 font-semibold">Resend in {timer}s</span>
          )}
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 font-medium"
        >
          Back to Registration
        </button>
      </div>
    </div>
  );
};
