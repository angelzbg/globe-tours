import { makeAutoObservable, runInAction } from 'mobx';
import { createContext, useContext } from 'react';
import AuthStore from './components/auth';
import ThemeStore from './components/themes';
import ProfileStore from './pages/profile';
import HomeStore from './pages/home';
import DevelopersStore from './pages/developers';
import OrganizationsStore from './pages/organizations';
import SearchStore from './pages/search';
import { networkCall, notify } from '../utils/utils';
import { notificationTypes } from '../components/header/notifications/constants';
import { io } from 'socket.io-client';
import { ActivityStore } from './pages/activity';
import Events from '../utils/events';

class Store {
  constructor() {
    makeAutoObservable(this);

    this.auth = new AuthStore(this);
    this.themeStore = new ThemeStore(this);
    this.profileStore = new ProfileStore(this);
    this.home = new HomeStore(this);
    this.developers = new DevelopersStore(this);
    this.organizations = new OrganizationsStore(this);
    this.searchStore = new SearchStore(this);
    this.activityStore = new ActivityStore(this);

    this.auth.getUserInfo();
  }

  isLoading = false;
  user = null;

  friends = [];
  requests = [];
  chats = {};
  activeChatId = null;
  setActiveChat = (friendId) => {
    if (friendId && this.activeChat?._id === friendId) {
      return;
    }

    this.activeChatId = friendId;
  };

  get activeChat() {
    const found = this.friends.find(({ _id }) => _id === this.activeChatId);
    return found ? { ...found, chatUser: found.users.filter(({ _id }) => _id !== this.user._id)[0] } : null;
  }

  sendMessage = async (chatId = '', content = '') => {
    if (!this.activeChat) {
      return;
    }

    const response = await networkCall({ path: '/api/message', method: 'POST', body: { chatId, content } });

    if (response.okay) {
      runInAction(() => {
        if (this.chats[chatId]) {
          this.chats[chatId].push(response.okay);
        } else {
          this.chats[chatId] = [response.okay];
        }
      });
      this.multiUser('new-message', response.okay);
    } else {
      notify(response);
    }

    return response;
  };

  loadingChatsIds = {};
  cantLoadChatsIds = {};
  loadChatMessages = async (chatId, created, initial) => {
    if (this.loadingChatsIds[chatId] || this.cantLoadChatsIds[chatId]) {
      return;
    }

    runInAction(() => (this.loadingChatsIds[chatId] = true));
    const response = await networkCall({ path: `/api/message/${chatId}`, method: 'POST', body: { created } });
    if (response.okay) {
      runInAction(() => {
        if (response.okay.length) {
          this.chats[chatId] = response.okay.concat(this.chats[chatId]);
          if (response.okay.length < 10) {
            this.cantLoadChatsIds[chatId] = true;
          } else {
            setTimeout(() => Events.trigger(initial ? 'scroll-to-bottom-chat' : 'scroll-top-chat', chatId), 100);
          }
        } else {
          this.cantLoadChatsIds[chatId] = true;
        }
      });
    } else {
      notify(response);
    }
    runInAction(() => (this.loadingChatsIds[chatId] = false));
  };

  socket = null;
  disconnected = false;

  multiUser = (channel, data) => {
    this.socket.emit('multiuser', JSON.stringify({ channel, data }));
  };

  listen = () => {
    if (!this.socket) {
      this.socket = io('/');

      this.socket.on('friend-request-received', (data) => {
        const request = JSON.parse(data);
        runInAction(() => this.requests.unshift(request));
      });

      this.socket.on('friend-request-accepted', (data) => {
        const { friend, removed } = JSON.parse(data);
        runInAction(() => {
          this.requests = this.requests.filter(({ _id }) => _id !== removed);
          this.friends.unshift(friend);
        });
      });

      this.socket.on('friend-request-removed', (data) => {
        const id = JSON.parse(data);
        runInAction(() => (this.requests = this.requests.filter(({ _id }) => _id !== id)));
      });

      this.socket.on('friend-removed', (data) => {
        const id = JSON.parse(data);
        const friendsId = this.friends.findIndex(({ _id }) => _id === id);
        runInAction(() => {
          if (this.activeChatId === id) {
            this.activeChatId = null;
          }

          if (friendsId !== -1) {
            const chatId = this.friends[friendsId].chatId;
            if (this.chats[chatId]) {
              delete this.chats[chatId];
            }
          }

          this.friends.splice(friendsId, 1);
        });
      });

      this.socket.on('new-message', (data) => {
        const message = JSON.parse(data);
        runInAction(() => {
          if (this.chats[message.chatId]) {
            this.chats[message.chatId].push(message);
          } else {
            this.chats[message.chatId] = [message];
          }
        });
        setTimeout(() => Events.trigger('scroll-to-bottom-chat', message.chatId), 20);
      });

      this.socket.on('connect', () => {
        this.socket.emit('subscribeSocket', this.user.socketId);

        if (this.disconnected) {
          runInAction(() => (this.disconnected = false));
          let messages = Object.values(this.chats)
            .map((msgs) => msgs?.[msgs.length - 1]?.created)
            .filter((c) => !!c);
          const lastMessage = messages.length ? Math.max(...messages) : 0;
          this.loadChats(lastMessage);
          this.loadFriends();
          this.loadRequests();
        }
      });

      this.socket.on('disconnect', (reason) => {
        runInAction(() => (this.disconnected = true));
        if (reason === 'io server disconnect') {
          this.socket.connect();
        }
      });
    } else {
      this.socket.emit('subscribeSocket', this.user.socketId);
    }
  };

  close = () => {
    if (this.socket && this.user) {
      this.socket.disconnect();
    }
    runInAction(() => {
      this.socket = null;
      this.disconnected = false;
    });
  };

  sendRequest = async (id = '') => {
    const response = await networkCall({ path: `/api/send-friend-request/${id}`, method: 'GET' });
    if (response.okay) {
      runInAction(() => this.requests.unshift(response.okay));
      this.multiUser('friend-request-received', response.okay);
    } else {
      notify(response);
    }

    return response;
  };

  acceptRequest = async (id = '') => {
    const response = await networkCall({ path: `/api/accept-friend-request/${id}`, method: 'GET' });
    if (response.okay) {
      runInAction(() => {
        this.requests = this.requests.filter(({ _id }) => _id !== id);
        this.friends.unshift(response.okay);
      });
      this.multiUser('friend-request-accepted', { removed: id, friend: response.okay });
    } else {
      notify(response);
    }

    return response;
  };

  removeRequest = async (id = '') => {
    const response = await networkCall({ path: `/api/remove-friend-request/${id}`, method: 'GET' });
    if (response.okay) {
      runInAction(() => (this.requests = this.requests.filter(({ _id }) => _id !== id)));
      this.multiUser('friend-request-removed', id);
    } else {
      notify(response);
    }

    return response;
  };

  removeFriend = async (id = '') => {
    const response = await networkCall({ path: `/api/friends/remove/${id}`, method: 'GET' });
    if (response.okay) {
      const friendsId = this.friends.findIndex(({ _id }) => _id === id);
      runInAction(() => {
        if (this.activeChatId === id) {
          this.activeChatId = null;
        }

        if (friendsId !== -1) {
          const chatId = this.friends[friendsId].chatId;
          if (this.chats[chatId]) {
            delete this.chats[chatId];
          }
        }

        this.friends.splice(friendsId, 1);
      });
      this.multiUser('friend-removed', id);
    } else {
      notify(response);
    }

    return response;
  };

  get connections() {
    if (!this.user) {
      return [];
    }

    return this.friends
      .map((f) => ({
        ...f,
        user: f.users.find(({ _id }) => _id !== this.user._id),
        lastMessage: this.chats[f.chatId]?.[this.chats[f.chatId].length - 1],
      }))
      .sort((a, b) => {
        if (a.lastMessage && b.lastMessage) {
          return b.lastMessage.created - a.lastMessage.created;
        } else if (a.lastMessage) {
          return -1;
        } else if (b.lastMessage) {
          return 1;
        }

        return 0;
      });
  }

  get notifications() {
    if (!this.user) {
      return [];
    }

    let seen = 0;
    let weekAgo = new Date().getTime() - 604800000;
    const { lastNotifCheck, _id: currentUserId } = this.user;
    const requests = this.requests
      .filter(({ receiver }) => receiver._id === currentUserId)
      .map((r) => ({ ...r, type: notificationTypes.friendRequest }));

    const accepted = this.friends
      .filter(({ users: [_, sender], created }) => sender._id === currentUserId && created > weekAgo)
      .map((f) => ({ ...f, type: notificationTypes.friendAccepted }));

    const list = requests
      .concat(accepted)
      .map((n) => ({ ...n, new: n.created > lastNotifCheck || !++seen }))
      .sort((a, b) => b.created - a.created);
    return { list, newCount: list.length - seen };
  }

  get requestsTo() {
    return !!this.user
      ? this.requests
          .filter(({ sender }) => sender._id === this.user._id)
          .reduce((map, { receiver, created }) => Object.assign(map, { [receiver._id]: { created } }), {})
      : {};
  }

  get requestsFrom() {
    return !!this.user
      ? this.requests
          .filter(({ receiver }) => receiver._id === this.user._id)
          .reduce(
            (map, { sender, created }) =>
              Object.assign(map, { [sender._id]: { created, new: this.user.lastNotifCheck < created } }),
            {}
          )
      : {};
  }

  get friendsIds() {
    return !!this.user
      ? this.friends.map(({ users }) => (users[0]._id === this.user._id ? users[1]._id : users[0]._id))
      : [];
  }

  loadingChats = false;
  loadChats = async (created) => {
    if (created === undefined) {
      runInAction(() => (this.loadingChats = true));
    }

    const response = await networkCall({ path: '/api/chats', method: 'POST', body: { created } });
    if (response.okay) {
      runInAction(() => {
        if (created !== undefined) {
          response.okay.forEach((msg) => {
            if (this.chats[msg.chatId]) {
              this.chats[msg.chatId].push(msg);
            } else {
              this.chats[msg.chatId] = [msg];
            }
          });
        } else {
          response.okay.forEach((msg) => {
            this.chats[msg.chatId] = [msg];
          });
        }
      });
    } else {
      notify(response);
    }

    if (created === undefined) {
      runInAction(() => (this.loadingChats = false));
    }
  };

  loadingFriends = false;
  loadFriends = async () => {
    if (this.loadingFriends) {
      return;
    }

    runInAction(() => (this.loadingFriends = true));

    const response = await networkCall({ path: '/api/friends', method: 'GET' });
    if (response.okay) {
      runInAction(() => {
        // if connection was lost and the other user has removed the friendship
        if (this.friends.length && response.okay.length !== this.friends.length) {
          this.friends.forEach(({ chatId }) => {
            if (response.okay.findIndex((f) => f.chatId === chatId) === -1) {
              if (this.activeChat && this.activeChat.chatId === chatId) {
                this.activeChatId = null;
              }

              if (this.chats[chatId]) {
                delete this.chats[chatId];
              }
            }
          });
        }
        this.friends = response.okay;
      });
    } else {
      notify(response);
      setTimeout(this.loadFriends, 5000);
    }

    runInAction(() => (this.loadingFriends = false));

    return response;
  };

  loadingRequests = false;
  loadRequests = async () => {
    if (this.loadingRequests) {
      return;
    }

    runInAction(() => (this.loadingRequests = true));
    const response = await networkCall({ path: '/api/friend-requests', method: 'GET' });
    if (response.okay) {
      runInAction(() => (this.requests = response.okay));
    } else {
      notify(response);
      setTimeout(this.loadRequests, 5000);
    }

    runInAction(() => (this.loadingRequests = false));

    return response;
  };
}

const store = new Store();

const StoreContext = createContext(store);
const useStore = () => useContext(StoreContext);

export { store, StoreContext, useStore };
