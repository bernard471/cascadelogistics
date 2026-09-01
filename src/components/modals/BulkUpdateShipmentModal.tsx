"use client";

import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulkUpdateShipmentModalProps {
  selectedIds: string[]; // Array of shipment _id values
  onClose: () => void;
  onSave: () => void;
}

export default function BulkUpdateShipmentModal({ selectedIds, onClose, onSave }: BulkUpdateShipmentModalProps) {
  const [formData, setFormData] = useState({
    status: "",
    estimatedDelivery: "",
    deltaNumber: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    if (!formData.status && !formData.deltaNumber.trim()) {
      setError("Please select a status and/or enter a DELTA number");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/shipments/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentIds: selectedIds,
          status: formData.status || undefined,
          estimatedDelivery: formData.estimatedDelivery || undefined,
          deltaNumber: formData.deltaNumber.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update shipments");
        setIsSaving(false);
        return;
      }

      onSave(); // Refresh the shipment list
      onClose();
    } catch (error) {
      console.error("Bulk update error:", error);
      setError("An error occurred while updating shipments");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bulk Update Shipments</h2>
            <p className="text-sm text-gray-600 mt-1">{selectedIds.length} shipment(s) selected</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* DELTA Number - set one DELTA for all selected shipments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DELTA Number
            </label>
            <Input
              type="text"
              name="deltaNumber"
              value={formData.deltaNumber}
              onChange={handleInputChange}
              placeholder="e.g., DELTA85720"
              className="h-12"
            />
            <p className="text-xs text-gray-500 mt-2">
              Set one DELTA number for all {selectedIds.length} selected shipment(s). Leave empty to keep existing.
            </p>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="">No change</option>
              <option value="pending">Pending</option>
              <option value="arrived-at-warehouse-pending-proof">Arrived at Warehouse – Pending Proof</option>
              <option value="arrived-at-warehouse">Arrived at Warehouse</option>
              <option value="ready-for-shipment">Ready for Shipment</option>
              <option value="in-transit">In Transit</option>
              <option value="arrived-at-warehouse-ghana">Arrived at Warehouse (Ghana)</option>
              <option value="ready-for-pickup">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Provide at least one: DELTA number and/or new status.
            </p>
          </div>

          {/* Estimated Delivery Date (only for in-transit) */}
          {formData.status === "in-transit" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery Date (Optional)
              </label>
              <Input
                type="date"
                name="estimatedDelivery"
                value={formData.estimatedDelivery}
                onChange={handleInputChange}
                className="h-12"
              />
              <p className="text-xs text-gray-500 mt-2">
                Set an estimated delivery date for all selected shipments
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#055b8e] hover:bg-[#044a73] text-white px-6 flex items-center gap-2"
              style={{ borderRadius: "10px 0px 10px 0px" }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Updating..." : `Update ${selectedIds.length} Shipment(s)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

