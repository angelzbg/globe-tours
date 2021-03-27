import './styles/chat.css';
import { observer } from 'mobx-react';
import { useStore } from '../../store/store';
import { useEffect } from 'react';
import Events from '../../utils/events';
import ActiveChat from './ActiveChat';

export default observer(() => {
  const store = useStore();
  const { activeChat } = store;

  useEffect(() => {
    Events.listen('scroll-to-bottom-chat', 'chat-listener', (chatId) => {
      const container = document.getElementById(chatId);
      if (container && container.scrollHeight !== container.scrollTop) {
        container.scrollTop = container.scrollHeight;
      }
    });

    Events.listen('scroll-top-chat', 'chat-listener', (chatId) => {
      const container = document.getElementById(chatId);
      if (container) {
        container.scrollTo({ top: 20, behavior: 'smooth' });
      }
    });

    Events.listen('focus-chat', 'chat-listener', (chatId) => {
      const input = document.getElementById(`chat-input-${chatId}`);
      if (input) {
        input.focus();
      }
    });

    return () => {
      Events.unlisten('scroll-to-bottom-chat', 'chat-listener');
      Events.unlisten('scroll-top-chat', 'chat-listener');
      Events.unlisten('focus-chat', 'chat-listener');
    };
  }, [store]);

  if (!activeChat) {
    return null;
  }

  return <ActiveChat chatId={activeChat.chatId} />;
});
