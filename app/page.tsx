"use client"
import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { 
  PlayCircle, 
  StopCircle, 
  Infinity,
  Undo,
  FastForward,
  Rewind,
  Settings
} from 'lucide-react';
import * as webllm from "@mlc-ai/web-llm";
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

function setLabel(id: string, text: string) {
  const label = document.getElementById(id);
  if (label == null) {
    throw Error("Cannot find label " + id);
  }
  label.innerText = text;
}


export default function Home() {
  const stopTrigger = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isRunning = useRef(false);
  const isRoleOne = useRef(false);
  const chatThread = useRef<ChatCompletionMessageParam[]>([]);
  const engineRef = useRef<webllm.MLCEngineInterface | null>(null);
  const initializeWebLLMEngine = async (selectedModel: string, modelLib: string, modelUrl: string, llmTemp: number, llmTopP: number): Promise<webllm.MLCEngineInterface | null> => {
    console.log("Initialize Engine check 1: Start");
    console.log(isRunning.current)
    console.log("Initialize Engine check 2: ready to initialize");
    isRunning.current = true;
    const initProgressCallback = (report: webllm.InitProgressReport) => {
      setLabel("status-label", report.text);
    };
    const appConfig: webllm.AppConfig = {
      model_list: [
        {
          model: modelUrl,
          model_id: selectedModel,
          model_lib: modelLib,
        },
      ],
    };
    const engine: webllm.MLCEngineInterface = await webllm.CreateMLCEngine(
      selectedModel,
      { appConfig: appConfig, initProgressCallback: initProgressCallback,
        logLevel: "INFO",
      },
      {
        context_window_size: -1,
        temperature: llmTemp,
        top_p: llmTopP,
        // max_new_tokens: 100,
        sliding_window_size: 500,
        attention_sink_size: 0,
      },

    );
    console.log("Initialize Engine check 3: Engine initialized");
    return engine;
  }

  function updateLastMessage(content: string) {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      const messageDoms = chatBox.querySelectorAll(".message");
      const lastMessageDom = messageDoms[messageDoms.length - 1];
      lastMessageDom.textContent = content;
      scrollToBottom();
    }
  }

  const onFinishGenerating = (finalMessage: string, usage: { prompt_tokens: number; completion_tokens: number; extra: { prefill_tokens_per_s: number; decode_tokens_per_s: number; } }) => {
    updateLastMessage(finalMessage);
    const usageText =
      `prompt_tokens: ${usage.prompt_tokens}, ` +
      `completion_tokens: ${usage.completion_tokens}, ` +
      `prefill: ${usage.extra.prefill_tokens_per_s.toFixed(4)} tokens/sec, ` +
      `decoding: ${usage.extra.decode_tokens_per_s.toFixed(4)} tokens/sec`;
    const chatStats = document.getElementById("status-label");
    if (chatStats) {
      chatStats.textContent = usageText;
    }
  };

  function scrollToBottom() {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function appendMessage(message: ChatCompletionMessageParam) {
    // console.log("Append message check 1:");
    // console.log("message", message);
    const chatBox = document.getElementById("chat-box");
    const container = document.createElement("div");
    container.classList.add("message-container");
    if (isRoleOne.current === false) {
      // console.log("Append message check 2:");
      // console.log("Adding user message", message);
      container.classList.add("user");
      container.classList.add(
        "bg-gradient-to-r",
        "from-blue-500/10",
        "to-blue-600/10",
        "border-l-4",
        "border-blue-500",
        "p-4"
      );
    } else {
      console.log("Append message check 2:");
      console.log("Adding assistant message", message);
      container.classList.add("assistant");
      container.classList.add(
        "bg-gradient-to-r",
        "from-green-500/10",
        "to-green-600/10",
        "border-l-4",
        "border-green-500",
        "p-4"
      );
    }

    const newMessage = document.createElement("div");
    newMessage.classList.add("message");
    if (isRoleOne.current === false) {
      newMessage.classList.add("text-blue-400");
    } else {
      newMessage.classList.add("text-green-400");
    }
    newMessage.textContent = typeof message.content === 'string' ? message.content : '';

  
    container.appendChild(newMessage);
    if (chatBox) {
      chatBox.appendChild(container);
      scrollToBottom();
    }
    // console.log("Append message check 3: End");
  }

  function updatechatThreadFromDom() { 
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      const messageContainers = chatBox.querySelectorAll(".message-container");
      chatThread.current = [];
      messageContainers.forEach((container) => {
        const role = container.classList.contains("user") ? "user" : "assistant";
        const messageDom = container.querySelector(".message");
        if (role === "user") {
          chatThread.current.push({ role: "user", content: messageDom ? messageDom.textContent : "" } as ChatCompletionMessageParam);
        } else {
          chatThread.current.push({ role: "assistant", content: messageDom ? messageDom.textContent : "" } as ChatCompletionMessageParam);
        }
      });
      // console.log("Read chatThread from DOM:");
      // console.log(chatThread.current);
    }
  }

  async function runLLMEngine (modelName: string, modelLib: string, modelUrl: string,
    updateLastMessage: (content: string) => void,
    onFinishGenerating: (finalMessage: string, usage: { prompt_tokens: number; completion_tokens: number; extra: { prefill_tokens_per_s: number; decode_tokens_per_s: number; } })
    => void,
    firstMessageTest: string,
    ) {
    console.log("Run Engine check 1: Start");
    if (isRunning.current) {
      return;
    }
    isRunning.current = true;
    let engine: webllm.MLCEngineInterface | null = null;
    console.log("Run Engine check 2: ready to initialize");
    if (engineRef.current === null) {
      engine = await initializeWebLLMEngine(modelName, modelLib, modelUrl, 0.6, 0.9);
      console.log("Run Engine check 3: Engine initialized - unchecked");
      if (engine !== null) {
        console.log("Run Engine check 4: Engine initialized - checked");
        engineRef.current = engine;
      }else{
        console.log("Run Engine check 4: Engine not initialized");
        isRunning.current = false;
        setIsPlaying(false);
        return;
      }
    } else {
      engine = engineRef.current;
      console.log("Engine already initialized");
    }
    if (engine !== null) {
      console.log("Run Engine check 5: Ready to run");
      try {
        let curMessage = "";
        
        const chatBox = document.getElementById("chat-box");
        if (chatBox) {
          updatechatThreadFromDom();
          console.log("Run Engine check 5.1: Chatbox create");
          console.log("chatThread.current:");
          console.log(chatThread.current);
          const newMessage: ChatCompletionMessageParam = { role: 'user', content: firstMessageTest };
          chatThread.current.push(newMessage);
          chatThread.current = [... systemPrompt, ... chatThread.current];
          // Hide in instruction
          // appendMessage(newMessage);
        }else{
          console.log("Run Engine check 5.1: Chatbox not created");
        }
        let usage;
        console.log("Run Engine check 6: Completions create");
        console.log("chatThread.current:");
        console.log(chatThread.current);
        const assistantMessage: ChatCompletionMessageParam = { role: 'assistant', content: 'Generating...' };
        // chatThread.current.push(assistantMessage);
        appendMessage(assistantMessage);
        const reply0 = await engine.chat.completions.create({
          messages: chatThread.current,
          stream: true,
          stream_options: { include_usage: true },
        });
        console.log("Run Engine check 7: Completions created");
        console.log("chatThread.current:");
        console.log(chatThread.current);
        for await (const chunk of reply0) {
          // console.log("1-5 Chunk...");
          try {
            const curDelta = chunk.choices[0]?.delta.content;
            if (curDelta) {
              curMessage += curDelta;
            }
            if (chunk.usage) {
              usage = chunk.usage;
            }
            updateLastMessage(curMessage);
            const finalMessage = await engine.getMessage();
            if (usage) {
              onFinishGenerating(finalMessage, usage);
              chatThread.current = [...chatThread.current, { role: 'assistant', content: finalMessage }];
            }
            console.log("Run Engine check 8: ChatThread display");
            console.log(chatThread.current);
          } catch (e) {
            // console.log(e);
          }
        }
        console.log("Run Engine check 8: End");
        console.log("chatThread.current:");
        console.log(chatThread.current);
      } catch (e) {
        console.log(engine);
        console.log(e);
        setIsPlaying(false);
        console.log("chatThread.current:");
        console.log(chatThread.current);
        // stop the program
        return;
      }
      // 记得一轮运行完成之后 isRunning.current = false;
    console.log("Run Engine check 8: End");
    console.log(chatThread.current);
    isRunning.current = false;
  }
  }

  // const modelUrl =  "https://huggingface.co/oopus/RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC";
  // const modelLibName = "RedPajama-INCITE-Chat-3B-v1-q4f16_1-webgpu.wasm";
  // const modelUrl = "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC";
  // const modelLibName = "Llama-3_1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm";
  const modelUrl = "https://huggingface.co/oopus/L3.1-Niitorm-8B-DPO-t0.0001-MLC";
  const modelLibName = "L3.1-Niitorm-8B-DPO-t0.0001-q4f32_1-webgpu.wasm";
  const systemPromptContent = `

  You are generating a romantic conversation between a **Female Character** and a **Male Character**.

  **Conversation Rules:**
  - Alternate between the female and male characters.
  - Each response should include:
    - A line of dialogue from the character.
    - A brief description of their inner thoughts and feelings.
  - Do not include any other content or repeat these instructions.
  - Keep the conversation natural and engaging.

  **Character Profiles:**

  **Female Character:**
    - Personality: Curious, shy with strangers, flirty, bubbly with friends.
    - Expresses love through gentle, intimate touches, feeling at ease with the man.

  **Male Character:**
    - Personality: Flirty, witty, engaging, knowledgeable, insightful.
    - Responds with tender gestures, cherishing close moments with the woman.

  **Language:** 
    - Chinese (Simplified)
  `; 
  const systemPrompt = [{ role: 'system', content: systemPromptContent} as ChatCompletionMessageParam];
  const selectedModel = modelUrl.split("/").pop() || "";
  // for oopus's model
  const modelLib = modelUrl + "/resolve/main/" + modelLibName;
  // for web-llm model
  // const modelLib = "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/" + modelLibName;

  const scenario = `
    Please start an imaginative and engaging conversation between the female and male characters as described.
  `;


  const femalePrompt = `
    Respond in character as a female persona with the specified personality traits. Base each response on the previous interaction, using her unique tone, expressions, and perspective.
  `;
  const malePrompt = `
    Respond in character as a male persona with the specified personality traits. Base each response on the previous interaction, using her unique tone, expressions, and perspective.
  `;

  const testPromptList = [scenario, '', '', '', '', '', '', '', '', '', ''];

  // const testPromptList = [femalePrompt + scenario, malePrompt, 
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt,
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt, 
  //                         femalePrompt, malePrompt];
  const runPause = async () => {
    if (isPlaying) {
      stopTrigger.current = true;
      setIsPlaying(false);
      const playButton = document.getElementById("play-button");
      if (playButton) {
        playButton.style.pointerEvents = "none";
      }
      updateStatusLabel("Stopping... it will be stopped after the current completion.");
      return;
    }
  
    setIsPlaying(true);
    updateStatusLabel("Running...");
  
    for (const testPrompt of testPromptList) {
      if (stopTrigger.current) {
        const playButton = document.getElementById("play-button");
        if (playButton) {
          playButton.style.pointerEvents = "auto";
        }
        break;
      }
      isRoleOne.current = !isRoleOne.current;
      await runLLMEngine(selectedModel, modelLib, modelUrl, updateLastMessage, onFinishGenerating, testPrompt);
    }
  
    stopTrigger.current = false;
    setIsPlaying(false);
    updateStatusLabel("Stopped!");
  };
  
  const updateStatusLabel = (text: string) => {
    const statusLabel = document.getElementById("status-label");
    if (statusLabel) {
      statusLabel.innerText = text;
    }
  };

return (
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
  <div className="max-w-6xl mx-auto bg-gray-900 bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
    <label id="status-label"> </label>
    {/* Chat Display */}
    <div className="chat-container mb-8 bg-gray-800 rounded-lg p-4 shadow-inner border border-purple-500/20">
      <div
        id="chat-box"
        className="h-[50vh] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-700 overflow-x-hidden scroll-smooth"
      >
        {/* {chatThread.current.map((message) => (
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <div
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-l-4 border-blue-500'
                  : 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-l-4 border-green-500'
              }`}
            >
              <div
                className={`font-bold mb-2 ${
                  message.role === 'user' ? 'text-blue-400' : 'text-green-400'
                }`}
              >
                {message.role}
              </div>
              <div className="text-gray-100">
                {Array.isArray(message.content) ? "" : message.content}
              </div>
            </div>
          </div>
        ))} */}
      </div>
    </div>

    {/* Gaming Controller */}
    <div className="flex flex-col items-center space-y-6">
      {/* Play/Stop Controls */}
      <div className="flex space-x-6">
      <button
        onClick={runPause}
        id="play-button"
        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg border ${
          isPlaying
            ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-400/30 hover:from-red-400 hover:to-red-500'
            : 'bg-gradient-to-br from-green-500 to-green-600 border-green-400/30 hover:from-green-400 hover:to-green-500'
        } hover:scale-110 active:scale-95`}
      >
        {isPlaying ? <StopCircle /> : <PlayCircle />}
      </button>

      <button
        onClick={() => setIsPlaying(true)}
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg border border-blue-400/30 hover:scale-110 active:scale-95"
      >
        <FastForward className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      <button
        onClick={() => setIsPlaying(true)}
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg border border-blue-400/30 hover:scale-110 active:scale-95"
      >
        <Rewind className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      <button
        onClick={() => setIsPlaying(true)}
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg border border-blue-400/30 hover:scale-110 active:scale-95"
      >
        <Undo className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      <button
        onClick={() => setIsPlaying(false)}
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white hover:from-red-400 hover:to-red-500 transition-all duration-300 shadow-lg border border-red-400/30 hover:scale-110 active:scale-95"
      >
        <Infinity className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      </div>
      {/* Settings Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsPlaying(true)}
          className="w-32 h-10 mt-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg border border-blue-400/30 hover:scale-110 active:scale-95"
        >
          <Settings className="w-8 h-8" />
        </button>
      </div>
    </div>
  </div>
</div>


  );
};