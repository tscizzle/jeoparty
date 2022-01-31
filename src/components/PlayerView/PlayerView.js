import React, { Component } from "react";
import PropTypes from "prop-types";

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
    submissions: PropTypes.objectOf(submissionShape).isRequired,
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

    const { id: room_id, current_clue_id } = currentRoom;

    api
      .submitResponse({
        clueId: current_clue_id,
        submissionText: typedResponse,
        isFakeGuess,
      })
      .then(() => {
        fetchSubmissions({ roomId: room_id });
      });
  };

  clickPass = () => {
    const { currentRoom, fetchSubmissions } = this.props;

    const { id: room_id, current_clue_id } = currentRoom;

    api
      .submitResponse({
        clueId: current_clue_id,
        submissionText: "",
      })
      .then(() => {
        fetchSubmissions({ roomId: room_id });
      });
  };
}

AnsweringForm = withCurrentRoom(AnsweringForm);
AnsweringForm = withSubmissions(AnsweringForm);

class PlayerView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape.isRequired,
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { currentRoom } = this.props;

    const { current_clue_id, current_clue_stage } = currentRoom;

    const showAnsweringForm = Boolean(
      current_clue_id && current_clue_stage === "answering"
    );

    return (
      <div className="player-view">
        {showAnsweringForm && <AnsweringForm />}
        <button onClick={this.leaveRoom}>Leave Room</button>
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

export default PlayerView;
