# Sautoyrs

[Sautoyrs](https://sautoyrs.oopus.info) is a web application that generates romantic and explicit sexual stories automatically using a large language model. It creates interactive narratives between two characters with customizable settings.

## Notes

- The application supports only browsers that are compatible with WebGPU. Most mobile browsers do not support WebGPU. We highly recommend using **Chrome or Firefox on a desktop or laptop to access Sautoyrs. (Recommended memory for Windows: 32GB)**
- Sautoyrs downloads the Gemma-2-Ataraxy-9B model (~5.2 GB) to your browser cache. To remove the cache, click the settings icon and select "Remove LLM Cache."  
- For reference, here are generation speed cases on Nvidia GTX 3070:  
  > Prefill: 14.7263 tokens/sec, Decoding: 1.3206 tokens/sec  
  > Prefill: 38.6973 tokens/sec, Decoding: 2.2036 tokens/sec  

  Here is the generation speed case on Apple M1 MacBook Pro
  >  prefill: 10.8472 tokens/sec, decoding: 4.5792 tokens/sec

- This application contains mature content and is intended for adult audiences only. Please use it responsibly and in compliance with all applicable laws and regulations.  

## Usage

Visit https://sautoyrs.oopus.info

![sautoyrs](https://github.com/user-attachments/assets/981613d3-aedb-4abb-b32f-34e429d94ee6)

1. Set the first character's gender.  
2. Set the second character's gender.  
3. Select the language.  
4. Confirm your age.  
5. Save your settings.  
6. Click the play button to start generating the story.  
7. Use the stop button to pause the generation at any time.  
8. After stopping, click the play button to start a new story.  

## Features

- Character customization (gender, background)  
- Automatic generation of characters' personas  
- Language selection  
- Real-time story generation 

## Technology Stack

- React
- Next.js
- TypeScript
- Tailwind CSS
- @mlc-ai/web-llm (webgpu) for AI model integration
- Lucide React for icons
- js-cookie for cookie management

## AI Model

The application uses the Gemma-2-Ataraxy-9B model from Hugging Face for story generation. The model is loaded and run directly in the browser using WebGPU technology.
