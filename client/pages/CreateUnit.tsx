import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Search,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";

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
        unit._id !== editingId,
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

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Unit deleted successfully");
        setTimeout(() => {
          fetchUnits();
          setMessage("");
        }, 1500);
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
    setFormData({ name: "", shortCode: "" });
    setEditingId(null);
    setErrors({});
    setShowAddForm(false);
  };

  const getFilteredUnits = () => {
    return units.filter((unit) => {
      if (
        searchTerm &&
        !unit.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  const filteredUnits = getFilteredUnits();
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUnits = filteredUnits.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

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
    <Layout title="Units">
      <PageHeader
        title="Unit Management"
        description="Manage measurement units for products"
        breadcrumbs={[{ label: "Unit Management" }]}
        icon={<Settings className="w-6 h-6 text-white" />}
        actions={
          !showAddForm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAllClick}
                disabled={units.length === 0}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-2 hover:shadow-elevation-4 transform hover:scale-105 hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Unit</span>
              </button>
            </div>
          ) : null
        }
      />
      {showAddForm ? (
        <div className="space-y-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
          >
            ← Back to List
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {editingId ? "Edit Unit" : "Add New Unit"}
              </h2>
              <p className="text-gray-600">
                {editingId ? "Update unit information" : "Create a new measurement unit"}
              </p>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 border animate-slide-in-down ${
                  messageType === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                {messageType === "success" ? (
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <span className="font-medium text-sm">
                  {message}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Unit Name Field */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Kilogram, Liter, Piece"
                  autoCapitalize="words"
                  className={`w-full px-4 py-3 rounded-lg bg-white border transition-all capitalize-each-word text-gray-900 placeholder-gray-400 focus:outline-none ${
                    errors.name
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Short Code Field */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Short Code <span className="text-red-500">*</span>
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
                  placeholder="e.g., KG, LTR, PCS"
                  className={`w-full px-4 py-3 rounded-lg bg-white border transition-all text-gray-900 placeholder-gray-400 focus:outline-none font-semibold text-center ${
                    errors.shortCode
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  }`}
                />
                {errors.shortCode && (
                  <p className="text-red-600 text-sm mt-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.shortCode}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200 mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingId ? "Update Unit" : "Create Unit"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
                messageType === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
              }`}
            >
              {messageType === "success" ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={
                  messageType === "success"
                    ? "text-green-800 dark:text-green-300 font-medium text-sm"
                    : "text-red-800 dark:text-red-300 font-medium text-sm"
                }
              >
                {message}
              </span>
            </div>
          )}

          {/* Statistics Card - Modern Design */}
          <div className="stat-card group mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="stat-label">
                  Total Units
                </p>
                <h3 className="stat-value text-3xl mt-2">
                  {filteredUnits.length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Search Section - Modern Design */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Search & Filter
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Find units by name..."
                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Units Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Units
                </h2>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {filteredUnits.length}
                  </span>{" "}
                  unit{filteredUnits.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </div>

          {/* Units Grid - Light & Modern Design */}
          <div className="space-y-3">
            {tableLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="inline-block w-8 h-8 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-gray-600 mt-3 font-medium text-sm">Loading units...</p>
              </div>
            ) : paginatedUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <Settings className="w-14 h-14 text-blue-300 mb-3" />
                <p className="font-bold text-gray-900 text-base">No units yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first unit to get started</p>
              </div>
            ) : (
              paginatedUnits.map((unit) => (
                <div
                  key={unit._id}
                  className="group bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-lg hover:scale-102 cursor-pointer flex items-center justify-between"
                  onClick={() => navigate(`/unit/${unit._id}`)}
                >
                  {/* Left Content */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-base flex items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:from-blue-600 group-hover:to-blue-700 shadow-sm">
                        {unit.name.substring(0, 1).toUpperCase()}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate capitalize-each-word">
                          {unit.name}
                        </h3>
                        <span className="hidden sm:inline text-xs bg-blue-100 group-hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-md transition-colors font-medium uppercase">
                          {unit.shortCode}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">by <span className="font-medium text-gray-700 capitalize-each-word">{unit.createdBy}</span></p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(unit);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-semibold transition-all active:scale-95"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(unit._id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-600 text-red-600 hover:text-white text-xs font-semibold transition-all active:scale-95"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Show:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all hover:border-blue-400"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-600">
                  <span className="font-semibold text-blue-600">
                    {startIndex + 1}–{Math.min(endIndex, filteredUnits.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredUnits.length}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 transition-all hover:border-blue-400"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-700 min-w-[70px] text-center">
                    <span className="font-bold text-blue-600">{currentPage}</span>/<span className="font-bold text-gray-900">{totalPages || 1}</span>
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 transition-all hover:border-blue-400"
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Confirm Clear All
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                This will delete ALL units. This action cannot be undone.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Enter password to confirm
                </label>
                <input
                  type="password"
                  value={clearPassword}
                  onChange={(e) => setClearPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      confirmClearAll();
                    }
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowClearModal(false);
                    setClearPassword("");
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearAll}
                  disabled={!clearPassword}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
