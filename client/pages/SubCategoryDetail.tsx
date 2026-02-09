import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface SubCategory {
  _id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function SubCategoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    categoryId: "",
    name: "",
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
      fetchAllData();
    }
  }, [id, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [subResponse, catResponse] = await Promise.all([
        fetch("/api/subcategories"),
        fetch("/api/categories"),
      ]);

      const subData = await subResponse.json();
      const catData = await catResponse.json();

      if (subData.success && Array.isArray(subData.data)) {
        const sub = subData.data.find((s: SubCategory) => s._id === id);
        if (sub) {
          setSubCategory(sub);
          setEditFormData({
            categoryId: sub.categoryId,
            name: sub.name,
            status: sub.status || "inactive",
          });
        } else {
          navigate("/create-subcategory");
        }
      }

      if (catData.success && Array.isArray(catData.data)) {
        setCategories(catData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessageType("error");
      setMessage("Failed to load subcategory details");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editFormData.categoryId) {
      newErrors.categoryId = "Category is required";
    }
    if (!editFormData.name.trim()) {
      newErrors.name = "SubCategory name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;

    setSaveLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/subcategories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("SubCategory updated successfully");
        setShowEditForm(false);
        setTimeout(() => {
          fetchAllData();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to update subcategory");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error updating subcategory");
      console.error(error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this subcategory?") || !id)
      return;

    try {
      const response = await fetch(`/api/subcategories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("SubCategory deleted successfully");
        setTimeout(() => {
          navigate("/create-subcategory");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to delete subcategory");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error deleting subcategory");
      console.error(error);
    }
  };

  const handleCancel = () => {
    if (subCategory) {
      setEditFormData({
        categoryId: subCategory.categoryId,
        name: subCategory.name,
        status: subCategory.status || "inactive",
      });
    }
    setShowEditForm(false);
    setErrors({});
    setMessage("");
  };

  if (loading) {
    return (
      <Layout title="SubCategory Details">
        <div className="flex items-center justify-center p-8">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 ml-3">
            Loading subcategory...
          </p>
        </div>
      </Layout>
    );
  }

  if (!subCategory) {
    return (
      <Layout title="SubCategory Not Found">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            SubCategory not found
          </p>
          <button
            onClick={() => navigate("/create-subcategory")}
            className="mt-4 text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
          >
            Back to SubCategories
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="SubCategory Details">
      <div className="space-y-6">
        <PageHeader
          title={subCategory?.name || "SubCategory Details"}
          description={`Category: ${subCategory?.categoryName || "Loading..."}`}
          breadcrumbs={[
            { label: "SubCategories", href: "/create-subcategory" },
            { label: subCategory?.name || "Details" },
          ]}
          icon={<FolderOpen className="w-6 h-6 text-white" />}
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {subCategory.categoryName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                    (subCategory.status || "inactive") === "active"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}
                >
                  {(subCategory.status || "inactive").charAt(0).toUpperCase() +
                    (subCategory.status || "inactive").slice(1)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created By
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {subCategory.createdBy}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Created Date
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(subCategory.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Last Updated
                </label>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(subCategory.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-400 dark:to-teal-500 bg-clip-text text-transparent mb-6">
              Edit SubCategory Details
            </h2>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={editFormData.categoryId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      categoryId: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.categoryId
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">Select a category</option>
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
                  SubCategory Name *
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
