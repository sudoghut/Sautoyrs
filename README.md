# Sautoyrs

Sautoyrs is a web application that generates romantic and explicit sexual stories automatically using a large language model. It creates interactive narratives between two characters with customizable settings.

## Notes

- It only supports browsers that are compatible with WebGPU. Most cellphone browsers do not support WebGPU. We highly recommend using Chrome or Firefox to access Sautoyrs on your desktop or laptop.

- Sautoyrs will download the Gemma-2-Ataraxy-9B model, which is ~5.2GB, to your browser cache. To remove the cache, click the settings icon and then select "Remove Cache."

- For reference, here is the generation speed on my GTR 3070:

> Prefill: 38.6973 tokens/sec, Decoding: 2.2036 tokens/sec

- This application contains mature content and is intended for adult audiences only. Please use responsibly and in accordance with all applicable laws and regulations.

## Usage

1. Configure your story parameters:  
   - Set character genders  
   - Choose a language  
   - Confirm your age (18+)  

2. Click the play button to start generating the story.  
3. Use the stop button to pause the generation at any time.  
4. After stopping, clicking the play button will start a new story.

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
