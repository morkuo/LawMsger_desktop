import { HOST, addClass, setMessage, scrollToBottom, setMsg, FILE_HOST } from './helper.js';
import { drawContactDivs, drawSidebar, drawGroups, drawDeleteGroupButton } from './sidebar.js';

let jwtToken = localStorage.getItem('token');

// eslint-disable-next-line no-undef
const socket = io(HOST, { query: { jwtToken }, transports: ['websocket'] });

socket.on('connect', async () => {
  drawSidebar();
});

socket.on('connect_error', err => {
  console.log(err.message);
});

socket.on('msg', (msg, senderSocketId, filesInfo) => {
  //check if current user is at chat window
  const messages = document.getElementById('messages');
  if (!messages) return;

  //if message is not for current window contact, do nothing
  if (senderSocketId !== messages.dataset.socketId) return;

  const userId = localStorage.getItem('id');

  //append message from the sender to chat window
  setMessage(msg, Date.now(), userId, filesInfo, null, null, 'append');

  scrollToBottom();
});

socket.on('suggestion', suggestions => {
  const suggestionsList = document.getElementById('suggestions');

  suggestionsList.innerHTML = '';
  suggestionsList.classList.remove('on');

  if (suggestions.length === 0) return;

  for (let suggestion of suggestions) {
    const li = document.createElement('li');

    if (suggestion) li.innerText = suggestion;
    else li.innerText = suggestion;

    suggestionsList.appendChild(li);
  }

  suggestionsList.classList.add('on');
});

socket.on('clauses', suggestions => {
  const suggestionsList = document.getElementById('suggestions');

  suggestionsList.innerHTML = '';
  suggestionsList.classList.remove('on');

  if (suggestions.length === 0) return;

  const table = document.createElement('table');
  suggestionsList.appendChild(table);

  for (let suggestion of suggestions) {
    const clauseTitle = suggestion.title;
    const clauseNumber = suggestion.number;
    const clauseBody = suggestion.body;

    const row = document.createElement('tr');
    const title = document.createElement('td');
    const number = document.createElement('td');
    const body = document.createElement('td');

    row.appendChild(title);
    row.appendChild(number);
    row.appendChild(body);

    if (clauseBody.length > 40) {
      title.innerText = clauseTitle;
      number.innerText = clauseNumber;
      body.innerText = `${clauseBody.slice(0, 40)}...`;

      row.setAttribute('data-body', clauseBody);
      row.setAttribute('data-title', clauseTitle);
      row.setAttribute('data-number', clauseNumber);
    } else {
      title.innerText = clauseTitle;
      number.innerText = clauseNumber;
      body.innerText = clauseBody;

      row.setAttribute('data-body', clauseBody);
      row.setAttribute('data-title', clauseTitle);
      row.setAttribute('data-number', clauseNumber);
    }

    table.appendChild(row);
  }

  suggestionsList.classList.add('on');
});

socket.on('matchedClauses', suggestions => {
  const suggestionsList = document.getElementById('suggestions');

  suggestionsList.innerHTML = '';

  if (suggestions.length === 0) return;

  const table = document.createElement('table');
  suggestionsList.appendChild(table);

  for (let suggestion of suggestions) {
    const clauseTitle = suggestion.title;
    const clauseBody = suggestion.body;
    const clauseNumber = suggestion.number;

    const row = document.createElement('tr');
    const title = document.createElement('td');
    const number = document.createElement('td');
    const body = document.createElement('td');

    row.appendChild(title);
    row.appendChild(number);
    row.appendChild(body);

    if (clauseBody.length > 40) {
      title.innerText = clauseTitle;
      number.innerText = clauseNumber;
      body.innerText = `${clauseBody.slice(0, 40)}...`;

      row.setAttribute('data-body', clauseBody);
      row.setAttribute('data-title', clauseTitle);
      row.setAttribute('data-number', clauseNumber);
    } else {
      title.innerText = clauseTitle;
      number.innerText = clauseNumber;
      body.innerText = `${clauseBody}`;

      row.setAttribute('data-body', clauseBody);
      row.setAttribute('data-title', clauseTitle);
      row.setAttribute('data-number', clauseNumber);
    }

    table.appendChild(row);
  }

  suggestionsList.classList.add('on');
});

socket.on(
  'checkChatWindow',
  (
    msg,
    fromSocketId,
    fromUserId,
    fromUserName,
    targetSocketId,
    targetUserId,
    targetUserName,
    filesInfo
  ) => {
    //check if current user is at targetUser's chat window
    const messages = document.getElementById('messages');
    let messagesUserId = null;
    if (messages) messagesUserId = messages.dataset.id;

    if (!messages || messagesUserId !== fromUserId) {
      socket.emit(
        'checkChatWindow',
        msg,
        fromSocketId,
        fromUserId,
        fromUserName,
        targetSocketId,
        targetUserId,
        targetUserName,
        filesInfo,
        false
      );

      const contactDivs = document.querySelectorAll(`[data-id="${fromUserId}"]`);

      contactDivs.forEach(div => {
        const unreadCountDiv = div.querySelector('.contact-unread-count');
        unreadCountDiv.innerText++;
        unreadCountDiv.classList.add('on');
      });

      return;
    }

    socket.emit(
      'checkChatWindow',
      msg,
      fromSocketId,
      fromUserId,
      fromUserName,
      targetSocketId,
      targetUserId,
      targetUserName,
      filesInfo,
      true
    );

    //append message from the sender to chat window
    setMessage(msg, Date.now(), fromUserId, filesInfo, fromUserName, 'read', 'append');

    scrollToBottom();
  }
);

socket.on(
  'checkGroupChatWindow',
  (msg, fromSocketId, fromUserId, fromUserName, groupId, messageId, filesInfo) => {
    //check if current user is at group chat window
    const messages = document.getElementById('messages');

    if (!messages || messages.dataset.socketId !== groupId) {
      // Unread
      const groupDiv = document.querySelector(`[data-socket-id="${groupId}"]`);

      const unreadCountDiv = groupDiv.querySelector('.group-unread-count');
      unreadCountDiv.innerText++;
      unreadCountDiv.classList.add('on');

      return;
    }

    const userId = localStorage.getItem('id');

    //user is at window
    socket.emit('checkGroupChatWindow', userId, messageId);

    //append message from the sender to chat window
    setMessage(msg, Date.now(), fromUserId, filesInfo, fromUserName, 'read', 'append');

    scrollToBottom();
  }
);

socket.on('drawGroupDiv', (groupId, groupName, hostId, participants) => {
  const newGroup = [
    {
      id: groupId,
      name: groupName,
      host: hostId,
      unread: 0,
    },
  ];

  drawGroups(newGroup);

  const newGroupDiv = document.querySelector(`[data-socket-id="${groupId}"]`);
  let titleAttribute = '';
  for (let participant of participants) {
    titleAttribute += `${participant.name} - ${participant.email}\n`;
  }

  newGroupDiv.setAttribute('title', titleAttribute);

  socket.emit('join', newGroup);

  drawDeleteGroupButton(newGroup);
});

socket.on('deleteGroupDiv', groupId => {
  const groupDiv = document.querySelector(`[data-socket-id="${groupId}"]`);
  const groupNameDiv = groupDiv.querySelector('.group-name');
  const groupName = groupNameDiv.innerText;

  groupDiv.remove();

  const messages = document.getElementById('messages');
  if (!messages || messages.dataset.socketId !== groupId) return;

  const pane = document.getElementById('pane');
  const welcome = document.createElement('h1');

  welcome.innerText = 'Welcome Aboard';

  pane.innerHTML = '';
  pane.appendChild(welcome);

  setMsg(`Group "${groupName}" was deleted by the host`);
});

socket.on('createStarContact', response => {
  if (response.error) return;

  const {
    data: { targetContactUserId },
  } = response;

  //append new star to star block
  const createdDiv = document.querySelector(`#all div.contact[data-id="${targetContactUserId}"]`);
  const contactPictureDiv = createdDiv.querySelector('.contact-picture');
  const contactNameDiv = createdDiv.querySelector('.contact-info div:first-child');
  const contactEmailDiv = createdDiv.querySelector('.contact-info div:last-child');
  const contactUnreadDiv = createdDiv.querySelector('.contact-unread-count');

  const contacts = [
    {
      id: targetContactUserId,
      name: contactNameDiv.innerText,
      email: contactEmailDiv.innerText,
      picture: contactPictureDiv.innerText,
      socket_id: createdDiv.dataset.socketId,
      unread: contactUnreadDiv.innerText,
    },
  ];

  drawContactDivs(contacts, 'star');

  //add delete star button
  const contactDiv = document.querySelector(`#star div.contact[data-id="${targetContactUserId}"]`);
  const deleteStarButton = document.createElement('span');

  deleteStarButton.setAttribute('class', 'contact-delete-star-button');
  deleteStarButton.classList.add('material-symbols-outlined');
  contactDiv.appendChild(deleteStarButton);

  deleteStarButton.innerText = 'delete';

  deleteStarButton.addEventListener('click', e => {
    socket.emit('deleteStarContact', targetContactUserId);
    contactDiv.remove();
  });

  //set to the same color as div in all contacs block
  contactDiv.style.backgroundColor = createdDiv.style.backgroundColor;
});

socket.on('deleteStarContact', response => {
  if (response.error) return;

  const { data: targetContactUserId } = response;

  //append new star to star block
  const contactDiv = document.querySelector(`#all div.contact[data-id="${targetContactUserId}"]`);
  const addStarButton = document.createElement('span');

  addStarButton.setAttribute('class', 'contact-add-star-button');
  addStarButton.classList.add('material-symbols-outlined');
  contactDiv.appendChild(addStarButton);

  addStarButton.innerText = 'star';

  addStarButton.addEventListener('click', e => {
    socket.emit('createStarContact', targetContactUserId);
    addStarButton.remove();
  });
});

socket.on('onlineStatus', (userId, socketId, status) => {
  const contactDivs = document.querySelectorAll(`.contact[data-id="${userId}"]`);

  contactDivs.forEach(div => {
    const statusDiv = div.querySelector('.contact-status');

    if (status === 'on') {
      statusDiv.classList.add('on');
      div.dataset.socketId = socketId;
    } else {
      statusDiv.classList.remove('on');
      div.dataset.socketId = '';
    }
  });

  const chatWindow = document.querySelector('#messages');
  if (chatWindow && chatWindow.dataset.id === userId) {
    chatWindow.dataset.socketId = socketId;
  }
});

socket.on('searchEamil', users => {
  const suggestionsList = document.getElementById('groupParticipantsSearchResultDiv');
  const selectedUserDiv = document.getElementById('groupSelectedUserDiv');

  suggestionsList.innerHTML = '';

  users.forEach(user => {
    const suggestionLi = document.createElement('li');
    const info = document.createElement('div');

    addClass('group-participants-option', suggestionLi);

    info.innerText = user.name;

    suggestionLi.addEventListener('click', e => {
      window.selectedUser[user.id] = user.name;

      selectedUserDiv.innerHTML = '';

      for (let userId in window.selectedUser) {
        const userDiv = document.createElement('div');
        const info = document.createElement('div');

        info.innerText = window.selectedUser[userId];

        addClass('group-participants-selected', userDiv);

        selectedUserDiv.appendChild(userDiv);
        userDiv.appendChild(info);

        userDiv.addEventListener('click', () => {
          delete window.selectedUser[userId];
          userDiv.remove();
        });
      }
    });

    suggestionsList.appendChild(suggestionLi);
    suggestionLi.appendChild(info);
  });
});

socket.on('changeProfilePicture', userId => {
  const contactDivs = document.querySelectorAll(`.contact[data-id="${userId}"]`);

  contactDivs.forEach(div => {
    const pictureDiv = div.querySelector('.contact-picture');

    //force the picture div to refresh the picture
    pictureDiv.style.backgroundImage = `url(${FILE_HOST}/profile_picture/${userId}.jpg?v=${Date.now()})`;
  });
});

socket.on('changeFirmPicture', firmId => {
  const logoDiv = document.getElementById('firmLogo');

  //force the picture div to refresh the picture
  logoDiv.style.backgroundImage = `url(${FILE_HOST}/firm_picture/${firmId}.jpg?v=${Date.now()})`;
});

//Change online status to 'off' when disonnected
socket.on('disconnect', () => {
  const contactDivs = document.querySelectorAll(`.contact`);

  contactDivs.forEach(div => {
    const statusDiv = div.querySelector('.contact-status');

    statusDiv.classList.remove('on');
    div.dataset.socketId = '';
  });
});

export { socket };
