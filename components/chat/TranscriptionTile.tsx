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
import { useCallback, useEffect, useRef, useState } from "react";

// 创建一个单独的组件来处理远程转录
function RemoteParticipantTranscription({
  track,
  onTranscription,
}: {
  track: TrackReferenceOrPlaceholder;
  onTranscription: (segments: TranscriptionSegment[], participant: Participant) => void;
}) {
  const transcription = useTrackTranscription(track);

  useEffect(() => {
    if (transcription.segments.length > 0) {
      onTranscription(transcription.segments, track.participant);
    }
  }, [transcription.segments, track.participant, onTranscription]);

  return null;
}

export function TranscriptionTile({
  accentColor,
}: {
  accentColor: string;
}) {
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const remoteTracks = useTracks(remoteParticipants).filter(
    track => track.source === Track.Source.Microphone
  );

  // 本地参与者的转录
  const localMessages = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const { chatMessages, send: sendChat } = useChat();
  const transcriptsRef = useRef(new Map<string, ChatMessageType>());

  // 处理远程转录的回调
  const handleRemoteTranscription = useCallback((segments: TranscriptionSegment[], participant: Participant) => {
    const newTranscripts = new Map(transcriptsRef.current);
    segments.forEach((s) =>
      newTranscripts.set(
        s.id,
        segmentToChatMessage(s, newTranscripts.get(s.id), participant)
      )
    );
    transcriptsRef.current = newTranscripts;
    updateMessages();
  }, []);

  // 更新消息的函数
  const updateMessages = useCallback(() => {
    const allMessages = Array.from(transcriptsRef.current.values());
    
    // 添加聊天消息
    chatMessages.forEach(msg => {
      const isSelf = msg.from?.identity === localParticipant.localParticipant.identity;
      let name = msg.from?.name;
      if (!name) {
        if (isSelf) {
          name = localParticipant.localParticipant.name || "You";
        } else {
          const participant = remoteParticipants.find(
            p => p.identity === msg.from?.identity
          );
          name = participant?.name || "Unknown";
        }
      }
      allMessages.push({
        name,
        message: msg.message,
        timestamp: msg.timestamp,
        isSelf,
      });
    });

    // 排序并更新状态
    allMessages.sort((a, b) => a.timestamp - b.timestamp);
    setMessages(allMessages);
  }, [chatMessages, localParticipant.localParticipant, remoteParticipants]);

  // 处理本地转录
  useEffect(() => {
    const newTranscripts = new Map(transcriptsRef.current);
    localMessages.segments.forEach((s) =>
      newTranscripts.set(
        s.id,
        segmentToChatMessage(
          s,
          newTranscripts.get(s.id),
          localParticipant.localParticipant
        )
      )
    );
    transcriptsRef.current = newTranscripts;
    updateMessages();
  }, [localMessages.segments, localParticipant.localParticipant, updateMessages]);

  // 处理聊天消息更新
  useEffect(() => {
    updateMessages();
  }, [updateMessages]);

  return (
    <>
      {remoteTracks.map((track) => (
        <RemoteParticipantTranscription
          key={track.sid}
          track={track}
          onTranscription={handleRemoteTranscription}
        />
      ))}
      <ChatTile messages={messages} accentColor={accentColor} onSend={sendChat} />
    </>
  );
}

function segmentToChatMessage(
  s: TranscriptionSegment,
  existingMessage: ChatMessageType | undefined,
  participant: Participant
): ChatMessageType {
  const msg: ChatMessageType = {
    message: s.final ? s.text : `${s.text} ...`,
    name: participant.name || participant.identity || (participant instanceof LocalParticipant ? "You" : "Unknown"),
    isSelf: participant instanceof LocalParticipant,
    timestamp: existingMessage?.timestamp ?? Date.now(),
  };
  return msg;
} 