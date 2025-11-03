
import { GoogleGenAI, Type } from "@google/genai";
import type { Photo, OrganizedFolder } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const organizePhotos = async (photos: Photo[]): Promise<OrganizedFolder[]> => {
  try {
    const imageParts = await Promise.all(
      photos.map((photo) => fileToGenerativePart(photo.file))
    );

    const prompt = `
      Analyze the following images. Your task is to act as an expert photo organizer. 
      Group these images into logical folders based on their content, such as events, locations, subjects, or themes.
      For each folder, provide a descriptive name and a brief, one-sentence description.
      Return the result as a JSON array. Each object in the array should represent a folder and contain:
      1. 'folderName': A short, descriptive name for the folder (e.g., "Beach Vacation 2024", "Family Portraits", "City Architecture").
      2. 'description': A single sentence summarizing the content of the folder.
      3. 'photoIndices': An array of numbers, where each number is the zero-based index of the photo belonging to that folder from the input list.

      Ensure every photo is assigned to exactly one folder.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }, ...imageParts] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              folderName: {
                type: Type.STRING,
                description: "The name of the folder.",
              },
              description: {
                type: Type.STRING,
                description: "A brief description of the folder's contents."
              },
              photoIndices: {
                type: Type.ARRAY,
                items: {
                  type: Type.INTEGER,
                  description: "The index of the photo in the original list."
                },
              },
            },
            required: ["folderName", "description", "photoIndices"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    // Validate the result structure
    if (!Array.isArray(result) || result.some(folder => typeof folder.folderName !== 'string' || !Array.isArray(folder.photoIndices))) {
      throw new Error("Invalid JSON structure received from API.");
    }
    
    return result as OrganizedFolder[];

  } catch (error) {
    console.error("Error organizing photos with Gemini API:", error);
    throw new Error("Failed to organize photos. The AI model could not process the request.");
  }
};
