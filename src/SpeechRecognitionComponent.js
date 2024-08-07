import React, { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const SpeechRecognitionComponent = ({ onCommand }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onCommand(transcript);
      resetTranscript();
    }
  }, [transcript, onCommand, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <div>
      <button onClick={SpeechRecognition.startListening} disabled={listening}>
        Start Listening
      </button>
      <button onClick={SpeechRecognition.stopListening} disabled={!listening}>
        Stop Listening
      </button>
      <button onClick={resetTranscript}>Reset Transcript</button>
      <p>Transcript: {transcript}</p>
    </div>
  );
};

export default SpeechRecognitionComponent;