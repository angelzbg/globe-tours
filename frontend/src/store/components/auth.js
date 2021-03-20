import { makeAutoObservable, runInAction } from 'mobx';
import { networkCall, notify } from '../../utils/utils';
import { listen, close } from '../sockets/notifications';

export default class AuthStore {
  constructor(root) {
    makeAutoObservable(this);
    this.root = root;
  }

  signIn = async (body) => {
    runInAction(() => (this.root.isLoading = true));

    const response = await networkCall({ path: '/api/login', method: 'POST', body });

    if (response.okay) {
      this.getUserInfo();
      notify(response);
    } else {
      runInAction(() => (this.root.isLoading = false));
    }

    return response;
  };

  signUp = async (body) => {
    runInAction(() => (this.root.isLoading = true));

    const response = await networkCall({ path: '/api/register', method: 'POST', body });

    if (response.okay) {
      notify(response);
      this.getUserInfo();
    } else {
      runInAction(() => (this.root.isLoading = false));
    }

    return response;
  };

  signOut = async () => {
    runInAction(() => (this.root.isLoading = true));

    close();
    const response = await networkCall({ path: '/api/logout', method: 'GET' });

    if (response.okay) {
      runInAction(() => {
        this.root.isLoading = false;
        this.root.user = null;
        this.root.friends = [];
        this.root.requests = [];
      });
    }

    notify(response);

    return response;
  };

  getUserInfo = async (isSilent) => {
    if (!isSilent) {
      runInAction(() => (this.root.isLoading = true));
    }

    const response = await networkCall({ path: '/api/userInfo', method: 'GET' });

    if (response.okay) {
      if (!this.root.user) {
        (async () => {
          const user = { ...response.okay, lastNotifCheck: response.okay.lastNotifCheck ?? 0 };
          await Promise.all([this.root.loadFriends(), this.root.loadRequests()]);
          runInAction(() => (this.root.user = user));
          listen(user.socketId);
          if (!isSilent) {
            runInAction(() => (this.root.isLoading = false));
          }
        })();
      } else {
        runInAction(() => {
          Object.assign(this.root.user, {
            ...response.okay,
            lastNotifCheck: response.okay.lastNotifCheck ?? 0,
          });
          if (!isSilent) {
            this.root.isLoading = false;
          }
        });
      }
    } else {
      runInAction(() => {
        this.root.user = this.root.user === undefined ? null : undefined;
        if (!isSilent) {
          this.root.isLoading = false;
        }
      });
    }

    return response;
  };
}
