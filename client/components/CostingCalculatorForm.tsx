import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CostingInputs {
  shipperBoxCost: number;
  shipperBoxQty: number;
  hygieneCostPerUnit: number;
  hygieneQtyPerKg: number;
  scavengerCostPerUnit: number;
  scavengerQtyPerKg: number;
  mapCostPerKg: number;
  smallerSizePackagingCost: number;
  monoCartonCostPerUnit: number;
  monoCartonQtyPerKg: number;
  stickerCostPerUnit: number;
  stickerQtyPerKg: number;
  butterPaperCostPerKg: number;
  butterPaperQtyPerKg: number;
  excessWeightPerKg: number;
  rmcCostPerKg: number;
  wastagePercentage: number;
}

interface CostingResults {
  shipperBoxCostPerKg: number;
  hygieneCostPerKg: number;
  scavengerCostPerKg: number;
  mapCostPerKg: number;
  smallerSizePackagingCostPerKg: number;
  monoCartonCostPerKg: number;
  stickerCostPerKg: number;
  butterPaperCostPerKg: number;
  excessStockCostPerKg: number;
  materialWastageCostPerKg: number;
  totalPackagingHandlingCost: number;
}

const initialInputs: CostingInputs = {
  shipperBoxCost: 0,
  shipperBoxQty: 0,
  hygieneCostPerUnit: 0,
  hygieneQtyPerKg: 0,
  scavengerCostPerUnit: 0,
  scavengerQtyPerKg: 0,
  mapCostPerKg: 0,
  smallerSizePackagingCost: 0,
  monoCartonCostPerUnit: 0,
  monoCartonQtyPerKg: 0,
  stickerCostPerUnit: 0,
  stickerQtyPerKg: 0,
  butterPaperCostPerKg: 0,
  butterPaperQtyPerKg: 0,
  excessWeightPerKg: 0,
  rmcCostPerKg: 0,
  wastagePercentage: 0,
};

interface CostingCalculatorFormProps {
  title?: string;
  rmCostPerKg?: number;
  productionLabourCostPerKg?: number;
  packingLabourCostPerKg?: number;
  recipeId?: string;
  onSave?: () => void;
  batchSize?: number;
  yield?: number;
}

export function CostingCalculatorForm({
  title = "📦 Costing Calculator",
  rmCostPerKg = 0,
  productionLabourCostPerKg = 0,
  packingLabourCostPerKg = 0,
  recipeId,
  onSave,
  batchSize = 0,
  yield: yieldPercentage = 100,
}: CostingCalculatorFormProps) {
  const [inputs, setInputs] = useState<CostingInputs>(initialInputs);
  const [results, setResults] = useState<CostingResults | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load previously saved packaging costs on mount
  useEffect(() => {
    if (!recipeId) return;

    const loadPackagingCosts = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}/packaging-costs`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const savedData = data.data;
            setInputs(savedData.inputs || initialInputs);
            setResults(savedData.results || null);
          }
        }
      } catch (error) {
        console.debug("Could not load packaging costs:", error);
      }
    };

    loadPackagingCosts();
  }, [recipeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedInputs = {
      ...inputs,
      [name]: value === "" ? 0 : parseFloat(value),
    };
    setInputs(updatedInputs);
    calculateCosts_internal(updatedInputs);
  };

  const calculateCosts_internal = (currentInputs: CostingInputs = inputs) => {
    const shipperBoxCostPerKg =
      currentInputs.shipperBoxQty > 0
        ? currentInputs.shipperBoxCost / currentInputs.shipperBoxQty
        : 0;

    const hygieneCostPerKg = currentInputs.hygieneCostPerUnit * currentInputs.hygieneQtyPerKg;
    const scavengerCostPerKg = currentInputs.scavengerCostPerUnit * currentInputs.scavengerQtyPerKg;
    const mapCostPerKg = currentInputs.mapCostPerKg;
    const smallerSizePackagingCostPerKg = currentInputs.smallerSizePackagingCost;
    const monoCartonCostPerKg = currentInputs.monoCartonCostPerUnit * currentInputs.monoCartonQtyPerKg;
    const stickerCostPerKg = currentInputs.stickerCostPerUnit * currentInputs.stickerQtyPerKg;
    const butterPaperCostPerKg = currentInputs.butterPaperCostPerKg * currentInputs.butterPaperQtyPerKg;
    const excessStockCostPerKg = currentInputs.excessWeightPerKg * currentInputs.rmcCostPerKg;

    const wastageBaseSum =
      shipperBoxCostPerKg +
      hygieneCostPerKg +
      scavengerCostPerKg +
      monoCartonCostPerKg +
      stickerCostPerKg +
      butterPaperCostPerKg;
    const materialWastageCostPerKg = (wastageBaseSum * currentInputs.wastagePercentage) / 100;

    const totalPackagingHandlingCost =
      shipperBoxCostPerKg +
      hygieneCostPerKg +
      scavengerCostPerKg +
      mapCostPerKg +
      smallerSizePackagingCostPerKg +
      monoCartonCostPerKg +
      stickerCostPerKg +
      butterPaperCostPerKg +
      excessStockCostPerKg +
      materialWastageCostPerKg;

    setResults({
      shipperBoxCostPerKg,
      hygieneCostPerKg,
      scavengerCostPerKg,
      mapCostPerKg,
      smallerSizePackagingCostPerKg,
      monoCartonCostPerKg,
      stickerCostPerKg,
      butterPaperCostPerKg,
      excessStockCostPerKg,
      materialWastageCostPerKg,
      totalPackagingHandlingCost,
    });
  };

  const handleSavePackagingCosts = async () => {
    if (!recipeId) {
      toast.error("Recipe ID is required to save packaging costs");
      return;
    }

    if (!results) {
      toast.error("Please calculate the costs first");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/packaging-costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs,
          results,
          totalPackagingHandlingCost: results.totalPackagingHandlingCost,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", response.status, errorText);
        toast.error(`Server error: ${response.status}`);
        return;
      }

      const responseText = await response.text();
      if (!responseText) {
        toast.success("Packaging costs saved successfully!");
        if (onSave) onSave();
        return;
      }

      const data = JSON.parse(responseText);
      if (data.success) {
        toast.success("Packaging costs saved successfully!");
        if (onSave) onSave();
      } else {
        toast.error(data.message || "Failed to save packaging costs");
      }
    } catch (error) {
      console.error("Error saving packaging costs:", error);
      toast.error("Failed to save packaging costs");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">{title}</h2>

      <div className="space-y-6">
        {/* 1. Shipper Box Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
            Shipper Box Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Box (₹)</Label>
              <Input
                type="number"
                name="shipperBoxCost"
                value={inputs.shipperBoxCost || ""}
                onChange={handleInputChange}
                placeholder="Cost per box"
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Qty per Box (Kg)</Label>
              <Input
                type="number"
                name="shipperBoxQty"
                value={inputs.shipperBoxQty || ""}
                onChange={handleInputChange}
                placeholder="Quantity in kg"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
              <p className="font-medium text-blue-900 dark:text-blue-200">
                ✓ Shipper Box Cost / Kg = {inputs.shipperBoxCost} ÷ {inputs.shipperBoxQty} = <span className="font-bold">₹{results.shipperBoxCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 2. Hygiene Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
            Hygiene Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Unit (₹)</Label>
              <Input
                type="number"
                name="hygieneCostPerUnit"
                value={inputs.hygieneCostPerUnit || ""}
                onChange={handleInputChange}
                placeholder="Cost per unit"
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Qty used per Kg</Label>
              <Input
                type="number"
                name="hygieneQtyPerKg"
                value={inputs.hygieneQtyPerKg || ""}
                onChange={handleInputChange}
                placeholder="Quantity per kg"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-900 dark:text-green-200">
                ✓ Hygiene Cost / Kg = {inputs.hygieneCostPerUnit} × {inputs.hygieneQtyPerKg} = <span className="font-bold">₹{results.hygieneCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 3. Scavenger Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
            Scavenger Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Unit (₹)</Label>
              <Input
                type="number"
                name="scavengerCostPerUnit"
                value={inputs.scavengerCostPerUnit || ""}
                onChange={handleInputChange}
                placeholder="Cost per unit"
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Qty used per Kg</Label>
              <Input
                type="number"
                name="scavengerQtyPerKg"
                value={inputs.scavengerQtyPerKg || ""}
                onChange={handleInputChange}
                placeholder="Quantity per kg"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded border border-purple-200 dark:border-purple-800">
              <p className="font-medium text-purple-900 dark:text-purple-200">
                ✓ Scavenger Cost / Kg = {inputs.scavengerCostPerUnit} × {inputs.scavengerQtyPerKg} = <span className="font-bold">₹{results.scavengerCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 4. MAP Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
            MAP Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Kg (₹)</Label>
              <Input
                type="number"
                name="mapCostPerKg"
                value={inputs.mapCostPerKg || ""}
                onChange={handleInputChange}
                placeholder="Direct input"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded border border-orange-200 dark:border-orange-800">
              <p className="font-medium text-orange-900 dark:text-orange-200">
                ✓ MAP Cost / Kg = <span className="font-bold">₹{results.mapCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 5. Smaller Size Packaging */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
            Smaller Size Packaging Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Kg (₹)</Label>
              <Input
                type="number"
                name="smallerSizePackagingCost"
                value={inputs.smallerSizePackagingCost || ""}
                onChange={handleInputChange}
                placeholder="Direct input"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-pink-50 dark:bg-pink-950 p-3 rounded border border-pink-200 dark:border-pink-800">
              <p className="font-medium text-pink-900 dark:text-pink-200">
                ✓ Smaller Size Packaging Cost / Kg = <span className="font-bold">₹{results.smallerSizePackagingCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 6. Mono Carton Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">6</span>
            Mono Carton Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Carton (₹)</Label>
              <Input
                type="number"
                name="monoCartonCostPerUnit"
                value={inputs.monoCartonCostPerUnit || ""}
                onChange={handleInputChange}
                placeholder="Cost per carton"
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Qty used per Kg</Label>
              <Input
                type="number"
                name="monoCartonQtyPerKg"
                value={inputs.monoCartonQtyPerKg || ""}
                onChange={handleInputChange}
                placeholder="Quantity per kg"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
              <p className="font-medium text-red-900 dark:text-red-200">
                ✓ Mono Carton Cost / Kg = {inputs.monoCartonCostPerUnit} × {inputs.monoCartonQtyPerKg} = <span className="font-bold">₹{results.monoCartonCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 7. Sticker Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">7</span>
            Sticker Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Sticker (₹)</Label>
              <Input
                type="number"
                name="stickerCostPerUnit"
                value={inputs.stickerCostPerUnit || ""}
                onChange={handleInputChange}
                placeholder="Cost per sticker"
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Qty used per Kg</Label>
              <Input
                type="number"
                name="stickerQtyPerKg"
                value={inputs.stickerQtyPerKg || ""}
                onChange={handleInputChange}
                placeholder="Quantity per kg"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-indigo-50 dark:bg-indigo-950 p-3 rounded border border-indigo-200 dark:border-indigo-800">
              <p className="font-medium text-indigo-900 dark:text-indigo-200">
                ✓ Sticker Cost / Kg = {inputs.stickerCostPerUnit} × {inputs.stickerQtyPerKg} = <span className="font-bold">₹{results.stickerCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 8. Butter Paper Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">8</span>
            Butter Paper Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cost per Kg (₹)</Label>
              <Input
                type="number"
                name="butterPaperCostPerKg"
                value={inputs.butterPaperCostPerKg || ""}
                onChange={handleInputChange}
                placeholder="Cost per kg"
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Qty used per Kg</Label>
              <Input
                type="number"
                name="butterPaperQtyPerKg"
                value={inputs.butterPaperQtyPerKg || ""}
                onChange={handleInputChange}
                placeholder="Quantity per kg"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="font-medium text-yellow-900 dark:text-yellow-200">
                ✓ Butter Paper Cost / Kg = {inputs.butterPaperCostPerKg} × {inputs.butterPaperQtyPerKg} = <span className="font-bold">₹{results.butterPaperCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 9. Excess Stock Cost */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">9</span>
            Excess Stock Cost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Excess Weight per Kg</Label>
              <Input
                type="number"
                name="excessWeightPerKg"
                value={inputs.excessWeightPerKg || ""}
                onChange={handleInputChange}
                placeholder="Excess weight"
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">RMC Cost per Kg (₹)</Label>
              <Input
                type="number"
                name="rmcCostPerKg"
                value={inputs.rmcCostPerKg || ""}
                onChange={handleInputChange}
                placeholder="RMC cost"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-cyan-50 dark:bg-cyan-950 p-3 rounded border border-cyan-200 dark:border-cyan-800">
              <p className="font-medium text-cyan-900 dark:text-cyan-200">
                ✓ Excess Stock Cost / Kg = {inputs.excessWeightPerKg} × {inputs.rmcCostPerKg} = <span className="font-bold">₹{results.excessStockCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>

        {/* 10. Material Wastage */}
        <div className="pb-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Material Wastage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Wastage Percentage (%)</Label>
              <Input
                type="number"
                name="wastagePercentage"
                value={inputs.wastagePercentage || ""}
                onChange={handleInputChange}
                placeholder="Wastage %"
                step="0.01"
              />
            </div>
          </div>
          {results && (
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded border border-amber-200 dark:border-amber-800">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                ✓ Material Wastage Cost / Kg ({inputs.wastagePercentage}%) = <span className="font-bold">₹{results.materialWastageCostPerKg.toFixed(2)}/Kg</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      {results && (
        <div className="mt-8">
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600">
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Cost Component</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Cost per Kg (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Shipper Box Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.shipperBoxCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Hygiene Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.hygieneCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Scavenger Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.scavengerCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">MAP Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.mapCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Smaller Size Packaging Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.smallerSizePackagingCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Mono Carton Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.monoCartonCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Sticker Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.stickerCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Butter Paper Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.butterPaperCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Excess Stock Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">₹{results.excessStockCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">Material Wastage Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-900 dark:text-amber-200">₹{results.materialWastageCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="bg-green-100 dark:bg-green-900 border-t-2 border-green-300 dark:border-green-700">
                  <td className="px-4 py-4 font-bold text-lg text-green-900 dark:text-green-200">👉 TOTAL PACKAGING & HANDLING COST / KG</td>
                  <td className="px-4 py-4 text-right font-bold text-lg text-green-900 dark:text-green-200">₹{results.totalPackagingHandlingCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Summary */}
          <div className="mt-6 border-t-2 border-slate-300 dark:border-slate-600 pt-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border-2 border-blue-300 dark:border-blue-700">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4">
                📊 Complete Cost Breakdown (Per Kg)
              </h3>
              <div className="space-y-3">
                <div className="pb-3 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">1. Raw Material Cost / KG</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">₹{rmCostPerKg.toFixed(2)}</span>
                  </div>
                  {batchSize > 0 && (
                    <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300">
                      <span></span>
                      <span>{rmCostPerKg.toFixed(2)} × {yieldPercentage} = ₹{(rmCostPerKg * yieldPercentage).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pb-3 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">2. Production Labour Cost / KG</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">₹{productionLabourCostPerKg.toFixed(4)}</span>
                  </div>
                  {batchSize > 0 && (
                    <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300">
                      <span></span>
                      <span>{productionLabourCostPerKg.toFixed(4)} × {yieldPercentage} = ₹{(productionLabourCostPerKg * yieldPercentage).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pb-3 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">3. Packing Labour Cost / KG</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">₹{packingLabourCostPerKg.toFixed(4)}</span>
                  </div>
                  {batchSize > 0 && (
                    <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300">
                      <span></span>
                      <span>{packingLabourCostPerKg.toFixed(4)} × {yieldPercentage} = ₹{(packingLabourCostPerKg * yieldPercentage).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pb-3 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">4. Packaging & Handling Cost / KG</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">₹{results.totalPackagingHandlingCost.toFixed(2)}</span>
                  </div>
                  {batchSize > 0 && (
                    <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300">
                      <span></span>
                      <span>{results.totalPackagingHandlingCost.toFixed(2)} × {yieldPercentage} = ₹{(results.totalPackagingHandlingCost * yieldPercentage).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-blue-400 dark:border-blue-600 bg-blue-100 dark:bg-blue-900 p-4 rounded">
                  <span className="text-base font-bold text-blue-900 dark:text-blue-100">🎯 GRAND TOTAL COST / KG</span>
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ₹{(rmCostPerKg + productionLabourCostPerKg + packingLabourCostPerKg + results.totalPackagingHandlingCost).toFixed(2)}
                  </span>
                </div>
                {batchSize > 0 && (
                  <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-green-400 dark:border-green-600 bg-green-100 dark:bg-green-900 p-4 rounded">
                    <span className="text-base font-bold text-green-900 dark:text-green-100">
                      📈 TOTAL BATCH COST
                    </span>
                    <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ₹{((rmCostPerKg * yieldPercentage) + (productionLabourCostPerKg * yieldPercentage)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button Section */}
          {recipeId && (
            <div className="mt-8 pt-6 border-t-2 border-slate-300 dark:border-slate-600 flex gap-3 justify-end">
              <button
                onClick={handleSavePackagingCosts}
                disabled={isSaving || !results}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Packaging Costs</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
