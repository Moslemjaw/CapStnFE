import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variable or use provided key
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyDm8rm5oTMykmGTeu9TJaADbTSJOTWMVE8";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ExtractedSurveyData {
  title: string | null;
  description: string | null;
  questions: ExtractedQuestion[];
}

export interface ExtractedQuestion {
  text: string;
  type: "text" | "multiple_choice";
  options: string[] | null;
  isRequired: boolean;
}

/**
 * Structured prompt that teaches Gemini how to extract survey data
 */
const SURVEY_EXTRACTION_PROMPT = `You are a survey extraction assistant. Analyze the provided image/text and extract survey information.

EXTRACTION RULES:
1. Look for a survey title at the top of the document. If found, extract it. If not found, use null.
2. Look for a description or subtitle. If found, extract it. If not found, use null.
3. Identify all questions in the document. For each question:
   - Extract the question text exactly as written
   - Determine the question type:
     * "text" - if it's a written/essay question or asks for text input
     * "multiple_choice" - if it has multiple options/choices (A, B, C, etc. or checkboxes/radio buttons)
   - If multiple_choice, extract ALL options as an array
   - Determine if the question is required (look for asterisks, "required", or similar indicators)
   - If question type cannot be determined, default to "text"

4. Questions should be extracted in the order they appear in the document.

5. If you cannot find any questions, return an empty questions array.

OUTPUT FORMAT (JSON only, no markdown):
{
  "title": "string or null",
  "description": "string or null",
  "questions": [
    {
      "text": "question text here",
      "type": "text" or "multiple_choice",
      "options": ["option1", "option2"] or null if type is "text",
      "isRequired": true or false
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no explanations or markdown
- If a field is missing, use null (for title/description) or appropriate defaults
- Preserve the exact wording of questions and options
- Do not add or modify the content, only extract what is present
- Ensure the JSON is valid and parseable`;

/**
 * Extract survey data from an image using Gemini Vision API
 */
export const extractSurveyFromImage = async (
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ExtractedSurveyData> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

    // Convert base64 to format expected by Gemini
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([SURVEY_EXTRACTION_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    return parseGeminiResponse(text);
  } catch (error: any) {
    console.error("Error extracting survey from image:", error);
    throw new Error(
      error.message || "Failed to extract survey data from image. Please try again."
    );
  }
};

/**
 * Extract survey data from text using Gemini Pro API
 */
export const extractSurveyFromText = async (text: string): Promise<ExtractedSurveyData> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `${SURVEY_EXTRACTION_PROMPT}\n\nDocument content:\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Parse the JSON response
    return parseGeminiResponse(textResponse);
  } catch (error: any) {
    console.error("Error extracting survey from text:", error);
    throw new Error(
      error.message || "Failed to extract survey data from text. Please try again."
    );
  }
};

/**
 * Parse Gemini's JSON response and validate structure
 */
function parseGeminiResponse(text: string): ExtractedSurveyData {
  try {
    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }

    // Parse JSON
    const parsed = JSON.parse(cleanedText) as ExtractedSurveyData;

    // Validate structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response: questions array is missing");
    }

    // Validate each question
    const validatedQuestions: ExtractedQuestion[] = parsed.questions.map((q, index) => {
      if (!q.text || typeof q.text !== "string") {
        throw new Error(`Invalid question at index ${index}: missing or invalid text`);
      }

      const type = q.type === "multiple_choice" ? "multiple_choice" : "text";
      const options =
        type === "multiple_choice" && Array.isArray(q.options) && q.options.length >= 2
          ? q.options
          : null;

      return {
        text: q.text.trim(),
        type: type,
        options: options,
        isRequired: typeof q.isRequired === "boolean" ? q.isRequired : true,
      };
    });

    return {
      title: parsed.title && typeof parsed.title === "string" ? parsed.title.trim() : null,
      description:
        parsed.description && typeof parsed.description === "string"
          ? parsed.description.trim()
          : null,
      questions: validatedQuestions,
    };
  } catch (error: any) {
    console.error("Error parsing Gemini response:", error);
    if (error instanceof SyntaxError) {
      throw new Error(
        "Failed to parse AI response. The document may not contain survey data."
      );
    }
    throw error;
  }
}

/**
 * Convert image URI to base64 string for React Native
 * Handles both web and native platforms
 */
export const imageUriToBase64 = async (uri: string): Promise<{ base64: string; mimeType: string }> => {
  try {
    // Determine MIME type from URI extension
    let mimeType = "image/jpeg"; // default
    const uriLower = uri.toLowerCase();
    if (uriLower.endsWith(".png")) {
      mimeType = "image/png";
    } else if (uriLower.endsWith(".jpg") || uriLower.endsWith(".jpeg")) {
      mimeType = "image/jpeg";
    } else if (uriLower.endsWith(".webp")) {
      mimeType = "image/webp";
    }

    // Handle data URIs (already base64)
    if (uri.startsWith("data:")) {
      const base64 = uri.split(",")[1];
      return { base64, mimeType };
    }

    // For React Native, use fetch to get the image
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to base64
    return new Promise((resolve, reject) => {
      // Use FileReader if available (web/Expo Web)
      if (typeof FileReader !== "undefined") {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix
          const base64 = base64String.split(",")[1] || base64String;
          resolve({ base64, mimeType });
        };
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(blob);
      } else {
        // For React Native native, convert blob to array buffer then to base64
        blob.arrayBuffer().then((buffer) => {
          // Convert ArrayBuffer to base64
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          resolve({ base64, mimeType });
        }).catch(reject);
      }
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to process image. Please try again.");
  }
};

