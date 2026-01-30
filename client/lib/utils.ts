import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Enhanced fetch wrapper with better error handling and logging
 * Provides more detailed error messages for debugging network issues
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    console.log(`📡 API Request: ${options.method || "GET"} ${url}`);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`⚠️ API Response Error: ${response.status} ${response.statusText} for ${url}`);
    } else {
      console.log(`✅ API Response: ${response.status} for ${url}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof TypeError) {
      // Network error - more common in production
      console.error(`❌ Network Error (Failed to fetch):`, {
        url,
        method: options.method || "GET",
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Check if it's a timeout
      if (error.message.includes("aborted")) {
        throw new Error(`Request timeout: ${url} took longer than 30 seconds`);
      }

      throw new Error(
        `Failed to connect to ${url}. Please check your internet connection and ensure the server is running.`
      );
    } else if (error instanceof Error) {
      console.error(`❌ API Error for ${url}:`, error.message);
      throw error;
    } else {
      console.error(`❌ Unknown error fetching ${url}:`, error);
      throw new Error("An unknown error occurred while fetching data");
    }
  }
}
