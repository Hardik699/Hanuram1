import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface Unit {
  _id: string;
  name: string;
  shortCode: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function UnitDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    shortCode: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }

    if (id) {
      fetchUnit();
    }
  }, [id, navigate]);

  const fetchUnit = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/units");
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const u = data.data.find((u: Unit) => u._id === id);
        if (u) {
          setUnit(u);
          setEditFormData({
            name: u.name,
            shortCode: u.shortCode,
          });
        } else {
          navigate("/create-unit");
        }
      }
    } catch (error) {
      console.error("Error fetching unit:", error);
      setMessageType("error");
      setMessage("Failed to load unit details");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editFormData.name.trim()) {
      newErrors.name = "Unit name is required";
    }
    if (!editFormData.shortCode.trim()) {
      newErrors.shortCode = "Short code is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;

    setSaveLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Unit updated successfully");
        setShowEditForm(false);
        setTimeout(() => {
          fetchUnit();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to update unit");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error updating unit");
      console.error(error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this unit?") || !id)
      return;

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Unit deleted successfully");
        setTimeout(() => {
          navigate("/create-unit");
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
    if (unit) {
      setEditFormData({
        name: unit.name,
        shortCode: unit.shortCode,
      });
    }
    setShowEditForm(false);
    setErrors({});
    setMessage("");
  };

  if (loading) {
    return (
      <Layout title="Unit Details">
        <div className="flex items-center justify-center p-8">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 ml-3">
            Loading unit...
          </p>
        </div>
      </Layout>
    );
  }

  if (!unit) {
    return (
      <Layout title="Unit Not Found">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Unit not found
          </p>
          <button
            onClick={() => navigate("/create-unit")}
            className="mt-4 text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
          >
            Back to Units
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Unit Details">
      <div className="space-y-6">
        <PageHeader
          title={unit?.name || "Unit Details"}
          description={`Short Code: ${unit?.shortCode || "Loading..."}`}
          breadcrumbs={[
            { label: "Units", href: "/create-unit" },
            { label: unit?.name || "Details" },
          ]}
          icon={<Settings className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
          actions={
            !showEditForm ? (
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
            ) : null
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

        {!showEditForm ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {unit.name}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Short Code
                </label>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-mono bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded">
                  {unit.shortCode}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created By
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {unit.createdBy}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created Date
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(unit.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Last Updated
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(unit.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Edit Unit
            </h2>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Unit Name *
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
                  Short Code *
                </label>
                <input
                  type="text"
                  value={editFormData.shortCode}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      shortCode: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.shortCode
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.shortCode && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.shortCode}
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
