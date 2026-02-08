import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Upload,
  Building2,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProfessionalPage, EmptyState } from "@/components/ProfessionalPage";
import { ProfessionalForm, FormGroup, FormActions } from "@/components/ProfessionalForm";
import { DataTable } from "@/components/DataTable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Vendor {
  _id: string;
  name: string;
  personName: string;
  mobileNumber: string;
  email: string;
  location: string;
  gstNumber?: string;
  createdAt: string;
  createdBy: string;
}

export default function CreateVendor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    personName: "",
    mobileNumber: "",
    email: "",
    location: "",
    gstNumber: "",
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchVendors();
  }, [navigate]);

  const fetchVendors = async () => {
    try {
      setTableLoading(true);
      const response = await fetch("/api/vendors");
      const data = await response.json();
      if (data.success) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const clearAllVendors = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL vendors? This action cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/vendors/clear/all", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);
      if (data.success) {
        setMessageType("success");
        setMessage(data.message);
        setTimeout(() => {
          fetchVendors();
          setMessage("");
        }, 1000);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to clear vendors");
      }
    } catch (error) {
      console.error("Error clearing vendors:", error);
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Error clearing vendors",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vendors/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessageType("success");
        setMessage(
          `Successfully uploaded! Created: ${data.created}, Skipped: ${data.skipped}`,
        );
        setTimeout(() => {
          fetchVendors();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to upload vendors");
      }
    } catch (error) {
      console.error("Error uploading vendors:", error);
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Error uploading vendors",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vendor name is required";
    }

    if (!formData.personName.trim()) {
      newErrors.personName = "Person name is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location/Address is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    const isDuplicate = vendors.some(
      (vendor) =>
        vendor.name.toLowerCase() === formData.name.toLowerCase() &&
        vendor._id !== editingId,
    );
    if (isDuplicate) {
      newErrors.name = "Vendor with this name already exists";
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
      const url = editingId ? `/api/vendors/${editingId}` : "/api/vendors";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(data.message);
        setFormData({
          name: "",
          personName: "",
          mobileNumber: "",
          email: "",
          location: "",
          gstNumber: "",
        });
        setEditingId(null);
        setErrors({});

        setTimeout(() => {
          fetchVendors();
          setMessage("");
          setShowAddForm(false);
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Operation failed");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error saving vendor");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      personName: vendor.personName,
      mobileNumber: vendor.mobileNumber,
      email: vendor.email,
      location: vendor.location,
      gstNumber: vendor.gstNumber || "",
    });
    setEditingId(vendor._id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Vendor deleted successfully");
        setTimeout(() => {
          fetchVendors();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to delete vendor");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error deleting vendor");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      personName: "",
      mobileNumber: "",
      email: "",
      location: "",
      gstNumber: "",
    });
    setEditingId(null);
    setErrors({});
    setShowAddForm(false);
  };

  const getFilteredVendors = () => {
    return vendors.filter((vendor) => {
      if (
        searchTerm &&
        !vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  const filteredVendors = getFilteredVendors();
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <Layout title="Vendors">
      {showAddForm ? (
        <div className="space-y-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to List
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {editingId ? "Edit Vendor" : "Add New Vendor"}
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
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter vendor name"
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.name
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.name && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Person Name *
                </label>
                <input
                  type="text"
                  value={formData.personName}
                  onChange={(e) =>
                    setFormData({ ...formData, personName: e.target.value })
                  }
                  placeholder="Enter contact person name"
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.personName
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.personName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.personName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, mobileNumber: e.target.value })
                    }
                    placeholder="Enter mobile number"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                      errors.mobileNumber
                        ? "border-red-500 dark:border-red-400"
                        : "border-slate-300 dark:border-slate-600"
                    } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.mobileNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                      errors.email
                        ? "border-red-500 dark:border-red-400"
                        : "border-slate-300 dark:border-slate-600"
                    } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Location/Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter location or full address"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                      errors.location
                        ? "border-red-500 dark:border-red-400"
                        : "border-slate-300 dark:border-slate-600"
                    } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                {errors.location && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.location}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, gstNumber: e.target.value })
                  }
                  placeholder="Enter GST number"
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.gstNumber
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.gstNumber && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.gstNumber}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>
                        {editingId ? "Update Vendor" : "Create Vendor"}
                      </span>
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
            title="Vendor Management"
            description="Create, manage, and organize vendors and suppliers"
            breadcrumbs={[{ label: "Vendor Management" }]}
            icon={<Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Excel"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={clearAllVendors}
                  disabled={loading || vendors.length === 0}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vendor</span>
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

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-2 p-6 mb-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Filter Results
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-blue-700 dark:text-blue-400">
                  Search Vendor Name
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search vendors..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-900/50 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Vendors List
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Showing <span className="font-bold text-slate-900 dark:text-white">{filteredVendors.length}</span> vendor{filteredVendors.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {tableLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Loading vendors...
                  </p>
                </div>
              ) : paginatedVendors.length === 0 ? (
                <div className="p-8 text-center text-slate-600 dark:text-slate-400">
                  No vendors found
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 dark:from-indigo-900 dark:via-indigo-900 dark:to-indigo-950 border-b-2 border-indigo-700 dark:border-indigo-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Vendor Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                        Mobile
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                        Created By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {paginatedVendors.map((vendor, idx) => (
                      <tr
                        key={vendor._id}
                        className={`transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500 ${
                          idx % 2 === 0
                            ? "hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                            : "bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <td
                          onClick={() => navigate(`/vendor/${vendor._id}`)}
                          className="px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors"
                        >
                          {vendor.name}
                        </td>
                        <td
                          onClick={() => navigate(`/vendor/${vendor._id}`)}
                          className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          {vendor.personName}
                        </td>
                        <td
                          onClick={() => navigate(`/vendor/${vendor._id}`)}
                          className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {vendor.mobileNumber}
                          </div>
                        </td>
                        <td
                          onClick={() => navigate(`/vendor/${vendor._id}`)}
                          className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 cursor-pointer max-w-xs truncate"
                        >
                          {vendor.location}
                        </td>
                        <td
                          onClick={() => navigate(`/vendor/${vendor._id}`)}
                          className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          {vendor.createdBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-5 border-t-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-800/30 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Items per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-semibold hover:border-blue-300"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {startIndex + 1}-{Math.min(endIndex, filteredVendors.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-slate-200">
                    {filteredVendors.length}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-blue-300 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-blue-500 dark:hover:border-blue-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 min-w-[100px] text-center">
                    Page{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
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
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-blue-300 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-blue-500 dark:hover:border-blue-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
