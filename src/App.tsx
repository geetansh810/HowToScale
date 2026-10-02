import { Routes, Route } from 'react-router';
import { Chrome } from './components/Chrome';
import { Home } from './pages/Home';
import { Journey } from './pages/Journey';
import { StatePage } from './pages/StatePage';
import { KnowledgeIndex } from './pages/KnowledgeIndex';
import { NodePage } from './pages/NodePage';
import { GraphPage } from './pages/GraphPage';
import { WalkthroughPage } from './pages/WalkthroughPage';
import { JournalPage } from './pages/JournalPage';
import { validateContent } from './lib/validate';

// The knowledge base is treated like software: validate the graph at boot.
const violations = validateContent();
if (violations.length) {
  console.error('[content validation]', violations);
} else {
  console.info('[content validation] knowledge graph sound ✓');
}

export default function App() {
  return (
    <Routes>
      <Route element={<Chrome />}>
        <Route path="/" element={<Home />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/journey/:stateId" element={<StatePage />} />
        <Route path="/knowledge" element={<KnowledgeIndex />} />
        <Route path="/knowledge/:nodeId" element={<NodePage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/walkthrough" element={<WalkthroughPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
