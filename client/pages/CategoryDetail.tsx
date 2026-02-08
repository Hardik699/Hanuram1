import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Plus,
  Folder,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface Category {
  _id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function CategoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
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
      fetchCategory();
    }
  }, [id, navigate]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const cat = data.data.find((c: Category) => c._id === id);
        if (cat) {
          setCategory(cat);
          setEditFormData({
            name: cat.name,
            description: cat.description,
            status: cat.status || "inactive",
          });
        } else {
          navigate("/create-category");
        }
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      setMessageType("error");
      setMessage("Failed to load category details");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editFormData.name.trim()) {
      newErrors.name = "Category name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;

    setSaveLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Category updated successfully");
        setShowEditForm(false);
        setTimeout(() => {
          fetchCategory();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to update category");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error updating category");
      console.error(error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category?") || !id)
      return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Category deleted successfully");
        setTimeout(() => {
          navigate("/create-category");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to delete category");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error deleting category");
      console.error(error);
    }
  };

  const handleCancel = () => {
    if (category) {
      setEditFormData({
        name: category.name,
        description: category.description,
        status: category.status || "inactive",
      });
    }
    setShowEditForm(false);
    setErrors({});
    setMessage("");
  };

  if (loading) {
    return (
      <Layout title="Category Details">
        <div className="flex items-center justify-center p-8">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 ml-3">
            Loading category...
          </p>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout title="Category Not Found">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Category not found
          </p>
          <button
            onClick={() => navigate("/create-category")}
            className="mt-4 text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
          >
            Back to Categories
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Category Details">
      <div className="space-y-6">
        <button
          onClick={() => navigate("/create-category")}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
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
                {category.name}
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
                  Description
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {category.description || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                    (category.status || "inactive") === "active"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}
                >
                  {(category.status || "inactive").charAt(0).toUpperCase() +
                    (category.status || "inactive").slice(1)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created By
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {category.createdBy}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created Date
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(category.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Last Updated
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(category.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Edit Category
            </h2>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category Name *
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
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status *
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
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
