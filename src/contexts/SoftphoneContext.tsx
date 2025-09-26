import React, { createContext, useContext } from "react";

// Minimal SoftphoneContext compatibility layer used across the app.
export const SoftphoneContext = createContext<any | undefined>(undefined);

export const useSoftphoneContext = () => {
  const ctx = useContext(SoftphoneContext);
  if (ctx === undefined)
    throw new Error(
      "useSoftphoneContext must be used within SoftphoneProvider"
    );
  return ctx as any;
};

export default SoftphoneContext;
