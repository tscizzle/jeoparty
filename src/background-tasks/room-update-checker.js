import api from "api";
import store from "state-management/create-store";
import {
  fetchCurrentRoom,
  fetchPlayers,
  fetchSubmissions,
} from "state-management/actions";

const createRoomUpdateChecker = () => {
  /* Return an object with a `loop` method. Calling the `loop` method starts a loop
    where we periodically fetch the current Room, check if there has been an update
    since we last fetched it, and if there has then fetch other data associated with the
    room (players, submissions, etc.).
  */

  const ROOM_UPDATE_CHECK_INTERVAL_sec = 1;

  const loop = () => {
    /* This function is a single iteration in the loop described above. This function
      schedules itself to run again soon (thus continuing the loop).
    */

    // Fetch the current Room.
    api.getCurrentRoom().then(({ room: fetchedRoom }) => {
      if (!fetchedRoom) {
        return;
      }

      // Check the fetched Room vs the Room we already have in state to see if there has
      // been an update on the server side since we last fetched.
      const { currentRoom } = store.getState();
      if (fetchedRoom.last_updated_at !== currentRoom.last_updated_at) {
        // Since there has been an update, fetch the data associated with the Room.
        store.dispatch([
          fetchCurrentRoom(),
          fetchPlayers(),
          fetchSubmissions(),
        ]);
      }
    });

    setTimeout(loop, ROOM_UPDATE_CHECK_INTERVAL_sec * 1000);
  };

  return {
    loop,
  };
};

const RoomUpdateChecker = createRoomUpdateChecker();

export default RoomUpdateChecker;
