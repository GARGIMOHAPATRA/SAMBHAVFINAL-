import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://127.0.0.1:8000';

export default function App() {

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  const [gloss, setGloss] = useState([]);
  const [english, setEnglish] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [history, setHistory] = useState([]);

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState(
    'Starting camera...'
  );


  // ============================================================
  // START WEBCAM
  // ============================================================

  useEffect(() => {

    startCamera();
    loadHistory();


    return () => {

      if (timerRef.current) {

        clearTimeout(
          timerRef.current
        );

      }


      if (recorderRef.current) {

        try {

          if (
            recorderRef.current.state !==
            'inactive'
          ) {

            recorderRef.current.stop();

          }

        } catch (error) {

          console.error(error);

        }

      }


      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach((track) => {

            track.stop();

          });

      }


      // Stop browser speech if running

      if (
        window.speechSynthesis
      ) {

        window.speechSynthesis.cancel();

      }

    };

  }, []);


  // ============================================================
  // CAMERA
  // ============================================================

  async function startCamera() {

    try {

      setStatus(
        'Starting camera...'
      );


      const stream =
        await navigator.mediaDevices.getUserMedia({

          video: {

            width: {
              ideal: 640,
            },

            height: {
              ideal: 480,
            },

            frameRate: {
              ideal: 30,
              max: 30,
            },

          },

          audio: false,

        });


      streamRef.current =
        stream;


      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();

      }


      setCameraReady(true);

      setStatus(
        'Camera ready. Show your sign.'
      );


    } catch (error) {

      console.error(
        'Camera error:',
        error
      );


      setCameraReady(false);

      setStatus(
        'Camera access failed'
      );


      alert(
        'Unable to access webcam. Please allow camera permission and try again.'
      );

    }

  }


  // ============================================================
  // LOAD HISTORY
  // ============================================================

  async function loadHistory() {

    try {

      console.log(
        'Loading session history...'
      );


      const response =
        await axios.get(
          `${BACKEND_URL}/history`
        );


      console.log(
        'History response:',
        response.data
      );


      if (
        Array.isArray(
          response.data
        )
      ) {

        setHistory(
          response.data
        );

      } else {

        console.error(
          'History response is not an array:',
          response.data
        );

        setHistory([]);

      }


    } catch (error) {

      console.error(
        'History loading failed:',
        error
      );


      if (error.response) {

        console.error(
          'History backend response:',
          error.response.data
        );

      }

    }

  }


  // ============================================================
  // RECORD SIGN
  // ============================================================

  async function captureSign() {

    try {

      if (!cameraReady) {

        alert(
          'Camera is not ready yet.'
        );

        return;

      }


      if (
        recording ||
        processing
      ) {

        return;

      }


      const stream =
        streamRef.current;


      if (!stream) {

        alert(
          'Camera stream not available.'
        );

        return;

      }


      // --------------------------------------------------------
      // Choose supported MIME type
      // --------------------------------------------------------

      let mimeType = '';


      if (
        MediaRecorder.isTypeSupported(
          'video/webm;codecs=vp9'
        )
      ) {

        mimeType =
          'video/webm;codecs=vp9';

      } else if (
        MediaRecorder.isTypeSupported(
          'video/webm;codecs=vp8'
        )
      ) {

        mimeType =
          'video/webm;codecs=vp8';

      } else if (
        MediaRecorder.isTypeSupported(
          'video/webm'
        )
      ) {

        mimeType =
          'video/webm';

      } else {

        alert(
          'Your browser does not support video recording.'
        );

        return;

      }


      const recorder =
        new MediaRecorder(
          stream,
          {
            mimeType: mimeType,
          }
        );


      recorderRef.current =
        recorder;


      const chunks = [];


      // --------------------------------------------------------
      // Collect recorded video
      // --------------------------------------------------------

      recorder.ondataavailable =
        (event) => {

          if (
            event.data &&
            event.data.size > 0
          ) {

            chunks.push(
              event.data
            );

          }

        };


      // --------------------------------------------------------
      // Recording finished
      // --------------------------------------------------------

      recorder.onstop =
        async () => {

          setRecording(false);

          setProcessing(true);

          setStatus(
            'Processing sign with AI model...'
          );


          try {

            if (
              chunks.length === 0
            ) {

              throw new Error(
                'No video data was recorded.'
              );

            }


            const videoBlob =
              new Blob(
                chunks,
                {
                  type: mimeType,
                }
              );


            console.log(
              'Recorded video size:',
              (
                videoBlob.size /
                1024 /
                1024
              ).toFixed(2),
              'MB'
            );


            // --------------------------------------------------
            // Send video to FastAPI
            // --------------------------------------------------

            const formData =
              new FormData();


            formData.append(
              'file',
              videoBlob,
              'sign.webm'
            );


            console.log(
              'Sending video to /predict-video...'
            );


            const response =
              await axios.post(
                `${BACKEND_URL}/predict-video`,
                formData
              );


            console.log(
              'Prediction response:',
              response.data
            );


            // --------------------------------------------------
            // Validate response
            // --------------------------------------------------

            if (!response.data) {

              throw new Error(
                'Empty response from backend.'
              );

            }


            if (
              response.data.success ===
              false
            ) {

              throw new Error(
                response.data.error ||
                'Prediction failed.'
              );

            }


            // --------------------------------------------------
            // Special cases
            // --------------------------------------------------

            if (
              response.data.word ===
              'No hand detected'
            ) {

              setStatus(
                'No hand detected. Please try again.'
              );


              alert(
                'No hand detected during recording.\n\n' +
                'Make sure your complete hand is visible inside the camera.'
              );


              return;

            }


            if (
              response.data.word ===
              'Prediction failed'
            ) {

              setStatus(
                'Prediction failed.'
              );


              alert(
                'The AI model could not predict the sign.'
              );


              return;

            }


            // --------------------------------------------------
            // Get prediction
            // --------------------------------------------------

            const predictedWord =
              response.data.word;


            const predictedConfidence =
              Number(
                response.data.confidence
              ) || 0;


            if (!predictedWord) {

              throw new Error(
                'Backend did not return a predicted word.'
              );

            }


            // --------------------------------------------------
            // Add prediction to gloss
            // --------------------------------------------------

            setGloss(
              (previousGloss) => [
                ...previousGloss,
                predictedWord,
              ]
            );


            setConfidence(
              predictedConfidence
            );


            // Gloss changed, so clear old English

            setEnglish('');


            setStatus(
              `Detected: ${predictedWord}`
            );


          } catch (error) {

            console.error(
              'Prediction error:',
              error
            );


            if (error.response) {

              console.error(
                'Backend response:',
                error.response.data
              );


              console.error(
                'Backend status:',
                error.response.status
              );

            }


            setStatus(
              'Prediction failed.'
            );


            alert(
              'Prediction failed.\n\n' +
              (
                error.response?.data?.error ||
                error.message ||
                'Check the backend terminal.'
              )
            );


          } finally {

            setProcessing(false);

          }

        };


      // --------------------------------------------------------
      // Recorder error
      // --------------------------------------------------------

      recorder.onerror =
        (event) => {

          console.error(
            'MediaRecorder error:',
            event
          );


          setRecording(false);

          setProcessing(false);


          setStatus(
            'Recording error'
          );


          alert(
            'An error occurred while recording.'
          );

        };


      // --------------------------------------------------------
      // Start recording
      // --------------------------------------------------------

      setRecording(true);


      setStatus(
        'Recording sign for 6 seconds...'
      );


      recorder.start(250);


      console.log(
        'Recording started'
      );


      // --------------------------------------------------------
      // Stop after 6 seconds
      // --------------------------------------------------------

      timerRef.current =
        setTimeout(
          () => {

            if (
              recorder.state !==
              'inactive'
            ) {

              recorder.stop();


              console.log(
                'Recording stopped after 6 seconds'
              );

            }

          },
          6000
        );


    } catch (error) {

      console.error(
        'Recording error:',
        error
      );


      setRecording(false);

      setProcessing(false);


      setStatus(
        'Recording failed'
      );


      alert(
        'Unable to record the sign.'
      );

    }

  }


  // ============================================================
  // CONVERT ISL GLOSS → ENGLISH
  // ============================================================

  async function convertToEnglish() {

    try {

      if (
        !Array.isArray(gloss) ||
        gloss.length === 0
      ) {

        alert(
          'Please record at least one sign first.'
        );

        return;

      }


      setStatus(
        'Converting ISL gloss to English...'
      );


      // --------------------------------------------------------
      // Convert array to string
      //
      // ["market", "go"]
      //
      // becomes
      //
      // "market go"
      // --------------------------------------------------------

      const glossText =
        gloss.join(' ').trim();


      console.log(
        'Gloss array:',
        gloss
      );


      console.log(
        'Gloss sent to backend:',
        glossText
      );


      if (!glossText) {

        throw new Error(
          'Gloss is empty.'
        );

      }


      // --------------------------------------------------------
      // POST /convert
      // --------------------------------------------------------

      const response =
        await axios.post(
          `${BACKEND_URL}/convert`,
          {
            gloss: glossText,
          }
        );


      console.log(
        'English conversion response:',
        response.data
      );


      if (!response.data) {

        throw new Error(
          'Empty response from backend.'
        );

      }


      if (
        response.data.success ===
        false
      ) {

        throw new Error(
          response.data.error ||
          'English conversion failed.'
        );

      }


      const englishSentence =
        response.data.english;


      if (
        !englishSentence ||
        typeof englishSentence !==
        'string'
      ) {

        throw new Error(
          'Backend did not return a valid English sentence.'
        );

      }


      // --------------------------------------------------------
      // Display English sentence
      // --------------------------------------------------------

      setEnglish(
        englishSentence
      );


      setStatus(
        'English sentence generated.'
      );


      // --------------------------------------------------------
      // IMPORTANT:
      // Backend has now saved the history.
      //
      // Reload it immediately.
      // --------------------------------------------------------

      await loadHistory();


    } catch (error) {

      console.error(
        'Conversion error:',
        error
      );


      if (error.response) {

        console.error(
          'Backend response:',
          error.response.data
        );


        console.error(
          'Backend status:',
          error.response.status
        );

      }


      setStatus(
        'English conversion failed.'
      );


      alert(
        'English sentence conversion failed.\n\n' +
        (
          error.response?.data?.error ||
          error.message ||
          'Check the backend.'
        )
      );

    }

  }


  // ============================================================
  // TEXT TO SPEECH
  // ============================================================

  async function speakText() {

    try {

      if (!english.trim()) {

        alert(
          'Please convert the ISL gloss to English first.'
        );

        return;

      }


      setStatus(
        'Converting text to speech...'
      );


      // --------------------------------------------------------
      // Browser speech synthesis
      // --------------------------------------------------------

      if (
        !('speechSynthesis' in window)
      ) {

        throw new Error(
          'Speech synthesis is not supported by this browser.'
        );

      }


      // Stop previous speech

      window.speechSynthesis.cancel();


      const utterance =
        new SpeechSynthesisUtterance(
          english
        );


      utterance.lang =
        'en-IN';


      utterance.rate =
        0.9;


      utterance.pitch =
        1;


      utterance.onstart =
        () => {

          setStatus(
            'Speaking English sentence...'
          );

        };


      utterance.onend =
        () => {

          setStatus(
            'Speech completed.'
          );

        };


      utterance.onerror =
        (event) => {

          console.error(
            'Speech synthesis error:',
            event
          );


          setStatus(
            'Speech failed.'
          );

        };


      window.speechSynthesis.speak(
        utterance
      );


    } catch (error) {

      console.error(
        'Speech error:',
        error
      );


      alert(
        'Speech generation failed.\n\n' +
        error.message
      );

    }

  }


  // ============================================================
  // CLEAR
  // ============================================================

  function clearAll() {

    setGloss([]);

    setEnglish('');

    setConfidence(0);


    setStatus(
      'Cleared. Show your next sign.'
    );

  }


  // ============================================================
  // REMOVE LAST WORD
  // ============================================================

  function removeLastWord() {

    setGloss(
      (previousGloss) => {

        if (
          previousGloss.length === 0
        ) {

          return previousGloss;

        }


        return previousGloss.slice(
          0,
          -1
        );

      }
    );


    setEnglish('');


    setStatus(
      'Last sign removed.'
    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div
      style={{
        fontFamily:
          'Arial, sans-serif',

        padding: '20px',

        maxWidth: '900px',

        margin: 'auto',
      }}
    >

      {/* ======================================================
          TITLE
      ======================================================= */}

      <h1>
        SAANKET — Sign → Text → Speech
      </h1>


      <p
        style={{
          color: '#555',
        }}
      >
        AI-powered Indian Sign Language
        recognition
      </p>


      {/* ======================================================
          CAMERA
      ======================================================= */}

      <div
        style={{
          position: 'relative',

          width: '640px',

          maxWidth: '100%',
        }}
      >

        <video
          ref={videoRef}

          autoPlay

          playsInline

          muted

          width="640"

          height="480"

          style={{
            width: '100%',

            height: 'auto',

            border:
              '2px solid black',

            borderRadius: '10px',

            background: 'black',
          }}
        />


        <div
          style={{
            position: 'absolute',

            top: '10px',

            left: '10px',

            background:
              'rgba(0,0,0,0.65)',

            color: 'white',

            padding:
              '6px 10px',

            borderRadius: '5px',

            fontSize: '14px',
          }}
        >

          {cameraReady
            ? 'Hand Tracking Active'
            : 'Camera Starting...'}

        </div>

      </div>


      {/* ======================================================
          STATUS
      ======================================================= */}

      <div
        style={{
          marginTop: '15px',

          padding: '10px',

          background: '#f5f5f5',

          borderRadius: '8px',
        }}
      >

        <b>Status:</b>{' '}

        {status}

      </div>


      {/* ======================================================
          RECORDING MESSAGE
      ======================================================= */}

      {recording && (

        <div
          style={{
            marginTop: '10px',

            padding: '10px',

            color: 'red',

            fontWeight: 'bold',
          }}
        >

          Recording sign for 6 seconds...

        </div>

      )}


      {processing && (

        <div
          style={{
            marginTop: '10px',

            padding: '10px',

            fontWeight: 'bold',
          }}
        >

          AI model is processing
          the video...

        </div>

      )}


      {/* ======================================================
          BUTTONS
      ======================================================= */}

      <div
        style={{
          marginTop: '20px',

          display: 'flex',

          gap: '10px',

          flexWrap: 'wrap',
        }}
      >

        <button
          onClick={captureSign}

          disabled={
            recording ||
            processing ||
            !cameraReady
          }

          style={{
            padding:
              '10px 15px',

            cursor:
              recording ||
              processing ||
              !cameraReady
                ? 'not-allowed'
                : 'pointer',
          }}
        >

          {recording
            ? 'Recording...'
            : processing
            ? 'Processing...'
            : 'Record Sign (6s)'}

        </button>


        <button
          onClick={convertToEnglish}

          disabled={
            gloss.length === 0 ||
            recording ||
            processing
          }

          style={{
            padding:
              '10px 15px',
          }}
        >

          Convert to English

        </button>


        <button
          onClick={speakText}

          disabled={
            !english.trim()
          }

          style={{
            padding:
              '10px 15px',
          }}
        >

          Speak

        </button>


        <button
          onClick={removeLastWord}

          disabled={
            gloss.length === 0
          }

          style={{
            padding:
              '10px 15px',
          }}
        >

          Remove Last

        </button>


        <button
          onClick={clearAll}

          style={{
            padding:
              '10px 15px',
          }}
        >

          Clear

        </button>

      </div>


      {/* ======================================================
          LATEST PREDICTION
      ======================================================= */}

      <h2>
        Latest Prediction
      </h2>


      <div
        style={{
          background: '#f0f0f0',

          padding: '15px',

          borderRadius: '8px',

          minHeight: '40px',
        }}
      >

        {gloss.length > 0 ? (

          <div>

            <div>

              <b>Word:</b>{' '}

              {
                gloss[
                  gloss.length - 1
                ]
              }

            </div>


            <div
              style={{
                marginTop: '5px',
              }}
            >

              <b>
                Confidence:
              </b>{' '}

              {(
                confidence * 100
              ).toFixed(2)}

              %

            </div>

          </div>

        ) : (

          'No prediction yet.'

        )}

      </div>


      {/* ======================================================
          ISL GLOSS
      ======================================================= */}

      <h2>
        ISL Gloss
      </h2>


      <div
        style={{
          background: '#f0f0f0',

          padding: '15px',

          borderRadius: '8px',

          minHeight: '50px',

          fontSize: '18px',
        }}
      >

        {gloss.length > 0
          ? gloss.join(' ')
          : 'Your detected signs will appear here.'}

      </div>


      {/* ======================================================
          ENGLISH SENTENCE
      ======================================================= */}

      <h2>
        English Sentence
      </h2>


      <div
        style={{
          background: '#e8f5e9',

          padding: '15px',

          borderRadius: '8px',

          minHeight: '50px',

          fontSize: '18px',
        }}
      >

        {english ||
          'Your English sentence will appear here.'}

      </div>


      {/* ======================================================
          SESSION HISTORY
      ======================================================= */}

      <h2>
        Session History
      </h2>


      {history.length === 0 ? (

        <p>
          No previous sessions.
        </p>

      ) : (

        history.map(
          (item, index) => (

            <div
              key={
                `${item.created_at}-${index}`
              }

              style={{
                border:
                  '1px solid #ccc',

                padding: '12px',

                marginBottom:
                  '10px',

                borderRadius: '8px',

                background:
                  '#fafafa',
              }}
            >

              <div>

                <b>
                  Gloss:
                </b>{' '}

                {item.gloss}

              </div>


              <div>

                <b>
                  English:
                </b>{' '}

                {item.english}

              </div>


              <div
                style={{
                  marginTop: '5px',

                  color: '#666',

                  fontSize: '13px',
                }}
              >

                {item.created_at}

              </div>

            </div>

          )
        )

      )}

    </div>

  );

}