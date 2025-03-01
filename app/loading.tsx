import React from "react";

function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500" />
    </div>
  );
}

export default Loading;
