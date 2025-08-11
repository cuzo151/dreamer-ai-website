import React from 'react';

interface DemoResultProps {
  result: string;
  type: string;
}

const DemoResult: React.FC<DemoResultProps> = ({ result }) => {
  return (
    <div className="demo-result">
      <h4>Analysis Result</h4>
      <pre>{result}</pre>
    </div>
  );
};

export default DemoResult;