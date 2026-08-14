# Welcome to DevSense - Developer-ChatGPT Interactive Emotion Analysis Dashboard

This is a React (v19) based application that anaylzes the patterns, trends and correlations in the emotions of developers while using the ChatGPT for software development.

Raw Dataset (Source: DevGPT): https://github.com/NAIST-SE/DevGPT/tree/main
Emotion-Labeled Dataset (Source: CommiTune): https://github.com/anonymous-commit-emotion/reproducibility-pack-2025
Emotion Classifier Model (Source: Hugging Face): https://huggingface.co/microsoft/codebert-base


## Cloning and Running the Application

git clone https://github.com/jukebox3000/devsense-devgpt-emotion-analysis.git
npm i
npm run dev

## Tech Stack 
- React (v19)
- Redux Toolkit
- Recharts
- Tailwind CSS

## Processed data file structure

The folder `Emotion_UNIQUE` in root has the following structure:
1. metadata (contains meta-data about )
2. individual conversational metrics (contains specific metrics per conversation)
3. flattened prompt-answer pairs (contains flattened prompt-answer pairs of all conversations)


