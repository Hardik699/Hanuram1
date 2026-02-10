import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, AlertCircle, Plus } from "lucide-react";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Category {
  _id: string;
  name: string;
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
}

interface Unit {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface RawMaterial {
  _id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  unitId?: string;
  unitName?: string;
  brandId?: string;
  brandName?: string;
  hsnCode?: string;
}

export default function CreateRawMaterial() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(id ? true : false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    subCategoryId: "",
    unitId: "",
    brandId: "",
    hsnCode: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }

    Promise.all([
      fetchCategories(),
      fetchSubCategories(),
      fetchUnits(),
      fetchBrands(),
    ]).then(() => {
      if (id) {
        fetchRawMaterial(id);
      } else {
        setPageLoading(false);
      }
    });
  }, [navigate, id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch("/api/subcategories");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSubCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch("/api/units");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setUnits(data.data);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const handleCreateNewBrand = async () => {
    if (!newBrandName.trim()) {
      setMessage("Brand name cannot be empty");
      setMessageType("error");
      return;
    }

    setCreatingBrand(true);
    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newBrand = data.data;
        setBrands([...brands, newBrand]);
        setFormData({ ...formData, brandId: newBrand._id });
        setShowNewBrandInput(false);
        setNewBrandName("");
        setMessage("Brand created successfully");
        setMessageType("success");
      } else {
        setMessage(data.message || "Failed to create brand");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error creating brand:", error);
      setMessage("Error creating brand");
      setMessageType("error");
    } finally {
      setCreatingBrand(false);
    }
  };

  const fetchRawMaterial = async (rmId: string) => {
    try {
      const response = await fetch("/api/raw-materials");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const rm = data.data.find((m: RawMaterial) => m._id === rmId);
        if (rm) {
          setFormData({
            name: rm.name,
            categoryId: rm.categoryId,
            subCategoryId: rm.subCategoryId,
            unitId: rm.unitId || "",
            brandId: rm.brandId || "",
            hsnCode: rm.hsnCode || "",
          });
        } else {
          navigate("/raw-materials");
        }
      }
    } catch (error) {
      console.error("Error fetching raw material:", error);
      navigate("/raw-materials");
    } finally {
      setPageLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Raw material name is required";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (!formData.subCategoryId) {
      newErrors.subCategoryId = "Sub-category is required";
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
      const selectedCategory = categories.find(
        (c) => c._id === formData.categoryId,
      );
      const selectedSubCategory = subCategories.find(
        (sc) => sc._id === formData.subCategoryId,
      );
      const selectedUnit = units.find((u) => u._id === formData.unitId);
      const selectedBrand = brands.find((b) => b._id === formData.brandId);

      const method = id ? "PUT" : "POST";
      const url = id ? `/api/raw-materials/${id}` : "/api/raw-materials";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId,
          categoryName: selectedCategory?.name,
          subCategoryId: formData.subCategoryId,
          subCategoryName: selectedSubCategory?.name,
          unitId: formData.unitId,
          unitName: selectedUnit?.name,
          brandId: formData.brandId,
          brandName: selectedBrand?.name,
          hsnCode: formData.hsnCode,
          createdBy: "admin",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(
          id ? "Raw material updated successfully" : "Raw material created successfully",
        );
        setTimeout(() => {
          navigate("/raw-materials");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Operation failed");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error saving raw material");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSubCategories = () => {
    if (!formData.categoryId) return subCategories;
    return subCategories.filter((sc) => sc.categoryId === formData.categoryId);
  };

  if (pageLoading) {
    return (
      <Layout title="Loading...">
        <LoadingSpinner message="Loading..." />
      </Layout>
    );
  }

  return (
    <Layout title={id ? "Edit Raw Material" : "Create Raw Material"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/raw-materials")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {id ? "Edit Raw Material" : "Add New Raw Material"}
          </h1>
        </div>

        {/* Form Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                messageType === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
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
            {/* Raw Material Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Raw Material Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter raw material name"
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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: e.target.value,
                    subCategoryId: "",
                  })
                }
                className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                  errors.categoryId
                    ? "border-red-500 dark:border-red-400"
                    : "border-slate-300 dark:border-slate-600"
                } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                <option value="">Select Category</option>
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

            {/* Sub Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sub Category *
              </label>
              <select
                value={formData.subCategoryId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subCategoryId: e.target.value,
                  })
                }
                disabled={!formData.categoryId}
                className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                  errors.subCategoryId
                    ? "border-red-500 dark:border-red-400"
                    : "border-slate-300 dark:border-slate-600"
                } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">Select Sub Category</option>
                {getFilteredSubCategories().map((subcat) => (
                  <option key={subcat._id} value={subcat._id}>
                    {subcat.name}
                  </option>
                ))}
              </select>
              {errors.subCategoryId && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.subCategoryId}
                </p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Unit (Optional)
              </label>
              <select
                value={formData.unitId}
                onChange={(e) =>
                  setFormData({ ...formData, unitId: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Brand (Optional)
              </label>
              {!showNewBrandInput ? (
                <div className="flex gap-2">
                  <select
                    value={formData.brandId}
                    onChange={(e) =>
                      setFormData({ ...formData, brandId: e.target.value })
                    }
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandInput(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    title="Create new brand"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Enter new brand name"
                    disabled={creatingBrand}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewBrand}
                    disabled={creatingBrand}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {creatingBrand ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewBrandInput(false);
                      setNewBrandName("");
                    }}
                    disabled={creatingBrand}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* HSN Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                HSN Code (Optional)
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) =>
                  setFormData({ ...formData, hsnCode: e.target.value })
                }
                placeholder="Enter HSN code"
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Buttons */}
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
                    <span>
                      {id ? "Update Raw Material" : "Create Raw Material"}
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/raw-materials")}
                className="px-6 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
