import React, { useState } from 'react';

const CreatePoll = ({ creatorEmail }) => {
  const [poll, setPoll] = useState({
    title: '',
    deadline: '',
    targetType: 'class', // battalion, platoon, or class
    targetValue: '',
    questions: [''],
    creator: creatorEmail
  });

  const addQuestion = () => setPoll({...poll, questions: [...poll.questions, '']});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/create-poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poll)
    });
    if (response.ok) alert("Poll published!");
  };

  return (
    <form onSubmit={handleSubmit} className="poll-form">
      <h3>Assign New Poll</h3>
      <input type="text" placeholder="Poll Title" onChange={e => setPoll({...poll, title: e.target.value})} />
      <input type="date" onChange={e => setPoll({...poll, deadline: e.target.value})} />
      
      <select onChange={e => setPoll({...poll, targetType: e.target.value})}>
        <option value="class">Target: Specific Class</option>
        <option value="platoon">Target: Whole Platoon</option>
      </select>

      {poll.questions.map((q, i) => (
        <input 
          key={i} 
          placeholder={`Question ${i+1}`} 
          onChange={e => {
            let newQs = [...poll.questions];
            newQs[i] = e.target.value;
            setPoll({...poll, questions: newQs});
          }} 
        />
      ))}
      <button type="button" onClick={addQuestion}>+ Add Question</button>
      <button type="submit">Publish Poll</button>
    </form>
  );
};

export default CreatePoll;