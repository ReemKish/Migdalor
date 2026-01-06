import { createRoot } from 'react-dom/client';
import App from './components/Migdalor/App/App.jsx';
import { BrowserRouter } from "react-router-dom";

const root = createRoot(document.getElementById('root'));
root.render(<BrowserRouter>
    <App />
</BrowserRouter>);