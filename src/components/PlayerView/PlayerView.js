import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import _ from "lodash";

import api from "api";

import {
  userShape,
  roomShape,
  submissionShape,
  jGameDataShape,
} from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withSubmissions from "state-management/state-connectors/with-submissions";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/PlayerView/PlayerView.scss";

class AnsweringForm extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withSubmissions */
    fetchSubmissions: PropTypes.func.isRequired,
  };

  state = {
    typedResponse: "",
    isFakeGuess: false,
  };

  /* Lifecycle methods. */

  render() {
    const { typedResponse, isFakeGuess } = this.state;

    return (
      <div className="answering-form">
        <input
          placeholder="What is …"
          value={typedResponse}
          onChange={this.onChangeTypedResponse}
        />
        <label>
          <input
            type="checkbox"
            checked={isFakeGuess}
            onChange={this.onChangeIsFakeGuess}
          />
          Fake guess
        </label>
        <button onClick={this.clickSubmit}>Submit</button>
        <button onClick={this.clickPass}>Pass</button>
      </div>
    );
  }

  /* Helpers. */

  onChangeTypedResponse = (evt) => {
    this.setState({ typedResponse: evt.target.value });
  };

  onChangeIsFakeGuess = (evt) => {
    const { isFakeGuess } = this.state;
    this.setState({ isFakeGuess: !isFakeGuess });
  };

  clickSubmit = () => {
    const { currentRoom, fetchSubmissions } = this.props;
    const { typedResponse, isFakeGuess } = this.state;

    const { current_clue_id } = currentRoom;

    api
      .submitResponse({
        clueId: current_clue_id,
        submissionText: typedResponse,
        isFakeGuess,
      })
      .then(() => {
        fetchSubmissions();
      });
  };

  clickPass = () => {
    const { currentRoom, fetchSubmissions } = this.props;

    const { current_clue_id } = currentRoom;

    api.submitResponse({ clueId: current_clue_id }).then(() => {
      fetchSubmissions();
    });
  };
}

AnsweringForm = withCurrentRoom(AnsweringForm);
AnsweringForm = withSubmissions(AnsweringForm);

class SubmittedAnswer extends Component {
  static propTypes = {
    submission: submissionShape.isRequired,
  };

  render() {
    const { submission } = this.props;

    const { is_fake_guess } = submission;

    const fakeGuessText = is_fake_guess ? " (fake guess)" : "";
    const displayText = `${submission.text}${fakeGuessText}`;

    return <div className="submitted-answer">{displayText}</div>;
  }
}

class GradingForm extends Component {
  static propTypes = {
    submission: submissionShape,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withSubmissions */
    fetchSubmissions: PropTypes.func.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { submission, currentRoom, jGameData } = this.props;

    const { current_clue_id } = currentRoom;

    const text = submission ? submission.text : "(None)";
    const { clues } = jGameData;
    const currentClue = clues[current_clue_id];
    const { answer } = currentClue;

    return (
      <div className="grading-form">
        <div className="answer-comparison">
          <div className="correct-answer">Correct response: {answer}</div>
          <div className="player-answer">Your response: {text}</div>
        </div>
        <div className="grading-buttons">
          <button onClick={() => this.giveGrade({ gradedAs: "correct" })}>
            Correct
          </button>
          <button onClick={() => this.giveGrade({ gradedAs: "incorrect" })}>
            Incorrect
          </button>
          <button onClick={() => this.giveGrade({ gradedAs: "blank" })}>
            Left it blank
          </button>
        </div>
      </div>
    );
  }

  /* Helpers. */

  giveGrade = ({ gradedAs }) => {
    const { currentRoom, fetchSubmissions } = this.props;

    const { current_clue_id } = currentRoom;

    api.gradeResponse({ clueId: current_clue_id, gradedAs }).then(() => {
      fetchSubmissions();
    });
  };
}

GradingForm = withCurrentRoom(GradingForm);
GradingForm = withSubmissions(GradingForm);
GradingForm = withJGameData(GradingForm);

class GradedAnswer extends Component {
  static propTypes = {
    submission: submissionShape,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { submission, jGameData } = this.props;

    const { graded_as, is_fake_guess } = submission;
    const { clues } = jGameData;
    const currentClue = clues[submission.clue_id];
    let { money } = currentClue;
    money = money || 0;

    let deltaMoney;
    let deltaSymbol;
    let deltaClassname;
    if (graded_as === "correct") {
      deltaMoney = money;
      deltaSymbol = "+";
      deltaClassname = "points-delta-positive";
    } else if (graded_as === "incorrect") {
      deltaMoney = -money;
      deltaSymbol = "-";
      deltaClassname = "points-delta-negative";
    } else {
      deltaMoney = 0;
      deltaSymbol = "+";
      deltaClassname = "points-delta-neutral";
    }

    const shadowClause = is_fake_guess ? " (shadow)" : "";

    const displayText = `${deltaSymbol}${deltaMoney}${shadowClause}`;

    const gradedAnswerClassnames = classNames("graded-answer", deltaClassname);

    return <div className={gradedAnswerClassnames}>{displayText}</div>;
  }
}

GradedAnswer = withJGameData(GradedAnswer);

class PlayerView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape.isRequired,
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
    /* supplied by withSubmissions */
    submissions: PropTypes.objectOf(submissionShape),
  };

  /* Lifecycle methods. */

  render() {
    const { currentUser, currentRoom, submissions } = this.props;

    const { id: user_id } = currentUser;
    const { current_clue_id, current_clue_stage } = currentRoom;

    let currentSubmission;
    if (submissions) {
      currentSubmission = _(submissions)
        .values()
        .find({ clue_id: current_clue_id, user_id });
    }
    console.log(currentSubmission);

    const showAnsweringForm = Boolean(
      current_clue_id &&
        current_clue_stage === "answering" &&
        !currentSubmission
    );
    const showSubmittedAnswer = Boolean(
      current_clue_id && current_clue_stage === "answering" && currentSubmission
    );
    const showGradingForm = Boolean(
      current_clue_id &&
        current_clue_stage === "grading" &&
        (!currentSubmission || !currentSubmission.graded_as)
    );
    const showGradedAnswer = Boolean(
      current_clue_id &&
        current_clue_stage === "grading" &&
        currentSubmission &&
        currentSubmission.graded_as
    );

    return (
      <div className="player-view">
        {showAnsweringForm && <AnsweringForm />}
        {showSubmittedAnswer && (
          <SubmittedAnswer submission={currentSubmission} />
        )}
        {showGradingForm && <GradingForm submission={currentSubmission} />}
        {showGradedAnswer && <GradedAnswer submission={currentSubmission} />}
        <div className="player-view-footer">
          <button onClick={this.leaveRoom}>Leave Room</button>
        </div>
      </div>
    );
  }

  /* Helpers. */

  leaveRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;

    api.leaveRoom().then(() => {
      fetchCurrentUser();
      fetchCurrentRoom();
    });
  };
}

PlayerView = withCurrentUser(PlayerView);
PlayerView = withCurrentRoom(PlayerView);
PlayerView = withSubmissions(PlayerView);

export default PlayerView;
