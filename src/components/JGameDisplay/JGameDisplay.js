import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment-timezone";
import _ from "lodash";
import ProgressBar from "@ramonak/react-progress-bar";

import {
  roomShape,
  roundShape,
  userShape,
  submissionShape,
  categoryShape,
  clueShape,
  jGameDataShape,
} from "prop-shapes";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withPlayers from "state-management/state-connectors/with-players";
import withSubmissions from "state-management/state-connectors/with-submissions";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/JGameDisplay/JGameDisplay.scss";

class SubmissionSummary extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withPlayers */
    players: PropTypes.objectOf(userShape).isRequired,
    /* supplied by withSubmissions */
    submissions: PropTypes.objectOf(submissionShape).isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { currentRoom, players, submissions, jGameData } = this.props;

    const { current_clue_id } = currentRoom;
    const { clues } = jGameData;

    const current_clue_obj = clues[current_clue_id];

    const clueSubmissions = _.pickBy(submissions, { clue_id: current_clue_id });
    const submissionsByPlayer = _.keyBy(clueSubmissions, "user_id");

    const playerSubmissions = _.map(_.values(players), (player) => {
      const playerSubmission = submissionsByPlayer[player.id];
      const submissionText = playerSubmission ? playerSubmission.text : "";
      const fakeGuessSuffix =
        playerSubmission && playerSubmission.is_fake_guess
          ? "(fake guess)"
          : "";
      return (
        <div key={player.id}>
          {player.registered_name}: {submissionText} {fakeGuessSuffix}
        </div>
      );
    });

    let timerPercent = 0;
    if (currentRoom.timer_started_at) {
      const timerTotal_ms =
        currentRoom.timer_will_end_at - currentRoom.timer_started_at;
      const timerTotal_sec = timerTotal_ms / 1000;
      timerPercent = (currentRoom.timer_seconds_elapsed / timerTotal_sec) * 100;
    }

    return (
      <div className="submission-summary">
        <div className="instruction-text">
          Grade your response on your phone
        </div>
        <div className="clue-text">{current_clue_obj.clue}</div>
        <div className="answer-text">
          Correct answer: <b>{current_clue_obj.answer}</b>
        </div>
        <ProgressBar
          className="grading-progress"
          completed={timerPercent}
          customLabel=" "
          bgColor="#ddaa55"
          height="80px"
          width="700px"
        />
        <div className="player-submissions">{playerSubmissions}</div>
      </div>
    );
  }
}

SubmissionSummary = withCurrentRoom(SubmissionSummary);
SubmissionSummary = withPlayers(SubmissionSummary);
SubmissionSummary = withSubmissions(SubmissionSummary);
SubmissionSummary = withJGameData(SubmissionSummary);

class Clue extends Component {
  static propTypes = {
    clue: clueShape.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { clue, currentRoom, jGameData } = this.props;

    const { id: this_clue_id, category_id, clue: clueText, money } = clue;
    const { current_clue_id, current_clue_stage } = currentRoom;
    const { categories, clueOrderIdxs } = jGameData;

    const thisClueIdx = clueOrderIdxs[this_clue_id];
    const currentClueIdx = !_.isNull(current_clue_id)
      ? clueOrderIdxs[current_clue_id]
      : -1;

    const showMoney = thisClueIdx > currentClueIdx;
    const showThisClueText =
      this_clue_id === current_clue_id && current_clue_stage === "answering";

    const category = categories[category_id];

    let timerPercent = 0;
    if (currentRoom.timer_started_at) {
      const timerTotal_ms =
        currentRoom.timer_will_end_at - currentRoom.timer_started_at;
      const timerTotal_sec = timerTotal_ms / 1000;
      timerPercent = (currentRoom.timer_seconds_elapsed / timerTotal_sec) * 100;
    }

    return (
      <div className="clue">
        {showMoney && <div className="money-text">${money}</div>}
        {showThisClueText && (
          <div className="fullscreen-clue">
            <div className="fullscreen-clue-category">{category.text}</div>
            <div className="fullscreen-clue-money">${money}</div>
            <div classname="fullscreen-clue-text">{clueText}</div>
            <ProgressBar
              className="clue-progress"
              completed={timerPercent}
              customLabel=" "
              bgColor="#ddaa55"
              height="80px"
              width="700px"
            />
          </div>
        )}
      </div>
    );
  }
}

Clue = withCurrentRoom(Clue);
Clue = withJGameData(Clue);

class Category extends Component {
  static propTypes = {
    category: categoryShape.isRequired,
    clues: PropTypes.arrayOf(clueShape).isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { category, clues, currentRoom, jGameData } = this.props;

    const { text } = category;
    const { current_clue_id } = currentRoom;
    const { clueOrderIdxs } = jGameData;
    const orderedClues = _.orderBy(clues, "money");

    const lastClueIdxInThisCategory = clueOrderIdxs[_.last(orderedClues).id];
    const currentClueIdx = !_.isNull(current_clue_id)
      ? clueOrderIdxs[current_clue_id]
      : -1;

    const cells = _.map(orderedClues, (clue) => (
      <Clue clue={clue} key={clue.id} />
    ));

    const showCategoryTitle = lastClueIdxInThisCategory > currentClueIdx;

    return (
      <div className="category">
        <div className="category-title">{showCategoryTitle && text}</div>
        <div className="category-cells">{cells}</div>
      </div>
    );
  }
}

Category = withCurrentRoom(Category);
Category = withJGameData(Category);

class JRound extends Component {
  static propTypes = {
    roundType: roundShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { roundType, jGameData } = this.props;

    const { categories, clues } = jGameData;

    const cluesByCategory = _.groupBy(clues, "category_id");

    const categoriesForThisRound = _.pickBy(categories, {
      round_type: roundType,
    });

    const columns = _(categoriesForThisRound)
      .values()
      .orderBy("col_order_index")
      .map((category) => (
        <Category
          category={category}
          clues={cluesByCategory[category.id]}
          key={category.id}
        />
      ))
      .value();

    return (
      <div className="j-round">
        <div className="j-round-columns">{columns}</div>
      </div>
    );
  }
}

JRound = withJGameData(JRound);

class JGameDisplay extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { currentRoom, jGameData } = this.props;

    const { sourceGame } = jGameData;

    const tapedDate = moment
      .tz(sourceGame.taped_date, "UTC")
      .format("YYYY-MM-DD");

    const { current_clue_id, current_clue_stage } = currentRoom;
    const currentClue = jGameData.clues[current_clue_id];
    let currentRound = "single";
    if (currentClue) {
      const currentCategory = jGameData.categories[currentClue.category_id];
      currentRound = currentCategory.round_type;
    }

    const showSubmissionSummary = current_clue_stage === "grading";

    return (
      <div className="j-game-display">
        <h1 hidden>{tapedDate}</h1>
        {showSubmissionSummary && <SubmissionSummary />}
        <JRound roundType={currentRound} />
      </div>
    );
  }
}

JGameDisplay = withCurrentRoom(JGameDisplay);
JGameDisplay = withJGameData(JGameDisplay);

export default JGameDisplay;
