import './styles/profile-card.css';
import React, { useEffect } from 'react';
import { useStore } from '../../../../store/store';
import { observer, useLocalObservable } from 'mobx-react';
import { runInAction } from 'mobx';
import ProfileLoader from '../../../loaders/ProfileLoader';
import ProfileSync from './ProfileSync';
import ProfileAvatar from './ProfileAvatar';
import ProfileName from './ProfileName';
import ProfileLocation from './ProfileLocation';
import ProfileRating from './ProfileRating';

export default observer(({ id }) => {
  const store = useStore();

  const isSelf = !!store.user && store.user._id === id;
  const isLoading = (!store.profile && !isSelf) || store.isLoading;
  const profile = isSelf ? store.user : store.profile;

  const observable = useLocalObservable(() => ({
    syncing: false,
    setSync: (isSync = true) => runInAction(() => (observable.syncing = isSync)),
    sync: async (id) => {
      observable.setSync(true);
      observable.setEditField(false);
      await (id ? store.getUserProfile(id) : store.getUserInfo());
      observable.setSync(false);
    },
    editField: false,
    setEditField: (field = '') => runInAction(() => (observable.editField = field)),
  }));

  const { syncing, setSync, sync, editField, setEditField } = observable;

  useEffect(() => {
    if (store.user && store.user._id === id && !store.isLoading) {
      store.getUserInfo();
    } else {
      store.getUserProfile(id);
    }
  }, [store, id]);

  useEffect(() => {
    if (!store.user && (!store.profile || store.profile._id !== id) && !store.isLoading && !store.loadingProfile) {
      store.getUserProfile(id);
    }
  }, [store, store.isLoading, id]);

  return (
    <div className="profile-card">
      {isLoading ? (
        <ProfileLoader />
      ) : (
        <>
          <ProfileSync {...{ syncing, sync, isSelf, id }} />
          <ProfileAvatar {...{ setSync, isSelf, avatar: profile.avatar }} />
          <div className="profile-card-info">
            <ProfileName {...{ profile, isSelf, setSync, setEditField, editField, syncing }} />
            <div className="profile-card-account-type">{profile.type}</div>
            <ProfileLocation {...{ profile, isSelf, setSync, setEditField, editField, syncing }} />
            <ProfileRating {...{ id, profile, isSelf, sync, setSync, syncing }} />
          </div>
        </>
      )}
    </div>
  );
});
