import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

import _ from "lodash";

function App() {
  const [questions, setQuestions] = useState(0);

  useEffect(() => {
    fetch("/fetch-questions")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>The first question is {_.first(questions)}.</p>
      </header>
    </div>
  );
}

export default App;
