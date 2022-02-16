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

import NiceInput from "components/NiceInput/NiceInput";
import NiceButton from "components/NiceButton/NiceButton";

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
        <NiceInput
          placeholder="What is …"
          value={typedResponse}
          onChange={this.onChangeTypedResponse}
        />
        <label className="fake-guess">
          <NiceInput
            type="checkbox"
            checked={isFakeGuess}
            onChange={this.onChangeIsFakeGuess}
          />
          Fake guess
        </label>
        <div className="submission-buttons">
          <NiceButton isPrimary={true} isBig={true} onClick={this.clickSubmit}>
            Submit
          </NiceButton>
          <NiceButton isPrimary={true} isBig={true} onClick={this.clickPass}>
            Pass
          </NiceButton>
        </div>
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
    const displayText = submission.text
      ? `${submission.text}${fakeGuessText}`
      : "";

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
    const fakeGuessSuffix =
    submission && submission.is_fake_guess
          ? "(fake guess)"
          : "";
    const { clues } = jGameData;
    const currentClue = clues[current_clue_id];
    const { answer } = currentClue;

    return (
      <div className="grading-form">
        <div className="answer-comparison">
          <div className="correct-answer">Correct response: {answer}</div>
          <div className="player-answer">Your response: {text} {fakeGuessSuffix}</div>
        </div>
        <div className="grading-buttons">
          <NiceButton onClick={() => this.giveGrade({ gradedAs: "correct" })}>
            ✅ Correct
          </NiceButton>
          <NiceButton onClick={() => this.giveGrade({ gradedAs: "incorrect" })}>
            ❌ Incorrect
          </NiceButton>
          <NiceButton onClick={() => this.giveGrade({ gradedAs: "blank" })}>
            Left it blank
          </NiceButton>
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
    const money = currentClue.money || 0;

    let moneyChangeStr;
    let moneyChangeClassname;
    if (graded_as === "correct") {
      moneyChangeStr = `+${money}`;
      moneyChangeClassname = "points-change-positive";
    } else if (graded_as === "incorrect") {
      moneyChangeStr = `${-money}`;
      moneyChangeClassname = "points-change-negative";
    } else {
      moneyChangeStr = `+0`;
      moneyChangeClassname = "points-change-neutral";
    }
    const shadowClause = is_fake_guess ? " (shadow)" : "";
    const displayText = `${moneyChangeStr}${shadowClause}`;

    const gradedAnswerClassnames = classNames(
      "graded-answer",
      moneyChangeClassname
    );

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
    const { has_game_been_started, current_clue_id, current_clue_stage } =
      currentRoom;

    let currentSubmission;
    if (submissions) {
      currentSubmission = _(submissions)
        .values()
        .find({ clue_id: current_clue_id, user_id });
    }
    const pregameMessage = (
      <p className="pregame-message">
        Sit back and relax, Mother John! (and friends)
        <br />
        <br />
        🎂
      </p>
    );

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
    const showPregameMessage = !has_game_been_started;

    return (
      <div className="player-view">
        {showAnsweringForm && <AnsweringForm />}
        {showSubmittedAnswer && (
          <SubmittedAnswer submission={currentSubmission} />
        )}
        {showGradingForm && <GradingForm submission={currentSubmission} />}
        {showGradedAnswer && <GradedAnswer submission={currentSubmission} />}
        {showPregameMessage && pregameMessage}
        <div className="player-view-footer">
          <NiceButton onClick={this.leaveRoom}>Quit</NiceButton>
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
