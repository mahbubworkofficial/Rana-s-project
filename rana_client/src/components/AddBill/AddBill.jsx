// components/AddBill.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Fade } from "react-awesome-reveal";
import { AuthContext } from "../../Context/AuthContext";

const AddBill = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "Electricity",
    amount: "",
    location: "",
    description: "",
    image: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const categories = ["Electricity", "Gas", "Water", "Internet"];

  // Sample images for each category
  const categoryImages = {
    Electricity:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    Gas: "https://images.unsplash.com/photo-1585970480901-90d6bb2a48b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    Water:
      "https://images.unsplash.com/photo-1551085254-e96b210db58a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    Internet:
      "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-fill image based on category
    if (name === "category" && categoryImages[value]) {
      setFormData((prev) => ({
        ...prev,
        image: categoryImages[value],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (
      !formData.title ||
      !formData.amount ||
      !formData.location ||
      !formData.description
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const billData = {
        ...formData,
        amount: parseFloat(formData.amount),
        email: user?.email || "anonymous@example.com",
        createdBy: user?.uid || "anonymous",
      };

      // Send to backend API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(billData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add bill");
      }

      setSuccess("Bill added successfully!");
      setFormData({
        title: "",
        category: "Electricity",
        amount: "",
        location: "",
        description: "",
        image: categoryImages.Electricity,
        date: new Date().toISOString().split("T")[0],
      });

      // Redirect to bills page after 2 seconds
      setTimeout(() => {
        navigate("/bills");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to add bill. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSampleBills = async () => {
    setLoading(true);
    setError("");

    try {
      // Call backend API to add sample bills
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bills/sample`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add sample bills");
      }

      setSuccess(
        "8 sample bills added successfully! Redirecting to bills page..."
      );

      setTimeout(() => {
        navigate("/bills");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to add sample bills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Fade direction="down" triggerOnce>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Add New Bill
            </h1>
            <p className="text-xl text-gray-600">
              Create a new utility bill entry in the system
            </p>
          </div>
        </Fade>

        {/* Add Sample Bills Button */}
        <Fade direction="up" triggerOnce>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Quick Setup
              </h3>
              <p className="text-blue-700 mb-4">
                Add 8 sample bills with realistic data for testing
              </p>
              <button
                onClick={handleAddSampleBills}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? "Adding Sample Bills..." : "Add 8 Sample Bills"}
              </button>
            </div>
          </div>
        </Fade>

        {/* Form */}
        <Fade direction="up" triggerOnce>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bill title"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location address"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter image URL"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter detailed description of the bill issue"
                  />
                </div>
              </div>

              {/* Preview */}
              {formData.image && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Image Preview
                  </h4>
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/bills")}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold disabled:opacity-50"
                >
                  {loading ? "Adding Bill..." : "Add Bill"}
                </button>
              </div>
            </form>
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default AddBill;
