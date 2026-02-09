import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Check, AlertCircle, Plus, ChevronLeft, ChevronRight, X, Search, FolderOpen } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";

interface Category {
  _id: string;
  name: string;
}

interface SubCategory {
  _id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  createdBy: string;
}

export default function CreateSubCategory() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<{
    categoryId: string;
    name: string;
    status: "active" | "inactive";
  }>({
    categoryId: "",
    name: "",
    status: "active",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
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
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">("");

  // Clear all state
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchCategories();
    fetchSubcategories();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      setTableLoading(true);
      const response = await fetch("/api/subcategories");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSubcategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Sub Category name is required";
    }
    const isDuplicate = subcategories.some(
      (sub) =>
        sub.name.toLowerCase() === formData.name.toLowerCase() &&
        sub._id !== editingId
    );
    if (isDuplicate) {
      newErrors.name = "Sub Category with this name already exists";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/subcategories/${editingId}` : "/api/subcategories";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(data.message);
        setFormData({ categoryId: "", name: "", status: "active" });
        setEditingId(null);
        setErrors({});

        setTimeout(() => {
          fetchSubcategories();
          setMessage("");
          setShowAddForm(false);
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Operation failed");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error saving sub category");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subcategory: SubCategory) => {
    setFormData({
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      status: subcategory.status,
    });
    setEditingId(subcategory._id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sub category?")) return;

    try {
      const response = await fetch(`/api/subcategories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Sub Category deleted successfully");
        setTimeout(() => {
          fetchSubcategories();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to delete sub category");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error deleting sub category");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setFormData({ categoryId: "", name: "", status: "active" });
    setEditingId(null);
    setErrors({});
    setShowAddForm(false);
  };

  const getFilteredSubcategories = () => {
    return subcategories.filter((sub) => {
      if (searchTerm && !sub.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterCategoryId && sub.categoryId !== filterCategoryId) {
        return false;
      }
      if (filterStatus && sub.status !== filterStatus) {
        return false;
      }
      return true;
    });
  };

  const filteredSubcategories = getFilteredSubcategories();
  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubcategories = filteredSubcategories.slice(startIndex, endIndex);

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
      const response = await fetch("/api/subcategories/clear/all", {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setMessageType("success");
        setMessage(data.message);
        setClearPassword("");
        setTimeout(() => {
          fetchSubCategories();
          setMessage("");
        }, 1000);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to clear subcategories");
      }
    } catch (error) {
      console.error("Error clearing subcategories:", error);
      setMessageType("error");
      setMessage("Error clearing subcategories");
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <Layout title="Sub Categories">
      {showAddForm ? (
        <div className="space-y-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
          >
            ← Back to List
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {editingId ? "Edit Sub Category" : "Add New Sub Category"}
            </h2>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  messageType === "success"
                    ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                }`}
              >
                {messageType === "success" ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <span
                  className={
                    messageType === "success"
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }
                >
                  {message}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.categoryId
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">Choose a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.categoryId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sub Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter sub category name"
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.name
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.name && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{editingId ? "Update Sub Category" : "Create Sub Category"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Sub Category Management"
            description="Create, manage, and organize product sub categories"
            breadcrumbs={[{ label: "Sub Category Management" }]}
            icon={<FolderOpen className="w-6 h-6 text-white" />}
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllClick}
                  disabled={subcategories.length === 0}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Sub Category</span>
                </button>
              </div>
            }
          />

          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 border ${
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

          {/* Filter Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-2 p-6 mb-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Filter Results
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-teal-700 dark:text-teal-400">
                  Search Name
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-teal-500 dark:text-teal-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search sub categories..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-700 border-2 border-teal-200 dark:border-teal-900/50 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-teal-700 dark:text-teal-400">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as "" | "active" | "inactive");
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border-2 border-teal-200 dark:border-teal-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium shadow-sm hover:border-teal-300"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub Categories List Header */}
          <div className="bg-gradient-to-r from-slate-50 to-teal-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl shadow-md p-5 mb-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Sub Categories List
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {filteredSubcategories.length}
                  </span>{" "}
                  sub categor{filteredSubcategories.length !== 1 ? "ies" : "y"}
                </p>
              </div>
            </div>
          </div>

          {/* Sub Categories Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-full">
                <thead className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 dark:from-teal-900 dark:via-teal-900 dark:to-teal-950 border-b-2 border-teal-700 dark:border-teal-800 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs md:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Initial
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs md:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs md:text-sm font-bold text-white uppercase tracking-wider hidden sm:table-cell">
                      Category
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs md:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs md:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                      Created By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tableLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                          Loading sub categories...
                        </p>
                      </td>
                    </tr>
                  ) : paginatedSubcategories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-600 dark:text-slate-400"
                      >
                        No sub categories found
                      </td>
                    </tr>
                  ) : (
                    paginatedSubcategories.map((subcategory, idx) => (
                      <tr
                        key={subcategory._id}
                        className={`transition-all group border-l-4 border-l-transparent hover:border-l-teal-500 h-16 ${
                          idx % 2 === 0
                            ? "hover:bg-teal-50 dark:hover:bg-slate-700/50"
                            : "bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <td
                          className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-xs font-bold text-white cursor-pointer transition-colors whitespace-nowrap"
                          onClick={() => navigate(`/subcategory/${subcategory._id}`)}
                        >
                          <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 text-white text-xs font-bold group-hover:from-teal-700 group-hover:to-teal-800 dark:group-hover:from-teal-800 dark:group-hover:to-teal-900 transition-all shadow-md">
                            {subcategory.name.substring(0, 1)}
                          </span>
                        </td>
                        <td
                          className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white cursor-pointer group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate"
                          onClick={() => navigate(`/subcategory/${subcategory._id}`)}
                          title={subcategory.name}
                        >
                          {subcategory.name}
                        </td>
                        <td
                          className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 cursor-pointer truncate hidden sm:table-cell"
                          onClick={() => navigate(`/subcategory/${subcategory._id}`)}
                          title={subcategory.categoryName || "-"}
                        >
                          {subcategory.categoryName || "-"}
                        </td>
                        <td
                          className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                          onClick={() => navigate(`/subcategory/${subcategory._id}`)}
                        >
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              subcategory.status === "active"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {subcategory.status
                              ? subcategory.status.charAt(0).toUpperCase() +
                                subcategory.status.slice(1)
                              : "-"}
                          </span>
                        </td>
                        <td
                          className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer hidden md:table-cell"
                          onClick={() => navigate(`/subcategory/${subcategory._id}`)}
                        >
                          {subcategory.createdBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-5 border-t-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-teal-50 dark:from-slate-800/50 dark:to-slate-800/30 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Items per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border-2 border-teal-200 dark:border-teal-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-semibold hover:border-teal-300"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {startIndex + 1}-{Math.min(endIndex, filteredSubcategories.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-slate-200">
                    {filteredSubcategories.length}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-teal-300 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-teal-500 dark:hover:border-teal-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 min-w-[100px] text-center">
                    Page{" "}
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {totalPages || 1}
                    </span>
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-teal-300 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-teal-500 dark:hover:border-teal-800"
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
                This will delete ALL sub categories. This action cannot be undone.
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
