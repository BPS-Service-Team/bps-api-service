import { useState } from 'react';
import io from 'socket.io-client';
import feathers from '@feathersjs/client';
import { store } from '../Redux/store';
import { getWebSocketUrl, getWebSocketPath } from '../Utils/url';

const token = () => store.getState().auth.token;

export const useAgfWebSocket = () => {
  const [socketData, setSocketData] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [socket, setSocket] = useState({});
  const [socketApp, setSocketApp] = useState({});

  function initSocket() {
    const socket_ = io(`${getWebSocketUrl()}`, {
      path: `${getWebSocketPath()}`,
    });
    const socketApp_ = feathers();
    socketApp_.configure(feathers.socketio(socket_));
    socketApp_.configure(feathers.authentication());
    setSocket(socket_);
    setSocketApp(socketApp_);
    setSocketApp(socketApp_);
  }

  function socketConnect() {
    let currentUser_;
    if (Object.entries(socket).length === 0) {
      return;
    }
    socket.on('connect', () => {
      if (currentUser.accessToken === undefined) {
        socket.emit(
          'create',
          'auth',
          {
            strategy: 'jwt',
            accessToken: `${token()}`,
          },
          function (error, newAuthResult) {
            if (!error) {
              console.log('Connected with the ID: ' + socket.id);
              currentUser_ = newAuthResult;
              setCurrentUser(currentUser_);
            }
          }
        );
      }
    });
    socketApp.service('agfs').on('patched', onUpdateNotification);
  }

  function onUpdateNotification(data) {
    setSocketData(data);
  }

  return [{ ...socketData }, initSocket, socketConnect];
};
