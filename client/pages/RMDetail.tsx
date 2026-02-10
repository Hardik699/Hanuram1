import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import RawMaterialLogs from "@/components/RawMaterialLogs";
import {
  ArrowLeft,
  Phone,
  Eye,
  History,
  ChefHat,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
  Check,
} from "lucide-react";

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
  brandIds?: string[];
  brandNames?: string[];
  hsnCode?: string;
  createdAt: string;
  lastAddedPrice?: number;
  lastVendorName?: string;
  lastPriceDate?: string;
}

interface Vendor {
  _id: string;
  name: string;
  personName: string;
  mobileNumber: string;
  email?: string;
  location: string;
}

interface VendorPrice {
  _id: string;
  rawMaterialId: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  unitName?: string;
  price: number;
  addedDate: string;
  brandId?: string;
  brandName?: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface PriceLog {
  _id: string;
  rawMaterialId: string;
  vendorId: string;
  vendorName: string;
  oldPrice: number;
  newPrice: number;
  quantity: number;
  unitName?: string;
  changeDate: string;
  changedBy: string;
}

interface RecipeWithItems {
  _id: string;
  code: string;
  name: string;
  unitName: string;
  updatedAt: string;
  rawMaterialQuantity?: number;
  rawMaterialUnit?: string;
}

interface VendorWithLastPurchase extends Vendor {
  lastPrice?: number;
  lastPurchaseDate?: string;
}

type TabType = "overview" | "vendor" | "recipe";

export default function RMDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [rawMaterial, setRawMaterial] = useState<RawMaterial | null>(null);
  const [vendors, setVendors] = useState<VendorWithLastPurchase[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [vendorPrices, setVendorPrices] = useState<VendorPrice[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithItems[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedVendor, setSelectedVendor] =
    useState<VendorWithLastPurchase | null>(null);
  const [vendorPurchaseHistory, setVendorPurchaseHistory] = useState<
    VendorPrice[]
  >([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    categoryId: "",
    subCategoryId: "",
    unitId: "",
    brandId: "",
    hsnCode: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [showAddPriceForm, setShowAddPriceForm] = useState(false);
  const [addPriceFormData, setAddPriceFormData] = useState({
    vendorId: "",
    brandId: "",
    quantity: "",
    price: "",
    billNumber: "",
  });
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [vendorSearchInput, setVendorSearchInput] = useState("");
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [addingPrice, setAddingPrice] = useState(false);
  const [selectedBrandForAdd, setSelectedBrandForAdd] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<Array<{ _id: string; name: string }>>([]);

  // Calculate total price whenever quantity or price changes
  const totalPrice =
    addPriceFormData.quantity && addPriceFormData.price
      ? (
          parseFloat(addPriceFormData.quantity) *
          parseFloat(addPriceFormData.price)
        ).toFixed(2)
      : "0.00";

  // Filter vendors based on search input
  const filteredVendors = vendorSearchInput
    ? allVendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(vendorSearchInput.toLowerCase()),
      )
    : allVendors;

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
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch("/api/raw-materials");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch raw materials: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const rm = data.data.find((m: RawMaterial) => m._id === id);
        if (rm) {
          setRawMaterial(rm);
          await Promise.all([
            fetchVendorPrices(id),
            fetchVendorsData(id),
            fetchRecipesUsingRM(id),
            fetchCategoriesData(),
            fetchSubCategoriesData(),
            fetchUnitsData(),
            fetchBrandsData(),
          ]);
        } else {
          navigate("/raw-materials");
        }
      }
    } catch (error) {
      console.error("Error fetching raw material:", error);
      navigate("/raw-materials");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesData = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategoriesData = async () => {
    try {
      const response = await fetch("/api/subcategories");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSubCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchUnitsData = async () => {
    try {
      const response = await fetch("/api/units");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setUnits(data.data);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const fetchBrandsData = async () => {
    try {
      const response = await fetch("/api/brands");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchVendorPrices = async (rmId: string) => {
    try {
      const response = await fetch(`/api/raw-materials/${rmId}/vendor-prices`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setVendorPrices(data.data);
      }
    } catch (error) {
      console.error("Error fetching vendor prices:", error);
    }
  };

  const fetchVendorsData = async (rmId: string) => {
    try {
      const [vendorsRes, pricesRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch(`/api/raw-materials/${rmId}/vendor-prices`),
      ]);

      if (!vendorsRes.ok)
        throw new Error(`Vendors fetch failed: HTTP ${vendorsRes.status}`);
      if (!pricesRes.ok)
        throw new Error(`Prices fetch failed: HTTP ${pricesRes.status}`);

      const vendorsData = await vendorsRes.json();
      const pricesData = await pricesRes.json();

      if (vendorsData.success && Array.isArray(vendorsData.data)) {
        const vendorsList = vendorsData.data as Vendor[];
        const pricesList = pricesData.data as VendorPrice[];

        // Set all vendors for the Add Price dropdown
        setAllVendors(vendorsList);

        // Get unique vendors from pricesList only (show only vendors with actual purchases)
        const uniqueVendors = new Map<string, VendorWithLastPurchase>();

        pricesList.forEach((price) => {
          if (!uniqueVendors.has(price.vendorId)) {
            // Find vendor details from vendorsList
            const vendorDetails = vendorsList.find(
              (v) => v._id === price.vendorId,
            );
            if (vendorDetails) {
              uniqueVendors.set(price.vendorId, {
                ...vendorDetails,
              });
            }
          }
        });

        // Now populate last prices for each vendor
        const vendorsWithPrices = Array.from(uniqueVendors.values()).map(
          (vendor) => {
            const lastPrice = pricesList
              .filter((p) => p.vendorId === vendor._id)
              .sort(
                (a, b) =>
                  new Date(b.addedDate).getTime() -
                  new Date(a.addedDate).getTime(),
              )[0];

            return {
              ...vendor,
              lastPrice: lastPrice?.price,
              lastPurchaseDate: lastPrice?.addedDate,
            };
          },
        );

        setVendors(vendorsWithPrices);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchRecipesUsingRM = async (rmId: string) => {
    try {
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const allRecipes = data.data;

        // Find recipes that use this raw material
        const recipesWithRM: RecipeWithItems[] = [];

        for (const recipe of allRecipes) {
          try {
            const itemsRes = await fetch(`/api/recipes/${recipe._id}/items`);
            if (!itemsRes.ok) throw new Error(`HTTP ${itemsRes.status}`);
            const itemsData = await itemsRes.json();

            if (itemsData.success && Array.isArray(itemsData.data)) {
              const rmItem = itemsData.data.find(
                (item: any) => item.rawMaterialId === rmId,
              );
              if (rmItem) {
                recipesWithRM.push({
                  _id: recipe._id,
                  code: recipe.code,
                  name: recipe.name,
                  unitName: recipe.unitName,
                  updatedAt: recipe.updatedAt,
                  rawMaterialQuantity: rmItem.quantity,
                  rawMaterialUnit: rmItem.unitName,
                });
              }
            }
          } catch (error) {
            console.error(
              `Error fetching items for recipe ${recipe._id}:`,
              error,
            );
          }
        }

        setRecipes(recipesWithRM);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  const handleVendorClick = (vendor: VendorWithLastPurchase) => {
    setSelectedVendor(vendor);
    const history = vendorPrices.filter((p) => p.vendorId === vendor._id);
    setVendorPurchaseHistory(
      history.sort(
        (a, b) =>
          new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime(),
      ),
    );
  };

  const handleEditClick = () => {
    if (rawMaterial) {
      setEditFormData({
        name: rawMaterial.name,
        categoryId: rawMaterial.categoryId,
        subCategoryId: rawMaterial.subCategoryId,
        unitId: rawMaterial.unitId || "",
        brandId: rawMaterial.brandId || "",
        hsnCode: rawMaterial.hsnCode || "",
      });

      // Initialize selected brands from rawMaterial
      if (rawMaterial.brandIds && rawMaterial.brandIds.length > 0) {
        const selectedBrandList = rawMaterial.brandIds.map((brandId, index) => ({
          _id: brandId,
          name: rawMaterial.brandNames?.[index] || "",
        })).filter(b => b._id && b.name);
        setSelectedBrands(selectedBrandList);
      } else {
        setSelectedBrands([]);
      }

      setShowEditForm(true);
    }
  };

  const handleUpdateRawMaterial = async () => {
    if (!id || !rawMaterial) return;

    if (!editFormData.name.trim()) {
      setMessage("Name is required");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch(`/api/raw-materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          brandIds: selectedBrands.map(b => b._id),
          brandNames: selectedBrands.map(b => b.name),
          changedBy: localStorage.getItem("username") || "admin",
        }),
      });

      if (!response.ok) {
        throw new Error(`Update failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessage("Raw material updated successfully");
        setMessageType("success");
        setShowEditForm(false);
        setSelectedBrands([]);
        setTimeout(() => {
          fetchAllData();
        }, 500);
      } else {
        setMessage(data.message || "Update failed");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating raw material:", error);
      setMessage("Error updating raw material");
      setMessageType("error");
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
        // Add the new brand to the selected brands list
        setSelectedBrands([...selectedBrands, newBrand]);
        setShowNewBrandInput(false);
        setNewBrandName("");
        setMessage("Brand created and added successfully");
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeletePassword("");
  };

  const handleConfirmDelete = async () => {
    if (deletePassword !== "-1") {
      setMessage("Invalid password");
      setMessageType("error");
      return;
    }

    if (!id || !rawMaterial) return;

    try {
      const response = await fetch(`/api/raw-materials/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changedBy: localStorage.getItem("username") || "admin",
        }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessage("Raw material deleted successfully");
        setMessageType("success");
        setShowDeleteModal(false);
        setTimeout(() => {
          navigate("/raw-materials");
        }, 500);
      } else {
        setMessage(data.message || "Delete failed");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting raw material:", error);
      setMessage("Error deleting raw material");
      setMessageType("error");
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

  const handleAddPrice = async () => {
    if (!id || !addPriceFormData.vendorId) {
      setMessage("Please select a vendor");
      setMessageType("error");
      return;
    }

    if (!addPriceFormData.quantity || !addPriceFormData.price) {
      setMessage("Please enter quantity and price");
      setMessageType("error");
      return;
    }

    // Prevent multiple submissions
    if (addingPrice) {
      return;
    }

    setAddingPrice(true);

    try {
      const selectedBrand = brands.find((b) => b._id === addPriceFormData.brandId);

      const response = await fetch("/api/raw-materials/vendor-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawMaterialId: id,
          vendorId: addPriceFormData.vendorId,
          brandId: addPriceFormData.brandId,
          brandName: selectedBrand?.name,
          quantity: parseFloat(addPriceFormData.quantity),
          price: parseFloat(addPriceFormData.price),
          billNumber: addPriceFormData.billNumber,
          createdBy: localStorage.getItem("username") || "admin",
        }),
      });

      if (!response.ok) {
        throw new Error(`Add price failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessage("Price added successfully");
        setMessageType("success");
        setShowAddPriceForm(false);
        setAddPriceFormData({
          vendorId: "",
          brandId: "",
          quantity: "",
          price: "",
          billNumber: "",
        });
        setVendorSearchInput("");
        setTimeout(() => {
          fetchAllData();
        }, 500);
      } else {
        setMessage(data.message || "Failed to add price");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error adding price:", error);
      setMessage("Error adding price");
      setMessageType("error");
    } finally {
      setAddingPrice(false);
    }
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

  if (loading) {
    return (
      <Layout title="Loading...">
        <LoadingSpinner message="Loading raw material..." />
      </Layout>
    );
  }

  if (!rawMaterial) {
    return (
      <Layout title="Not Found">
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">
            Raw material not found
          </p>
          <button
            onClick={() => navigate("/raw-materials")}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Back to Raw Materials
          </button>
        </div>
      </Layout>
    );
  }

  if (selectedVendor) {
    return (
      <Layout title={`${selectedVendor.name} - Purchase History`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedVendor(null)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Back to vendor list"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {selectedVendor.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Contact:{" "}
                <span className="font-semibold">
                  {selectedVendor.mobileNumber}
                </span>
              </p>
            </div>
          </div>

          {/* Vendor Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Person Name
                </label>
                <p className="text-sm text-slate-900 dark:text-white font-medium">
                  {selectedVendor.personName}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Mobile Number
                </label>
                <p className="text-sm text-slate-900 dark:text-white font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {selectedVendor.mobileNumber}
                </p>
              </div>
              {selectedVendor.email && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">
                    {selectedVendor.email}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Location
                </label>
                <p className="text-sm text-slate-900 dark:text-white font-medium">
                  {selectedVendor.location}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase History Table */}
          <div className="table-responsive shadow-elevation-4 animate-page-load">
            <div className="bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                Purchase History - {rawMaterial.name}
              </h2>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
                className="prof-btn-secondary py-2"
              >
                {sortOrder === "desc" ? (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    New to Old
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Old to New
                  </>
                )}
              </button>
            </div>

            {vendorPurchaseHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 p-6 bg-white dark:bg-slate-800">
                <p className="font-bold">No purchase history for this vendor</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="prof-table-head">
                    <tr>
                      <th className="prof-table-head-cell">Purchase Date</th>
                      <th className="prof-table-head-cell">Quantity</th>
                      <th className="prof-table-head-cell">Price</th>
                      <th className="prof-table-head-cell">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {(sortOrder === "desc"
                      ? vendorPurchaseHistory
                      : [...vendorPurchaseHistory].reverse()
                    ).map((purchase, idx) => {
                      const totalAmount = purchase.quantity * purchase.price;
                      return (
                        <tr
                          key={purchase._id}
                          className={cn(
                            "prof-table-row prof-table-row-hover",
                            idx % 2 === 0 && "prof-table-row-even",
                          )}
                        >
                          <td className="prof-table-cell">
                            {formatDate(purchase.addedDate)}
                          </td>
                          <td className="prof-table-cell-bold text-slate-900 dark:text-white">
                            {purchase.quantity} {formatUnit(purchase.unitName)}
                          </td>
                          <td className="prof-table-cell">
                            <span className="prof-badge-green">
                              ₹{purchase.price.toFixed(2)}/
                              {formatUnit(purchase.unitName)}
                            </span>
                          </td>
                          <td className="prof-table-cell-bold text-blue-600 dark:text-blue-400">
                            ₹{totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (showEditForm && rawMaterial) {
    return (
      <Layout title={`Edit - ${rawMaterial.name}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setShowEditForm(false);
                setSelectedBrands([]);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Cancel"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Edit Raw Material
            </h1>
          </div>

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

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-6 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                Raw Material Name
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                Category
              </label>
              <select
                value={editFormData.categoryId}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    categoryId: e.target.value,
                    subCategoryId: "",
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              >
                <option value="">Select Category</option>
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
                value={editFormData.subCategoryId}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    subCategoryId: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              >
                <option value="">Select Sub Category</option>
                {subCategories
                  .filter((sc) => sc.categoryId === editFormData.categoryId)
                  .map((subcat) => (
                    <option key={subcat._id} value={subcat._id}>
                      {subcat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                Unit
              </label>
              <select
                value={editFormData.unitId}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, unitId: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                Brands (Optional - Add Multiple)
              </label>
              {!showNewBrandInput ? (
                <div className="flex gap-2">
                  <select
                    value={selectedBrandForAdd}
                    onChange={(e) => {
                      const brandId = e.target.value;
                      if (brandId) {
                        const brand = brands.find(b => b._id === brandId);
                        if (brand) {
                          setSelectedBrands([...selectedBrands, brand]);
                          setSelectedBrandForAdd("");
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  >
                    <option value="">Select Brand</option>
                    {brands.filter(b => !selectedBrands.find(sb => sb._id === b._id)).map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandInput(true)}
                    className="px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm whitespace-nowrap"
                    title="Create new brand"
                  >
                    <Plus className="w-4 h-4" />
                    New
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
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleCreateNewBrand();
                      setShowNewBrandInput(false);
                    }}
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

              {/* Selected Brands List */}
              {selectedBrands.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Selected Brands ({selectedBrands.length})
                  </p>
                  <div className="space-y-2">
                    {selectedBrands.map((brand) => (
                      <div
                        key={brand._id}
                        onDoubleClick={() => setSelectedBrands(selectedBrands.filter(b => b._id !== brand._id))}
                        className="flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {brand.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedBrands(selectedBrands.filter(b => b._id !== brand._id))}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                HSN Code
              </label>
              <input
                type="text"
                value={editFormData.hsnCode}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, hsnCode: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdateRawMaterial}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditForm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${rawMaterial.code} - ${rawMaterial.name}`}>
      <RawMaterialLogs
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        rawMaterialId={id || ""}
        rawMaterialName={rawMaterial.name}
      />

      {/* Delete Password Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Confirm Delete
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Are you sure you want to delete "{rawMaterial.name}"? This action
              cannot be undone.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                Enter Password to Confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmDelete();
                  }
                }}
                placeholder="Enter password"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
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

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/raw-materials")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Back to Raw Materials"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {rawMaterial.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Code: <span className="font-semibold">{rawMaterial.code}</span>
              </p>
            </div>
          </div>

          {/* Edit, Logs and Delete Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors font-medium text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowLogsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
            >
              <History className="w-4 h-4" />
              Logs
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "overview"
                    ? "border-teal-600 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("vendor")}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "vendor"
                    ? "border-teal-600 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                Vendor ⭐
              </button>
              <button
                onClick={() => setActiveTab("recipe")}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "recipe"
                    ? "border-teal-600 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                <ChefHat className="w-4 h-4 inline mr-2" />
                Recipe
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Category
                  </label>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">
                    {rawMaterial.categoryName}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Sub Category
                  </label>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">
                    {rawMaterial.subCategoryName}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Unit
                  </label>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">
                    {rawMaterial.unitName || "-"}
                  </p>
                </div>
                {rawMaterial.brandName && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Brand
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white font-medium">
                      {rawMaterial.brandName}
                    </p>
                  </div>
                )}
                {rawMaterial.hsnCode && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                      HSN Code
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white font-medium">
                      {rawMaterial.hsnCode}
                    </p>
                  </div>
                )}
                {typeof rawMaterial.lastAddedPrice === "number" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Last Price
                    </label>
                    <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold">
                      ₹{rawMaterial.lastAddedPrice.toFixed(2)}
                      {formatUnit(rawMaterial.unitName)
                        ? ` / ${formatUnit(rawMaterial.unitName)}`
                        : ""}
                    </p>
                    {rawMaterial.lastVendorName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        from {rawMaterial.lastVendorName}
                      </p>
                    )}
                  </div>
                )}
                {rawMaterial.lastPriceDate && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Last Purchase Date
                    </label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(rawMaterial.lastPriceDate)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Vendor Tab */}
            {activeTab === "vendor" && (
              <div className="space-y-4">
                {/* Add Price Button */}
                <button
                  onClick={() => {
                    setShowAddPriceForm(!showAddPriceForm);
                    if (showAddPriceForm) {
                      setVendorSearchInput("");
                      setAddPriceFormData({
                        vendorId: "",
                        brandId: "",
                        quantity: "",
                        price: "",
                        billNumber: "",
                      });
                    } else {
                      // Auto-populate brand when opening form
                      setAddPriceFormData({
                        vendorId: "",
                        brandId: rawMaterial?.brandId || "",
                        quantity: "",
                        price: "",
                        billNumber: "",
                      });
                    }
                  }}
                  className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
                >
                  {showAddPriceForm ? "Cancel" : "+ Add Price"}
                </button>

                {/* Add Price Form */}
                {showAddPriceForm && (
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Select Vendor
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="🔍 Search vendor..."
                            value={vendorSearchInput}
                            onChange={(e) =>
                              setVendorSearchInput(e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm placeholder-slate-400"
                          />
                          <select
                            value={addPriceFormData.vendorId}
                            onChange={(e) => {
                              setAddPriceFormData({
                                ...addPriceFormData,
                                vendorId: e.target.value,
                              });
                              setVendorSearchInput("");
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm"
                          >
                            <option value="">-- Choose Vendor --</option>
                            {filteredVendors.length > 0 ? (
                              filteredVendors.map((vendor) => (
                                <option key={vendor._id} value={vendor._id}>
                                  {vendor.name}
                                </option>
                              ))
                            ) : (
                              <option disabled>No vendors found</option>
                            )}
                          </select>
                          {filteredVendors.length > 0 && vendorSearchInput && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {filteredVendors.length} vendor
                              {filteredVendors.length !== 1 ? "s" : ""} found
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Brand (Optional)
                        </label>
                        <select
                          value={addPriceFormData.brandId}
                          onChange={(e) =>
                            setAddPriceFormData({
                              ...addPriceFormData,
                              brandId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm"
                        >
                          <option value="">-- Select Brand --</option>
                          {brands.map((brand) => (
                            <option key={brand._id} value={brand._id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Bill Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={addPriceFormData.billNumber}
                          onChange={(e) =>
                            setAddPriceFormData({
                              ...addPriceFormData,
                              billNumber: e.target.value,
                            })
                          }
                          placeholder="Enter bill number"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={addPriceFormData.quantity}
                          onChange={(e) =>
                            setAddPriceFormData({
                              ...addPriceFormData,
                              quantity: e.target.value,
                            })
                          }
                          placeholder="Qty"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Unit
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm flex items-center">
                          {formatUnit(rawMaterial.unitName) || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Unit Price (₹)
                        </label>
                        <input
                          type="number"
                          value={addPriceFormData.price}
                          onChange={(e) =>
                            setAddPriceFormData({
                              ...addPriceFormData,
                              price: e.target.value,
                            })
                          }
                          placeholder="Price"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Total Price (₹)
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-semibold text-sm flex items-center">
                          {totalPrice}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleAddPrice}
                      disabled={addingPrice}
                      className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                        addingPrice
                          ? "bg-slate-400 text-white cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {addingPrice ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Price"
                      )}
                    </button>
                  </div>
                )}

                {/* Brands Section */}
                {vendorPrices.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Brands for this Product
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Brand Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Vendor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Price (₹)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {vendorPrices.map((price) => (
                            <tr key={price._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100 font-medium">
                                {price.brandName || "Unbranded"}
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                                {price.vendorName}
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300 font-semibold text-teal-600">
                                ₹{price.price}
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(price.addedDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Vendors Table */}
                {vendors.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <p>No vendors available for this raw material</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Vendor Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Contact Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Last Purchase Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Last Purchase Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {vendors.map((vendor) => (
                          <tr
                            key={vendor._id}
                            onClick={() => handleVendorClick(vendor)}
                            className="hover:bg-teal-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                              {vendor.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {vendor.mobileNumber}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-teal-600 dark:text-teal-400">
                              {vendor.lastPrice
                                ? `₹${vendor.lastPrice.toFixed(2)}/${formatUnit(rawMaterial.unitName)}`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {vendor.lastPurchaseDate
                                ? formatDate(vendor.lastPurchaseDate)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recipe Tab */}
            {activeTab === "recipe" && (
              <div>
                {recipes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <p>This raw material is not used in any recipes yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Recipe Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Recipe Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Proportion / Qty Used
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Updated At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {recipes.map((recipe) => (
                          <tr
                            key={recipe._id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                              {recipe.code}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                              {recipe.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-teal-600 dark:text-teal-400 font-semibold">
                              {recipe.rawMaterialQuantity}
                              {recipe.rawMaterialUnit
                                ? ` ${formatUnit(recipe.rawMaterialUnit)}`
                                : ""}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(recipe.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
