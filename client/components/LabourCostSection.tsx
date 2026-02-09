import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabourSelector } from "@/components/LabourSelector";
import { toast } from "sonner";

interface Labour {
  id: string;
  code: string;
  name: string;
  department: string;
  salaryPerDay: number;
}

interface RecipeLabour {
  id: string;
  labour: Labour;
  labourName: string;
  department: string;
  salaryPerDay: number;
  type: "production" | "packing";
}

interface LabourCostSectionProps {
  recipeId?: string;
  recipeQuantity: number;
  type: "production" | "packing";
  title: string;
}

export function LabourCostSection({
  recipeId,
  recipeQuantity,
  type,
  title,
}: LabourCostSectionProps) {
  const [labourList, setLabourList] = useState<RecipeLabour[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch recipe labour
  const fetchRecipeLabour = async () => {
    if (!recipeId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/recipes/${recipeId}/labour?type=${type}`
      );
      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText);
        setLabourList([]);
        return;
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setLabourList(result.data);
      }
    } catch (error) {
      console.error("Error fetching recipe labour:", error);
      setLabourList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipeLabour();
  }, [recipeId, type, refreshTrigger]);

  const handleDeleteLabour = async (recipeLabourId: string) => {
    if (!window.confirm("Remove this labour from the recipe?")) return;

    try {
      const response = await fetch(`/api/recipes/labour/${recipeLabourId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Labour removed successfully");
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(result.message || "Failed to remove labour");
      }
    } catch (error) {
      console.error("Error deleting labour:", error);
      toast.error("Failed to remove labour");
    }
  };

  // Calculate totals
  const totalLabourCost = labourList.reduce(
    (sum, item) => sum + item.salaryPerDay,
    0
  );
  const labourCostPerKg =
    recipeQuantity > 0 ? totalLabourCost / recipeQuantity : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Labour Count: <span className="font-semibold">{labourList.length}</span>
          </p>
        </div>
        <Button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
          disabled={!recipeId}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Labour
        </Button>
      </div>

      {/* Labour Selector */}
      {recipeId && (
        <div className="mb-6">
          <LabourSelector
            recipeId={recipeId}
            type={type}
            onLabourAdded={() => setRefreshTrigger((prev) => prev + 1)}
            selectedLabour={labourList.map((item) => {
              // Get labour ID from the labour object (_id field from MongoDB)
              // Convert to string if it's an object
              const labourId = String(item.labour?._id || item.labour?.id || "");

              return {
                id: labourId,
                code: item.labour?.code || "",
                name: item.labourName,
                department: item.department,
                salaryPerDay: item.salaryPerDay,
              };
            })}
          />
        </div>
      )}

      {/* Labour Table */}
      {loading ? (
        <div className="p-4 text-center text-slate-500">Loading...</div>
      ) : labourList.length === 0 ? (
        <div className="p-4 text-center text-slate-500">
          No labour added yet. Click "Add Labour" to get started.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                    Department
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                    Salary / Day
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {labourList.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {item.labourName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.department}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                      ₹{item.salaryPerDay.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteLabour(item.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cost Summary Footer */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                Total {type === "production" ? "Production" : "Packing"} Labour Cost
              </span>
              <span className="text-lg font-bold text-teal-700">
                ₹{totalLabourCost.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-teal-200"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                {type === "production" ? "Production" : "Packing"} Labour Cost / KG
              </span>
              <span className="text-lg font-bold text-teal-700">
                ₹{labourCostPerKg.toFixed(4)}
              </span>
            </div>
            {recipeQuantity === 0 && (
              <p className="text-xs text-slate-500 mt-2">
                (Set recipe quantity to calculate per KG cost)
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
