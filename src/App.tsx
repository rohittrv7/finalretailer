import { createRoot } from 'react-dom/client';
import MainApp from './MainApp';
import './index.css';

const root = createRoot(document.getElementById("root"));
root.render(<MainApp />);
