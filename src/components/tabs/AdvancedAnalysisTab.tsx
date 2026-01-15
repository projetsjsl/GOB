/**
 * AdvancedAnalysisTab - Advanced financial analysis tools
 * 
 * This component wraps the legacy AdvancedAnalysisTab.js component
 * to make it compatible with the Vite/React environment
 */

import React, { useState, useEffect } from "react";
import type { TabProps } from "../../types";

// Load the legacy AdvancedAnalysisTab component if not already loaded
const loadAdvancedAnalysisTab = async (): Promise<void> => {
  if (window.AdvancedAnalysisTab) {
    return; // Already loaded
  }

  // Check if script is already loaded
  const scriptUrl = "/js/dashboard/components/tabs/AdvancedAnalysisTab.js";
  const existingScript = Array.from(document.head.querySelectorAll("script")).find(
    (script) => script.src && script.src.includes("AdvancedAnalysisTab.js")
  );

  if (existingScript) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = false; // Ensure proper loading order
    script.onload = () => {
      console.log(" AdvancedAnalysisTab loaded");
      resolve();
    };
    script.onerror = (error) => {
      console.error(" Failed to load AdvancedAnalysisTab:", error);
      reject(error);
    };
    document.head.appendChild(script);
  });
};

export const AdvancedAnalysisTab: React.FC<TabProps> = (props) => {
  const { isDarkMode = true } = props;
  const [componentLoaded, setComponentLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        await loadAdvancedAnalysisTab();
        setComponentLoaded(true);
      } catch (err) {
        setError("Failed to load Advanced Analysis components");
        console.error("Error loading Advanced Analysis tab:", err);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (componentLoaded && window.AdvancedAnalysisTab) {
    // Pass the props to the legacy component
    return React.createElement(window.AdvancedAnalysisTab, { 
      isDarkMode,
      ...props 
    });
  }

  return (
    <div className="p-6 text-center text-gray-500">
      Advanced Analysis component not available
    </div>
  );
};

export default AdvancedAnalysisTab;
