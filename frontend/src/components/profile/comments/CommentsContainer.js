import React from 'react';
import { useHistory } from 'react-router-dom';
import { useStore } from '../../../store/store';
import { observer, useLocalObservable } from 'mobx-react';
import { commentsFilter } from '../constants';
import CommentDeleteModal from './modals/CommentDeleteModal';
import Comment from './comment/index';

export default observer(({ id, filter, syncing, setSync, sync, commentRef }) => {
  const history = useHistory();
  const { user, comments, actionComment } = useStore();
  const observable = useLocalObservable(() => ({
    deleteId: '',
    setDeleteId: (id = '') => (observable.deleteId = id),
    action: async (action = '', profileId = '', commentId = '') => {
      if (!user) return history.push('/login');
      setSync(true);
      if (action === 'delete') {
        const id = observable.deleteId;
        observable.setDeleteId();
        (await actionComment('delete', id)).okay ? sync(profileId) : setSync(false);
      } else {
        (await actionComment(action, commentId)).okay ? sync(profileId) : setSync(false);
      }
    },
  }));

  const { deleteId, setDeleteId, action } = observable;
  const maxHeight = `calc(100vh - 318px - ${commentRef?.current?.clientHeight ?? 0 + 12}px)`;
  const cmnts = comments.slice().sort(commentsFilter[filter]);

  return (
    <div className="comments-wrapper" style={{ maxHeight }}>
      {deleteId && <CommentDeleteModal {...{ id, setDeleteId, action }} />}
      {cmnts.map((item) => (
        <Comment key={`comment-${item._id}`} {...{ item, id, user, syncing, setDeleteId, action }} />
      ))}
    </div>
  );
});
