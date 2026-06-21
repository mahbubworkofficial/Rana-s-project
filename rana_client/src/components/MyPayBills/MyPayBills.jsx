import React, { useState, useEffect, useContext } from "react";
import { Fade } from "react-awesome-reveal";
import { AuthContext } from "../../Context/AuthContext";
// PDF IMPORTS (ADD THESE AT THE TOP)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const MyPayBills = () => {
  const [userBills, setUserBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [updateData, setUpdateData] = useState({
    amount: "",
    address: "",
    phone: "",
    date: "",
  });

  const { user } = useContext(AuthContext);

  // Helper function to extract MongoDB ID
  const getMongoId = (bill) => {
    if (bill._id && typeof bill._id === "object" && bill._id.$oid) {
      return bill._id.$oid;
    }
    return bill._id || bill.id;
  };

  // Fetch user's paid bills from your server
  useEffect(() => {
    const fetchUserBills = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/paid-bills?email=${user.email}`
        );
        if (!response.ok) throw new Error("Failed to fetch bills");
        const data = await response.json();
        console.log("Fetched bills:", data);
        setUserBills(data);
      } catch (error) {
        console.error("Error fetching user bills:", error);
        setUserBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBills();
  }, [user]);

  // Total stats
  const totalBillsPaid = userBills.length;
  const totalAmount = userBills.reduce(
    (sum, bill) => sum + parseFloat(bill.amount || 0),
    0
  );

  // Handle update button click
  const handleUpdateClick = (bill) => {
    setSelectedBill(bill);
    setUpdateData({
      amount: bill.amount?.toString() || "",
      address: bill.address || "",
      phone: bill.phone || "",
      date: bill.date ? bill.date.split("T")[0] : "",
    });
    setShowUpdateModal(true);
  };

  // Handle delete button click
  const handleDeleteClick = (bill) => {
    setSelectedBill(bill);
    setShowDeleteModal(true);
  };

  // Handle update form input
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle update submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const billId = getMongoId(selectedBill);
      console.log("Updating bill ID:", billId);

      const updatedBill = {
        amount: parseFloat(updateData.amount),
        address: updateData.address,
        phone: updateData.phone,
        date: updateData.date,
        billTitle: selectedBill.billTitle,
        category: selectedBill.category,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/paid-bills/${billId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updatedBill),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bill");
      }

      const result = await response.json();
      console.log("Update result:", result);

      // Update local state
      setUserBills((prev) =>
        prev.map((bill) => {
          const currentBillId = getMongoId(bill);
          return currentBillId === billId ? { ...bill, ...updatedBill } : bill;
        })
      );

      setShowUpdateModal(false);
      setSelectedBill(null);
      alert(" Bill updated successfully!");
    } catch (error) {
      console.error("Error updating bill:", error);
      alert(` Error updating bill: ${error.message}`);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!selectedBill) return;

    try {
      const billId = getMongoId(selectedBill);
      console.log("Deleting bill ID:", billId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/paid-bills/${billId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete bill");
      }

      const result = await response.json();
      console.log("Delete result:", result);

      // Update local state
      setUserBills((prev) =>
        prev.filter((bill) => {
          const currentBillId = getMongoId(bill);
          return currentBillId !== billId;
        })
      );

      setShowDeleteModal(false);
      setSelectedBill(null);
      alert("🗑️ Bill deleted successfully!");
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert(` Error deleting bill: ${error.message}`);
    }
  };

  // Handle CSV download
  // Handle PDF download
const handleDownloadReport = () => {
  if (userBills.length === 0) {
    alert("No bills to download");
    return;
  }

  try {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Paid Bills Report", 14, 20);

    doc.setFontSize(12);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      14,
      28
    );

    const tableColumn = [
      "Username",
      "Email",
      "Amount",
      "Address",
      "Phone",
      "Date",
      "Bill Title",
      "Category",
    ];

    const tableRows = userBills.map((bill) => [
      bill.username || "",
      bill.email || "",
      bill.amount || "",
      bill.address || "",
      bill.phone || "",
      bill.date || "",
      bill.billTitle || "",
      bill.category || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });

    doc.save(`bill-report-${new Date().toISOString().split("T")[0]}.pdf`);

    alert("PDF downloaded successfully!");
  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Error generating PDF");
  }
};


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading your bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Fade direction="down" triggerOnce>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              My Paid Bills
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Manage and view all your bill payments in one place.
            </p>
          </Fade>
        </div>

        {/* Stats */}
        <Fade direction="up" triggerOnce>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {totalBillsPaid}
              </div>
              <div className="text-gray-600 font-medium">Total Bills Paid</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${totalAmount.toFixed(2)}
              </div>
              <div className="text-gray-600 font-medium">Total Amount Paid</div>
            </div>
          </div>
        </Fade>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <Fade direction="left" triggerOnce>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Payment History
              </h2>
              <p className="text-gray-600 mt-1">
                {userBills.length} bill{userBills.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </Fade>
          <Fade direction="right" triggerOnce>
            <button
              onClick={handleDownloadReport}
              disabled={userBills.length === 0}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                userBills.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md"
              }`}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Report
            </button>
          </Fade>
        </div>

        {/* Bills Table */}
        {userBills.length === 0 ? (
          <Fade direction="up" triggerOnce>
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md mx-auto">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No bills found
                </h3>
                <p className="text-gray-600">
                  {user
                    ? "You haven't paid any bills yet."
                    : "Please log in to view your paid bills."}
                </p>
              </div>
            </div>
          </Fade>
        ) : (
          <Fade direction="up" triggerOnce>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Bill Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date Paid
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userBills.map((bill) => (
                      <tr
                        key={getMongoId(bill)}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {bill.billTitle || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bill.category || "N/A"}
                          </div>
                          {bill.description && (
                            <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {bill.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {bill.username || "N/A"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {bill.email || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bill.phone || "N/A"}
                          </div>
                          {bill.address && (
                            <div className="text-sm text-gray-400 mt-1">
                              {bill.address}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-green-600 font-bold text-lg">
                            ${parseFloat(bill.amount || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-800 font-medium">
                            {formatDate(bill.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateClick(bill)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteClick(bill)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Fade>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Update Bill
              </h3>
              <form onSubmit={handleUpdateSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={updateData.amount}
                      onChange={handleUpdateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={updateData.address}
                      onChange={handleUpdateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={updateData.phone}
                      onChange={handleUpdateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={updateData.date}
                      onChange={handleUpdateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Update Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the bill "
                <strong>{selectedBill.billTitle}</strong>"? This action cannot
                be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-red-800 font-medium">
                    Warning: This will permanently delete this bill record.
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Bill
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPayBills;
