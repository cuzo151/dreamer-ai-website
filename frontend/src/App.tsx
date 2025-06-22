import React from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import Capabilities from './components/Capabilities/Capabilities';
import Interactive from './components/Interactive/Interactive';
import Contact from './components/Contact/Contact';
import AIAssistant from './components/AIAssistant/AIAssistant';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <About />
        <Capabilities />
        <Interactive />
        <Contact />
      </main>
      <AIAssistant />
    </div>
  );
}

export default App;