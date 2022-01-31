import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import api from "api";

import { userShape, roomShape, submissionShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withSubmissions from "state-management/state-connectors/with-submissions";

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

    const fakeGuessText = submission.is_fake_guess ? " (fake guess)" : "";
    const displayText = `${submission.text}${fakeGuessText}`;

    return <div className="submitted-answer">{displayText}</div>;
  }
}

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

    const showAnsweringForm = Boolean(
      current_clue_id &&
        current_clue_stage === "answering" &&
        !currentSubmission
    );
    const showSubmittedAnswer = Boolean(
      current_clue_id && current_clue_stage === "answering" && currentSubmission
    );

    return (
      <div className="player-view">
        {showAnsweringForm && <AnsweringForm />}
        {showSubmittedAnswer && (
          <SubmittedAnswer submission={currentSubmission} />
        )}
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
