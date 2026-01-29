import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface OpCostData {
  _id?: string;
  month: string;
  year: number;
  costs: {
    rent: number;
    fixedSalary: number;
    electricity: number;
    marketing: number;
    logistics: number;
    insurance: number;
    vehicleInstallments: number;
    travelCost: number;
    miscellaneous: number;
    otherCosts: number;
    equipmentMaintenance: number;
    internetCharges: number;
    telephoneBills: number;
  };
  production: {
    mithaiProduction: number;
    namkeenProduction: number;
  };
  autoOpCostPerKg: number;
  manualOpCostPerKg?: number;
  useManualOpCost: boolean;
  createdAt: string;
  updatedAt: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function OpCostManagement() {
  const [opCosts, setOpCosts] = useState<OpCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    costs: {
      rent: 0,
      fixedSalary: 0,
      electricity: 0,
      marketing: 0,
      logistics: 0,
      insurance: 0,
      vehicleInstallments: 0,
      travelCost: 0,
      miscellaneous: 0,
      otherCosts: 0,
      equipmentMaintenance: 0,
      internetCharges: 0,
      telephoneBills: 0,
    },
    production: {
      mithaiProduction: 0,
      namkeenProduction: 0,
    },
  });

  useEffect(() => {
    fetchOpCosts();
  }, []);

  const fetchOpCosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/op-costs");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.success) {
        setOpCosts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching OP costs:", error);
      toast.error("Failed to load OP costs");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith("cost_")) {
      const costKey = name.replace("cost_", "");
      setFormData(prev => ({
        ...prev,
        costs: {
          ...prev.costs,
          [costKey]: value === "" ? 0 : parseFloat(value),
        }
      }));
    } else if (name.startsWith("prod_")) {
      const prodKey = name.replace("prod_", "");
      setFormData(prev => ({
        ...prev,
        production: {
          ...prev.production,
          [prodKey]: value === "" ? 0 : parseFloat(value),
        }
      }));
    } else if (name === "month") {
      setFormData(prev => ({ ...prev, month: value }));
    } else if (name === "year") {
      setFormData(prev => ({ ...prev, year: parseInt(value) }));
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
      };

      const response = await fetch(
        editingId ? `/api/op-costs/${editingId}` : "/api/op-costs",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(editingId ? "OP Cost updated" : "OP Cost created");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear(),
          costs: {
            rent: 0,
            fixedSalary: 0,
            electricity: 0,
            marketing: 0,
            logistics: 0,
            insurance: 0,
            vehicleInstallments: 0,
            travelCost: 0,
            miscellaneous: 0,
            otherCosts: 0,
            equipmentMaintenance: 0,
            internetCharges: 0,
            telephoneBills: 0,
          },
          production: {
            mithaiProduction: 0,
            namkeenProduction: 0,
          },
        });
        fetchOpCosts();
      } else {
        toast.error(data.message || `Failed to ${editingId ? "update" : "create"} OP cost`);
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save OP cost");
    }
  };

  const handleEdit = (opCost: OpCostData) => {
    setFormData({
      month: opCost.month,
      year: opCost.year,
      costs: opCost.costs,
      production: opCost.production,
    });
    setEditingId(opCost._id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this OP cost entry?")) return;

    try {
      const response = await fetch(`/api/op-costs/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Deleted successfully");
        fetchOpCosts();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const calculateTotalCost = () => {
    return Object.values(formData.costs).reduce((sum, val) => sum + val, 0);
  };

  const calculateTotalKgs = () => {
    return formData.production.mithaiProduction + formData.production.namkeenProduction;
  };

  const calculateOpCostPerKg = () => {
    const totalKgs = calculateTotalKgs();
    if (totalKgs === 0) return 0;
    return calculateTotalCost() / totalKgs;
  };

  if (loading) {
    return (
      <Layout title="Operational Cost (OP Cost)">
        <LoadingSpinner message="Loading OP costs..." fullScreen />
      </Layout>
    );
  }

  return (
    <Layout
      title="Operational Cost (OP Cost)"
      headerActions={
        <Button onClick={() => {
          setEditingId(null);
          setFormData({
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear(),
            costs: {
              rent: 0,
              fixedSalary: 0,
              electricity: 0,
              marketing: 0,
              logistics: 0,
              insurance: 0,
              vehicleInstallments: 0,
              travelCost: 0,
              miscellaneous: 0,
              otherCosts: 0,
              equipmentMaintenance: 0,
              internetCharges: 0,
              telephoneBills: 0,
            },
            production: {
              mithaiProduction: 0,
              namkeenProduction: 0,
            },
          });
          setShowForm(!showForm);
        }} className="flex-shrink-0">
          <Plus size={16} className="mr-2" />
          {showForm ? "Cancel" : "Add OP Cost"}
        </Button>
      }
    >
      <div className="space-y-4 sm:space-y-6">

        {/* Form */}
        {showForm && (
          <div className="bg-card rounded-lg p-4 sm:p-6 border space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Month</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-input"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-input"
                  min="2020"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            {/* Monthly Costs Section */}
            <div className="border-t pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Monthly Operating Costs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rent (₹)</label>
                  <input
                    type="number"
                    name="cost_rent"
                    value={formData.costs.rent || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fixed Salary Cost (₹)</label>
                  <input
                    type="number"
                    name="cost_fixedSalary"
                    value={formData.costs.fixedSalary || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Electricity Cost (₹)</label>
                  <input
                    type="number"
                    name="cost_electricity"
                    value={formData.costs.electricity || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Marketing Cost (₹)</label>
                  <input
                    type="number"
                    name="cost_marketing"
                    value={formData.costs.marketing || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Logistics Cost (₹)</label>
                  <input
                    type="number"
                    name="cost_logistics"
                    value={formData.costs.logistics || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Insurance Cost (₹)</label>
                  <input
                    type="number"
                    name="cost_insurance"
                    value={formData.costs.insurance || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Vehicle Installments (₹)</label>
                  <input
                    type="number"
                    name="cost_vehicleInstallments"
                    value={formData.costs.vehicleInstallments || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Travel Cost (₹)</label>
                  <input
                    type="number"
                    name="cost_travelCost"
                    value={formData.costs.travelCost || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Miscellaneous Cost (₹)</label>
                  <input
                    type="number"
                    name="cost_miscellaneous"
                    value={formData.costs.miscellaneous || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Other Costs (₹)</label>
                  <input
                    type="number"
                    name="cost_otherCosts"
                    value={formData.costs.otherCosts || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Equipment Maintenance (₹)</label>
                  <input
                    type="number"
                    name="cost_equipmentMaintenance"
                    value={formData.costs.equipmentMaintenance || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Internet Charges (₹)</label>
                  <input
                    type="number"
                    name="cost_internetCharges"
                    value={formData.costs.internetCharges || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Telephone Bills (₹)</label>
                  <input
                    type="number"
                    name="cost_telephoneBills"
                    value={formData.costs.telephoneBills || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
              </div>
            </div>

            {/* Production Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Production</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Mithai Production (Kg/Month)</label>
                  <input
                    type="number"
                    name="prod_mithaiProduction"
                    value={formData.production.mithaiProduction || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Namkeen Production (Kg/Month)</label>
                  <input
                    type="number"
                    name="prod_namkeenProduction"
                    value={formData.production.namkeenProduction || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md bg-input"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Display */}
            <div className="border-t pt-6 bg-blue-50 dark:bg-blue-950 p-4 rounded">
              <h3 className="text-lg font-semibold mb-4">Automatic Calculations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Monthly Cost</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{calculateTotalCost().toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total KGs Produced</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {calculateTotalKgs().toFixed(2)} Kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">OP Cost / Kg (Auto)</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{calculateOpCostPerKg().toFixed(2)}/Kg
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {editingId ? "Update" : "Save"} OP Cost
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* OP Costs List */}
        {opCosts.length === 0 ? (
          <div className="bg-card rounded-lg p-12 border text-center">
            <p className="text-muted-foreground">No OP cost entries found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {opCosts.map(opCost => (
              <div key={opCost._id} className="bg-card rounded-lg p-6 border hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {opCost.month} {opCost.year}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(opCost.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(opCost)}
                      className="p-2 hover:bg-secondary rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => opCost._id && handleDelete(opCost._id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Monthly Cost</p>
                    <p className="text-lg font-bold">₹{Object.values(opCost.costs).reduce((a, b) => a + b, 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total KGs Produced</p>
                    <p className="text-lg font-bold">{(opCost.production.mithaiProduction + opCost.production.namkeenProduction).toFixed(2)} Kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">OP Cost / Kg (Auto)</p>
                    <p className="text-lg font-bold text-blue-600">₹{opCost.autoOpCostPerKg.toFixed(2)}/Kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">OP Cost / Kg (Active)</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{(opCost.useManualOpCost && opCost.manualOpCostPerKg ? opCost.manualOpCostPerKg : opCost.autoOpCostPerKg || 0).toFixed(2)}/Kg
                    </p>
                    {opCost.useManualOpCost && <span className="text-xs text-amber-600">Manual</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
