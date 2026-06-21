import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";

const BillDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/bills/${id}`
        );
        const data = await res.json();
        setBill(data);
      } catch (error) {
        console.error("Error fetching bill:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [id]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getCategoryColor = (category) => {
    const colors = {
      Electricity: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Gas: "bg-red-100 text-red-800 border-red-200",
      Water: "bg-blue-100 text-blue-800 border-blue-200",
      Internet: "bg-purple-100 text-purple-800 border-purple-200",
    };

    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handlePayNow = async () => {
    if (!bill || !user) {
      alert("Please log in to pay bills");
      return;
    }

    const paidBill = {
      username: user.name,
      email: user.email,
      billTitle: bill.title,
      category: bill.category,
      amount: bill.amount,
      date: new Date().toISOString(),
      address: user.address || "",
      phone: user.phone || "",
      image: bill.image,
      description: bill.description,
      location: bill.location,
      originalBillId: id,
      billDueDate: bill.date,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/paid-bills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paidBill),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to record payment");
      }

      alert("✅ Payment successful! Bill added to paid bills.");
    } catch (error) {
      console.error(error);
      alert(`Payment failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2>Bill not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          to="/bills"
          className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
        >
          ← Back to Bills
        </Link>

        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <img
            src={bill.image}
            alt={bill.title}
            className="w-full h-64 object-cover"
          />

          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold">{bill.title}</h1>
                <p className="text-gray-600">{bill.location}</p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  ${bill.amount}
                </div>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${getCategoryColor(
                    bill.category
                  )}`}
                >
                  {bill.category}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Due Date</h3>
                <p>{formatDate(bill.date)}</p>
                <p className="text-green-600 text-sm mt-1">
                  Available for payment
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Category</h3>
                <p>{bill.category}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Description</h3>
              <p className="text-gray-600">{bill.description}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePayNow}
                disabled={!user}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold ${
                  user
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {!user ? "Please Login to Pay" : "Pay Now"}
              </button>

              <button className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300">
                Download Invoice
              </button>
            </div>

            {!user && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700">
                  Please log in to pay bills and access payment features.
                </p>
              </div>
            )}

            {user && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-800 text-sm">
                  ✅ This bill is eligible for payment.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow border p-6">
          <h3 className="text-lg font-semibold mb-3">
            Payment Information
          </h3>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p>
                <strong>Payment Policy:</strong> All bills can be paid online.
              </p>

              <p className="mt-2">
                <strong>Payments:</strong> Bills can be paid at any time.
              </p>
            </div>

            <div>
              <p>
                <strong>Support:</strong> support@utilitybills.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetails;