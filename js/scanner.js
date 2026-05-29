const GEMINI_API_KEY = "{{credential:gemini-api}}"; // To be replaced during deployment or handled via proxy

async function analyzeImage(base64Image) {
    const prompt = `You are the Calalloo Food Lab Scanner. Analyze this heritage food specimen.
Deconstruct it into its components and provide:
1. The identification of the dish.
2. Nutritional estimation (Calories, Protein, Carbs, Fats).
Return ONLY JSON in this format:
{
  "dishName": "...",
  "nutrition": {
    "calories": 0,
    "protein": "0g",
    "carbs": "0g",
    "fats": "0g"
  }
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Analysis failed");
    }

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    
    // Clean up markdown if Gemini returns it
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Could not parse analysis result");
}

window.analyzeImage = analyzeImage;
