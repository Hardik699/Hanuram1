import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Check, AlertCircle, Plus, ChevronLeft, ChevronRight, X, Settings, Search } from "lucide-react";
import { Layout } from "@/components/Layout";

interface Unit {
  _id: string;
  name: string;
  shortCode: string;
  createdAt: string;
  createdBy: string;
}

export default function CreateUnit() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    shortCode: "",
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Clear all state
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchUnits();
  }, [navigate]);

  const fetchUnits = async () => {
    try {
      setTableLoading(true);
      const response = await fetch("/api/units");
      const data = await response.json();
      if (data.success) {
        setUnits(data.data);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Unit name is required";
    }

    if (!formData.shortCode.trim()) {
      newErrors.shortCode = "Unit short code is required";
    }

    const isDuplicate = units.some(
      (unit) =>
        unit.name.toLowerCase() === formData.name.toLowerCase() &&
        unit._id !== editingId
    );
    if (isDuplicate) {
      newErrors.name = "Unit with this name already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/units/${editingId}` : "/api/units";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(data.message);
        setFormData({ name: "", shortCode: "" });
        setEditingId(null);
        setErrors({});

        setTimeout(() => {
          fetchUnits();
          setMessage("");
          setShowAddForm(false);
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Operation failed");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error saving unit");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit: Unit) => {
    setFormData({
      name: unit.name,
      shortCode: unit.shortCode,
    });
    setEditingId(unit._id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessageType("success");
        setMessage("Unit deleted successfully");
        fetchUnits();

        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to delete unit");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error deleting unit");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setFormData({ name: "", shortCode: "" });
    setEditingId(null);
    setErrors({});
    setMessage("");
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUnits = filteredUnits.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleClearAllClick = () => {
    setShowClearModal(true);
    setClearPassword("");
  };

  const confirmClearAll = async () => {
    const CLEAR_PASSWORD = "1212";

    if (clearPassword !== CLEAR_PASSWORD) {
      setMessageType("error");
      setMessage("Incorrect password");
      return;
    }

    setShowClearModal(false);

    try {
      const response = await fetch("/api/units/clear/all", {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setMessageType("success");
        setMessage(data.message);
        setClearPassword("");
        setTimeout(() => {
          fetchUnits();
          setMessage("");
        }, 1000);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to clear units");
      }
    } catch (error) {
      console.error("Error clearing units:", error);
      setMessageType("error");
      setMessage("Error clearing units");
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <Layout
      title="Unit Management"
      headerActions={
        !showAddForm ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleClearAllClick}
              disabled={units.length === 0}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </button>
          </div>
        ) : null
      }
    >
      {showAddForm ? (
        <div className="space-y-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
          >
            ← Back to List
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingId ? "Edit Unit" : "Add New Unit"}
            </h2>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  messageType === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {messageType === "success" ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <span
                  className={
                    messageType === "success"
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {message}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Unit Name (e.g., kg, gm, liter) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter unit name"
                  className={`w-full px-4 py-2.5 rounded-lg bg-white border-2 transition-all ${
                    errors.name
                      ? "border-red-500"
                      : "border-slate-200"
                  } text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Unit Short Code *
                </label>
                <input
                  type="text"
                  value={formData.shortCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., KG, GM, LTR"
                  className={`w-full px-4 py-2.5 rounded-lg bg-white border-2 transition-all ${
                    errors.shortCode
                      ? "border-red-500"
                      : "border-slate-200"
                  } text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.shortCode && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.shortCode}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-slate-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{editingId ? "Update Unit" : "Create Unit"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
                messageType === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {messageType === "success" ? (
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={
                  messageType === "success"
                    ? "text-green-800 font-medium text-sm"
                    : "text-red-800 font-medium text-sm"
                }
              >
                {message}
              </span>
            </div>
          )}

          {/* Statistics Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">Total Units</p>
                <h3 className="text-4xl font-bold mt-2 text-slate-900">{filteredUnits.length}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-100">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Filter Results
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Search Unit Name
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search units..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Units List Header */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Units List
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Showing <span className="font-bold text-slate-900">{filteredUnits.length}</span> unit{filteredUnits.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Units Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-700 sticky top-0">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">
                      Short Code
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">
                      Created By
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 sm:px-6 py-8 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-600 mt-2 text-sm">Loading units...</p>
                      </td>
                    </tr>
                  ) : paginatedUnits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 sm:px-6 py-8 text-center text-slate-600 text-sm">
                        No units found
                      </td>
                    </tr>
                  ) : (
                    paginatedUnits.map((unit, idx) => (
                      <tr
                        key={unit._id}
                        className={`transition-all group border-l-4 border-l-transparent hover:border-l-blue-500 ${
                          idx % 2 === 0
                            ? "hover:bg-slate-50"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-900">
                          {unit.name}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {unit.shortCode}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-600">
                          {unit.createdBy}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(unit)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 text-xs sm:text-sm"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(unit._id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 text-xs sm:text-sm"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-3 sm:px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="font-bold text-slate-700">
                  Items per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white border-2 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-semibold hover:border-slate-300 text-xs sm:text-sm"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm">
                <span className="font-semibold text-slate-600">
                  <span className="font-bold text-blue-600">
                    {startIndex + 1}-
                    {Math.min(endIndex, filteredUnits.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900">
                    {filteredUnits.length}
                  </span>
                </span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center p-2 rounded-lg border-2 border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-blue-500"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 min-w-[70px] sm:min-w-[100px] text-center">
                    Page <span className="font-bold text-blue-600">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages || 1}</span>
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="inline-flex items-center justify-center p-2 rounded-lg border-2 border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-blue-500"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-2xl font-bold text-slate-900">
                  Confirm Clear All
                </h3>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                This will delete all units. Please enter the password to confirm.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={clearPassword}
                  onChange={(e) => setClearPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmClearAll()}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
