import React, { Component } from "react";

import _ from "lodash";

import "./App.scss";

class App extends Component {
  state = {
    questions: [],
  };

  /* Lifecycle methods. */

  render() {
    const { questions } = this.state;
    return (
      <div className="App">
        <table>
          <tbody>
            {_.map(questions, (q, idx) => (
              <tr key={idx}>
                <td>{q}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  componentDidMount() {
    fetch("/fetch-questions")
      .then((res) => res.json())
      .then((res) => {
        this.setState({ questions: res.questions });
      });
  }

  /* Helpers. */
}

export default App;
