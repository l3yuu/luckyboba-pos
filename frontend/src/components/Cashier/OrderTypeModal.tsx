"use client";

import React from "react";

interface Props {
  onSelect: (type: "dine_in" | "take_out") => void;
}

const OrderTypeModal: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center w-[420px]">
        <h1 className="text-2xl font-bold text-[#7c14d4] mb-6">
          Select Order Type
        </h1>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect("dine_in")}
            className="py-5 text-lg font-semibold bg-green-500 text-white rounded-xl hover:scale-105 transition"
          >
            🍽️ DINE IN
          </button>

          <button
            onClick={() => onSelect("take_out")}
            className="py-5 text-lg font-semibold bg-blue-500 text-white rounded-xl hover:scale-105 transition"
          >
            🛍️ TAKE OUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeModal;