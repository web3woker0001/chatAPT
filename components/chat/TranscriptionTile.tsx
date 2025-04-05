import { ChatMessageType, ChatTile } from "@/components/chat/ChatTile";
import {
  TrackReferenceOrPlaceholder,
  useChat,
  useLocalParticipant,
  useTrackTranscription,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import {
  LocalParticipant,
  Participant,
  Track,
  TranscriptionSegment,
} from "livekit-client";
import { useEffect, useState, useRef, useMemo } from "react";

export function TranscriptionTile({
  agentAudioTrack,
  accentColor,
}: {
  agentAudioTrack?: TrackReferenceOrPlaceholder;
  accentColor: string;
}) {
  // 获取本地参与者信息
  const { localParticipant, microphoneTrack } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  
  // 获取所有远程参与者的音频轨道
  const remoteTracks = useTracks(remoteParticipants).filter(
    track => track.source === Track.Source.Microphone &&
    (!agentAudioTrack || track.sid !== agentAudioTrack.sid)
  );
  
  // 获取转录
  const agentTranscription = useTrackTranscription(agentAudioTrack || undefined);
  const localTranscription = useTrackTranscription({
    publication: microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant,
  });

  // 获取所有远程参与者的转录
  const remoteTranscriptions = useMemo(() => 
    remoteTracks.map(track => ({
      track,
      transcription: useTrackTranscription(track),
    })), [remoteTracks]);

  // 状态管理
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const { chatMessages, send: sendChat } = useChat();
  
  // 使用 useRef 来跟踪上一次的消息，避免不必要的更新
  const prevMessagesRef = useRef<ChatMessageType[]>([]);
  
  // 使用 useMemo 来缓存参与者信息
  const participantInfo = useMemo(() => {
    const info: Record<string, string> = {};
    
    // 添加本地参与者
    if (localParticipant?.identity) {
      info[localParticipant.identity] = "You";
    }
    
    // 添加代理参与者
    if (agentAudioTrack?.participant?.identity) {
      info[agentAudioTrack.participant.identity] = "Agent";
    }
    
    // 添加远程参与者
    remoteParticipants.forEach(participant => {
      if (participant.identity) {
        info[participant.identity] = participant.name || `User ${participant.identity.slice(0, 4)}` || "Unknown";
      }
    });
    
    return info;
  }, [localParticipant?.identity, agentAudioTrack?.participant?.identity, remoteParticipants]);

  // 处理转录和消息更新
  useEffect(() => {
    // 创建一个新的消息数组
    const transcriptionMessages: ChatMessageType[] = [];
    
    // 处理本地转录
    if (localTranscription.segments.length > 0) {
      localTranscription.segments.forEach((segment) => {
        transcriptionMessages.push({
          message: segment.final ? segment.text : `${segment.text} ...`,
          name: "You",
          isSelf: true,
          timestamp: Date.now(),
        });
      });
    }

    // 处理代理转录
    if (agentTranscription.segments.length > 0) {
      agentTranscription.segments.forEach((segment) => {
        transcriptionMessages.push({
          message: segment.final ? segment.text : `${segment.text} ...`,
          name: "Agent",
          isSelf: false,
          timestamp: Date.now(),
        });
      });
    }

    // 处理其他远程参与者的转录
    remoteTranscriptions.forEach(({ track, transcription }) => {
      if (transcription.segments.length > 0) {
        const participant = track.participant;
        const participantName = participant?.name || 
          (participant?.identity ? `User ${participant.identity.slice(0, 4)}` : "Unknown");
        
        transcription.segments.forEach((segment) => {
          transcriptionMessages.push({
            message: segment.final ? segment.text : `${segment.text} ...`,
            name: participantName,
            isSelf: false,
            timestamp: Date.now(),
          });
        });
      }
    });

    // 处理聊天消息
    chatMessages.forEach((msg) => {
      const isAgent = agentAudioTrack
        ? msg.from?.identity === agentAudioTrack.participant?.identity
        : false;
      
      const isSelf = msg.from?.identity === localParticipant?.identity;
      
      // 使用缓存的参与者信息
      let name = msg.from?.name;
      if (!name && msg.from?.identity) {
        name = participantInfo[msg.from.identity] || "Unknown";
      }

      transcriptionMessages.push({
        name,
        message: msg.message,
        timestamp: msg.timestamp,
        isSelf,
      });
    });

    // 按时间戳排序
    transcriptionMessages.sort((a, b) => a.timestamp - b.timestamp);
    
    // 检查消息是否有变化，避免不必要的更新
    const hasMessagesChanged = JSON.stringify(transcriptionMessages) !== JSON.stringify(prevMessagesRef.current);
    
    if (hasMessagesChanged) {
      setMessages(transcriptionMessages);
      prevMessagesRef.current = [...transcriptionMessages]; // 创建新数组而不是引用
    }
  }, [
    // 使用更精确的依赖项，避免不必要的重新计算
    localTranscription.segments.length,
    agentTranscription.segments.length,
    remoteTranscriptions.map(({ transcription }) => transcription.segments.length).join(','),
    chatMessages.length,
    participantInfo,
  ]);

  return (
    <ChatTile 
      messages={messages} 
      accentColor={accentColor} 
      onSend={sendChat}
      height="calc(100vh - 200px)"
    />
  );
} 