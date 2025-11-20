import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Key for storing the last entry date in localStorage
const LAST_ENTRY_DATE_KEY = "icflog_last_entry_date";

/**
 * Fetches the most recent session date from Supabase
 * @returns Promise with the most recent date string or null
 */
export const fetchMostRecentEntryDate = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to fetch the most recent session date
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1);

    // If no session data, try CPD entries
    if (!sessionData || sessionData.length === 0) {
      const { data: cpdData } = await supabase
        .from("cpd_entries")
        .select("date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1);

      // If no CPD data, try mentoring entries
      if (!cpdData || cpdData.length === 0) {
        const { data: mentoringData } = await supabase
          .from("mentoring_sessions")
          .select("date")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1);

        if (mentoringData && mentoringData.length > 0) {
          return mentoringData[0].date;
        }
        return null;
      }
      return cpdData[0].date;
    }
    return sessionData[0].date;
  } catch (error) {
    return null;
  }
};

/**
 * Gets the default date for date pickers to open at
 * Uses localStorage to cache the last entry date for performance
 * Falls back to today's date if no entries exist
 */
export const getDatePickerDefaultDate = (): string => {
  try {
    // Try to get from localStorage first for performance
    const cachedDate = localStorage.getItem(LAST_ENTRY_DATE_KEY);
    
    if (cachedDate) {
      return cachedDate;
    }
    
    // Fall back to today's date if no entries exist
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    // Return today's date as fallback
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Updates the stored last entry date
 * Call this when a new entry is saved
 */
export const updateLastEntryDate = (date: string): void => {
  try {
    localStorage.setItem(LAST_ENTRY_DATE_KEY, date);
  } catch (error) {
  }
};

/**
 * Initializes the date picker default date from localStorage or Supabase
 * Call this on component mount to fetch and store the last entry date
 */
export const initializeDatePickerDefaultDate = async (): Promise<void> => {
  try {
    // Skip if we already have a cached date
    if (localStorage.getItem(LAST_ENTRY_DATE_KEY)) {
      return;
    }
    
    // Fetch from Supabase if not in localStorage
    const mostRecentDate = await fetchMostRecentEntryDate();
    
    if (mostRecentDate) {
      localStorage.setItem(LAST_ENTRY_DATE_KEY, mostRecentDate);
    }
  } catch (error) {
  }
};

/**
 * Sets the default date on a date input element
 * Call this when the date input is clicked or focused
 */
export const setDateInputDefault = (event: React.FocusEvent<HTMLInputElement>): void => {
  try {
    // Only set the default if the input is empty
    if (event.target.value === "") {
      // Get the default date (most recent entry or today)
      const defaultDate = getDatePickerDefaultDate();
      
      // Extract just the year and month
      const [year, month] = defaultDate.split('-');
      
      if (year && month) {
        // Set the month attribute on the input element
        // This influences which month is shown when the picker opens
        const dateInput = event.target;
        
        // Use a trick to set the month view without selecting a date
        // This sets the month view temporarily and then clears the selection
        const originalValue = dateInput.value;
        dateInput.value = defaultDate;
        
        // Use setTimeout to reset the value after the picker opens
        setTimeout(() => {
          dateInput.value = originalValue;
        }, 10);
      }
    }
  } catch (error) {
  }
};

/**
 * Hook to use with date inputs to set the default month/year view
 */
export const useDatePickerDefault = () => {
  // Initialize date picker default date when component mounts
  useEffect(() => {
    const init = async () => {
      await initializeDatePickerDefaultDate();
    };
    init();
  }, []);
  
  return {
    // Function to handle focus event on date inputs
    onFocus: setDateInputDefault
  };
};
