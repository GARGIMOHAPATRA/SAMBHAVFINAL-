# SAMBHAV

<h3 align="center">Bridging Communication Through AI and Indian Sign Language</h3>

<p align="center">
  <img src="assets_jpg/sambhav-brand-strip.jpg" alt="Sambhav, HacKNomads, and Smart India Hackathon 2026" width="920" />
</p>

<p align="center">
  <a href="https://www.sih.gov.in/">Smart India Hackathon 2026</a> ·
  <strong>Team HacKNomads</strong> ·
  <strong>Medtech / Healthtech / Biotech</strong>
</p>

> Over 63 million people in India, or about 6.3% of the population, are hard of hearing. Though they do not regard their hearing loss as a disability, but rather a different way of life, their social interactions can be significantly limited.

**Sambhav** is an AI-powered, bidirectional communication platform that connects Indian Sign Language users and hearing users through **real-time speech/text ↔ ISL translation, a digital signing avatar, one-on-one video communication, accessible news reading, and ISL learning support**.

The project was developed for the **Smart India Hackathon 2026** by a team of six third-year students from the **Computer Science Engineering Department, Institute of Technical Education & Research (ITER), Siksha 'O' Anusandhan**.

> **Vision:** A world where every sign is understood and every voice is heard.

## Table of Contents

- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Why Sambhav](#why-sambhav)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Technical Approach](#technical-approach)
- [Tech Stack](#tech-stack)
- [Dataset and Metrics](#dataset-and-metrics)
- [Real-Time Communication and News Reading](#real-time-communication-and-news-reading)
- [Feasibility and Viability](#feasibility-and-viability)
- [Challenges and Mitigation](#challenges-and-mitigation)
- [Use Cases and Future Scope](#use-cases-and-future-scope)
- [Impact](#impact)
- [Getting Started](#getting-started)
- [Team](#team)
- [Research and References](#research-and-references)
- [License](#license)

## The Problem

Imagine knowing exactly what you want to say, but the person in front of you does not understand your language.

For deaf and hard-of-hearing individuals who communicate through Indian Sign Language, everyday conversations can become difficult when the other person does not understand sign language. This barrier affects education, healthcare, workplaces, public services, news, and daily social interaction. Existing solutions may depend on human interpreters or support only one direction of communication.

The real challenge is not the ability to communicate. It is the lack of a common, accessible, and spontaneous medium between ISL users and hearing users.

<p align="center">
  <img src="assets_jpg/sambhav-problem-solution.jpg" alt="Sambhav problem statement and proposed solution" width="880" />
</p>

## Our Solution

Sambhav combines AI, natural-language processing, computer vision, a 3D avatar, and real-time communication services in one accessibility platform.

| Communication direction | Input | Processing | Output |
|---|---|---|---|
| **Speech/Text → ISL** | Speech or typed text from a hearing user | Speech recognition, NLP, ISL gloss generation, movement-sequence mapping | ISL signs rendered through a digital avatar |
| **ISL → Speech/Text** | Live webcam video from an ISL user | OpenCV frames, MediaPipe landmarks, sequence processing, BiLSTM classification | Recognized text and speech for the hearing user |

The platform is designed to work with standard webcams, microphones, and commodity devices. It is modular so that new signs, models, avatar libraries, languages, and accessibility services can be added over time.

## Why Sambhav

| Capability | What makes it important |
|---|---|
| **Bidirectional ISL communication** | Supports both ISL-to-speech/text and speech/text-to-ISL interaction. |
| **Indian Sign Language focus** | Designed for ISL classes, landmarks, glosses, and communication patterns. |
| **AI + NLP + digital avatar** | Unifies recognition, language processing, and visual sign rendering. |
| **Interpreter-independent interaction** | Helps users communicate spontaneously without requiring an interpreter for every exchange. |
| **Web and mobile orientation** | Designed around cross-platform access through common cameras, microphones, and network services. |
| **Beyond translation** | Extends into news reading, learning, culture, history, AI assistance, and accessible information. |

<p align="center">
  <img src="assets_jpg/sambhav-innovation-features.jpg" alt="Sambhav innovation and core feature visual" width="950" />
</p>

## Core Features

### Communication

- Real-time ISL recognition from webcam input.
- Speech-to-text for hearing users.
- Speech/text-to-ISL output through an animated avatar.
- ISL-to-text and ISL-to-speech output.
- One-on-one video rooms using LiveKit and WebRTC.
- Chat, conversation history, logs, profiles, and preferences.

### Accessibility and Information

- News and digital-content conversion into ISL-oriented output.
- Integrated AI assistant and knowledge access.
- ISL learning courses and practice resources.
- Accessible education support for deaf students.
- Cultural content, historical storytelling, and sign-language awareness.

## System Architecture

<p align="center">
  <img src="assets_jpg/sambhav-architecture.jpg" alt="Clean cropped Sambhav system architecture" width="940" />
</p>

Sambhav is organized into a frontend layer, backend services, data services, AI/ML services, real-time communication, and external speech/avatar/cloud integrations.

```text
Deaf user: webcam sign input ─┐
                              ├─> Web / Mobile Frontend
Hearing user: speech/text ────┘              │
                                             v
                         FastAPI / Spring Boot Backend
                                             │
          ┌──────────────────────────────────┼──────────────────────────────────┐
          v                                  v                                  v
   ISL Recognition                    Speech/Text → ISL                 LiveKit / WebRTC
   OpenCV + MediaPipe                NLP + gloss + avatar               One-on-one rooms
          │                                  │                                  │
          v                                  v                                  v
   BiLSTM prediction                  Digital ISL avatar                 Chat and sessions
          │                                  │                                  │
          └──────────────────────────────────┼──────────────────────────────────┘
                                             v
                               PostgreSQL + history + preferences
```

### Speech/Text → ISL

```text
Speech or typed text
        ↓
Speech-to-text, cleaning, tokenization, and NLP
        ↓
ISL gloss generation
        ↓
Movement and landmark-sequence mapping
        ↓
3D avatar animation
        ↓
Visual ISL output
```

### ISL → Speech/Text

```text
Live webcam video
        ↓
OpenCV frame processing
        ↓
MediaPipe hand-landmark extraction
        ↓
60-frame temporal sequence
        ↓
Standardization
        ↓
Bidirectional LSTM classification
        ↓
ISL class + confidence score
        ↓
Text and speech output
```

## Technical Approach

### Model 1: Speech/Text to ISL

The first model accepts speech or text, prepares the input using speech recognition and NLP, converts the result into ISL glosses, and maps the gloss sequence to avatar movements. The objective is to provide a visual sign-language response that can be understood by an ISL user.

<p align="center">
  <img src="assets_jpg/model-speech-to-isl.jpg" alt="Speech and text to ISL model pipeline" width="650" />
</p>

### Model 2: ISL to Speech/Text

The second model processes live signing video. OpenCV prepares frames, MediaPipe extracts hand landmarks, and the temporal landmark sequence is classified by a bidirectional LSTM.

Each frame contains:

```text
2 hands × 21 landmarks × 3 coordinates (x, y, z) = 126 features per frame
```

The model uses a 60-frame sequence, represented as **60 × 126**, and predicts one of the supported ISL classes with a confidence score.

<p align="center">
  <img src="assets_jpg/model-isl-to-speech.jpg" alt="ISL to speech and text model pipeline" width="650" />
</p>

## Tech Stack

All technology-stack visuals below are **local images extracted and cropped from the Sambhav project PDF**. No external image-hosting links are used for the stack panels.

### Frontend

<p align="center">
  <img src="assets_jpg/tech-frontend.jpg" alt="Frontend technologies: React 19, TypeScript, Vite 8, Tailwind CSS, HTML5/CSS3, and JavaScript" width="620" />
</p>

The frontend uses **React 19, TypeScript, Vite 8, Tailwind CSS, HTML5, CSS3, and JavaScript** to provide a responsive web interface for communication, translation, profiles, history, and accessible content.

### Backend

<p align="center">
  <img src="assets_jpg/tech-backend.jpg" alt="Backend technologies: Python, FastAPI, Uvicorn, Node.js, Java, Spring Boot, and Spring Security" width="620" />
</p>

The backend layer combines **Python 3.10, FastAPI, Uvicorn, Node.js, Java 21, Spring Boot 3.4, and Spring Security** for API routing, service orchestration, authentication, and model integration.

### AI and Machine Learning

<p align="center">
  <img src="assets_jpg/tech-ai-ml.jpg" alt="AI and machine-learning technologies used by Sambhav" width="620" />
</p>

The AI/ML layer uses **TensorFlow 2.20, MediaPipe, OpenCV, BiLSTM/LSTM models, NLTK, PyAudio, speech recognition, Web Speech API, and gTTS**.

### Data and Models

<p align="center">
  <img src="assets_jpg/tech-data-models.jpg" alt="Sambhav data and model technologies" width="620" />
</p>

Sambhav uses MediaPipe landmarks, JSON data, sequential landmark representations, TensorFlow/Keras models, and PostgreSQL-backed application data.

### Communication APIs, Speech, Cloud, and Database

<p align="center">
  <img src="assets_jpg/tech-communication-apis.jpg" alt="Sambhav communication and API technologies" width="920" />
</p>

<p align="center">
  <img src="assets_jpg/tech-speech.jpg" alt="Sambhav speech technologies" width="280" />
  <img src="assets_jpg/tech-cloud-devops.jpg" alt="Sambhav cloud and DevOps technologies" width="340" />
  <img src="assets_jpg/tech-database.jpg" alt="Sambhav database technology" width="250" />
</p>

The communication layer uses **REST APIs, WebSockets, LiveKit, WebRTC, speech recognition, Google speech services, Docker, Git/GitHub, and PostgreSQL**.

## Dataset and Metrics

The following values are reported in the Sambhav project deck. They describe the current prototype evaluation and should be revalidated on a held-out production dataset before deployment-grade claims are made.

### Dataset Summary

| Measure | Reported value |
|---|---:|
| Total ISL video samples | **5,399** |
| Successfully extracted samples | **5,398 / 5,399** |
| Supported ISL classes | **169** |
| Features per frame | **126** |
| Temporal window | **60 frames** |
| Model input representation | **60 × 126** |

### Speech/Text → ISL Metrics

| Metric | Result |
|---|---:|
| Training accuracy | **99.41%** |
| Test accuracy | **77.42%** |
| Validation accuracy | **77.78%** |

<p align="center">
  <img src="assets_jpg/metrics-speech-to-isl.jpg" alt="Speech to ISL accuracy and loss metrics" width="720" />
</p>

### ISL → Speech/Text Metrics

| Metric | Result |
|---|---:|
| Training accuracy | **83.48%** |
| Test accuracy | **70.49%** |
| Validation accuracy | **71.60%** |

<p align="center">
  <img src="assets_jpg/metrics-isl-to-speech.jpg" alt="ISL to speech and text accuracy and loss metrics" width="720" />
</p>

## Real-Time Communication and News Reading

Sambhav places translation inside an accessible communication experience instead of treating it as an isolated classifier. LiveKit/WebRTC provides one-on-one communication rooms, while the backend manages authentication, sessions, chat, history, preferences, and logs.

The news-reading module is intended to convert news and digital articles into a more accessible experience for ISL users. A typical flow is:

```text
News article or digital content
        ↓
Text extraction and cleanup
        ↓
Summary and language processing
        ↓
ISL gloss and movement-sequence generation
        ↓
Avatar-based or video-based signing output
```

The same foundation can support learning courses, cultural content, historical storytelling, and an AI assistant for accessible knowledge access.

## Feasibility and Viability

| Area | Sambhav position |
|---|---|
| **Technical** | Uses established AI components, MediaPipe, sequence models, webcams, microphones, and commodity hardware. |
| **Modular** | Frontend, backend, data, and model services can be updated independently. |
| **Operational** | Supports real-time interaction through webcam, microphone, speech, text, and avatar output. |
| **Economic** | Uses open-source technologies and standard hardware to reduce licensing and infrastructure costs. |
| **Scalable** | Can expand its ISL vocabulary, avatar library, languages, domains, and learning content. |
| **Deployable** | Web-based and service-oriented architecture supports deployment across platforms. |
| **Socially viable** | Targets education, healthcare, employment, public services, communication, and digital participation. |

## Challenges and Mitigation

| Challenge | Mitigation |
|---|---|
| Similar-looking ISL signs | Diverse training data and temporal BiLSTM learning. |
| Misclassification | Confidence scores and prediction validation. |
| Hand-detection failure | Hand-detection validation and frame-quality checks. |
| Lighting/background variation | MediaPipe landmark representation and diverse capture conditions. |
| Limited vocabulary | Expandable ISL class library and incremental retraining. |
| User-to-user variation | Diverse users, signing styles, and environments in the dataset. |
| Real-time latency | Optimized landmarks, sequence processing, and transport. |
| Avatar scalability | Modular sign library and expandable avatar pipeline. |

## Use Cases and Future Scope

### Use Cases

- **Daily communication:** bidirectional sign ↔ speech/text communication.
- **Education:** ISL learning resources, courses, classroom communication, and accessible online learning.
- **Healthcare:** basic communication between deaf patients and healthcare professionals.
- **Public services:** interaction in government offices, banks, transport, and service centers.
- **Digital accessibility:** inclusive websites, applications, news, and media.
- **Culture and history:** avatar-led storytelling, cultural music, and accessible heritage content.
- **Workplaces:** interview access, professional communication, and employment inclusion.

<p align="center">
  <img src="assets_jpg/use-cases-business.jpg" alt="Sambhav use cases and business potential" width="900" />
</p>

### Future Scope

- Expand the ISL vocabulary and support additional alphabets, signs, and regional variations.
- Add multilingual and multi-domain translation.
- Improve robustness across lighting, backgrounds, camera positions, and signing styles.
- Add richer avatar libraries and more expressive sign animation.
- Develop mobile applications for Android and iOS.
- Add institutional SaaS deployments for schools, hospitals, NGOs, and government services.
- Publish APIs and SDKs for accessibility integrations.
- Extend news, courses, AI-assistant, history, culture, and public-service modules.
- Improve confidence calibration and add user-facing correction feedback for continuous learning.

## Impact

Sambhav aims to transform communication barriers into real-time connections and improve independence, inclusion, and equal opportunity for the deaf community.

| Impact area | Benefit |
|---|---|
| **Social inclusion** | Supports equal participation in daily conversations and communities. |
| **Education access** | Helps deaf students communicate with teachers and peers. |
| **Healthcare improvement** | Reduces communication friction between patients and professionals. |
| **Employment** | Supports workplace communication, interviews, and professional growth. |
| **Public services** | Improves access to government offices, banks, transport, and essential services. |
| **Cultural participation** | Makes news, media, cultural events, and online communities more accessible. |
| **Future readiness** | Provides a modular base for more vocabulary, domains, languages, and services. |

<p align="center">
  <img src="assets_jpg/impact-benefits.jpg" alt="Sambhav impact and benefits" width="850" />
</p>

<p align="center">
  <img src="assets_jpg/vision-flow.jpg" alt="Sambhav communication barrier to inclusion vision flow" width="850" />
</p>

## Getting Started

The supplied project materials describe the architecture and technology stack but do not include the final repository URL, environment files, deployment URL, or release build. The commands below are a clean starting template and should be adjusted to match the final repository folders.

### Prerequisites

- Python 3.10 for the AI/ML and FastAPI services.
- Node.js and npm/pnpm for the React/Vite frontend.
- Java 21 if the Spring Boot service is enabled.
- PostgreSQL for persistent data.
- A webcam and microphone for real-time interaction.
- Docker for containerized deployment, if used.

### Suggested Local Setup

```bash
# Replace <YOUR_REPOSITORY_URL> with the final repository URL.
git clone <YOUR_REPOSITORY_URL>
cd sambhav

# Frontend
cd frontend
npm install
npm run dev

# Python AI/ML service
cd ../backend-python
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload

# Optional Java service
cd ../backend-java
./mvnw spring-boot:run
```

### Usage Flow

1. Start the frontend and required backend/model services.
2. Sign in or create a user profile.
3. Join or create a one-on-one LiveKit communication room.
4. Use speech/text input to display the response through the ISL avatar.
5. Use webcam input to recognize ISL and produce text or speech output.
6. Open the news-reading or learning module when accessible content is required.

## Team

**HacKNomads** is a six-member student team from the **Institute of Technical Education & Research (ITER), Siksha 'O' Anusandhan**, Computer Science Engineering Department.

| Member | Profile |
|---|---|
| Team member 1 | SUBHAM NAYAK |
| Team member 2 | MOHAPATRA S.H GARGI |
| Team member 3 | B.VINEET PATRO |
| Team member 4 | SIDHARTH KUMAR |
| Team member 5 | SHREYA KASHYAP |
| Team member 6 | AVISHEK RAUL |

## Research and References

1. Kazbekova, Gulnur, et al. “Real-Time Lightweight Sign Language Recognition on Hybrid Deep CNN-BiLSTM Neural Network with Attention Mechanism.” *International Journal of Advanced Computer Science & Applications*, 16.4 (2025): 510.
2. Kumar, Sujay Grama Suresh, and Jad Abbass. “Enhancing Sign Language Communication: Advanced Gesture Recognition Models for Indian Sign Language.” *2025 International Research Conference on Smart Computing and Systems Engineering (SCSE)*. IEEE, 2025.
3. Chemnad, Khansa, and Achraf Othman. “Perception and Monitoring of Sign Language Acquisition for Avatar Technologies: A Rapid Focused Review (2020–2025).” *Multimodal Technologies and Interaction*, 9.8 (2025): 82.
4. Edirisinghe, E. A. M. N., et al. “AI-Driven 3D Avatar Framework for Sign Language Translation and Gesture Representation.” *2025 7th International Conference on Advancements in Computing (ICAC)*. IEEE, 2025.
5. Kumar, Malay, et al. “Enhanced Sign Language Translation Between American Sign Language and Indian Sign Language Using LLMs.” *IEEE Access*, 2025.

### Technology Documentation

- [Smart India Hackathon](https://www.sih.gov.in/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Spring Boot](https://spring.io/projects/spring-boot)
- [PostgreSQL](https://www.postgresql.org/)
- [TensorFlow](https://www.tensorflow.org/)
- [MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/guide)
- [OpenCV](https://opencv.org/)
- [LiveKit](https://livekit.io/)
- [WebRTC](https://webrtc.org/)
- [Docker](https://www.docker.com/)

<p align="center">
  <img src="assets_jpg/comparison-table.jpg" alt="Sambhav feature comparison with existing systems" width="900" />
</p>

## License

No license was specified in the supplied materials. Add a license before publishing the repository. Until the team decides, the following statement can be used as a temporary academic-use notice:

> This project was developed for academic and Smart India Hackathon demonstration purposes. Redistribution of datasets, trained models, third-party assets, or deployment credentials is subject to their respective licenses and permissions.

## Acknowledgements

The Sambhav team acknowledges the Indian Sign Language community, accessibility advocates, research community, open-source maintainers, and all contributors working toward more inclusive communication technology.

<p align="center">
  <strong>From communication barriers to real-time inclusion.</strong>
</p>
