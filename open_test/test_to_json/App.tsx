import React, { useState, useEffect } from 'react';
import { FileUp, FileJson, Download, BookOpen, Database, AlertCircle, CheckCircle, BrainCircuit, Image as ImageIcon, Shield, Target, MousePointer, Trash2, Edit3, Save } from 'lucide-react';

// API Key updated
const DEFAULT_API_KEY = "";

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
    { id: "blue", label: "כחול", class: "bg-blue-500", border: "border-blue-200", light: "bg-blue-50" },
    { id: "red", label: "אדום", class: "bg-red-500", border: "border-red-200", light: "bg-red-50" },
    { id: "green", label: "ירוק", class: "bg-green-500", border: "border-green-200", light: "bg-green-50" },
    { id: "yellow", label: "צהוב", class: "bg-yellow-500", border: "border-yellow-200", light: "bg-yellow-50" }
  ];

  // Helper to get color styles safely
  const getColorStyles = (colorId) => COLORS.find(c => c.id === colorId) || COLORS[0];

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
    if (!apiKey) {
        setErrorMsg("נא להזין מפתח API תקין של Gemini.");
        return;
    }
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

      // 2. Prepare Payload
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
            "id": number, 
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
        let errorMsg = `API Error: ${response.status}`;
        try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error && errorJson.error.message) {
                errorMsg += ` - ${errorJson.error.message}`;
            }
        } catch (e) {
            errorMsg += ` - ${errorBody.substring(0, 100)}`;
        }
        
        if (response.status === 403) {
            throw new Error("מפתח ה-API אינו תקין או נחסם (403). אנא הזן מפתח חדש.");
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const parsedResponse = JSON.parse(rawText);
      
      // 4. Construct Final JSON Structure
      const finalStructure = {
        id: "generated_exam_" + new Date().getTime(),
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

  // --- Update Handlers ---

  const handleDeleteQuestion = (indexToDelete) => {
    if (!generatedJson) return;
    const updatedQuestions = generatedJson.questions.filter((_, index) => index !== indexToDelete);
    setGeneratedJson({
      ...generatedJson,
      questions: updatedQuestions
    });
  };

  const handleUpdateQuestion = (indexToUpdate, field, newValue) => {
    if (!generatedJson) return;
    const updatedQuestions = generatedJson.questions.map((q, index) => {
        if (index === indexToUpdate) {
            return { ...q, [field]: newValue };
        }
        return q;
    });
    setGeneratedJson({
        ...generatedJson,
        questions: updatedQuestions
    });
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

  // Render correct icon component
  const getIconComponent = (iconName) => {
      const found = ICONS.find(i => i.id === iconName);
      return found ? found.icon : <BookOpen />;
  };

  const styles = generatedJson ? getColorStyles(generatedJson.color) : getColorStyles('blue');

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
            <p className="opacity-80 mt-1">המרה חכמה לשאלות פתוחות (OCR) + עורך</p>
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
            placeholder="הזן כאן את מפתח ה-API שלך"
            className="w-full p-2 border rounded bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
          {!apiKey && <p className="text-red-500 text-xs mt-1">נדרש מפתח API לביצוע הפעולה.</p>}
        </div>

        {!pdfLibReady && (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-6 text-center">
                טוען רכיבי מערכת (PDF Processor)... אנא המתן.
            </div>
        )}

        {/* Input Sections - Only show if not complete to save space, or keep visible? Keeping visible for easy re-run */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Shield className="text-purple-700" />
                שלב 3: הגדרות שאלון
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">שם השאלון</label>
                    <input 
                        type="text" 
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
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

        {/* Generate Button */}
        <div className="mt-8 text-center mb-12">
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

        {/* --- RESULT EDITOR UI --- */}
        {status === 'complete' && generatedJson && (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in mb-12">
            
            {/* Editor Header */}
            <div className={`p-6 ${styles.class} text-white flex flex-col md:flex-row justify-between items-center gap-4`}>
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                        {getIconComponent(generatedJson.icon)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{generatedJson.name}</h2>
                        <span className="opacity-90 text-sm">סה"כ {generatedJson.questions.length} שאלות</span>
                    </div>
                </div>
                <button 
                    onClick={downloadJson}
                    className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                >
                    <Download size={20} />
                    הורד JSON מעודכן
                </button>
            </div>

            {/* Questions List */}
            <div className="p-6 bg-gray-50 space-y-6">
                {generatedJson.questions.map((q, idx) => (
                    <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative group hover:shadow-md transition-shadow">
                        
                        {/* Delete Button */}
                        <button 
                            onClick={() => handleDeleteQuestion(idx)}
                            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="מחק שאלה"
                        >
                            <Trash2 size={20} />
                        </button>

                        <div className="grid gap-6">
                            
                            {/* Topic & ID */}
                            <div className="flex items-center gap-4 pr-2">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${styles.light} ${styles.class.replace('bg-', 'text-')} font-bold text-sm`}>
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">נושא</label>
                                    <input 
                                        type="text" 
                                        value={q.topic}
                                        onChange={(e) => handleUpdateQuestion(idx, 'topic', e.target.value)}
                                        className="w-full text-sm font-semibold text-gray-800 border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* Question Text */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Edit3 size={14} className="text-blue-500" />
                                    השאלה
                                </label>
                                <textarea 
                                    value={q.question}
                                    onChange={(e) => handleUpdateQuestion(idx, 'question', e.target.value)}
                                    rows={2}
                                    className="w-full p-3 rounded bg-blue-50/50 border border-blue-100 text-gray-800 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>

                            {/* Source Text */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <BookOpen size={14} className="text-green-500" />
                                    טקסט המקור (התשובה)
                                </label>
                                <textarea 
                                    value={q.sourceText}
                                    onChange={(e) => handleUpdateQuestion(idx, 'sourceText', e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded bg-green-50/50 border border-green-100 text-gray-700 text-sm leading-relaxed focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {generatedJson.questions.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        אין שאלות להצגה.
                    </div>
                )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 bg-gray-100 border-t flex justify-center">
                <button 
                    onClick={downloadJson}
                    className={`bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 font-bold ${generatedJson.questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={generatedJson.questions.length === 0}
                >
                    <Save size={18} />
                    שמור והורד קובץ סופי
                </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}