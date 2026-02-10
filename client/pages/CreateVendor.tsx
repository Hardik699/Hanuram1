import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Search,
  Edit2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";

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
        !vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !vendor.personName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !vendor.location.toLowerCase().includes(searchTerm.toLowerCase())
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
      <PageHeader
        title="Vendor Management"
        description="Create, manage, and organize vendors and suppliers"
        breadcrumbs={[{ label: "Vendor Management" }]}
        icon={<Building2 className="w-6 h-6 text-white" />}
        actions={
          !showAddForm ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={vendors.length === 0}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>
            </div>
          ) : null
        }
      />

      {showAddForm ? (
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to List
          </button>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {editingId ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <p className="text-gray-600">
                {editingId
                  ? "Update vendor information and details"
                  : "Create a new vendor/supplier profile"}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vendor Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., ABC Supply Co..."
                  autoCapitalize="words"
                  className={`w-full px-4 py-3 rounded-lg bg-white border transition-all capitalize-each-word ${
                    errors.name
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } text-gray-900 placeholder-gray-500 focus:outline-none`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Contact Person Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personName}
                  onChange={(e) =>
                    setFormData({ ...formData, personName: e.target.value })
                  }
                  placeholder="e.g., John Doe..."
                  autoCapitalize="words"
                  className={`w-full px-4 py-3 rounded-lg bg-white border transition-all capitalize-each-word ${
                    errors.personName
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } text-gray-900 placeholder-gray-500 focus:outline-none`}
                />
                {errors.personName && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.personName}
                  </p>
                )}
              </div>

              {/* Mobile Number Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mobileNumber: e.target.value,
                      })
                    }
                    placeholder="Enter mobile number"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-white border transition-all ${
                      errors.email
                        ? "border-red-500 ring-1 ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    } text-gray-900 placeholder-gray-500 focus:outline-none`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Location Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Location / Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter full address"
                    autoCapitalize="words"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-white border transition-all capitalize-each-word ${
                      errors.location
                        ? "border-red-500 ring-1 ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    } text-gray-900 placeholder-gray-500 focus:outline-none`}
                  />
                </div>
                {errors.location && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.location}
                  </p>
                )}
              </div>

              {/* GST Number Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  GST Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, gstNumber: e.target.value })
                  }
                  placeholder="Enter GST number"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {editingId ? "Update Vendor" : "Create Vendor"}
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 border ${
                messageType === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {messageType === "success" ? (
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-medium text-sm">
                {message}
              </span>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Search & Filter
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Find vendors by name, person, or location..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Vendors Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Vendors
                </h2>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {filteredVendors.length}
                  </span>{" "}
                  vendor{filteredVendors.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {tableLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="inline-block w-8 h-8 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-gray-600 mt-3 font-medium text-sm">Loading vendors...</p>
              </div>
            ) : paginatedVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <Building2 className="w-14 h-14 text-gray-300 mb-3" />
                <p className="font-bold text-gray-900 text-base">No vendors yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first vendor to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table Header */}
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Vendor Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Contact Person</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Location</th>
                      {paginatedVendors.some(v => v.gstNumber) && (
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">GST</th>
                      )}
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-200">
                    {paginatedVendors.map((vendor, idx) => (
                      <tr
                        key={vendor._id}
                        className={`hover:bg-blue-50 transition-colors duration-200 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } cursor-pointer group`}
                        onClick={() => navigate(`/vendor/${vendor._id}`)}
                      >
                        {/* Vendor Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-sm flex items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:scale-110 flex-shrink-0">
                              {vendor.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="font-bold text-gray-900 capitalize-each-word group-hover:text-red-600 transition-colors">
                              {vendor.name}
                            </div>
                          </div>
                        </td>

                        {/* Contact Person */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 capitalize-each-word">
                            {vendor.personName}
                          </span>
                        </td>

                        {/* Mobile */}
                        <td className="px-6 py-4">
                          {vendor.mobileNumber ? (
                            <a
                              href={`tel:${vendor.mobileNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-red-600 hover:text-red-700 transition-colors"
                            >
                              {vendor.mobileNumber}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4">
                          {vendor.email ? (
                            <a
                              href={`mailto:${vendor.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-red-600 hover:text-red-700 transition-colors truncate max-w-xs block"
                              title={vendor.email}
                            >
                              {vendor.email}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 capitalize-each-word">
                            {vendor.location || "—"}
                          </span>
                        </td>

                        {/* GST */}
                        {paginatedVendors.some(v => v.gstNumber) && (
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">
                              {vendor.gstNumber || "—"}
                            </span>
                          </td>
                        )}

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(vendor);
                              }}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white transition-all active:scale-95"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(vendor._id);
                              }}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-red-100 hover:bg-red-600 text-red-600 hover:text-white transition-all active:scale-95"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                    {startIndex + 1}–{Math.min(endIndex, filteredVendors.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredVendors.length}
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
    </Layout>
  );
}
