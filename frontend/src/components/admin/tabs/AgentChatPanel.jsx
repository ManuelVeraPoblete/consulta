import React, { useState, useRef, useEffect } from 'react';
import api from '../../../services/authService';
import styles from './AgentChatPanel.module.css';

// Convierte texto plano con guiones en JSX estructurado
function MessageContent({ text }) {
  const cleaned = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '');

  const blocks = cleaned.split(/\n{2,}/);

  return (
    <div className={styles.messageContent}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim() !== '');
        const isAllListItems = lines.length > 0 && lines.every(l => /^[-•]\s/.test(l.trim()));

        if (isAllListItems) {
          return (
            <ul key={bi} className={styles.msgList}>
              {lines.map((line, li) => (
                <li key={li}>{line.replace(/^[-•]\s+/, '').trim()}</li>
              ))}
            </ul>
          );
        }

        // Bloque mixto: líneas normales y de lista juntas
        return (
          <p key={bi} className={styles.msgParagraph}>
            {lines.map((line, li) => {
              const isList = /^[-•]\s/.test(line.trim());
              return (
                <React.Fragment key={li}>
                  {isList ? (
                    <span className={styles.inlineListItem}>
                      {'• ' + line.replace(/^[-•]\s+/, '').trim()}
                    </span>
                  ) : (
                    <span>{line.trim()}</span>
                  )}
                  {li < lines.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <path d="M12 11V7"/>
    <circle cx="12" cy="5" r="2"/>
    <line x1="8" y1="15" x2="8" y2="17"/>
    <line x1="16" y1="15" x2="16" y2="17"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const AgentChatPanel = ({
  endpoint = '/agent/admin',
  welcomeMessage = '¡Hola! ¿En qué puedo ayudarte hoy?',
}) => {
  const welcomeRef = useRef({ role: 'assistant', content: welcomeMessage });
  const [messages, setMessages] = useState([welcomeRef.current]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const sendingRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const apiMessages = updatedMessages
      .slice(updatedMessages[0] === welcomeRef.current ? 1 : 0)
      .map(({ role, content }) => ({ role, content }));

    try {
      const { data } = await api.post(endpoint, { messages: apiMessages });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error al conectar con el asistente. Intenta de nuevo.' },
      ]);
    } finally {
      setLoading(false);
      sendingRef.current = false;
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.messagesArea}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.role === 'user' ? styles.rowUser : styles.rowAssistant}
          >
            {msg.role === 'assistant' && (
              <div className={styles.avatar}>
                <BotIcon />
              </div>
            )}
            <div className={msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}>
              <MessageContent text={msg.content} />
            </div>
          </div>
        ))}

        {loading && (
          <div className={styles.rowAssistant}>
            <div className={styles.avatar}><BotIcon /></div>
            <div className={`${styles.bubbleAssistant} ${styles.typing}`}>
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          aria-label="Escribe tu consulta al asistente"
          placeholder="Escribe tu consulta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          title="Enviar"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default AgentChatPanel;
