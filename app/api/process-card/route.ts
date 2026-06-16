import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // API Key ko environment variable se uthao, code mein mat likho!
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key missing in environment variables");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Sabse stable model use karo
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const prompt = `Extract name, jobTitle, company, email, phone, linkedinUrl from this business card image. 
    Return the response as a valid JSON object with the following fields: 
    { "name": "", "jobTitle": "", "company": "", "email": "", "phone": "", "linkedinUrl": "", "whatsappDraft": "" }
    Make sure whatsappDraft is a polite professional follow-up message.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);

    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}