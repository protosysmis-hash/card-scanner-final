import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // API Key check
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key missing in environment variables");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model wahi rakha hai jo tumne manga tha
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    // Strict Prompt: AI ko kaha hai ki saari details dhoonde
    const prompt = `You are a business card scanner. Analyze the image and extract ALL of these details: name, jobTitle, company, email, phone, linkedinUrl, website, and address.
    
    Return the response as a strict JSON object. If a field is missing, return "Not provided".
    
    JSON format:
    { 
      "name": "", 
      "jobTitle": "", 
      "company": "", 
      "email": "", 
      "phone": "", 
      "linkedinUrl": "", 
      "website": "", 
      "address": "", 
      "whatsappDraft": "Write a professional follow-up message." 
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);

    // Google Sheet Integration
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        console.log("Data successfully sent to Google Sheet");
      } catch (err) {
        console.error("Sheet update failed:", err);
      }
    }

    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}