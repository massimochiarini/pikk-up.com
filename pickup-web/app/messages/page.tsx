'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { supabase, type GroupChat, type Game, type GroupMessage, type Profile, type Conversation, type Message } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

type GroupChatWithDetails = {
  type: 'group'
  groupChat: GroupChat
  game: Game | null
  memberCount: number
  unreadCount: number
}

type ConversationWithDetails = {
  type: 'conversation'
  conversation: Conversation
  otherUser: Profile
  unreadCount: number
}

type ChatItem = GroupChatWithDetails | ConversationWithDetails

export default function MessagesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [allChats, setAllChats] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null)
  const [messages, setMessages] = useState<(GroupMessage | Message)[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAllChats()
    }
  }, [user])

  useEffect(() => {
    if (selectedChat) {
      if (selectedChat.type === 'group') {
        fetchGroupMessages(selectedChat.groupChat.id)
        fetchGroupMembers(selectedChat.groupChat.id)
        // Subscribe to new group messages
        const channel = supabase
          .channel(`group_messages:${selectedChat.groupChat.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'group_messages',
              filter: `group_chat_id=eq.${selectedChat.groupChat.id}`,
            },
            (payload) => {
              setMessages((prev) => [...prev, payload.new as GroupMessage])
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } else {
        fetchConversationMessages(selectedChat.conversation.id)
        setMembers([selectedChat.otherUser])
        // Subscribe to new conversation messages
        const channel = supabase
          .channel(`messages:${selectedChat.conversation.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${selectedChat.conversation.id}`,
            },
            (payload) => {
              setMessages((prev) => [...prev, payload.new as Message])
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [selectedChat])

  const fetchAllChats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch group chats
      const { data: memberships } = await supabase
        .from('group_chat_members')
        .select('group_chat_id')
        .eq('user_id', user.id)

      const groupChatsPromise = memberships && memberships.length > 0
        ? supabase
            .from('group_chats')
            .select('*')
            .in('id', memberships.map((m) => m.group_chat_id))
            .order('last_message_at', { ascending: false, nullsFirst: false })
        : Promise.resolve({ data: [] })

      // Fetch conversations
      const conversationsPromise = supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      const [groupChatsResult, conversationsResult] = await Promise.all([
        groupChatsPromise,
        conversationsPromise,
      ])

      // Enrich group chats
      const enrichedGroupChats: ChatItem[] = await Promise.all(
        (groupChatsResult.data || []).map(async (chat) => {
          const { data: gameData } = await supabase
            .from('games')
            .select('*')
            .eq('id', chat.game_id)
            .single()

          const { count } = await supabase
            .from('group_chat_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_chat_id', chat.id)

          return {
            type: 'group' as const,
            groupChat: chat,
            game: gameData,
            memberCount: count || 0,
            unreadCount: 0,
          }
        })
      )

      // Enrich conversations
      const enrichedConversations: ChatItem[] = await Promise.all(
        (conversationsResult.data || []).map(async (conversation) => {
          const otherUserId = conversation.participant_1 === user.id
            ? conversation.participant_2
            : conversation.participant_1

          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single()

          return {
            type: 'conversation' as const,
            conversation,
            otherUser: profileData!,
            unreadCount: 0,
          }
        })
      )

      // Combine and sort by last message time
      const combined = [...enrichedGroupChats, ...enrichedConversations]
      combined.sort((a, b) => {
        const aTime = a.type === 'group'
          ? a.groupChat.last_message_at
          : a.conversation.last_message_at
        const bTime = b.type === 'group'
          ? b.groupChat.last_message_at
          : b.conversation.last_message_at

        if (!aTime) return 1
        if (!bTime) return -1
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      setAllChats(combined)
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupMessages = async (groupChatId: string) => {
    try {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_chat_id', groupChatId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching group messages:', error)
    }
  }

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching conversation messages:', error)
    }
  }

  const fetchGroupMembers = async (groupChatId: string) => {
    try {
      const { data: memberData } = await supabase
        .from('group_chat_members')
        .select('user_id')
        .eq('group_chat_id', groupChatId)

      if (memberData) {
        const userIds = memberData.map((m) => m.user_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)

        setMembers(profilesData || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) return

    setSearching(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10)

      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const startConversationWithUser = async (otherUserId: string) => {
    if (!user) return

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
        .maybeSingle()

      if (existing) {
        // Find in allChats and select it
        const existingChat = allChats.find(
          (chat) => chat.type === 'conversation' && chat.conversation.id === existing.id
        )
        if (existingChat) {
          setSelectedChat(existingChat)
          setShowNewMessageModal(false)
          return
        }
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: otherUserId,
          context_type: 'profile',
        })
        .select()
        .single()

      if (error) throw error

      // Fetch other user's profile
      const { data: otherUserProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single()

      const newChat: ConversationWithDetails = {
        type: 'conversation',
        conversation: newConversation,
        otherUser: otherUserProfile!,
        unreadCount: 0,
      }

      setAllChats((prev) => [newChat, ...prev])
      setSelectedChat(newChat)
      setShowNewMessageModal(false)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation')
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return

    setSendingMessage(true)
    try {
      if (selectedChat.type === 'group') {
        console.log('Sending group message:', {
          group_chat_id: selectedChat.groupChat.id,
          sender_id: user.id,
          content: newMessage.trim()
        })
        
        const { data, error } = await supabase.from('group_messages').insert({
          group_chat_id: selectedChat.groupChat.id,
          sender_id: user.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.error('Group message error:', error)
          throw error
        }
        
        console.log('Group message sent successfully:', data)
      } else {
        console.log('Sending conversation message:', {
          conversation_id: selectedChat.conversation.id,
          sender_id: user.id,
          content: newMessage.trim()
        })
        
        const { data, error } = await supabase.from('messages').insert({
          conversation_id: selectedChat.conversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.error('Conversation message error:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
        
        console.log('Conversation message sent successfully:', data)
      }

      setNewMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(`Failed to send message: ${error.message || 'Unknown error'}`)
    } finally {
      setSendingMessage(false)
    }
  }

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'You'
    const member = members.find((m) => m.id === senderId)
    return member ? member.first_name : 'Unknown'
  }

  const deleteChat = async (chat: ChatItem, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) return
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return
    }

    const chatId = chat.type === 'group' ? chat.groupChat.id : chat.conversation.id
    setDeletingChatId(chatId)
    
    try {
      if (chat.type === 'group') {
        const { error } = await supabase
          .from('group_chat_members')
          .delete()
          .eq('group_chat_id', chat.groupChat.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', chat.conversation.id)

        if (error) throw error
      }

      await fetchAllChats()
      
      if (selectedChat === chat) {
        setSelectedChat(null)
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      alert('Failed to delete chat')
    } finally {
      setDeletingChatId(null)
    }
  }

  const getChatTitle = (chat: ChatItem) => {
    if (chat.type === 'group') {
      return chat.groupChat.name
    }
    return `${chat.otherUser.first_name} ${chat.otherUser.last_name}`
  }

  const getChatSubtitle = (chat: ChatItem) => {
    if (chat.type === 'group') {
      return `${chat.memberCount} members`
    }
    return chat.otherUser.username ? `@${chat.otherUser.username}` : ''
  }

  const getChatLastMessage = (chat: ChatItem) => {
    if (chat.type === 'group') {
      return chat.groupChat.last_message_preview
    }
    return chat.conversation.last_message_preview
  }

  const getChatLastMessageTime = (chat: ChatItem) => {
    if (chat.type === 'group') {
      return chat.groupChat.last_message_at
    }
    return chat.conversation.last_message_at
  }

  const getChatIcon = (chat: ChatItem) => {
    if (chat.type === 'conversation') {
      return chat.otherUser.first_name.charAt(0).toUpperCase()
    }

    // Get sport from game
    const sport = chat.game?.sport?.toLowerCase()

    // Yoga emojis - randomly pick one for variety
    const yogaEmojis = ['🧘', '🧘‍♀️', '🧘‍♂️', '🕉️', '🌸', '🌺', '🪷', '✨', '🌿', '🕊️']
    
    // Pick emoji based on sport
    if (sport === 'yoga') {
      // Use game ID to consistently pick the same emoji for the same game
      const index = chat.game?.id ? parseInt(chat.game.id.substring(0, 8), 16) % yogaEmojis.length : 0
      return yogaEmojis[index]
    }
    
    // Default to tennis/pickleball emoji for other sports
    return '🎾'
  }

  if (selectedChat) {
    // Chat view
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="container mx-auto max-w-4xl">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
            >
              ← Back to chats
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-navy">{getChatTitle(selectedChat)}</h2>
                <p className="text-sm text-gray-600">{getChatSubtitle(selectedChat)}</p>
              </div>
              {selectedChat.type === 'group' && selectedChat.game && (
                <button
                  onClick={() => router.push(`/game/${selectedChat.game?.id}`)}
                  className="btn-outline text-sm"
                >
                  View Game
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-500">No messages yet. Be the first to say hello!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isMe = message.sender_id === user?.id
                  return (
                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-600">
                            {getSenderName(message.sender_id)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(parseISO(message.created_at), 'h:mm a')}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isMe
                              ? 'bg-neon-green text-navy'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
                placeholder="Type a message..."
                className="input-field flex-1"
                disabled={sendingMessage}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Chat list view
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">
              Messages
            </h1>
            <p className="text-gray-600">
              Game chats and conversations
            </p>
          </div>
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="btn-primary"
          >
            + New Message
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
            </div>
          ) : allChats.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500 mb-4">
                Join a game to start chatting with other players or start a new conversation
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/home')}
                  className="btn-outline"
                >
                  Find Games
                </button>
                <button
                  onClick={() => setShowNewMessageModal(true)}
                  className="btn-primary"
                >
                  New Message
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allChats.map((chat) => {
                const chatId = chat.type === 'group' ? chat.groupChat.id : chat.conversation.id
                return (
                  <div
                    key={chatId}
                    onClick={() => setSelectedChat(chat)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold">
                        {getChatIcon(chat)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {getChatTitle(chat)}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getChatLastMessageTime(chat) && (
                              <span className="text-xs text-gray-500">
                                {format(parseISO(getChatLastMessageTime(chat)!), 'MMM d')}
                              </span>
                            )}
                            <button
                              onClick={(e) => deleteChat(chat, e)}
                              disabled={deletingChatId === chatId}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              title="Delete chat"
                            >
                              {deletingChatId === chatId ? (
                                <span className="text-xs text-gray-500">...</span>
                              ) : (
                                <span className="text-red-600">🗑️</span>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{getChatSubtitle(chat)}</span>
                          {chat.type === 'group' && chat.game && (
                            <span className="text-xs text-gray-500">
                              • {format(parseISO(chat.game.game_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                        {getChatLastMessage(chat) && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {getChatLastMessage(chat)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessageModal(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchUsers(e.target.value)
                }}
                placeholder="Search by username or name..."
                className="input-field w-full"
                autoFocus
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {searching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green mx-auto"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No users found' : 'Start typing to search for users'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => startConversationWithUser(profile.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold">
                        {profile.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">
                          {profile.first_name} {profile.last_name}
                        </div>
                        {profile.username && (
                          <div className="text-sm text-gray-600">@{profile.username}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
