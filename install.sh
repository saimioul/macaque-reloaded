#!/bin/bash

pip3 install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
