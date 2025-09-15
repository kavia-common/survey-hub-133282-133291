#!/bin/bash
cd /home/kavia/workspace/code-generation/survey-hub-133282-133291/survey_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

