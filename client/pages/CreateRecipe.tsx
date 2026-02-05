import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { LabourCostSection } from "@/components/LabourCostSection";
import { CostingCalculatorForm } from "@/components/CostingCalculatorForm";
import { PermissionGate } from "@/components/PermissionGate";

interface Unit {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
}

interface RawMaterial {
  _id: string;
  code: string;
  name: string;
  categoryId: string;
  subCategoryId: string;
  unitId?: string;
  unitName?: string;
  lastAddedPrice?: number;
  lastVendorName?: string;
}

interface RecipeItem {
  rawMaterialId: string;
  rawMaterialName: string;
  rawMaterialCode: string;
  quantity: number;
  unitId?: string;
  unitName?: string;
  price: number;
  vendorId?: string;
  vendorName?: string;
  totalPrice: number;
}

interface Recipe {
  _id: string;
  code: string;
  name: string;
  batchSize: number;
  unitId: string;
  unitName: string;
  yield?: number;
  moisturePercentage?: number;
  items?: RecipeItem[];
}

export default function CreateRecipe() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(id ? true : false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [filterCategoryForRM, setFilterCategoryForRM] = useState("");
  const [filterSubCategoryForRM, setFilterSubCategoryForRM] = useState("");
  const [filterSearchRM, setFilterSearchRM] = useState("");
  const [selectedRMForItem, setSelectedRMForItem] = useState("");
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState({
    quantity: "",
    unitId: "",
    price: "",
  });

  const [productionLabourCostPerKg, setProductionLabourCostPerKg] = useState(0);
  const [packingLabourCostPerKg, setPackingLabourCostPerKg] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    batchSize: "",
    unitId: "",
    yield: "",
    moisturePercentage: "",
  });

  const [itemForm, setItemForm] = useState({
    quantity: "",
    unitId: "",
    price: "",
    vendorId: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }

    Promise.all([
      fetchUnits(),
      fetchCategories(),
      fetchSubCategories(),
      fetchRawMaterials(),
    ]).then(() => {
      if (id) {
        fetchRecipe(id);
      } else {
        setPageLoading(false);
      }
    });
  }, [navigate, id]);

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

  const fetchRawMaterials = async () => {
    try {
      const response = await fetch("/api/raw-materials");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setRawMaterials(data.data);
      }
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  const fetchRecipe = async (recipeId: string) => {
    try {
      const response = await fetch("/api/recipes");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const recipe = data.data.find((r: Recipe) => r._id === recipeId);
        if (recipe) {
          setFormData({
            name: recipe.name,
            batchSize: recipe.batchSize.toString(),
            unitId: recipe.unitId,
            yield: recipe.yield?.toString() || "",
            moisturePercentage: recipe.moisturePercentage?.toString() || "",
          });

          // Fetch recipe items separately
          try {
            const itemsResponse = await fetch(`/api/recipes/${recipeId}/items`);
            if (!itemsResponse.ok) {
              throw new Error(`HTTP error! status: ${itemsResponse.status}`);
            }
            const itemsData = await itemsResponse.json();
            if (itemsData.success && Array.isArray(itemsData.data)) {
              setRecipeItems(itemsData.data);
            } else if (recipe.items) {
              setRecipeItems(recipe.items);
            }
          } catch (itemsError) {
            console.error("Error fetching recipe items:", itemsError);
            if (recipe.items) {
              setRecipeItems(recipe.items);
            }
          }
        } else {
          navigate("/rmc");
        }
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      navigate("/rmc");
    } finally {
      setPageLoading(false);
    }
  };

  const getFilteredRawMaterials = () => {
    return rawMaterials.filter((rm) => {
      if (filterCategoryForRM && rm.categoryId !== filterCategoryForRM)
        return false;
      if (filterSubCategoryForRM && rm.subCategoryId !== filterSubCategoryForRM)
        return false;
      if (
        filterSearchRM &&
        !rm.name.toLowerCase().includes(filterSearchRM.toLowerCase())
      )
        return false;
      if (recipeItems.some((item) => item.rawMaterialId === rm._id))
        return false;
      return true;
    });
  };

  const getFilteredSubCategories = () => {
    if (!filterCategoryForRM) return [];
    return subCategories.filter((sc) => sc.categoryId === filterCategoryForRM);
  };

  const handleAddItem = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedRMForItem) newErrors.rawMaterial = "Raw material is required";
    if (!itemForm.quantity || Number(itemForm.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    if (!itemForm.price || Number(itemForm.price) < 0)
      newErrors.price = "Valid price is required";

    if (Object.keys(newErrors).length > 0) {
      setItemErrors(newErrors);
      return;
    }

    const selectedRM = rawMaterials.find((rm) => rm._id === selectedRMForItem);
    if (!selectedRM) return;

    const totalPrice = Number(itemForm.quantity) * Number(itemForm.price);

    const newItem: RecipeItem = {
      rawMaterialId: selectedRM._id,
      rawMaterialName: selectedRM.name,
      rawMaterialCode: selectedRM.code,
      quantity: Number(itemForm.quantity),
      unitId: itemForm.unitId || selectedRM.unitId,
      unitName: itemForm.unitId
        ? units.find((u) => u._id === itemForm.unitId)?.name ||
          selectedRM.unitName
        : selectedRM.unitName,
      price: Number(itemForm.price),
      vendorId: itemForm.vendorId || selectedRM._id,
      vendorName: itemForm.vendorId
        ? selectedRM.lastVendorName
        : selectedRM.lastVendorName,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    };

    setRecipeItems([...recipeItems, newItem]);
    setShowAddItemForm(false);
    setSelectedRMForItem("");
    setItemForm({ quantity: "", unitId: "", price: "", vendorId: "" });
    setItemErrors({});
  };

  const handleRemoveItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleStartEditItem = (index: number) => {
    const item = recipeItems[index];
    setEditingItemIndex(index);
    setEditItemForm({
      quantity: item.quantity.toString(),
      unitId: item.unitId || "",
      price: item.price.toString(),
    });
  };

  const handleSaveEditItem = () => {
    const newErrors: Record<string, string> = {};
    if (!editItemForm.quantity || Number(editItemForm.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    if (!editItemForm.price || Number(editItemForm.price) < 0)
      newErrors.price = "Valid price is required";

    if (Object.keys(newErrors).length > 0) {
      setItemErrors(newErrors);
      return;
    }

    if (editingItemIndex === null) return;

    const updatedItems = [...recipeItems];
    const item = updatedItems[editingItemIndex];
    const newQuantity = Number(editItemForm.quantity);
    const newPrice = Number(editItemForm.price);
    const totalPrice = newQuantity * newPrice;

    updatedItems[editingItemIndex] = {
      ...item,
      quantity: newQuantity,
      unitId: editItemForm.unitId || item.unitId,
      unitName: editItemForm.unitId
        ? units.find((u) => u._id === editItemForm.unitId)?.name ||
          item.unitName
        : item.unitName,
      price: newPrice,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    };

    setRecipeItems(updatedItems);
    setEditingItemIndex(null);
    setEditItemForm({ quantity: "", unitId: "", price: "" });
    setItemErrors({});
  };

  const handleCancelEditItem = () => {
    setEditingItemIndex(null);
    setEditItemForm({ quantity: "", unitId: "", price: "" });
    setItemErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Recipe name is required";
    }

    if (!formData.batchSize || Number(formData.batchSize) <= 0) {
      newErrors.batchSize = "Batch size must be greater than 0";
    }

    if (!formData.unitId) {
      newErrors.unitId = "Unit is required";
    }

    if (recipeItems.length === 0) {
      newErrors.items = "At least one raw material is required";
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
      const selectedUnit = units.find((u) => u._id === formData.unitId);

      const method = id ? "PUT" : "POST";
      const url = id ? `/api/recipes/${id}` : "/api/recipes";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          batchSize: Number(formData.batchSize),
          unitId: formData.unitId,
          unitName: selectedUnit?.name,
          yield: formData.yield ? Number(formData.yield) : undefined,
          moisturePercentage: formData.moisturePercentage
            ? Number(formData.moisturePercentage)
            : undefined,
          items: recipeItems,
          createdBy: "admin",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(
          id ? "Recipe updated successfully" : "Recipe created successfully",
        );
        setTimeout(() => {
          navigate("/rmc");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Operation failed");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error saving recipe");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalCost = recipeItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );
    const pricePerUnit =
      formData.yield && Number(formData.yield) > 0
        ? totalCost / Number(formData.yield)
        : 0;
    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      pricePerUnit: parseFloat(pricePerUnit.toFixed(2)),
    };
  };

  if (pageLoading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 ml-3 font-medium">
            Loading...
          </p>
        </div>
      </Layout>
    );
  }

  const totals = calculateTotals();

  return (
    <Layout title={id ? "Edit Recipe" : "Create Recipe"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/rmc")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {id ? "Edit Recipe" : "Add New Recipe"}
          </h1>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              messageType === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <p
              className={
                messageType === "success"
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }
            >
              {message}
            </p>
          </div>
        )}

        {/* Recipe Basic Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Recipe Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipe Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Recipe Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter recipe name"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Batch Size *
                </label>
                <input
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) =>
                    setFormData({ ...formData, batchSize: e.target.value })
                  }
                  placeholder="Enter batch size"
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.batchSize
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.batchSize && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.batchSize}
                  </p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Unit *
                </label>
                <select
                  value={formData.unitId}
                  onChange={(e) =>
                    setFormData({ ...formData, unitId: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                    errors.unitId
                      ? "border-red-500 dark:border-red-400"
                      : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                {errors.unitId && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.unitId}
                  </p>
                )}
              </div>

              {/* Yield */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Yield (Optional)
                </label>
                <input
                  type="number"
                  value={formData.yield}
                  onChange={(e) =>
                    setFormData({ ...formData, yield: e.target.value })
                  }
                  placeholder="Enter yield"
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Moisture Percentage */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Moisture Percentage (Optional)
                </label>
                <input
                  type="number"
                  value={formData.moisturePercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      moisturePercentage: e.target.value,
                    })
                  }
                  placeholder="Enter moisture percentage"
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Recipe Items Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recipe Items
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddItemForm(!showAddItemForm)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {/* Add Item Form */}
              {showAddItemForm && (
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 p-4 mb-6 space-y-4">
                  {/* Filters Row - 3 columns */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Category
                      </label>
                      <select
                        value={filterCategoryForRM}
                        onChange={(e) => {
                          setFilterCategoryForRM(e.target.value);
                          setFilterSubCategoryForRM("");
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Sub Category
                      </label>
                      <select
                        value={filterSubCategoryForRM}
                        onChange={(e) =>
                          setFilterSubCategoryForRM(e.target.value)
                        }
                        disabled={!filterCategoryForRM}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm disabled:opacity-50"
                      >
                        <option value="">All Sub Categories</option>
                        {getFilteredSubCategories().map((sc) => (
                          <option key={sc._id} value={sc._id}>
                            {sc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Search RM
                      </label>
                      <input
                        type="text"
                        value={filterSearchRM}
                        onChange={(e) => setFilterSearchRM(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Raw Material Selection - Full Width */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Raw Material *
                    </label>
                    <select
                      value={selectedRMForItem}
                      onChange={(e) => {
                        const rmId = e.target.value;
                        setSelectedRMForItem(rmId);
                        // Auto-fill unit and price
                        if (rmId) {
                          const selectedRM = rawMaterials.find(
                            (rm) => rm._id === rmId,
                          );
                          if (selectedRM) {
                            setItemForm((prev) => ({
                              ...prev,
                              unitId: selectedRM.unitId || "",
                              price: selectedRM.lastAddedPrice
                                ? selectedRM.lastAddedPrice.toString()
                                : "0",
                            }));
                          }
                        } else {
                          setItemForm((prev) => ({
                            ...prev,
                            unitId: "",
                            price: "",
                          }));
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border transition-all ${
                        itemErrors.rawMaterial
                          ? "border-red-500 dark:border-red-400"
                          : "border-slate-200 dark:border-slate-600"
                      } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm`}
                    >
                      <option value="">-- Choose Raw Material --</option>
                      {getFilteredRawMaterials().map((rm) => (
                        <option key={rm._id} value={rm._id}>
                          {rm.name} ({rm.code})
                        </option>
                      ))}
                    </select>
                    {itemErrors.rawMaterial && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                        {itemErrors.rawMaterial}
                      </p>
                    )}
                  </div>

                  {/* Quantity, Price, Unit - 3 columns */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={itemForm.quantity}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, quantity: e.target.value })
                        }
                        placeholder="Enter quantity"
                        className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border transition-all ${
                          itemErrors.quantity
                            ? "border-red-500 dark:border-red-400"
                            : "border-slate-200 dark:border-slate-600"
                        } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm`}
                      />
                      {itemErrors.quantity && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                          {itemErrors.quantity}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Price (₹) *{" "}
                        {selectedRMForItem && itemForm.price !== "" && (
                          <span className="text-xs font-normal text-green-600 dark:text-green-400">
                            (Auto-filled)
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemForm.price}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, price: e.target.value })
                        }
                        placeholder="Enter price"
                        className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border transition-all ${
                          itemErrors.price
                            ? "border-red-500 dark:border-red-400"
                            : "border-slate-200 dark:border-slate-600"
                        } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm`}
                      />
                      {itemErrors.price && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                          {itemErrors.price}
                        </p>
                      )}
                      {selectedRMForItem && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          {(() => {
                            const rm = rawMaterials.find(
                              (r) => r._id === selectedRMForItem,
                            );
                            return rm && rm.lastAddedPrice ? (
                              <div>
                                Last purchase: ₹{rm.lastAddedPrice.toFixed(2)}
                                {rm.unitName ? ` / ${rm.unitName}` : ""}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Unit{" "}
                        {selectedRMForItem && itemForm.unitId !== "" && (
                          <span className="text-xs font-normal text-green-600 dark:text-green-400">
                            (Auto-filled)
                          </span>
                        )}
                      </label>
                      <select
                        value={itemForm.unitId}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, unitId: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="">Default</option>
                        {units.map((unit) => (
                          <option key={unit._id} value={unit._id}>
                            {unit.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      Add Item
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddItemForm(false);
                        setSelectedRMForItem("");
                        setItemForm({
                          quantity: "",
                          unitId: "",
                          price: "",
                          vendorId: "",
                        });
                        setItemErrors({});
                      }}
                      className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Items Table */}
              {errors.items && (
                <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                  {errors.items}
                </p>
              )}

              {recipeItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Raw Material
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {recipeItems.map((item, index) => (
                        <tr
                          key={index}
                          className={`transition-colors ${
                            editingItemIndex === index
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                            {item.rawMaterialName} ({item.rawMaterialCode})
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                            {editingItemIndex === index ? (
                              <input
                                type="number"
                                value={editItemForm.quantity}
                                onChange={(e) =>
                                  setEditItemForm({
                                    ...editItemForm,
                                    quantity: e.target.value,
                                  })
                                }
                                className={`w-20 px-2 py-1 rounded border ${
                                  itemErrors.quantity
                                    ? "border-red-500"
                                    : "border-slate-300 dark:border-slate-600"
                                } bg-white dark:bg-slate-700 text-slate-900 dark:text-white`}
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {editingItemIndex === index ? (
                              <select
                                value={editItemForm.unitId}
                                onChange={(e) =>
                                  setEditItemForm({
                                    ...editItemForm,
                                    unitId: e.target.value,
                                  })
                                }
                                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                              >
                                <option value="">Default</option>
                                {units.map((unit) => (
                                  <option key={unit._id} value={unit._id}>
                                    {unit.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              item.unitName || "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-teal-600 dark:text-teal-400 font-semibold">
                            {editingItemIndex === index ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editItemForm.price}
                                onChange={(e) =>
                                  setEditItemForm({
                                    ...editItemForm,
                                    price: e.target.value,
                                  })
                                }
                                className={`w-24 px-2 py-1 rounded border ${
                                  itemErrors.price
                                    ? "border-red-500"
                                    : "border-slate-300 dark:border-slate-600"
                                } bg-white dark:bg-slate-700 text-slate-900 dark:text-white`}
                              />
                            ) : (
                              `₹${item.price.toFixed(2)}`
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                            {editingItemIndex === index
                              ? `₹${(Number(editItemForm.quantity) * Number(editItemForm.price)).toFixed(2)}`
                              : `₹${item.totalPrice.toFixed(2)}`}
                          </td>
                          <td className="px-4 py-3 text-sm space-x-2 flex">
                            {editingItemIndex === index ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleSaveEditItem}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditItem}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditItem(index)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals */}
              {id || recipeItems.length > 0 ? (
                <div className="mt-6 space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                  {recipeItems.length === 0 && id ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center animate-pulse">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          Total Raw Material Cost:
                        </span>
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      {formData.yield && Number(formData.yield) > 0 && (
                        <div className="flex justify-between items-center animate-pulse">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            Price Per Unit (Yield: {formData.yield}):
                          </span>
                          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          Total Raw Material Cost:
                        </span>
                        <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                          ₹{totals.totalCost.toFixed(2)}
                        </span>
                      </div>
                      {formData.yield && Number(formData.yield) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            Price Per Unit (Yield: {formData.yield}):
                          </span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            ₹{totals.pricePerUnit.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Form Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
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
                    <span>{id ? "Update Recipe" : "Create Recipe"}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/rmc")}
                className="px-6 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Labour Costing Sections - Only show if recipe is created and user has permission */}
        <PermissionGate permission="labour_view_costs">
          {id && (
            <div className="space-y-6">
              {/* Production Labour Cost */}
              <LabourCostSection
                recipeId={id}
                recipeQuantity={parseFloat(formData.batchSize) || 0}
                type="production"
                title="Production Labour Cost"
              />

              {/* Packing Labour Cost */}
              <LabourCostSection
                recipeId={id}
                recipeQuantity={parseFloat(formData.batchSize) || 0}
                type="packing"
                title="Packing Labour Cost"
              />

              {/* Packaging & Handling Costing Calculator */}
              <CostingCalculatorForm
                title="📦 Packaging & Handling Costing Calculator"
                recipeId={id}
                rmCostPerKg={
                  parseFloat(formData.batchSize) > 0
                    ? recipeItems.reduce(
                        (sum, item) => sum + item.totalPrice,
                        0,
                      ) / parseFloat(formData.batchSize)
                    : 0
                }
                productionLabourCostPerKg={productionLabourCostPerKg}
                packingLabourCostPerKg={packingLabourCostPerKg}
                batchSize={parseFloat(formData.batchSize) || 0}
                yield={parseFloat(formData.yield) || 100}
              />
            </div>
          )}
        </PermissionGate>
      </div>
    </Layout>
  );
}
