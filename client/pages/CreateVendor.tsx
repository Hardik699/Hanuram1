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
  Edit2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProfessionalPage, EmptyState } from "@/components/ProfessionalPage";
import {
  ProfessionalForm,
  FormGroup,
  FormActions,
} from "@/components/ProfessionalForm";
import { DataTable } from "@/components/DataTable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
    <Layout>
      <ProfessionalPage
        title="Vendor Management"
        description="Create, manage, and organize vendors and suppliers"
        headerAction={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="prof-btn-secondary"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? "Uploading..." : "Upload Excel"}</span>
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
              className="prof-btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
            <button
              onClick={() => {
                if (showAddForm) {
                  handleCancel();
                } else {
                  setShowAddForm(true);
                }
              }}
              className={
                showAddForm ? "prof-btn-secondary" : "prof-btn-primary"
              }
            >
              {showAddForm ? (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to List</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Vendor</span>
                </>
              )}
            </button>
          </div>
        }
      >
        {showAddForm ? (
          <div className="max-w-3xl mx-auto">
            <ProfessionalForm
              title={
                editingId ? "Edit Vendor Details" : "New Vendor Information"
              }
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Vendor Name *" error={errors.name}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter vendor name"
                    className="prof-form-input"
                  />
                </FormGroup>

                <FormGroup label="Contact Person *" error={errors.personName}>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) =>
                      setFormData({ ...formData, personName: e.target.value })
                    }
                    placeholder="Enter contact person name"
                    className="prof-form-input"
                  />
                </FormGroup>

                <FormGroup label="Mobile Number" error={errors.mobileNumber}>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
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
                      className="prof-form-input pl-10"
                    />
                  </div>
                </FormGroup>

                <FormGroup label="Email Address" error={errors.email}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      className="prof-form-input pl-10"
                    />
                  </div>
                </FormGroup>

                <FormGroup label="Location / Address *" error={errors.location}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Enter full address"
                      className="prof-form-input pl-10"
                    />
                  </div>
                </FormGroup>

                <FormGroup label="GST Number" error={errors.gstNumber}>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, gstNumber: e.target.value })
                      }
                      placeholder="Enter GST number"
                      className="prof-form-input pl-10"
                    />
                  </div>
                </FormGroup>
              </div>

              <FormActions>
                <button
                  type="submit"
                  disabled={loading}
                  className="prof-btn-primary"
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
                  className="prof-btn-secondary"
                >
                  Cancel
                </button>
              </FormActions>
            </ProfessionalForm>
          </div>
        ) : (
          <div className="prof-section">
            {tableLoading ? (
              <div className="p-12 text-center">
                <LoadingSpinner message="Loading vendor list..." />
              </div>
            ) : vendors.length === 0 ? (
              <EmptyState
                icon={<Building2 size={48} />}
                title="No Vendors Registered"
                description="Start by adding your first vendor or upload an Excel sheet to populate the list."
                action={
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="prof-btn-primary"
                  >
                    Add First Vendor
                  </button>
                }
              />
            ) : (
              <DataTable
                data={vendors}
                searchPlaceholder="Search vendors by name, person or location..."
                columns={[
                  {
                    key: "name",
                    label: "Vendor Name",
                    className:
                      "font-bold text-blue-600 dark:text-blue-400 cursor-pointer",
                    render: (val, row) => (
                      <div
                        onClick={() => navigate(`/vendor/${row._id}`)}
                        className="flex items-center gap-2"
                      >
                        <Building2 size={16} />
                        {val}
                      </div>
                    ),
                  },
                  {
                    key: "personName",
                    label: "Contact Person",
                    className: "font-medium",
                  },
                  {
                    key: "mobileNumber",
                    label: "Mobile",
                    render: (val) => (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        {val || "-"}
                      </div>
                    ),
                  },
                  {
                    key: "location",
                    label: "Location",
                    className: "max-w-xs truncate",
                  },
                  {
                    key: "createdBy",
                    label: "Created By",
                    render: (val) => (
                      <span className="prof-badge-blue">{val}</span>
                    ),
                  },
                  {
                    key: "_id",
                    label: "Actions",
                    className: "text-right",
                    render: (_, row) => (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(row._id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
        )}
      </ProfessionalPage>
    </Layout>
  );
}
