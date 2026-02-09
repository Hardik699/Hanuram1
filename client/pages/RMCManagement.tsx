import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  Check,
  AlertCircle,
  History,
  Eye,
  Trash2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Edit2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  BookOpen,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import Modal from "@/components/ui/Modal";

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
  lastPriceDate?: string;
}

interface VendorPrice {
  _id: string;
  vendorId: string;
  vendorName: string;
  price: number;
  addedDate: string;
}

interface RecipeItem {
  _id?: string;
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
  totalRawMaterialCost: number;
  pricePerUnit: number;
  createdAt: string;
  updatedAt: string;
  items?: RecipeItem[];
}

interface RecipeHistory {
  _id: string;
  recipeId: string;
  recipeCode: string;
  recipeName: string;
  snapshotDate: string;
  totalRawMaterialCost: number;
  pricePerUnit: number;
  items: RecipeItem[];
  createdReason?: string;
}

interface RecipeLog {
  _id: string;
  recipeId: string;
  recipeItemId?: string;
  rawMaterialId?: string;
  fieldChanged: string;
  oldValue: any;
  newValue: any;
  changeDate: string;
  changedBy: string;
}

export default function RMCManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProductionUser = user?.role_id === 7;

  // Data
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // UI State
  const [showAddRecipeForm, setShowAddRecipeForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Add Recipe Form
  const [recipeForm, setRecipeForm] = useState({
    name: "",
    batchSize: "",
    unitId: "",
    yield: "",
    moisturePercentage: "",
  });
  const [recipeErrors, setRecipeErrors] = useState<Record<string, string>>({});

  // Recipe Items (RMs in recipe)
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [selectedRMForItem, setSelectedRMForItem] = useState("");
  const [itemForm, setItemForm] = useState({
    quantity: "",
    unitId: "",
    price: "",
    vendorId: "",
  });
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  // RM Filter for selection
  const [filterCategoryForRM, setFilterCategoryForRM] = useState("");
  const [filterSubCategoryForRM, setFilterSubCategoryForRM] = useState("");
  const [filterSearchRM, setFilterSearchRM] = useState("");

  // History & Comparison modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRecipeForHistory, setSelectedRecipeForHistory] =
    useState<Recipe | null>(null);
  const [recipeHistory, setRecipeHistory] = useState<RecipeHistory[]>([]);
  const [selectedHistoryEntries, setSelectedHistoryEntries] = useState<
    string[]
  >([]);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    old: RecipeHistory | null;
    new: RecipeHistory | null;
  }>({ old: null, new: null });

  // View recipe modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecipeForView, setSelectedRecipeForView] =
    useState<Recipe | null>(null);
  const [viewRecipeItems, setViewRecipeItems] = useState<RecipeItem[]>([]);

  // Edit mode and Logs for recipes
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showRecipeLogsModal, setShowRecipeLogsModal] = useState(false);
  const [recipeLogs, setRecipeLogs] = useState<RecipeLog[]>([]);
  const [selectedRecipeForLogs, setSelectedRecipeForLogs] =
    useState<Recipe | null>(null);

  // Sync state
  const [syncingRMId, setSyncingRMId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Vendor prices modal
  const [showVendorPricesModal, setShowVendorPricesModal] = useState(false);
  const [selectedRMForPrices, setSelectedRMForPrices] =
    useState<RawMaterial | null>(null);
  const [vendorPrices, setVendorPrices] = useState<VendorPrice[]>([]);

  // Item logs modal
  const [showItemLogsModal, setShowItemLogsModal] = useState(false);
  const [selectedItemForLogs, setSelectedItemForLogs] =
    useState<RecipeItem | null>(null);
  const [itemLogs, setItemLogs] = useState<RecipeLog[]>([]);

  // RM Price History modal
  const [showRMPriceHistoryModal, setShowRMPriceHistoryModal] = useState(false);
  const [selectedRMForHistory, setSelectedRMForHistory] =
    useState<RawMaterial | null>(null);
  const [rmPriceHistory, setRmPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      setTableLoading(true);
      await Promise.all([
        fetchUnits(),
        fetchCategories(),
        fetchSubCategories(),
        fetchRawMaterials(),
        fetchRecipes(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("/api/units", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) setUnits(data.data);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Error fetching units:", error);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("/api/categories", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Error fetching categories:", error);
      }
    }
  };

  const fetchSubCategories = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("/api/subcategories", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) setSubCategories(data.data);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Error fetching subcategories:", error);
      }
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("/api/raw-materials", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) setRawMaterials(data.data);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Raw materials fetch timed out");
      } else {
        console.error("Error fetching raw materials:", error);
      }
    }
  };

  const fetchRecipes = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("/api/recipes", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) setRecipes(data.data);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Error fetching recipes:", error);
      }
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
      // Exclude already added RMs
      if (recipeItems.some((item) => item.rawMaterialId === rm._id))
        return false;
      return true;
    });
  };

  const getFilteredSubCategories = () => {
    if (!filterCategoryForRM) return [];
    return subCategories.filter((sc) => sc.categoryId === filterCategoryForRM);
  };

  // Pagination calculations
  const totalPages = Math.ceil(recipes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecipes = recipes.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const validateRecipeForm = () => {
    const newErrors: Record<string, string> = {};
    if (!recipeForm.name.trim()) newErrors.name = "Recipe name is required";
    if (!recipeForm.batchSize || Number(recipeForm.batchSize) <= 0)
      newErrors.batchSize = "Valid batch size is required";
    if (!recipeForm.unitId) newErrors.unitId = "Unit is required";
    if (!recipeForm.yield || Number(recipeForm.yield) <= 0)
      newErrors.yield = "Yield is required";
    if (
      recipeForm.moisturePercentage === "" ||
      Number(recipeForm.moisturePercentage) < 0
    )
      newErrors.moisturePercentage = "Moisture % is required";
    if (recipeItems.length === 0)
      newErrors.items = "At least one raw material is required";
    setRecipeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateItemForm = () => {
    const newErrors: Record<string, string> = {};
    if (!itemForm.quantity || Number(itemForm.quantity) <= 0)
      newErrors.quantity = "Valid quantity is required";
    if (!itemForm.unitId) newErrors.unitId = "Unit is required";
    if (!itemForm.price || Number(itemForm.price) < 0)
      newErrors.price = "Valid price is required";
    setItemErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-populate unit and price when RM is selected
  const handleRMSelection = (rmId: string) => {
    setSelectedRMForItem(rmId);

    if (rmId) {
      const selectedRM = rawMaterials.find((rm) => rm._id === rmId);
      if (selectedRM) {
        // Auto-populate price and unit with the last purchase data
        const updateData: any = {
          vendorId: selectedRM._id,
        };

        // Auto-populate unit if available
        if (selectedRM.unitId) {
          updateData.unitId = selectedRM.unitId;
        }

        // Auto-populate price if available
        if (selectedRM.lastAddedPrice) {
          updateData.price = selectedRM.lastAddedPrice.toString();
        }

        setItemForm((prev) => ({
          ...prev,
          ...updateData,
        }));
      }
    }
  };

  const handleAddRecipeItem = async () => {
    if (!validateItemForm() || !selectedRMForItem) return;

    const selectedRM = rawMaterials.find((rm) => rm._id === selectedRMForItem);
    if (!selectedRM) return;

    const selectedUnit = units.find((u) => u._id === itemForm.unitId);
    const totalPrice = Number(itemForm.quantity) * Number(itemForm.price);

    const newItem: RecipeItem = {
      rawMaterialId: selectedRM._id,
      rawMaterialName: selectedRM.name,
      rawMaterialCode: selectedRM.code,
      quantity: Number(itemForm.quantity),
      unitId: itemForm.unitId,
      unitName: selectedUnit?.name,
      price: Number(itemForm.price),
      vendorId: itemForm.vendorId,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    };

    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const updated = [...recipeItems];
      updated[editingItemIndex] = newItem;
      setRecipeItems(updated);
      setEditingItemIndex(null);
    } else {
      setRecipeItems([...recipeItems, newItem]);
    }

    setSelectedRMForItem("");
    setItemForm({
      quantity: "",
      unitId: "",
      price: "",
      vendorId: "",
    });
    setItemErrors({});
    setShowAddItemForm(false);
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const calculateRecipeTotals = () => {
    const totalCost = recipeItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );
    const pricePerUnit =
      Number(recipeForm.yield) > 0 ? totalCost / Number(recipeForm.yield) : 0;

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      pricePerUnit: parseFloat(pricePerUnit.toFixed(2)),
    };
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRecipeForm()) return;

    setLoading(true);
    try {
      const selectedUnit = units.find((u) => u._id === recipeForm.unitId);

      // If editing, call PUT
      if (editingRecipeId) {
        const response = await fetch(`/api/recipes/${editingRecipeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: recipeForm.name,
            batchSize: Number(recipeForm.batchSize),
            unitId: recipeForm.unitId,
            unitName: selectedUnit?.name,
            yield: recipeForm.yield ? Number(recipeForm.yield) : undefined,
            moisturePercentage: recipeForm.moisturePercentage
              ? Number(recipeForm.moisturePercentage)
              : undefined,
            items: recipeItems,
            createdBy: "admin",
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setMessageType("success");
          setMessage("Recipe updated successfully");
          setRecipeForm({
            name: "",
            batchSize: "",
            unitId: "",
            yield: "",
            moisturePercentage: "",
          });
          setRecipeItems([]);
          setRecipeErrors({});
          setShowAddRecipeForm(false);
          setEditingRecipeId(null);
          setCurrentPage(1);

          setTimeout(() => {
            fetchRecipes();
            setMessage("");
          }, 1500);
        } else {
          setMessageType("error");
          setMessage(data.message || "Failed to update recipe");
        }
        setLoading(false);
        return;
      }

      // Create new recipe
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recipeForm.name,
          batchSize: Number(recipeForm.batchSize),
          unitId: recipeForm.unitId,
          unitName: selectedUnit?.name,
          yield: recipeForm.yield ? Number(recipeForm.yield) : undefined,
          moisturePercentage: recipeForm.moisturePercentage
            ? Number(recipeForm.moisturePercentage)
            : undefined,
          items: recipeItems,
          createdBy: "admin",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(
          editingRecipeId
            ? "Recipe updated successfully"
            : "Recipe created successfully",
        );
        setRecipeForm({
          name: "",
          batchSize: "",
          unitId: "",
          yield: "",
          moisturePercentage: "",
        });
        setRecipeItems([]);
        setRecipeErrors({});
        setShowAddRecipeForm(false);
        setCurrentPage(1);

        setTimeout(() => {
          fetchRecipes();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(
          data.message ||
            (editingRecipeId
              ? "Failed to update recipe"
              : "Failed to create recipe"),
        );
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        editingRecipeId ? "Error updating recipe" : "Error creating recipe",
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("Recipe deleted successfully");
        setCurrentPage(1);
        setTimeout(() => {
          fetchRecipes();
          setMessage("");
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to delete recipe");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error deleting recipe");
      console.error(error);
    }
  };

  const handleViewHistory = async (recipe: Recipe) => {
    setSelectedRecipeForHistory(recipe);
    setShowHistoryModal(true);
    try {
      const response = await fetch(`/api/recipes/${recipe._id}/history`);
      const data = await response.json();
      if (data.success) setRecipeHistory(data.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleViewRecipe = async (recipe: Recipe) => {
    setSelectedRecipeForView(recipe);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/recipes/${recipe._id}/items`);
      const data = await response.json();
      if (data.success) setViewRecipeItems(data.data);
    } catch (error) {
      console.error("Error fetching recipe items:", error);
    }
  };

  const handleCompareHistories = () => {
    if (selectedHistoryEntries.length !== 2) {
      setMessageType("error");
      setMessage("Please select exactly 2 entries to compare");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const [entry1Id, entry2Id] = selectedHistoryEntries;
    const entry1 = recipeHistory.find((h) => h._id === entry1Id);
    const entry2 = recipeHistory.find((h) => h._id === entry2Id);

    if (entry1 && entry2) {
      // Sort by date - old first, new second
      const oldEntry =
        new Date(entry1.snapshotDate) < new Date(entry2.snapshotDate)
          ? entry1
          : entry2;
      const newEntry =
        new Date(entry1.snapshotDate) < new Date(entry2.snapshotDate)
          ? entry2
          : entry1;

      setComparisonData({ old: oldEntry, new: newEntry });
      setShowComparisonView(true);
      setShowHistoryModal(false);
    }
  };

  const handleDeleteRecipeHistory = async (historyId: string) => {
    if (!selectedRecipeForHistory) return;

    if (!confirm("Are you sure you want to delete this history entry?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/recipes/${selectedRecipeForHistory._id}/history/${historyId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setMessageType("success");
        setMessage("History entry deleted successfully");
        // Refresh the history
        setRecipeHistory(
          recipeHistory.filter((entry) => entry._id !== historyId),
        );
        setSelectedHistoryEntries(
          selectedHistoryEntries.filter((id) => id !== historyId),
        );
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to delete history entry");
        setTimeout(() => setMessage(""), 2000);
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Error deleting history entry");
      console.error(error);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const handleViewVendorPrices = async (rm: RawMaterial) => {
    setSelectedRMForPrices(rm);
    setShowVendorPricesModal(true);
    try {
      const response = await fetch(
        `/api/raw-materials/${rm._id}/vendor-prices`,
      );
      const data = await response.json();
      if (data.success) setVendorPrices(data.data);
    } catch (error) {
      console.error("Error fetching vendor prices:", error);
    }
  };

  const handleViewRMPriceHistory = async (rm: RawMaterial) => {
    setSelectedRMForHistory(rm);
    setShowRMPriceHistoryModal(true);
    try {
      const response = await fetch(
        `/api/raw-materials/${rm._id}/price-history`,
      );
      const data = await response.json();
      if (data.success) setRmPriceHistory(data.data);
    } catch (error) {
      console.error("Error fetching RM price history:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatUnit = (u?: string | null) => {
    if (!u) return null;
    const s = u.toLowerCase().trim();
    if (s.includes("kg") || s.includes("kilogram")) return "kg";
    if (s === "g" || s.includes("gram")) return "g";
    if (
      s.includes("lit") ||
      s === "l" ||
      s.includes("ltr") ||
      s.includes("litre")
    )
      return "L";
    if (s.includes("ml")) return "ml";
    if (s.includes("piece") || s.includes("pc") || s === "pcs") return "pcs";
    return u;
  };

  // Sync latest RM price and propagate to recipes
  const handleSyncRMPrice = async (rawMaterialId: string) => {
    if (!rawMaterialId) return;
    setSyncingRMId(rawMaterialId);
    try {
      const response = await fetch(
        `/api/raw-materials/${rawMaterialId}/sync-latest-price`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ createdBy: "admin" }),
        },
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(data.message || "Price synced");
        // refresh recipes and current editing recipe items (if open)
        await fetchRecipes();
        if (editingRecipeId) {
          try {
            const itemsResp = await fetch(
              `/api/recipes/${editingRecipeId}/items`,
            );
            const itemsData = await itemsResp.json();
            if (itemsData.success) setRecipeItems(itemsData.data);
          } catch (err) {
            console.error("Error fetching updated recipe items:", err);
          }
        }
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to sync price");
      }
    } catch (error) {
      console.error("Error syncing RM price:", error);
      setMessageType("error");
      setMessage("Error syncing price");
    } finally {
      setSyncingRMId(null);
      setTimeout(() => setMessage(""), 2500);
    }
  };

  // Edit recipe - open modal and load items
  const handleEditRecipe = async (recipe: Recipe) => {
    setEditingRecipeId(recipe._id);
    setRecipeForm({
      name: recipe.name,
      batchSize: recipe.batchSize.toString(),
      unitId: recipe.unitId,
      yield: recipe.yield?.toString() || "",
      moisturePercentage: recipe.moisturePercentage?.toString() || "",
    });
    setRecipeErrors({});

    // Show loading state
    setRecipeItems([]);
    setShowAddRecipeForm(true);

    try {
      const response = await fetch(`/api/recipes/${recipe._id}/items`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setRecipeItems(data.data);
      } else {
        console.warn("No recipe items found or invalid response format");
        setRecipeItems([]);
      }
    } catch (error) {
      console.error("Error fetching recipe items:", error);
      setMessageType("error");
      setMessage("Failed to load recipe items. Please try again.");
      setRecipeItems([]);
    }
  };

  // Edit a recipe item inline
  const handleEditRecipeItem = (index: number) => {
    const item = recipeItems[index];
    setEditingItemIndex(index);
    setSelectedRMForItem(item.rawMaterialId);
    setItemForm({
      quantity: item.quantity.toString(),
      unitId: item.unitId || "",
      price: item.price.toString(),
      vendorId: item.vendorId || "",
    });
    setShowAddItemForm(true);
  };

  // Fetch and show recipe logs
  const handleViewRecipeLogs = async (recipe: Recipe) => {
    setSelectedRecipeForLogs(recipe);
    setShowRecipeLogsModal(true);
    try {
      const response = await fetch(`/api/recipes/${recipe._id}/logs`);
      const data = await response.json();
      if (data.success) setRecipeLogs(data.data);
    } catch (error) {
      console.error("Error fetching recipe logs:", error);
    }
  };

  const totals = calculateRecipeTotals();

  // Calculate statistics
  const totalRecipes = recipes.length;
  const totalRawMaterialCost = recipes.reduce(
    (sum, r) => sum + (r.totalRawMaterialCost || 0),
    0,
  );
  const avgPricePerUnit =
    recipes.length > 0
      ? recipes.reduce((sum, r) => sum + (r.pricePerUnit || 0), 0) /
        recipes.length
      : 0;

  return (
    <Layout title="Raw Material Costing">
      <PageHeader
        title={isProductionUser ? "Production Labour Cost" : "Raw Material Costing"}
        description={isProductionUser ? "View production labour costs for recipes" : "Manage recipes and calculate material costs"}
        breadcrumbs={[{ label: isProductionUser ? "Production Labour Cost" : "Raw Material Costing" }]}
        icon={
          <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        }
        actions={
          !isProductionUser && (
            <button
              onClick={() => navigate("/recipe/new")}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Recipe</span>
              <span className="sm:hidden">Add</span>
            </button>
          )
        }
      />

      {/* Content for Production Users */}
      {isProductionUser && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl shadow-md p-6 border border-orange-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Production Labour Costs
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Click on a recipe to view and manage its production labour costs
            </p>

            {recipes.length === 0 ? (
              <div className="p-8 text-center text-slate-600 dark:text-slate-400">
                <p>
                  No recipes available to display raw materials and labour
                  costs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {recipes.map((recipe) => (
                  <div
                    key={recipe._id}
                    onClick={() => navigate(`/recipe/${recipe._id}/edit`)}
                    className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600 cursor-pointer hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          {recipe.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Recipe Code: {recipe.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 dark:text-purple-400">
                          ₹{recipe.totalRawMaterialCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Total RM Cost
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded">
                        <p className="text-slate-600 dark:text-slate-400 text-xs">
                          Batch Size
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {recipe.batchSize} {recipe.unitName}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded">
                        <p className="text-slate-600 dark:text-slate-400 text-xs">
                          Price per Unit
                        </p>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          ₹{recipe.pricePerUnit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards - Hidden for Production Users */}
      {!isProductionUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Recipes Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  Total Recipes
                </p>
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">
                  {totalRecipes}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Active recipes
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 p-4 rounded-xl">
                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full mt-4"></div>
          </div>

          {/* Total Raw Material Cost Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  Total RM Cost
                </p>
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">
                  ₹{totalRawMaterialCost.toFixed(0)}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  All recipes combined
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mt-4"></div>
          </div>

          {/* Average Price Per Unit Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  Avg Price/Unit
                </p>
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">
                  ₹{avgPricePerUnit.toFixed(2)}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Per unit average
                </p>
              </div>
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 p-4 rounded-xl">
                <TrendingDown className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full mt-4"></div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 backdrop-blur-sm ${
              messageType === "success"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 shadow-lg"
                : "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800/50 shadow-lg"
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

        {/* All Recipes Header - Hidden for Production Users */}
        {!isProductionUser && (
          <>
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl shadow-md p-5 mb-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    All Recipes
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {recipes.length}
                    </span>{" "}
                    recipe{recipes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* All Recipes Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {tableLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Loading recipes...
                  </p>
                </div>
              ) : recipes.length === 0 ? (
                <div className="p-8 text-center text-slate-600 dark:text-slate-400">
                  No recipes found. Create one above!
                </div>
              ) : (
                <div className="table-responsive shadow-elevation-4 animate-page-load">
                  <table className="w-full">
                    <thead className="prof-table-head">
                      <tr>
                        <th className="prof-table-head-cell">Recipe Code</th>
                        <th className="prof-table-head-cell">Recipe Name</th>
                        <th className="prof-table-head-cell">Total RM Cost</th>
                        <th className="prof-table-head-cell">Price per Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedRecipes.map((recipe, idx) => (
                        <tr
                          key={recipe._id}
                          className={cn(
                            "prof-table-row",
                            idx % 2 === 0 && "prof-table-row-even",
                            !isProductionUser &&
                              "prof-table-row-hover cursor-pointer",
                          )}
                          onClick={() =>
                            !isProductionUser &&
                            navigate(`/recipe/${recipe._id}`)
                          }
                        >
                          <td className="prof-table-cell">
                            <span className="prof-badge-blue">
                              {recipe.code}
                            </span>
                          </td>
                          <td className="prof-table-cell-bold text-blue-600 dark:text-blue-400">
                            {recipe.name}
                          </td>
                          <td className="prof-table-cell font-bold text-slate-900 dark:text-white">
                            <span className="text-purple-600 dark:text-purple-400">
                              ₹{recipe.totalRawMaterialCost.toFixed(2)}
                            </span>
                          </td>
                          <td className="prof-table-cell font-bold">
                            <span className="text-blue-600 dark:text-blue-400">
                              ₹{recipe.pricePerUnit.toFixed(2)}/
                              {recipe.unitName}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="px-6 py-5 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Items per page:
                      </span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) =>
                          handleItemsPerPageChange(e.target.value)
                        }
                        className="prof-form-select px-4 py-2 w-24 text-sm"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {startIndex + 1}-{Math.min(endIndex, recipes.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-bold text-slate-900 dark:text-slate-200">
                          {recipes.length}
                        </span>
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="inline-flex items-center justify-center p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[100px] text-center">
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
                          disabled={
                            currentPage === totalPages || totalPages === 0
                          }
                          className="inline-flex items-center justify-center p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Next Page"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Recipe Modal - Hidden for Production Users */}
        {showAddRecipeForm && !isProductionUser && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50 ring-1 ring-slate-900/5">
              <div className="p-4 sm:p-6 md:p-8 border-b-2 border-gradient-to-r from-teal-200 to-cyan-200 dark:border-teal-900/50 flex items-center justify-between sticky top-0 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {editingRecipeId ? "Edit Recipe" : "Add New Recipe"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {editingRecipeId
                      ? "Update recipe details and raw materials"
                      : "Create a new recipe with raw materials"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddRecipeForm(false);
                    setRecipeForm({
                      name: "",
                      batchSize: "",
                      unitId: "",
                      yield: "",
                      moisturePercentage: "",
                    });
                    setRecipeItems([]);
                    setRecipeErrors({});
                    setEditingRecipeId(null);
                    setEditingItemIndex(null);
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={handleCreateRecipe}
                className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"
              >
                {/* Basic Recipe Details */}
                <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-700/30 dark:to-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"></div>
                    Basic Recipe Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Recipe Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Recipe Name *
                      </label>
                      <input
                        type="text"
                        value={recipeForm.name}
                        onChange={(e) =>
                          setRecipeForm({ ...recipeForm, name: e.target.value })
                        }
                        placeholder="Enter recipe name"
                        className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                          recipeErrors.name
                            ? "border-red-500 dark:border-red-400"
                            : "border-slate-300 dark:border-slate-600"
                        } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                      {recipeErrors.name && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {recipeErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Batch Size */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Batch Size *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={recipeForm.batchSize}
                        onChange={(e) =>
                          setRecipeForm({
                            ...recipeForm,
                            batchSize: e.target.value,
                          })
                        }
                        placeholder="Enter batch size"
                        className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                          recipeErrors.batchSize
                            ? "border-red-500 dark:border-red-400"
                            : "border-slate-300 dark:border-slate-600"
                        } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                      {recipeErrors.batchSize && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {recipeErrors.batchSize}
                        </p>
                      )}
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Unit *
                      </label>
                      <select
                        value={recipeForm.unitId}
                        onChange={(e) =>
                          setRecipeForm({
                            ...recipeForm,
                            unitId: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                          recipeErrors.unitId
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
                      {recipeErrors.unitId && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {recipeErrors.unitId}
                        </p>
                      )}
                    </div>

                    {(() => {
                      const selectedUnit = units.find(
                        (u) => u._id === recipeForm.unitId,
                      );
                      const yieldLabel = selectedUnit
                        ? `Yield (${selectedUnit.name})`
                        : "Yield";
                      return (
                        <>
                          {/* Yield */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              {yieldLabel} *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={recipeForm.yield}
                              onChange={(e) =>
                                setRecipeForm({
                                  ...recipeForm,
                                  yield: e.target.value,
                                })
                              }
                              placeholder="Enter yield quantity"
                              className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                                recipeErrors.yield
                                  ? "border-red-500 dark:border-red-400"
                                  : "border-slate-300 dark:border-slate-600"
                              } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            />
                            {recipeErrors.yield && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                                {recipeErrors.yield}
                              </p>
                            )}
                          </div>

                          {/* Moisture % */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Moisture % *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={recipeForm.moisturePercentage}
                              onChange={(e) =>
                                setRecipeForm({
                                  ...recipeForm,
                                  moisturePercentage: e.target.value,
                                })
                              }
                              placeholder="Enter moisture %"
                              className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                                recipeErrors.moisturePercentage
                                  ? "border-red-500 dark:border-red-400"
                                  : "border-slate-300 dark:border-slate-600"
                              } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            />
                            {recipeErrors.moisturePercentage && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                                {recipeErrors.moisturePercentage}
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* RM Filter Section */}
                <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-700/30 dark:to-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"></div>
                    Raw Material Filter
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/60 dark:bg-slate-900/30 rounded-lg p-4 border border-cyan-200/50 dark:border-cyan-900/30">
                      <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-2">
                        Category
                      </label>
                      <select
                        value={filterCategoryForRM}
                        onChange={(e) => {
                          setFilterCategoryForRM(e.target.value);
                          setFilterSubCategoryForRM("");
                        }}
                        className="w-full px-4 py-2.5 rounded-md bg-white dark:bg-slate-800 border-2 border-cyan-300 dark:border-cyan-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/30 rounded-lg p-4 border border-cyan-200/50 dark:border-cyan-900/30">
                      <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-2">
                        Sub Category
                      </label>
                      <select
                        value={filterSubCategoryForRM}
                        onChange={(e) =>
                          setFilterSubCategoryForRM(e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-md bg-white dark:bg-slate-800 border-2 border-cyan-300 dark:border-cyan-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                      >
                        <option value="">All Sub Categories</option>
                        {getFilteredSubCategories().map((subcat) => (
                          <option key={subcat._id} value={subcat._id}>
                            {subcat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/30 rounded-lg p-4 border border-cyan-200/50 dark:border-cyan-900/30">
                      <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-2">
                        Search RM
                      </label>
                      <input
                        type="text"
                        value={filterSearchRM}
                        onChange={(e) => setFilterSearchRM(e.target.value)}
                        placeholder="Search by RM name"
                        className="w-full px-4 py-2.5 rounded-md bg-white dark:bg-slate-800 border-2 border-cyan-300 dark:border-cyan-900/50 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Add RM to Recipe Section */}
                <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-700/30 dark:to-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"></div>
                      Recipe Items
                    </h4>
                    {!showAddItemForm && (
                      <button
                        type="button"
                        onClick={() => setShowAddItemForm(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Raw Material</span>
                      </button>
                    )}
                  </div>

                  {/* Add Item Form */}
                  {showAddItemForm && (
                    <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-600/30 dark:to-slate-700/20 p-6 rounded-xl mb-4 border-2 border-teal-200 dark:border-teal-900/50">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        Add Raw Material to Recipe
                      </h5>

                      {/* Raw Material Selection - Full Width */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Raw Material *
                        </label>
                        <select
                          value={selectedRMForItem}
                          onChange={(e) => handleRMSelection(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select Raw Material</option>
                          {getFilteredRawMaterials().map((rm) => (
                            <option key={rm._id} value={rm._id}>
                              {rm.code} - {rm.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity, Price, Unit - 3 Columns */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={itemForm.quantity}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                quantity: e.target.value,
                              })
                            }
                            placeholder="Enter quantity"
                            className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                              itemErrors.quantity
                                ? "border-red-500 dark:border-red-400"
                                : "border-slate-300 dark:border-slate-600"
                            } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                          {itemErrors.quantity && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                              {itemErrors.quantity}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Price (₹) *{" "}
                            {selectedRMForItem &&
                              rawMaterials.find(
                                (rm) => rm._id === selectedRMForItem,
                              )?.lastVendorName && (
                                <span className="text-xs font-normal text-green-600 dark:text-green-400">
                                  (Auto-filled:{" "}
                                  {
                                    rawMaterials.find(
                                      (rm) => rm._id === selectedRMForItem,
                                    )?.lastVendorName
                                  }
                                  )
                                </span>
                              )}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={itemForm.price}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                price: e.target.value,
                              })
                            }
                            placeholder="Enter price"
                            className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                              itemErrors.price
                                ? "border-red-500 dark:border-red-400"
                                : "border-slate-300 dark:border-slate-600"
                            } text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />

                          {selectedRMForItem &&
                            (() => {
                              const rm = rawMaterials.find(
                                (r) => r._id === selectedRMForItem,
                              );
                              const qty = Number(itemForm.quantity) || 0;
                              const price = Number(itemForm.price) || 0;
                              const totalPrice = qty * price;
                              const pricePerUnit = qty > 0 ? price / qty : null;

                              return (
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                  {rm && rm.lastAddedPrice ? (
                                    <div>
                                      Last updated price:{" "}
                                      <span className="font-semibold">
                                        ₹{rm.lastAddedPrice.toFixed(2)}
                                      </span>
                                      {rm.unitName ? ` / ${rm.unitName}` : ""}
                                      {rm.lastPriceDate && (
                                        <span className="ml-2">
                                          (updated{" "}
                                          {new Date(
                                            rm.lastPriceDate,
                                          ).toLocaleDateString()}
                                          )
                                        </span>
                                      )}
                                    </div>
                                  ) : null}

                                  {pricePerUnit !== null && (
                                    <div className="mt-1">
                                      Calculated price per unit:{" "}
                                      <span className="font-semibold">
                                        ₹{pricePerUnit.toFixed(2)}
                                      </span>{" "}
                                      / {rm?.unitName || "unit"}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                          {itemErrors.price && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                              {itemErrors.price}
                            </p>
                          )}
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Unit *{" "}
                            {selectedRMForItem &&
                              rawMaterials.find(
                                (rm) => rm._id === selectedRMForItem,
                              )?.unitName && (
                                <span className="text-xs font-normal text-green-600 dark:text-green-400">
                                  (Auto-filled:{" "}
                                  {
                                    rawMaterials.find(
                                      (rm) => rm._id === selectedRMForItem,
                                    )?.unitName
                                  }
                                  )
                                </span>
                              )}
                          </label>
                          <select
                            value={itemForm.unitId}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                unitId: e.target.value,
                              })
                            }
                            className={`w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border transition-all ${
                              itemErrors.unitId
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
                          {itemErrors.unitId && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                              {itemErrors.unitId}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleAddRecipeItem}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {editingItemIndex !== null
                            ? "Update Item"
                            : "Add Item"}
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
                            setEditingItemIndex(null);
                          }}
                          className="px-6 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-lg transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recipe Items Table */}
                  {recipeItems.length > 0 && (
                    <div className="overflow-x-auto table-responsive mb-4">
                      <table className="w-full">
                        <thead className="bg-slate-200 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                              RM Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Unit
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Total
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {recipeItems.map((item, index) => (
                            <tr
                              key={index}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                                {item.rawMaterialName}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                {item.unitName}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                                ₹{item.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-teal-600 dark:text-teal-400">
                                ₹{item.totalPrice.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditRecipeItem(index)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSyncRMPrice(item.rawMaterialId)
                                    }
                                    disabled={
                                      syncingRMId === item.rawMaterialId
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveRecipeItem(index)
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {recipeErrors.items && (
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {recipeErrors.items}
                    </p>
                  )}
                </div>

                {/* Recipe Summary */}
                {editingRecipeId || recipeItems.length > 0 ? (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-2 border-teal-200 dark:border-teal-800 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
                      Recipe Summary{" "}
                      {recipeItems.length === 0 &&
                        editingRecipeId &&
                        "(Loading...)"}
                    </p>
                    {recipeItems.length === 0 && editingRecipeId ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-teal-100 dark:border-teal-900 animate-pulse">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Total Raw Material Cost
                          </p>
                          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-green-100 dark:border-green-900 animate-pulse">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Price per Unit
                          </p>
                          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-teal-100 dark:border-teal-900">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Total Raw Material Cost
                          </p>
                          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                            ₹{totals.totalCost.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-green-100 dark:border-green-900">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Price per Unit
                          </p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            ₹{totals.pricePerUnit.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Form Buttons */}
                <div className="form-actions pt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || recipeItems.length === 0}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>
                          {editingRecipeId ? "Updating..." : "Creating..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>
                          {editingRecipeId ? "Update Recipe" : "Create Recipe"}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRecipeForm(false);
                      setRecipeForm({
                        name: "",
                        batchSize: "",
                        unitId: "",
                        yield: "",
                        moisturePercentage: "",
                      });
                      setRecipeItems([]);
                      setRecipeErrors({});
                    }}
                    className="px-6 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-lg transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedRecipeForHistory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50">
              <div className="p-4 sm:p-6 md:p-8 border-b-2 border-teal-100 dark:border-teal-900/50 flex items-center justify-between sticky top-0 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Recipe History - {selectedRecipeForHistory.code}
                </h3>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedRecipeForHistory(null);
                    setSelectedHistoryEntries([]);
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                {recipeHistory.length === 0 ? (
                  <p className="text-center text-slate-600 dark:text-slate-400">
                    No history found
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {recipeHistory.map((entry) => (
                        <div
                          key={entry._id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedHistoryEntries.includes(
                                entry._id,
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedHistoryEntries.length < 2) {
                                    setSelectedHistoryEntries([
                                      ...selectedHistoryEntries,
                                      entry._id,
                                    ]);
                                  }
                                } else {
                                  setSelectedHistoryEntries(
                                    selectedHistoryEntries.filter(
                                      (id) => id !== entry._id,
                                    ),
                                  );
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {formatDate(entry.snapshotDate)}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Total Cost: ₹
                                {entry.totalRawMaterialCost.toFixed(2)} | Price
                                per Unit: ₹{entry.pricePerUnit.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteRecipeHistory(entry._id)
                              }
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors flex-shrink-0"
                              title="Delete history entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleCompareHistories}
                        disabled={selectedHistoryEntries.length !== 2}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                      >
                        Compare Selected
                      </button>
                      <button
                        onClick={() => {
                          setShowHistoryModal(false);
                          setSelectedRecipeForHistory(null);
                          setSelectedHistoryEntries([]);
                        }}
                        className="px-6 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Recipe Modal */}
        {showViewModal && selectedRecipeForView && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50">
              <div className="p-4 sm:p-6 md:p-8 border-b-2 border-teal-100 dark:border-teal-900/50 flex items-center justify-between sticky top-0 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Recipe Details - {selectedRecipeForView.code}
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRecipeForView(null);
                    setViewRecipeItems([]);
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-semibold text-slate-900">
                      {selectedRecipeForView.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Batch Size</p>
                    <p className="font-semibold text-slate-900">
                      {selectedRecipeForView.batchSize}{" "}
                      {selectedRecipeForView.unitName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Yield</p>
                    <p className="font-semibold text-slate-900">
                      {selectedRecipeForView.yield ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Moisture %</p>
                    <p className="font-semibold text-slate-900">
                      {selectedRecipeForView.moisturePercentage ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total RM Cost</p>
                    <p className="font-semibold text-teal-600">
                      ₹{selectedRecipeForView.totalRawMaterialCost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Price per Unit</p>
                    <p className="font-semibold text-green-600">
                      ₹{selectedRecipeForView.pricePerUnit.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Recipe Items</h4>
                  {viewRecipeItems.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No items found for this recipe.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                              Raw Material
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                              Unit
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">
                              Price
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {viewRecipeItems.map((it, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                {it.rawMaterialName}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {it.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {it.unitName}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                                ₹{it.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-teal-600 text-right">
                                ₹{it.totalPrice.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedRecipeForView(null);
                      setViewRecipeItems([]);
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Logs Modal */}
        {showRecipeLogsModal && selectedRecipeForLogs && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Logs - {selectedRecipeForLogs.name}
                </h3>
                <button
                  onClick={() => {
                    setShowRecipeLogsModal(false);
                    setRecipeLogs([]);
                    setSelectedRecipeForLogs(null);
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {recipeLogs.length === 0 ? (
                  <div className="text-slate-600">
                    No logs found for this recipe.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recipeLogs.map((log) => {
                      const rm = rawMaterials.find(
                        (r) => r._id === (log as any).rawMaterialId,
                      );

                      return (
                        <div key={log._id} className="p-4 border rounded-lg">
                          <div className="text-sm text-slate-600">
                            {formatDate((log as any).changeDate || "")}
                          </div>

                          {rm ? (
                            <div className="text-sm font-medium text-slate-700">
                              Item: {rm.code} - {rm.name}
                            </div>
                          ) : null}

                          <div className="font-semibold">
                            {log.fieldChanged}
                          </div>
                          <div className="text-sm text-slate-700">
                            Old: {JSON.stringify(log.oldValue)}
                          </div>
                          <div className="text-sm text-slate-700">
                            New: {JSON.stringify(log.newValue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison View Modal */}
        {showComparisonView && comparisonData.old && comparisonData.new && (
          <Modal
            onClose={() => {
              setShowComparisonView(false);
              setComparisonData({ old: null, new: null });
            }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="p-4 sm:p-6 md:p-8 border-b-2 border-teal-100 dark:border-teal-900/50 flex items-center justify-between sticky top-0 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Recipe Comparison
              </h3>
              <button
                onClick={() => {
                  setShowComparisonView(false);
                  setComparisonData({ old: null, new: null });
                }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Old Version */}
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h4 className="font-bold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Old Version
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Date:
                      </span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatDate(comparisonData.old.snapshotDate)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Total Cost:
                      </span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{comparisonData.old.totalRawMaterialCost.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Price/Unit:
                      </span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{comparisonData.old.pricePerUnit.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* New Version */}
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <h4 className="font-bold text-green-900 dark:text-green-200 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    New Version
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Date:
                      </span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatDate(comparisonData.new.snapshotDate)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Total Cost:
                      </span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{comparisonData.new.totalRawMaterialCost.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Price/Unit:
                      </span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{comparisonData.new.pricePerUnit.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Differences */}
                <div className="bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-blue-800 rounded-lg p-6">
                  <h4 className="font-bold text-teal-900 dark:text-teal-200 mb-4">
                    Difference Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Cost Difference:
                      </span>{" "}
                      <span
                        className={`font-semibold ${
                          comparisonData.new.totalRawMaterialCost >
                          comparisonData.old.totalRawMaterialCost
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        ₹
                        {(
                          comparisonData.new.totalRawMaterialCost -
                          comparisonData.old.totalRawMaterialCost
                        ).toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600 dark:text-slate-400">
                        Unit Price Difference:
                      </span>{" "}
                      <span
                        className={`font-semibold ${
                          comparisonData.new.pricePerUnit >
                          comparisonData.old.pricePerUnit
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        ₹
                        {(
                          comparisonData.new.pricePerUnit -
                          comparisonData.old.pricePerUnit
                        ).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      % Change:{" "}
                      <span className="font-semibold">
                        {(
                          ((comparisonData.new.pricePerUnit -
                            comparisonData.old.pricePerUnit) /
                            comparisonData.old.pricePerUnit) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Comparison Table */}
              <div className="table-responsive">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">
                  Raw Material Changes
                </h4>
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                        RM Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Old Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                        New Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Old Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                        New Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {comparisonData.new.items.map((newItem) => {
                      const oldItem = comparisonData.old.items.find(
                        (item) => item.rawMaterialId === newItem.rawMaterialId,
                      );

                      if (!oldItem) return null;

                      const priceDiff = newItem.price - oldItem.price;
                      const totalDiff = newItem.totalPrice - oldItem.totalPrice;

                      return (
                        <tr
                          key={newItem.rawMaterialId}
                          className={
                            totalDiff !== 0
                              ? "bg-yellow-50 dark:bg-yellow-950"
                              : ""
                          }
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                            {newItem.rawMaterialName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            ₹{oldItem.price.toFixed(2)}
                            {formatUnit(oldItem.unitName)
                              ? ` / ${formatUnit(oldItem.unitName)}`
                              : formatUnit(newItem.unitName)
                                ? ` / ${formatUnit(newItem.unitName)}`
                                : ""}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-semibold ${
                              priceDiff > 0
                                ? "text-red-600 dark:text-red-400"
                                : priceDiff < 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-slate-900 dark:text-white"
                            }`}
                          >
                            ₹{newItem.price.toFixed(2)}
                            {formatUnit(newItem.unitName)
                              ? ` / ${formatUnit(newItem.unitName)}`
                              : formatUnit(oldItem.unitName)
                                ? ` / ${formatUnit(oldItem.unitName)}`
                                : ""}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            ₹{oldItem.totalPrice.toFixed(2)}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-semibold ${
                              totalDiff > 0
                                ? "text-red-600 dark:text-red-400"
                                : totalDiff < 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-slate-900 dark:text-white"
                            }`}
                          >
                            ₹{newItem.totalPrice.toFixed(2)}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-semibold ${
                              totalDiff > 0
                                ? "text-red-600 dark:text-red-400"
                                : totalDiff < 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {totalDiff > 0 ? "+" : ""}
                            {totalDiff.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowComparisonView(false);
                    setComparisonData({ old: null, new: null });
                    setShowHistoryModal(true);
                  }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to History
                </button>
                <button
                  onClick={() => {
                    setShowComparisonView(false);
                    setComparisonData({ old: null, new: null });
                  }}
                  className="px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
