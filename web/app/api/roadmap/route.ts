import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const job = typeof body?.job === "string" ? body.job.trim() : "";

    if (!job) {
      return NextResponse.json({ error: "Please enter your dream job target." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing GEMINI_API_KEY in .env.local" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt = `You are an expert career architect.
A student wants to reverse-engineer their dream career goal: "${job}".
Break this goal down into a logical roadmap with 12 to 15 nodes structured across 4 phases:
- Foundations
- Core Skills
- Advanced & Real-World Projects
- Target Job / Capstone

Return ONLY raw JSON with no markdown wrapping.
JSON structure:
{
  "nodes": [
    {
      "id": "1",
      "title": "Topic or Milestone name",
      "phase": "Foundations",
      "summary": "1-2 sentence description of why this matters",
      "actionableAdvice": "Concrete mini-project, recommended repo, or key certification to earn",
      "interviewQuestion": "One real interview question asked about this skill"
    }
  ],
  "edges": [
    { "source": "1", "target": "2" }
  ]
}

Make the nodes realistic, nuanced, and specific to "${job}". Ensure edge IDs map directly to existing node IDs in sequential learning order.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const raw = (response.text ?? "").replace(/```json|```/g, "").trim();
    const data = JSON.parse(raw);

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API Roadmap Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate roadmap" }, { status: 500 });
  }
}