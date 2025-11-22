// components/QuantityAdder.tsx
import React, { useState } from "react";
import { toast } from "sonner";
import { InventoryItem } from "../types/inventry";

interface Props {
  item: InventoryItem;
  qtyInCart: number;
  availableStock: number;
  onAdd: (quantity: number) => Promise<void>;
  onIncrement: () => Promise<void>;
  onDecrement: () => Promise<void>;
}

export const QuantityAdder: React.FC<Props> = ({
  item,
  qtyInCart,
  availableStock,
  onAdd,
  onIncrement,
  onDecrement,
}) => {
  const [inputQty, setInputQty] = useState(1); // ← Ab safe hai!

  const handleAdd = async () => {
    if (inputQty < 1 || inputQty > availableStock) {
      toast.error(`Valid range: 1-${availableStock}`);
      return;
    }
    await onAdd(inputQty);
    setInputQty(1);
  };

  if (qtyInCart > 0) {
    return (
      <div className="flex items-center border-2 border-pink-600 rounded-lg overflow-hidden select-none">
        <button
          onClick={onDecrement}
          className="bg-pink-600 hover:bg-pink-700 text-white w-10 h-10 text-xl font-bold"
        >
          −
        </button>
        <span className="px-5 py-2 bg-white text-gray-800 font-bold min-w-12 text-center">
          {qtyInCart}
        </span>
        <button
          onClick={onIncrement}
          className="bg-pink-600 hover:bg-pink-700 text-white w-10 h-10 text-xl font-bold"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        max={availableStock}
        value={inputQty}
        onChange={(e) =>
          setInputQty(Math.max(1, parseInt(e.target.value) || 1))
        }
        className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:border-fuchsia-600"
      />
      <button
        onClick={handleAdd}
        disabled={availableStock <= 0}
        className={`py-2 px-6 rounded-lg font-bold transition-all ${
          availableStock <= 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-md hover:scale-105"
        }`}
      >
        {availableStock <= 0 ? "OUT OF STOCK" : "ADD"}
      </button>
    </div>
  );
};
