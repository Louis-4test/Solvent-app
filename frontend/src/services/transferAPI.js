import axios from "axios";

const API_BASE_URL = "https://your-api-url.com";

export const transferFunds = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transfer`, data);
    return response.data;
  } catch (error) {
    console.error("Transfer Error:", error);
    throw error;
  }
};
