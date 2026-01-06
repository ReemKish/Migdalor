import React, { useState, useEffect } from 'react';
import { FileUp, FileJson, Download, BookOpen, Database, AlertCircle, CheckCircle, BrainCircuit, Image as ImageIcon, Shield, Target, MousePointer } from 'lucide-react';

const DEFAULT_API_KEY = "AIzaSyAM14qos5tCbGIM7beFvVc5KaQ8ukGdZvY";

// PDF.js constants
const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function App() {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  
  // User Configuration State
  const [examName, setExamName] = useState("מבחן מסכם");
  const [selectedIcon, setSelectedIcon] = useState("BookOpen");
  const [selectedColor, setSelectedColor] = useState("blue");

  // Files State
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [referenceText, setReferenceText] = useState("");
  const [questionsFile, setQuestionsFile] = useState(null);
  
  // Processing State
  const [status, setStatus] = useState("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [generatedJson, setGeneratedJson] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfLibReady, setPdfLibReady] = useState(false);

  // Constants for UI selections
  const ICONS = [
    { id: "BookOpen", label: "ספר", icon: <BookOpen /> },
    { id: "Shield", label: "מגן", icon: <Shield /> },
    { id: "Target", label: "מטרה", icon: <Target /> }
  ];

  const COLORS = [
    { id: "blue", label: "כחול", class: "bg-blue-500" },
    { id: "red", label: "אדום", class: "bg-red-500" },
    { id: "green", label: "ירוק", class: "bg-green-500" },
    { id: "yellow", label: "צהוב", class: "bg-yellow-500" }
  ];

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPdfJs = async () => {
      if (window.pdfjsLib) {
        setPdfLibReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = PDF_JS_URL;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
        setPdfLibReady(true);
      };
      document.body.appendChild(script);
    };

    loadPdfJs();
  }, []);

  // Extract Text (For Reference Books)
  const extractTextFromPDF = async (file) => {
    if (!window.pdfjsLib) throw new Error("PDF Library not loaded");
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `--- עמוד ${i} ---\n${pageText}\n`;
    }
    return { text: fullText, pageCount: pdf.numPages };
  };

  // Extract Images (For Questions File)
  const convertPdfToImages = async (file) => {
    if (!window.pdfjsLib) throw new Error("PDF Library not loaded");

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      images.push(base64);
    }
    return { images, pageCount: pdf.numPages };
  };

  const handleReferenceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setStatus("extracting_refs");
    setProgressMsg("קורא את ספרי המקור (טקסט)...");
    
    try {
      let combinedText = "";
      const loadedFiles = [];

      for (const file of files) {
        const extraction = await extractTextFromPDF(file);
        const tag = file.name.includes("התקפ") ? "VOLUME_B_OFFENSE" : 
                    file.name.includes("הגנ") ? "VOLUME_C_DEFENSE" : "UNKNOWN_SOURCE";
        
        combinedText += `\n\n=== START OF SOURCE: ${tag} (Filename: ${file.name}) ===\n`;
        combinedText += extraction.text;
        combinedText += `\n=== END OF SOURCE: ${tag} ===\n`;
        
        loadedFiles.push({ name: file.name, pages: extraction.pageCount });
      }

      setReferenceFiles(loadedFiles);
      setReferenceText(combinedText);
      setStatus("idle");
      setProgressMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg("שגיאה בקריאת קבצי המקור.");
      setStatus("error");
    }
  };

  const handleProcess = async () => {
    if (!questionsFile) {
      setErrorMsg("נא להעלות קובץ שאלות.");
      return;
    }
    if (!referenceText) {
      setErrorMsg("נא להעלות ספרי מקור.");
      return;
    }

    setStatus("processing");
    setErrorMsg("");
    setProgressMsg("מעבד שאלות...");

    try {
      // 1. Convert Questions PDF to Images
      const qExtraction = await convertPdfToImages(questionsFile);
      const questionImages = qExtraction.images;

      setProgressMsg("שולח לניתוח בינה מלאכותית (OCR + ניסוח מחדש)...");

      // 2. Prepare Payload - Requesting ONLY the questions array
      const promptText = `
      You are an expert IDF military instructor assistant.
      
      INPUT DATA:
      1. REFERENCE_MATERIAL (Text): Full text of military manuals.
      2. QUESTIONS_IMAGES (Images): Images of pages with multiple choice questions.

      YOUR TASK:
      1. Visually read ALL multiple-choice questions from the provided images.
      2. For each question:
         - **TRANSFORM** it into an **OPEN-ENDED QUESTION**.
         - **REMOVE** multiple-choice options.
         - **REPHRASE** if needed to be a standalone open question.
         - Find the correct answer and the *exact source text* within the REFERENCE_MATERIAL.
      
      OUTPUT FORMAT:
      Return a valid JSON object containing a SINGLE key "questions" which is an array of question objects.
      
      Structure:
      {
        "questions": [
          {
            "id": number, // Sequential ID starting from 1
            "topic": "Topic in Hebrew",
            "question": "Open-ended question text in Hebrew",
            "sourceText": "Excerpt from reference material including 'מתוך כרך...' header"
          }
        ]
      }

      REFERENCE_MATERIAL:
      ${referenceText.substring(0, 700000)}
      `;

      const contentParts = [{ text: promptText }];
      questionImages.forEach(base64Str => {
        contentParts.push({
            inlineData: { mimeType: "image/jpeg", data: base64Str }
        });
      });

      // 3. Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: contentParts }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorBody.substring(0, 200)}`);
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const parsedResponse = JSON.parse(rawText);
      
      // 4. Construct Final JSON Structure with User Selection
      const finalStructure = {
        id: "generated_exam", // Fixed ID or could be UUID
        name: examName,
        icon: selectedIcon,
        color: selectedColor,
        questions: parsedResponse.questions || []
      };

      setGeneratedJson(finalStructure);
      setStatus("complete");

    } catch (err) {
      console.error("Full error details:", err);
      setErrorMsg(`שגיאה בתהליך: ${err.message}`);
      setStatus("error");
    }
  };

  const downloadJson = () => {
    if (!generatedJson) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedJson, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "questions_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen pb-12 font-sans bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#4b5320] to-[#2c3510] text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BrainCircuit size={32} />
              מחולל מבחני תו"ל
            </h1>
            <p className="opacity-80 mt-1">המרה חכמה לשאלות פתוחות (OCR)</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-4">
        
        {/* API Key */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Gemini API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border rounded bg-gray-50 font-mono text-sm"
          />
        </div>

        {!pdfLibReady && (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-6 text-center">
                טוען רכיבי מערכת (PDF Processor)... אנא המתן.
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Step 1: Reference */}
          <div className={`p-6 rounded-xl border-2 transition-all ${referenceFiles.length > 0 ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300 bg-white'}`}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="text-green-700" />
              שלב 1: ספרות מקצועית
            </h2>
            <p className="text-sm text-gray-600 mb-4">כרך ב' (התקפה) וכרך ג' (הגנה).</p>
            <input 
              type="file" 
              multiple 
              accept=".pdf"
              onChange={handleReferenceUpload}
              disabled={!pdfLibReady}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
            {referenceFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {referenceFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-green-800 bg-green-100 p-2 rounded">
                    <CheckCircle size={16} />
                    <span>{f.name} ({f.pages} עמודים)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Questions */}
          <div className={`p-6 rounded-xl border-2 transition-all ${questionsFile ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300 bg-white'}`}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon className="text-blue-700" />
              שלב 2: קובץ שאלות
            </h2>
            <p className="text-sm text-gray-600 mb-4">קובץ המבחן (PDF) להמרה.</p>
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => setQuestionsFile(e.target.files[0])}
              disabled={!pdfLibReady}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {questionsFile && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-800 bg-blue-100 p-2 rounded">
                <CheckCircle size={16} />
                <span>{questionsFile.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Exam Configuration */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Shield className="text-purple-700" />
                שלב 3: הגדרות שאלון
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">שם השאלון (יופיע ב-JSON)</label>
                    <input 
                        type="text" 
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="לדוגמה: מבחן מסכם - עקרונות המלחמה"
                    />
                </div>

                {/* Icon Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">אייקון</label>
                    <div className="flex gap-2">
                        {ICONS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedIcon(item.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all w-full ${selectedIcon === item.id ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                            >
                                {item.icon}
                                <span className="text-xs mt-1">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">צבע נושא</label>
                    <div className="flex gap-2 h-[58px] items-center">
                        {COLORS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedColor(item.id)}
                                className={`w-10 h-10 rounded-full border-2 transition-all ${item.class} ${selectedColor === item.id ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                title={item.label}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Step 4: Action */}
        <div className="mt-8 text-center">
          {status.startsWith('processing') || status.startsWith('extracting') ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#4b5320] rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium animate-pulse">{progressMsg}</p>
            </div>
          ) : (
            <button 
              onClick={handleProcess}
              disabled={!questionsFile || referenceFiles.length === 0}
              className={`px-8 py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all flex items-center gap-2 mx-auto
              ${(!questionsFile || referenceFiles.length === 0) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-700 hover:bg-green-800 hover:shadow-xl'}`}
            >
              <FileJson />
              צור קובץ JSON
            </button>
          )}
          
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-200 inline-block text-left" dir="ltr">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Result Area */}
        {status === 'complete' && generatedJson && (
          <div className="mt-10 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-700">תוצאה ({generatedJson.questions.length} שאלות)</h3>
                  <span className={`px-2 py-1 rounded text-xs text-white bg-${generatedJson.color === 'blue' ? 'blue' : generatedJson.color === 'red' ? 'red' : generatedJson.color === 'green' ? 'green' : 'yellow'}-500`}>
                      {generatedJson.name}
                  </span>
              </div>
              <button 
                onClick={downloadJson}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                הורד JSON
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto font-mono text-sm bg-gray-900 text-green-400" dir="ltr">
              <pre>{JSON.stringify(generatedJson, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}