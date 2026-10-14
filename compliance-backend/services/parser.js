const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini using your .env key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractFields(filePath, docType) {
  // 1. Extract the raw text from the PDF
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const rawText = data.text;
  
  console.log(`Extracted ${rawText.length} characters from the PDF.`);

  // 2. Configure the Gemini model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json", 
      temperature: 0.1, 
    }
  });

  // 3. Define the extraction rules
  const prompt = `
    You are an expert trade compliance data extractor. 
    Analyze the following messy text extracted from a ${docType.replace(/_/g, ' ')}.
    
    Extract the following fields. If a field cannot be found, DO NOT include it in the JSON.
    Format requirements:
    - gross_weight_kg: Number only (e.g., 1500.5)
    - net_weight_kg: Number only
    - total_qty_units: Number only
    - total_value_usd: Number only (strip currency symbols)
    - hs_code: String (e.g., "8517.12.00")
    - currency: 3-letter ISO code (e.g., "USD", "EUR", "INR")
    - incoterms: 3-letter code (e.g., "FOB", "CIF")
    - consignee_name: String (Full company name, ignore blank lines or instructions)
    - shipper_address: String
    - shipment_id: String
    - invoice_number: String
    - bill_of_lading: String

    Document Text:
    ---
    ${rawText}
    ---
  `;

  try {
    // 4. Send the prompt and text to Gemini
    const result = await model.generateContent(prompt);
    
    // Get the raw text from Gemini
    let rawResponse = result.response.text();
    
    // FIX: Strip out markdown formatting if Gemini included it
    // This prevents the JSON.parse() SyntaxError crash!
    rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    // 5. Parse the cleaned result into a JavaScript object
    const extractedData = JSON.parse(rawResponse);
    
    console.log(`Gemini AI Extraction complete for ${docType}:`, extractedData);
    return extractedData;

  } catch (error) {
    console.error("Gemini AI Extraction failed:", error);
    throw new Error(`Gemini API Error: ${error.message}`); 
  }
}

module.exports = { extractFields };