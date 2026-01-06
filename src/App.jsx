// import { useState, useMemo } from 'react';
// import Select from 'react-select';
// import initialSimulations from './data.json';
// import skillsList from './skills.json';
// import redLinesList from './red_lines.json';
// import './App.css';

// function App() {
//   // ניהול רשימת הסימולציות ב-State כדי שנוכל להוסיף חדשות
//   const [simData, setSimData] = useState(initialSimulations);
  
//   // State לחיפושים ופילטרים
//   const [search, setSearch] = useState('');
//   const [selectedTypes, setSelectedTypes] = useState([]);
//   const [selectedSkills, setSelectedSkills] = useState([]);
//   const [selectedRedLines, setSelectedRedLines] = useState([]);
  
//   // State למודלים (Popup)
//   const [activeSimulation, setActiveSimulation] = useState(null);
//   const [showAddModal, setShowAddModal] = useState(false);

//   // State לטופס הוספה
//   const [newSim, setNewSim] = useState({
//     title: '', week: '', type: 'פורמלית', actors_needed: 1,
//     dilemma: '', description: '', briefing_actors: '',
//     communication_types: '', review: '', delivery_highlights: '',
//     skills: {}, red_lines: [], discussion_questions: [], practical_tools: []
//   });

//   // --- פונקציות עזר ---

//   // ג'ינרוט ID בפורמט YYYY-MM-XXX
//   const generateId = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const prefix = `${year}-${month}-`;
    
//     const monthlySims = simData.filter(s => s.id.includes(`-${month}-`) || s.id.startsWith(prefix));
//     const lastNum = monthlySims.length > 0 
//       ? Math.max(...monthlySims.map(s => {
//           const parts = s.id.split('-');
//           return parseInt(parts[parts.length - 1]) || 0;
//         })) 
//       : 0;
    
//     return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
//   };

//   // לוגיקת הציון (get_score מפייתון)
//   const getScore = (querySkills, simSkills) => {
//     let score = 0;
//     querySkills.forEach(s => {
//       if (simSkills && simSkills[s.value]) {
//         score += simSkills[s.value];
//       }
//     });
//     return score;
//   };

//   // לוגיקת בדיקת קווים אדומים (check_red_lines מפייתון)
//   const hasRedLineConflict = (queryRl, simRl) => {
//     return queryRl.some(rl => simRl.includes(rl.value));
//   };

//   // --- טיפול באירועים ---

//   const handleAddSimulation = (e) => {
//     e.preventDefault();
//     const simulationToAdd = {
//       ...newSim,
//       id: generateId(),
//       actors_needed: parseInt(newSim.actors_needed)
//     };
//     setSimData([simulationToAdd, ...simData]);
//     setShowAddModal(false);
//     // איפוס טופס
//     setNewSim({
//       title: '', week: '', type: 'פורמלית', actors_needed: 1,
//       dilemma: '', description: '', briefing_actors: '',
//       communication_types: '', review: '', delivery_highlights: '',
//       skills: {}, red_lines: [], discussion_questions: [], practical_tools: []
//     });
//   };

//   // --- לוגיקת הסינון המרכזית ---
//   const filteredResults = useMemo(() => {
//     let results = [];
//     simData.forEach(sim => {
//       // סינון לפי סוג
//       if (selectedTypes.length > 0 && !selectedTypes.some(t => t.value === sim.type)) return;
      
//       // סינון קווים אדומים (פסילה אם נמצאה התאמה)
//       if (selectedRedLines.length > 0 && hasRedLineConflict(selectedRedLines, sim.red_lines)) return;

//       // חישוב ציון התאמה
//       const score = getScore(selectedSkills, sim.skills);
      
//       // סף ציון (0.7 כפי שהוגדר בפייתון)
//       if (selectedSkills.length > 0 && score < 0.7) return;

//       // חיפוש טקסט חופשי
//       const searchLower = search.toLowerCase();
//       const matchesSearch = sim.title.toLowerCase().includes(searchLower) || 
//                            sim.dilemma.toLowerCase().includes(searchLower);
//       if (search && !matchesSearch) return;

//       results.push({ ...sim, calculatedScore: score });
//     });

//     return results.sort((a, b) => b.calculatedScore - a.calculatedScore);
//   }, [search, selectedTypes, selectedSkills, selectedRedLines, simData]);

//   return (
//     <div className="app-container" dir="rtl">
//       <header className="site-header">
//         <h1>מערכת ניהול סימולציות חכמה</h1>
//         <button className="add-sim-btn" onClick={() => setShowAddModal(true)}>+ הוסף סימולציה</button>
//       </header>

//       <div className="main-content">
//         <section className="search-center-panel">
//           <input 
//             className="main-search-input"
//             type="text" 
//             placeholder="חיפוש חופשי בשם או בדילמה..." 
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
          
//           <div className="multi-filters-container">
//             <div className="filter-box">
//               <label>סוג סימולציה</label>
//               <Select isMulti options={[{value:'פורמלית', label:'פורמלית'}, {value:'מתפרצת', label:'מתפרצת'}]} 
//                       onChange={setSelectedTypes} placeholder="הכל" />
//             </div>
//             <div className="filter-box">
//               <label>מיומנויות יעד (AND)</label>
//               <Select isMulti options={skillsList.map(s => ({value:s, label:s}))} 
//                       onChange={setSelectedSkills} placeholder="בחירת מיומנויות" />
//             </div>
//             <div className="filter-box">
//               <label>קווים אדומים (להחרגה)</label>
//               <Select isMulti options={redLinesList.map(r => ({value:r, label:r}))} 
//                       onChange={setSelectedRedLines} placeholder="ללא הגבלה" />
//             </div>
//           </div>
//         </section>

//         <main className="simulation-grid">
//           {filteredResults.map(sim => (
//             <div key={sim.id} className="simulation-card-item">
//               <div className="card-top">
//                 <div className="badge-row">
//                   <span className={`type-tag ${sim.type === 'מתפרצת' ? 'burst' : 'formal'}`}>{sim.type}</span>
//                   <span className="match-percent">ציון: {sim.calculatedScore.toFixed(2)}</span>
//                 </div>
//                 <h2 className="card-title">{sim.title}</h2>
//                 <div className="card-subtitle">{sim.week}</div>
//                 <div className="mini-dilemma"><strong>🤔 דילמה:</strong> {sim.dilemma}</div>
//                 <div className="skills-tags-container">
//                   {Object.keys(sim.skills).map(skill => (
//                     <span key={skill} className="skill-tag-pill">{skill}</span>
//                   ))}
//                 </div>
//               </div>
//               <div className="card-footer">
//                 <button className="action-button open-style" onClick={() => setActiveSimulation(sim)}>
//                   לפרטים מלאים ותדריך
//                 </button>
//               </div>
//             </div>
//           ))}
//         </main>
//       </div>

//       {/* --- Popup הוספת סימולציה --- */}
//       {showAddModal && (
//         <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
//           <div className="modal-content add-form-modal" onClick={e => e.stopPropagation()}>
//             <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
//             <h2>יצירת סימולציה חדשה</h2>
//             <form onSubmit={handleAddSimulation} className="add-sim-form">
//               <div className="form-grid">
//                 <input required placeholder="כותרת" onChange={e => setNewSim({...newSim, title: e.target.value})} />
//                 <input required placeholder="שבוע" onChange={e => setNewSim({...newSim, week: e.target.value})} />
//                 <select onChange={e => setNewSim({...newSim, type: e.target.value})}>
//                   <option value="פורמלית">פורמלית</option>
//                   <option value="מתפרצת">מתפרצת</option>
//                 </select>
//                 <input required type="number" placeholder="שחקנים" onChange={e => setNewSim({...newSim, actors_needed: e.target.value})} />
//               </div>
//               <textarea required placeholder="דילמה מרכזית" onChange={e => setNewSim({...newSim, dilemma: e.target.value})} />
//               <textarea required placeholder="תיאור הסימולציה" onChange={e => setNewSim({...newSim, description: e.target.value})} />
//               <textarea required placeholder="תדריך למסמלצים" onChange={e => setNewSim({...newSim, briefing_actors: e.target.value})} />
              
//               <div className="form-section">
//                 <label>מיומנויות (0.5 כברירת מחדל):</label>
//                 <Select isMulti options={skillsList.map(s => ({value:s, label:s}))} 
//                         onChange={(opt) => {
//                           const skillsObj = {};
//                           opt.forEach(o => skillsObj[o.value] = 0.5);
//                           setNewSim({...newSim, skills: skillsObj});
//                         }} />
//               </div>
//               <div className="form-section">
//                 <label>קווים אדומים:</label>
//                 <Select isMulti options={redLinesList.map(r => ({value:r, label:r}))} 
//                         onChange={(opt) => setNewSim({...newSim, red_lines: opt.map(o => o.value)})} />
//               </div>
//               <button type="submit" className="submit-btn">שמור במערכת</button>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* --- Popup פירוט מלא --- */}
//       {activeSimulation && (
//         <div className="modal-overlay" onClick={() => setActiveSimulation(null)}>
//           <div className="modal-content full-detail-modal" onClick={e => e.stopPropagation()}>
//             <button className="close-modal-btn" onClick={() => setActiveSimulation(null)}>×</button>
//             <div className="modal-header-top">
//               <div className="modal-badge-row">
//                 <span className="type-tag formal">{activeSimulation.type}</span>
//                 <span className="actors-count">👥 שחקנים: {activeSimulation.actors_needed}</span>
//               </div>
//               <h2>{activeSimulation.title}</h2>
//               <p className="modal-subtitle">{activeSimulation.week} | {activeSimulation.communication_types}</p>
//             </div>
//             <div className="modal-body">
//               <div className="modal-main-grid">
//                 <section className="modal-main-column">
//                   <div className="info-block">
//                     <h3>🤔 הדילמה</h3>
//                     <p>{activeSimulation.dilemma}</p>
//                   </div>
//                   <div className="info-block highlight-box">
//                     <h3>📝 תיאור המהלך</h3>
//                     <p>{activeSimulation.description}</p>
//                   </div>
//                   <div className="info-block">
//                     <h3>🎭 תדריך למסמלצים</h3>
//                     <p className="pre-wrap">{activeSimulation.briefing_actors}</p>
//                   </div>
//                   <div className="info-block">
//                     <h3>💡 דגשי העברה</h3>
//                     <p>{activeSimulation.delivery_highlights}</p>
//                   </div>
//                 </section>
//                 <aside className="modal-side-column">
//                   <div className="info-block red-lines-box">
//                     <h3>🚫 קווים אדומים</h3>
//                     <ul>{activeSimulation.red_lines.map((rl, i) => <li key={i}>{rl}</li>)}</ul>
//                   </div>
//                   <div className="info-block tools-box">
//                     <h3>🛠️ כלים פרקטיים</h3>
//                     <div className="tool-pills">
//                       {activeSimulation.practical_tools?.map((tool, i) => <span key={i} className="tool-pill">{tool}</span>)}
//                     </div>
//                   </div>
//                   <div className="info-block review-box">
//                     <h3>⭐ סקירה</h3>
//                     <p>{activeSimulation.review}</p>
//                   </div>
//                 </aside>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;




//////////////////////////////////////////////////////
/////////////////// רשימת שבועות קטגורית מעודכנת //////////////////////
///////////////////////////////////////////////////////////


import { useState, useMemo } from 'react';
import Select from 'react-select';
import initialSimulations from './data.json';
import skillsList from './skills.json';
import redLinesList from './red_lines.json';
import './App.css';

function App() {
  const [simData, setSimData] = useState(initialSimulations);
  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedRedLines, setSelectedRedLines] = useState([]);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // רשימת הערכים הקטגוריים לשדה week
  const weekOptions = [
    "קליטה וסף",
    "יסודות צה\"ל",
    "מנהיגות הערכות לשטח",
    "כשירות הפרט וחוסן - שטח",
    "פיקוד וטיפול בפרט",
    "חוסן והערכות להגנש",
    "הגנש",
    "משא פיקוד",
    "זהות",
    "אופרטיבי",
    "מסכמים",
    "טקס סיום"
  ];

  const [newSim, setNewSim] = useState({
    title: '', 
    week: weekOptions[0], // ערך ברירת מחדל מהרשימה
    type: 'פורמלית', 
    actors_needed: 1,
    dilemma: '', 
    description: '', 
    briefing_actors: '',
    communication_types: '', 
    review: '', 
    delivery_highlights: '',
    skills: {}, 
    red_lines: [], 
    discussion_questions: [], 
    practical_tools: []
  });

  const generateId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}-`;
    const monthlySims = simData.filter(s => s.id.startsWith(prefix));
    const lastNum = monthlySims.length > 0 
      ? Math.max(...monthlySims.map(s => parseInt(s.id.split('-')[2]) || 0)) 
      : 0;
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
  };

  const getScore = (querySkills, simSkills) => {
    let score = 0;
    querySkills.forEach(s => {
      if (simSkills && simSkills[s.value]) score += simSkills[s.value];
    });
    return score;
  };

  const handleAddSimulation = (e) => {
    e.preventDefault();
    const simulationToAdd = {
      ...newSim,
      id: generateId(),
      actors_needed: parseInt(newSim.actors_needed)
    };
    setSimData([simulationToAdd, ...simData]);
    setShowAddModal(false);
    setNewSim({
      title: '', week: weekOptions[0], type: 'פורמלית', actors_needed: 1,
      dilemma: '', description: '', briefing_actors: '',
      communication_types: '', review: '', delivery_highlights: '',
      skills: {}, red_lines: [], discussion_questions: [], practical_tools: []
    });
  };

  const filteredResults = useMemo(() => {
    let results = [];
    simData.forEach(sim => {
      if (selectedTypes.length > 0 && !selectedTypes.some(t => t.value === sim.type)) return;
      if (selectedRedLines.length > 0 && selectedRedLines.some(rl => sim.red_lines.includes(rl.value))) return;
      
      const score = getScore(selectedSkills, sim.skills);
      if (selectedSkills.length > 0 && score < 0.7) return;
      
      const matchesSearch = sim.title.toLowerCase().includes(search.toLowerCase()) || 
                           sim.dilemma.toLowerCase().includes(search.toLowerCase());
      if (search && !matchesSearch) return;

      results.push({ ...sim, calculatedScore: score });
    });
    return results.sort((a, b) => b.calculatedScore - a.calculatedScore);
  }, [search, selectedTypes, selectedSkills, selectedRedLines, simData]);

  return (
    <div className="app-container" dir="rtl">
      <header className="site-header">
        <h1>מערכת ניהול סימולציות חכמה</h1>
        <button className="add-sim-btn" onClick={() => setShowAddModal(true)}>+ הוסף סימולציה</button>
      </header>

      <div className="main-content">
        <section className="search-center-panel">
          <input 
            className="main-search-input"
            type="text" 
            placeholder="חיפוש חופשי בשם או בדילמה..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <div className="multi-filters-container">
            <div className="filter-box">
              <label>סוג סימולציה</label>
              <Select isMulti options={[{value:'פורמלית', label:'פורמלית'}, {value:'מתפרצת', label:'מתפרצת'}]} 
                      onChange={setSelectedTypes} placeholder="הכל" />
            </div>
            <div className="filter-box">
              <label>מיומנויות יעד</label>
              <Select isMulti options={skillsList.map(s => ({value:s, label:s}))} 
                      onChange={setSelectedSkills} placeholder="בחירה..." />
            </div>
            <div className="filter-box">
              <label>קווים אדומים</label>
              <Select isMulti options={redLinesList.map(r => ({value:r, label:r}))} 
                      onChange={setSelectedRedLines} placeholder="להחרגה..." />
            </div>
          </div>
        </section>

        <main className="simulation-grid">
          {filteredResults.map(sim => (
            <div key={sim.id} className="simulation-card-item">
              <div className="card-top">
                <div className="badge-row">
                  <span className={`type-tag ${sim.type === 'מתפרצת' ? 'burst' : 'formal'}`}>{sim.type}</span>
                  <span className="match-percent">ציון: {sim.calculatedScore.toFixed(2)}</span>
                </div>
                <h2 className="card-title">{sim.title}</h2>
                <div className="card-subtitle">{sim.week}</div>
                <div className="mini-dilemma"><strong>🤔 דילמה:</strong> {sim.dilemma}</div>
              </div>
              <div className="card-footer">
                <button className="action-button open-style" onClick={() => setActiveSimulation(sim)}>
                  לפרטים מלאים ותדריך
                </button>
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Popup הוספה עם Dropdown לשבוע */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content add-form-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
            <h2>יצירת סימולציה חדשה</h2>
            <form onSubmit={handleAddSimulation} className="add-sim-form">
              <div className="form-grid">
                <input required placeholder="כותרת" onChange={e => setNewSim({...newSim, title: e.target.value})} />
                
                {/* שדה שבוע כ-Select קטגורי */}
                <select required value={newSim.week} onChange={e => setNewSim({...newSim, week: e.target.value})}>
                  {weekOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <select onChange={e => setNewSim({...newSim, type: e.target.value})}>
                  <option value="פורמלית">פורמלית</option>
                  <option value="מתפרצת">מתפרצת</option>
                </select>
                <input required type="number" placeholder="שחקנים" onChange={e => setNewSim({...newSim, actors_needed: e.target.value})} />
              </div>
              
              <textarea required placeholder="דילמה מרכזית" onChange={e => setNewSim({...newSim, dilemma: e.target.value})} />
              <textarea required placeholder="תיאור הסימולציה" onChange={e => setNewSim({...newSim, description: e.target.value})} />
              <textarea required placeholder="תדריך למסמלצים" onChange={e => setNewSim({...newSim, briefing_actors: e.target.value})} />
              
              <div className="form-section">
                <label>מיומנויות:</label>
                <Select isMulti options={skillsList.map(s => ({value:s, label:s}))} 
                        onChange={(opt) => {
                          const skillsObj = {};
                          opt.forEach(o => skillsObj[o.value] = 0.5);
                          setNewSim({...newSim, skills: skillsObj});
                        }} />
              </div>
              <div className="form-section">
                <label>קווים אדומים:</label>
                <Select isMulti options={redLinesList.map(r => ({value:r, label:r}))} 
                        onChange={(opt) => setNewSim({...newSim, red_lines: opt.map(o => o.value)})} />
              </div>
              <button type="submit" className="submit-btn">שמור במערכת</button>
            </form>
          </div>
        </div>
      )}

      {/* Popup פירוט מלא (נשאר ללא שינוי) */}
      {activeSimulation && (
        <div className="modal-overlay" onClick={() => setActiveSimulation(null)}>
          <div className="modal-content full-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setActiveSimulation(null)}>×</button>
            <div className="modal-header-top">
              <div className="modal-badge-row">
                <span className="type-tag formal">{activeSimulation.type}</span>
                <span className="actors-count">👥 שחקנים: {activeSimulation.actors_needed}</span>
              </div>
              <h2>{activeSimulation.title}</h2>
              <p className="modal-subtitle">{activeSimulation.week} | {activeSimulation.communication_types}</p>
            </div>
            <div className="modal-body">
              <div className="modal-main-grid">
                <section className="modal-main-column">
                  <div className="info-block">
                    <h3>🤔 הדילמה</h3>
                    <p>{activeSimulation.dilemma}</p>
                  </div>
                  <div className="info-block highlight-box">
                    <h3>📝 תיאור המהלך</h3>
                    <p>{activeSimulation.description}</p>
                  </div>
                  <div className="info-block">
                    <h3>🎭 תדריך למסמלצים</h3>
                    <p className="pre-wrap">{activeSimulation.briefing_actors}</p>
                  </div>
                </section>
                <aside className="modal-side-column">
                  <div className="info-block red-lines-box">
                    <h3>🚫 קווים אדומים</h3>
                    <ul>{activeSimulation.red_lines.map((rl, i) => <li key={i}>{rl}</li>)}</ul>
                  </div>
                  <div className="info-block review-box">
                    <h3>⭐ סקירה</h3>
                    <p>{activeSimulation.review}</p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;