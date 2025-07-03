#!/bin/bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build 