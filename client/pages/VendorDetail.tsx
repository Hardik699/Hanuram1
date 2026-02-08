import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
} from "lucide-react";
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
  updatedAt: string;
  createdBy: string;
}

export default function VendorDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    personName: "",
    mobileNumber: "",
    email: "",
    location: "",
    gstNumber: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }

    if (id) {
      fetchVendor();
    }
  }, [id, navigate]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vendors");
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const v = data.data.find((v: Vendor) => v._id === id);
        if (v) {
          setVendor(v);
          setEditFormData({
            name: v.name,
            personName: v.personName,
            mobileNumber: v.mobileNumber,
            email: v.email,
            location: v.location,
            gstNumber: v.gstNumber || "",
          });
        } else {
          navigate("/create-vendor");
        }
      }
    } catch (error) {
      console.error("Error fetching vendor:", error);
      setMessageType("error");
      setMessage("Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editFormData.name.trim()) {
      newErrors.name = "Vendor name is required";
    }
    if (!editFormData.personName.trim()) {
      newErrors.personName = "Contact person name is required";
    }
    if (!editFormData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    }
    if (!editFormData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!editFormData.location.trim()) {
      newErrors.location = "Location is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;

    setSaveLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Vendor updated successfully");
        setShowEditForm(false);
        setTimeout(() => {
          fetchVendor();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to update vendor");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error updating vendor");
      console.error(error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vendor?") || !id) return;

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Vendor deleted successfully");
        setTimeout(() => {
          navigate("/create-vendor");
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
    if (vendor) {
      setEditFormData({
        name: vendor.name,
        personName: vendor.personName,
        mobileNumber: vendor.mobileNumber,
        email: vendor.email,
        location: vendor.location,
        gstNumber: vendor.gstNumber || "",
      });
    }
    setShowEditForm(false);
    setErrors({});
    setMessage("");
  };

  if (loading) {
    return (
      <Layout title="Vendor Details">
        <div className="flex items-center justify-center p-8">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 ml-3">
            Loading vendor...
          </p>
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout title="Vendor Not Found">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Vendor not found</p>
          <button
            onClick={() => navigate("/create-vendor")}
            className="mt-4 text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
          >
            Back to Vendors
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Vendor Details">
      <div className="space-y-6">
        <button
          onClick={() => navigate("/create-vendor")}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendors
        </button>

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

        {!showEditForm ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {vendor.name}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Contact Person
                  </label>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {vendor.personName}
                </p>
              </div>

              <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mobile Number
                  </label>
                </div>
                <a
                  href={`tel:${vendor.mobileNumber}`}
                  className="text-teal-600 dark:text-teal-400 hover:underline text-lg"
                >
                  {vendor.mobileNumber}
                </a>
              </div>

              <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                </div>
                <a
                  href={`mailto:${vendor.email}`}
                  className="text-teal-600 dark:text-teal-400 hover:underline text-lg"
                >
                  {vendor.email}
                </a>
              </div>

              <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {vendor.location}
                </p>
              </div>

              {vendor.gstNumber && (
                <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    GST Number
                  </label>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    {vendor.gstNumber}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created By
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {vendor.createdBy}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created Date
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(vendor.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Last Updated
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(vendor.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Edit Vendor
            </h2>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.name
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.name && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  value={editFormData.personName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      personName: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.personName
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.personName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.personName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={editFormData.mobileNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      mobileNumber: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.mobileNumber
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.mobileNumber && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.mobileNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.email
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.email && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      location: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.location
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
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
                  value={editFormData.gstNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      gstNumber: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.gstNumber
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.gstNumber && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.gstNumber}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {saveLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
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
        )}
      </div>
    </Layout>
  );
}
