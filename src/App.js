import React, { Component } from "react";
import Cookies from "js-cookie";
import _ from "lodash";

import api from "api";
import { randomID } from "misc-helpers";

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
        <button onClick={this.initGame}>Init Game</button>
      </div>
    );
  }

  componentDidMount() {
    const clientIdCookieKey = "jeopartyClientId";
    if (!Cookies.get(clientIdCookieKey)) {
      Cookies.set(clientIdCookieKey, randomID());
    }

    api.getQuestions().then(({ questions }) => {
      this.setState({ questions });
    });
  }

  /* Helpers. */

  initGame = () => {
    api.initGame();
  };
}

export default App;
