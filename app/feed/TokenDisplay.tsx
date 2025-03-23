"use client";
import { useState, useEffect } from "react";
import ProfileImage from "@/components/ProfileImage";

interface TokenDisplayProps {
  initialTokenBalance: number;
  onTokenUpdate: (newBalance: number) => void;
  isUpdating: boolean;
}

export default function TokenDisplay({ initialTokenBalance, onTokenUpdate, isUpdating }: TokenDisplayProps) {
  const [tokenBalance, setTokenBalance] = useState(initialTokenBalance);

  // Update token balance when initialTokenBalance changes
  useEffect(() => {
    setTokenBalance(initialTokenBalance);
  }, [initialTokenBalance]);

  const handleTokenUpdate = (newBalance: number) => {
    setTokenBalance(newBalance);
    onTokenUpdate(newBalance);
  };

  return (
    <div style={{justifyContent: 'end', alignItems:'center'}} className="flex">
      <div style={{justifyContent: 'end', alignItems:'center', border: '1px solid black', borderRadius: '5px', marginRight: '0.5rem', padding: '0.25rem'}} className="flex">
        <p className="text-white" style={{fontSize:'14px'}}> { isUpdating ? 'Updating...' : tokenBalance } </p>
        <img src="/coin.svg" alt="Edit" style={{height:'1.5rem'}} />
      </div>
      <ProfileImage />
    </div>
  );
} 