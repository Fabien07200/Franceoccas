'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'offer' | 'system';
  offer_amount?: number;
  offer_status?: 'pending' | 'accepted' | 'declined' | 'countered';
  created_at: string;
}

interface Conversation {
  id: string;
  listing_title: string;
  listing_price: number;
  listing_photo: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_rating: number;
  my_role: 'buyer' | 'seller';
  my_unread: number;
  last_message: string;
  last_msg_at: string;
  status: 'active' | 'sold' | 'archived';
}

const ME = 'me';

const CONVERSATIONS: Conversation[] = [
  { id: 'c1', listing_title: 'Renault Clio V 1.0 TCe 90 — 2022', listing_price: 1190000, listing_photo: '🚗', other_user_name: 'Marc L.', other_user_avatar: 'ML', other_user_rating: 4.8, my_role: 'seller', my_unread: 2, last_message: 'Pouvez-vous descendre à 11 000 € ?', last_msg_at: 'Il y a 10 min', status: 'active' },
  { id: 'c2', listing_title: 'Perceuse Bosch GBH 18V', listing_price: 18900, listing_photo: '🔧', other_user_name: 'Sophie A.', other_user_avatar: 'SA', other_user_rating: 5.0, my_role: 'seller', my_unread: 0, last_message: 'Parfait, je prends !', last_msg_at: 'Hier', status: 'active' },
  { id: 'c3', listing_title: 'MacBook Pro 14" M3', listing_price: 189900, listing_photo: '💻', other_user_name: 'Pierre D.', other_user_avatar: 'PD', other_user_rating: 4.6, my_role: 'buyer', my_unread: 1, last_message: 'Toujours disponible, venez le voir', last_msg_at: 'Il y a 2h', status: 'active' },
  { id: 'c4', listing_title: 'Tondeuse Honda HF 2315', listing_price: 120000, listing_photo: '🌿', other_user_name: 'Bernard C.', other_user_avatar: 'BC', other_user_rating: 4.4, my_role: 'seller', my_unread: 0, last_message: 'Vendu ! Merci beaucoup.', last_msg_at: 'Il y a 3j', status: 'sold' },
  { id: 'c5', listing_title: 'Yamaha MT-07 2020', listing_price: 690000, listing_photo: '🏍️', other_user_name: 'Thomas P.', other_user_avatar: 'TP', other_user_rating: 4.7, my_role: 'buyer', my_unread: 0, last_message: 'Je vous envoie les photos du CT', last_msg_at: 'Il y a 4j', status: 'active' },
];

const MESSAGES_BY_CONV: Record<string, Message[]> = {
  c1: [
    { id: 'm1', sender_id: 'marc', content: 'Bonjour, votre Clio est-elle toujours disponible ?', type: 'text', created_at: '12 avr. 14:30' },
    { id: 'm2', sender_id: ME, content: 'Bonjour Marc, oui elle est toujours disponible ! Avez-vous des questions ?', type: 'text', created_at: '12 avr. 14:45' },
    { id: 'm3', sender_id: 'marc', content: 'Elle a combien de propriétaires ?', type: 'text', created_at: '12 avr. 15:00' },
    { id: 'm4', sender_id: ME, content: 'Un seul propriétaire, moi-même. Achetée neuve en mars 2022.', type: 'text', created_at: '12 avr. 15:10' },
    { id: 'm5', sender_id: 'marc', content: '', type: 'offer', offer_amount: 110000, offer_status: 'pending', created_at: '12 avr. 15:30' },
    { id: 'm6', sender_id: ME, content: 'Je ne peux pas descendre en dessous de 11 400 €, c\'est déjà sous la cote Argus.', type: 'text', created_at: '12 avr. 15:45' },
    { id: 'm7', sender_id: 'marc', content: 'Pouvez-vous descendre à 11 000 € ?', type: 'text', created_at: 'Il y a 10 min' },
  ],
  c2: [
    { id: 'm1', sender_id: 'sophie', content: 'Bonjour ! La perceuse est-elle compatible avec les batteries BL1860 ?', type: 'text', created_at: '11 avr. 10:00' },
    { id: 'm2', sender_id: ME, content: 'Oui, toutes les batteries Makita 18V sont compatibles.', type: 'text', created_at: '11 avr. 10:15' },
    { id: 'm3', sender_id: 'sophie', content: '', type: 'offer', offer_amount: 16000, offer_status: 'declined', created_at: '11 avr. 10:30' },
    { id: 'm4', sender_id: ME, content: 'Je préfère m\'en tenir à 189 €, le prix est déjà très correct pour ce kit complet.', type: 'text', created_at: '11 avr. 10:45' },
    { id: 'm5', sender_id: 'sophie', content: 'Vous avez raison, c\'est juste. Parfait, je prends !', type: 'text', created_at: '11 avr. 11:00' },
    { id: 'm6', sender_id: 'system', content: '✅ Sophie A. a accepté d\'acheter au prix de 189 €. Paiement sécurisé en attente.', type: 'system', created_at: '11 avr. 11:01' },
  ],
  c3: [
    { id: 'm1', sender_id: ME, content: 'Bonjour, le MacBook Pro a-t-il encore la garantie Apple ?', type: 'text', created_at: '13 avr. 09:00' },
    { id: 'm2', sender_id: 'pierre', content: 'Oui, jusqu\'en novembre 2025. Facture d\'achat disponible.', type: 'text', created_at: '13 avr. 09:30' },
    { id: 'm3', sender_id: ME, content: 'Parfait. Possibilité de le voir en vrai ?', type: 'text', created_at: '13 avr. 10:00' },
    { id: 'm4', sender_id: 'pierre', content: 'Toujours disponible, venez le voir quand vous voulez à Lyon.', type: 'text', created_at: 'Il y a 2h' },
  ],
  c4: [
    { id: 'm1', sender_id: 'bernard', content: 'Bonjour, la tondeuse démarre bien ?', type: 'text', created_at: '10 avr. 08:00' },
    { id: 'm2', sender_id: ME, content: 'Oui parfaitement, révisée en début de saison.', type: 'text', created_at: '10 avr. 08:30' },
    { id: 'm3', sender_id: 'bernard', content: '', type: 'offer', offer_amount: 110000, offer_status: 'accepted', created_at: '10 avr. 09:00' },
    { id: 'm4', sender_id: ME, content: 'Offre acceptée ! À bientôt pour la remise en main propre.', type: 'text', created_at: '10 avr. 09:15' },
    { id: 'm5', sender_id: 'system', content: '✅ Transaction finalisée. Paiement libéré. Merci d\'avoir vendu sur FranceOccas !', type: 'system', created_at: '12 avr. 14:00' },
    { id: 'm6', sender_id: 'bernard', content: 'Vendu ! Merci beaucoup.', type: 'text', created_at: 'Il y a 3j' },
  ],
  c5: [
    { id: 'm1', sender_id: ME, content: 'Bonjour, la moto a-t-elle eu des chutes ?', type: 'text', created_at: '09 avr. 16:00' },
    { id: 'm2', sender_id: 'thomas', content: 'Aucune chute, garage depuis l\'achat.', type: 'text', created_at: '09 avr. 16:30' },
    { id: 'm3', sender_id: ME, content: 'Super. Et le CT est valide ?', type: 'text', created_at: '09 avr. 17:00' },
    { id: 'm4', sender_id: 'thomas', content: 'Je vous envoie les photos du CT dans la journée.', type: 'text', created_at: 'Il y a 4j' },
  ],
};

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<string>('c1');
  const [messages, setMessages] = useState<Record<string, Message[]>>(MESSAGES_BY_CONV);
  const [newMessage, setNewMessage] = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [showCounter, setShowCounter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conv = CONVERSATIONS.find(c => c.id === selectedConv);
  const convMessages = messages[selectedConv] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv, messages]);

  const filteredConvs = CONVERSATIONS.filter(c =>
    c.listing_title.toLowerCase().includes(search.toLowerCase()) ||
    c.other_user_name.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      sender_id: ME,
      content: newMessage,
      type: 'text',
      created_at: 'À l\'instant',
    };
    setMessages(prev => ({ ...prev, [selectedConv]: [...(prev[selectedConv] || []), msg] }));
    setNewMessage('');
  };

  const sendOffer = () => {
    if (!offerAmount) return;
    const amount = parseInt(offerAmount) * 100;
    const msg: Message = {
      id: `m${Date.now()}`,
      sender_id: ME,
      content: '',
      type: 'offer',
      offer_amount: amount,
      offer_status: 'pending',
      created_at: 'À l\'instant',
    };
    setMessages(prev => ({ ...prev, [selectedConv]: [...(prev[selectedConv] || []), msg] }));
    setOfferAmount('');
    setShowOffer(false);
  };

  const respondToOffer = (msgId: string, action: 'accepted' | 'declined') => {
    setMessages(prev => ({
      ...prev,
      [selectedConv]: prev[selectedConv].map(m =>
        m.id === msgId ? { ...m, offer_status: action } : m
      ),
    }));
    const sysMsg: Message = {
      id: `m${Date.now()}`,
      sender_id: 'system',
      content: action === 'accepted' ? '✅ Offre acceptée ! L\'acheteur peut maintenant procéder au paiement sécurisé.' : '❌ Offre refusée.',
      type: 'system',
      created_at: 'À l\'instant',
    };
    setMessages(prev => ({ ...prev, [selectedConv]: [...prev[selectedConv], sysMsg] }));
  };

  const sendCounter = (msgId: string) => {
    if (!counterAmount) return;
    const amount = parseInt(counterAmount) * 100;
    setMessages(prev => ({
      ...prev,
      [selectedConv]: prev[selectedConv].map(m =>
        m.id === msgId ? { ...m, offer_status: 'countered' } : m
      ),
    }));
    const counterMsg: Message = {
      id: `m${Date.now()}`,
      sender_id: ME,
      content: '',
      type: 'offer',
      offer_amount: amount,
      offer_status: 'pending',
      created_at: 'À l\'instant',
    };
    setMessages(prev => ({ ...prev, [selectedConv]: [...prev[selectedConv], counterMsg] }));
    setCounterAmount('');
    setShowCounter(null);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F0', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#8A8A85' }}>💬 Messagerie</span>
          <Link href="/compte" style={{ border: '1px solid #3A3A38', color: '#C8C6C0', padding: '5px 12px', borderRadius: '7px', textDecoration: 'none', fontSize: '12px' }}>Mon compte</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden' }}>

        {/* LEFT — conversation list */}
        <div style={{ background: '#fff', borderRight: '1px solid #E2DDD6', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #E2DDD6', flexShrink: 0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher une conversation…"
              style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#F7F5F0' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConvs.map(c => (
              <button key={c.id} onClick={() => setSelectedConv(c.id)}
                style={{ display: 'flex', gap: '10px', width: '100%', padding: '12px 14px', border: 'none', borderBottom: '1px solid #F7F5F0', background: selectedConv === c.id ? '#FFF0EB' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1A1A18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff' }}>
                    {c.other_user_avatar}
                  </div>
                  {c.my_unread > 0 && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', background: '#E8460A', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.my_unread}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ fontSize: '13px', fontWeight: c.my_unread > 0 ? 700 : 500, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {c.other_user_name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#AEABA3', flexShrink: 0 }}>{c.last_msg_at}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B6B66', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                    {c.listing_photo} {c.listing_title}
                  </div>
                  <div style={{ fontSize: '11px', color: c.my_unread > 0 ? '#1A1A18' : '#AEABA3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: c.my_unread > 0 ? 600 : 400 }}>
                    {c.last_message}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — chat */}
        {conv ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E2DDD6', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1A1A18', color: '#fff', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {conv.other_user_avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1A18' }}>{conv.other_user_name}</div>
                <div style={{ fontSize: '11px', color: '#6B6B66' }}>⭐ {conv.other_user_rating} · {conv.my_role === 'buyer' ? 'Vendeur' : 'Acheteur'}</div>
              </div>
              <Link href={`/annonces/1`}
                style={{ background: '#F7F5F0', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '8px 12px', textDecoration: 'none', display: 'flex', gap: '8px', alignItems: 'center', maxWidth: '220px' }}>
                <span style={{ fontSize: '20px' }}>{conv.listing_photo}</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{conv.listing_title}</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#E8460A' }}>{(conv.listing_price / 100).toLocaleString('fr')} €</div>
                </div>
              </Link>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {convMessages.map(msg => {
                const isMe = msg.sender_id === ME;
                const isSystem = msg.type === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} style={{ textAlign: 'center' }}>
                      <span style={{ background: '#F7F5F0', border: '1px solid #E2DDD6', borderRadius: '20px', padding: '6px 14px', fontSize: '11px', color: '#6B6B66' }}>
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                if (msg.type === 'offer') {
                  const canRespond = !isMe && msg.offer_status === 'pending' && conv.my_role === 'seller';
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ background: '#fff', border: `2px solid ${msg.offer_status === 'accepted' ? '#1D9E75' : msg.offer_status === 'declined' ? '#E24B4A' : '#E8460A'}`, borderRadius: '14px', padding: '14px 16px', maxWidth: '320px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                          {isMe ? 'Votre offre' : `Offre de ${conv.other_user_name}`}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '24px', color: '#1A1A18', marginBottom: '8px' }}>
                          {msg.offer_amount ? (msg.offer_amount / 100).toLocaleString('fr') : 0} €
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: canRespond ? '10px' : '0' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                            background: msg.offer_status === 'accepted' ? '#E1F5EE' : msg.offer_status === 'declined' ? '#FCEBEB' : msg.offer_status === 'countered' ? '#FAEEDA' : '#FFF0EB',
                            color: msg.offer_status === 'accepted' ? '#085041' : msg.offer_status === 'declined' ? '#791F1F' : msg.offer_status === 'countered' ? '#633806' : '#993C1D' }}>
                            {msg.offer_status === 'accepted' ? '✅ Acceptée' : msg.offer_status === 'declined' ? '❌ Refusée' : msg.offer_status === 'countered' ? '↩ Contre-offre' : '⏳ En attente'}
                          </span>
                        </div>
                        {canRespond && showCounter !== msg.id && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => respondToOffer(msg.id, 'accepted')}
                              style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              ✓ Accepter
                            </button>
                            <button onClick={() => setShowCounter(msg.id)}
                              style={{ flex: 1, background: '#FFF0EB', color: '#E8460A', border: '1px solid #F5C4B3', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              ↩ Contre-offrir
                            </button>
                            <button onClick={() => respondToOffer(msg.id, 'declined')}
                              style={{ flex: 1, background: '#FCEBEB', color: '#E24B4A', border: '1px solid #F7C1C1', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              ✕ Refuser
                            </button>
                          </div>
                        )}
                        {showCounter === msg.id && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                              <input type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)}
                                placeholder={`Ex: ${msg.offer_amount ? Math.round(msg.offer_amount / 100 * 1.05) : ''}`}
                                style={{ flex: 1, border: '1px solid #E2DDD6', borderRadius: '7px', padding: '7px 10px', fontSize: '13px', outline: 'none', fontWeight: 700 }} />
                              <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: '#6B6B66' }}>€</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => sendCounter(msg.id)}
                                style={{ flex: 1, background: '#E8460A', color: '#fff', border: 'none', borderRadius: '7px', padding: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                Envoyer la contre-offre
                              </button>
                              <button onClick={() => setShowCounter(null)}
                                style={{ background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '7px', padding: '7px 10px', fontSize: '12px', cursor: 'pointer' }}>
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: '#AEABA3', marginTop: '6px', textAlign: 'right' }}>{msg.created_at}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                    {!isMe && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1A1A18', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '2px' }}>
                        {conv.other_user_avatar}
                      </div>
                    )}
                    <div style={{ maxWidth: '65%' }}>
                      <div style={{ background: isMe ? '#E8460A' : '#fff', color: isMe ? '#fff' : '#1A1A18', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 14px', fontSize: '13px', lineHeight: 1.6, border: isMe ? 'none' : '1px solid #E2DDD6', boxShadow: 'none' }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: '10px', color: '#AEABA3', marginTop: '3px', textAlign: isMe ? 'right' : 'left' }}>
                        {msg.created_at} {isMe && '· Lu'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input zone */}
            <div style={{ background: '#fff', borderTop: '1px solid #E2DDD6', padding: '12px 18px', flexShrink: 0 }}>
              {showOffer && (
                <div style={{ background: '#F7F5F0', borderRadius: '10px', padding: '12px', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A18' }}>💰 Montant de votre offre</div>
                  <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                    placeholder={`Max: ${(conv.listing_price / 100).toLocaleString('fr')} €`}
                    style={{ flex: 1, border: '1px solid #E2DDD6', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
                  <span style={{ fontWeight: 700, color: '#6B6B66' }}>€</span>
                  <button onClick={sendOffer}
                    style={{ background: '#E8460A', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Envoyer
                  </button>
                  <button onClick={() => setShowOffer(false)}
                    style={{ background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                {conv.my_role === 'buyer' && !showOffer && (
                  <button onClick={() => setShowOffer(true)}
                    style={{ background: '#FFF0EB', color: '#E8460A', border: '1px solid #F5C4B3', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    💰 Faire une offre
                  </button>
                )}
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Écrivez un message… (Entrée pour envoyer)"
                  rows={1}
                  style={{ flex: 1, border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'Arial', lineHeight: 1.5, maxHeight: '120px' }} />
                <button onClick={sendMessage} disabled={!newMessage.trim()}
                  style={{ background: newMessage.trim() ? '#E8460A' : '#E2DDD6', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 16px', fontSize: '18px', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                  ↑
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B66', fontSize: '14px' }}>
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}
