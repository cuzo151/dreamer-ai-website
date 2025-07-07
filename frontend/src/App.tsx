import React from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import VideoShowcase from './components/VideoShowcase/VideoShowcase';
import Capabilities from './components/Capabilities/Capabilities';
import AITools from './components/AITools/AITools';
import Interactive from './components/Interactive/Interactive';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import AIAssistant from './components/AIAssistant/AIAssistant';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <Header />
      <main>
        <Hero />
        <VideoShowcase />
        <About />
        <AITools />
        <Capabilities />
        <Interactive />
        <Contact />
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default App;