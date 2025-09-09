
import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import type { ComparativeCostItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an elite-level AI architectural visualizer and interior designer. Your sole purpose is to produce hyper-realistic, editorial-quality architectural photography of interior spaces across any style—from contemporary, mid-century, heritage-inspired, coastal, to eclectic—but each render must embody sophistication, intentionality, and authenticity.

1. Style Flexibility

Do not default to a single design philosophy. Instead, adapt fluidly to the chosen style’s defining features—whether it’s heritage, contemporary, coastal, mid-century, or modern.

Prioritize coherence: your render should clearly convey the mood and era of the intended design language.

2. Aesthetic Quality—Drawn from The Local Project

Use clean, minimal compositions with purposeful arrangement—simplicity with depth.

Natural materials are essential: featured texts (e.g., linen, boucle, oak, polished concrete) must showcase texture and authenticity.

Integrate textural layering—smooth surfaces next to textured ones, soft textiles next to hard surfaces—creating visual richness without clutter.

Natural light should define the scene: directional, soft, dynamic—accentuating materiality, shadows, and spatial form.

For palette, start neutral and natural; allow accents to emerge organically through material or lighting—not bright or saturated unless contextually appropriate.

3. Anchored Styling

Use minimal but expressive props: a folded blanket, a sculptural vase, an open book. No overstyling—objects should feel purposeful and situational.

Avoid generic or trendy staging; props should subtly reinforce the mood and narrative of the space.

4. Architectural Context & Framing

Employ views that connect indoors and outdoors: framing gardens, landscape, neighborhood context in a believable, context-sensitive way.

Include architectural transitions—like large glazed frames, layered thresholds, or courtyard glimpses—to enrich spatial storytelling.

5. Realism & Photographic Detail

Apply real-world camera parameters: eye-level camera height, realistic focal lengths (e.g., 28-35 mm for interiors).

Include optical imperfections: lens bloom, film grain, soft vignettes, realistic exposure.

White balance and color grading should feel warm and neutral; avoid digital flatness.

Surfaces should feature micro-imperfections: variations in wood grain, fabric folds, stone veining, minor wear—underscoring authenticity.`;

interface GenerateDesignParams {
  base64ImageData: string;
  mimeType: string;
  base64ReferenceImageData?: string;
  referenceMimeType?: string;
}

export const generateDesign = async ({
  base64ImageData,
  mimeType,
  base64ReferenceImageData,
  referenceMimeType,
}: GenerateDesignParams): Promise<string> => {
  try {
    let prompt: string;
    const parts: Part[] = [];

    // Base Image (for structure)
    parts.push({
      inlineData: { data: base64ImageData, mimeType: mimeType },
    });

    // Reference Image (for style), if provided
    if (base64ReferenceImageData && referenceMimeType) {
      parts.push({
        inlineData: { data: base64ReferenceImageData, mimeType: referenceMimeType },
      });
      prompt = `Analyze the two provided images. The first image is a room that needs a redesign. The second image is a style reference. Your task is to generate a photorealistic interior design rendering of the first room, but apply the aesthetic from the second image. Specifically, use the second image ONLY for its lighting, material textures, and overall color palette. DO NOT copy any furniture or layout elements from the second image. The final design must maintain the structure and layout of the first image. CRITICAL COMMAND: The output image's aspect ratio MUST EXACTLY MATCH the aspect ratio of the first input image. Do not crop, stretch, or change it to 1:1. This is the most important rule.`;
    } else {
      prompt = `Generate a photorealistic, high-quality interior design rendering based on the provided image. Maintain the original room's core structure and layout but elevate the design, materials, and lighting to a professional, aesthetically pleasing standard. CRITICAL COMMAND: The output image's aspect ratio MUST EXACTLY MATCH the aspect ratio of the uploaded image. Do not crop, stretch, or change it to 1:1. This is the most important rule.`;
    }
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    throw new Error("No image was generated by the AI. The model may have refused the request.");
  } catch (error) {
    console.error("Error generating design:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
    throw new Error(`Failed to generate design: ${errorMessage}`);
  }
};

interface AdjustDesignParams {
  base64ImageData: string;
  mimeType: string;
  adjustmentPrompt: string;
  base64AdjustmentImageData?: string;
  adjustmentMimeType?: string;
}

export const adjustDesign = async ({
  base64ImageData,
  mimeType,
  adjustmentPrompt,
  base64AdjustmentImageData,
  adjustmentMimeType,
}: AdjustDesignParams): Promise<string> => {
  if (!adjustmentPrompt.trim()) {
    throw new Error("Adjustment instructions cannot be empty.");
  }

  try {
    let prompt: string;
    const parts: Part[] = [];

    // Base Image (to be adjusted)
    parts.push({
      inlineData: { data: base64ImageData, mimeType: mimeType },
    });

    // Adjustment Reference Image (if provided)
    if (base64AdjustmentImageData && adjustmentMimeType) {
      parts.push({
        inlineData: { data: base64AdjustmentImageData, mimeType: adjustmentMimeType },
      });
      prompt = `Using the first image as the base, apply the following adjustment: "${adjustmentPrompt}". Use the second image as an additional visual reference for this change. Maintain the photorealistic quality and overall style. CRITICAL COMMAND: The output image's aspect ratio MUST EXACTLY MATCH the aspect ratio of the first input image.`;
    } else {
      prompt = `Apply the following adjustment to the provided image: "${adjustmentPrompt}". Maintain the photorealistic quality and the overall style of the image, only changing what is requested. CRITICAL COMMAND: The output image's aspect ratio MUST EXACTLY MATCH the aspect ratio of the provided input image. Do not modify the dimensions. Output only the modified image.`;
    }
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    throw new Error("No adjusted image was generated by the AI. The model may have refused the request.");
  } catch (error) {
    console.error("Error adjusting design:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image adjustment.";
    throw new Error(`Failed to adjust design: ${errorMessage}`);
  }
};

export const estimateCost = async (base64ImageData: string, mimeType: string): Promise<ComparativeCostItem[]> => {
  try {
    const prompt = `Analyze the provided interior design image. Identify key items, materials, and finishes (e.g., joinery, flooring, lighting, furniture). For each identified item, provide two distinct options for comparison based on the Australian market: a standard/budget option and a premium/high-end option.

CRITICAL: For each identified item, you must also provide its normalized bounding box coordinates ([y_min, x_min, y_max, x_max]) that pinpoint its location within the image.

For each of the two options, you must provide:
1.  A descriptive option name (e.g., "Laminate Benchtop" vs. "Caesarstone Benchtop").
2.  A detailed description of the item, including materials and style.
3.  An estimated cost in Australian Dollars (AUD).
4.  A suggested, plausible Australian supplier for that type of item (e.g., "Bunnings Warehouse", "Reece", "Space Furniture").

Return the data as a JSON array where each object represents an item and contains its bounding box and two comparative options.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: {
                type: Type.STRING,
                description: 'The general category of the item (e.g., "Kitchen Benchtop", "Sofa").',
              },
              boundingBox: {
                type: Type.ARRAY,
                description: "A normalized bounding box for the item's location in the image, in the format [yMin, xMin, yMax, xMax].",
                items: { type: Type.NUMBER }
              },
              options: {
                type: Type.ARRAY,
                description: "An array containing exactly two options for the item: one budget, one premium.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    optionName: {
                      type: Type.STRING,
                      description: 'The specific name for this option (e.g., "Mid-Range Fabric Sofa").',
                    },
                    description: {
                      type: Type.STRING,
                      description: 'A brief description of this option (e.g., "A comfortable 3-seater sofa upholstered in a durable polyester-blend fabric.").',
                    },
                    estimatedCostAUD: {
                      type: Type.NUMBER,
                      description: 'The estimated cost of this option in Australian Dollars (AUD).',
                    },
                    suggestedSupplier: {
                      type: Type.STRING,
                      description: 'A plausible Australian supplier for this type of item (e.g., "Temple & Webster", "King Living").',
                    }
                  },
                  required: ["optionName", "description", "estimatedCostAUD", "suggestedSupplier"],
                },
              },
            },
            required: ["item", "boundingBox", "options"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("The model returned an empty response for the cost estimate.");
    }
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
        parsed.forEach(item => {
            if (!item.options || item.options.length !== 2) {
                throw new Error("AI response did not provide two options for comparison for every item.");
            }
            if (!item.boundingBox || item.boundingBox.length !== 4) {
                 throw new Error("AI response did not provide a valid bounding box for every item.");
            }
        });
    }
    return parsed as ComparativeCostItem[];

  } catch (error) {
    console.error("Error estimating cost:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during cost estimation.";
    throw new Error(`Failed to estimate cost: ${errorMessage}`);
  }
};
