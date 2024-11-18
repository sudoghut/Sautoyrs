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
        sliding_window_size: 1000,
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
    let systemPromptContent = `
    You are generating a romantic conversation.
    
    **Conversation Guidelines:**  

    - Output Language:  Chinese (Simplified).  
    - Each response must include:  
      - A line of dialogue spoken by the character.  
      - A brief description of your inner thoughts and feelings in the Output Language. 
    - Keep the tone engaging, and aligned with the characters' profile. 
    
    
    **Character Profile:**  
    
    `
    const systemPromptContentFemale = `   
    **Female Character:**  
    - **Personality:** Curious and shy with strangers but flirty and bubbly with friends.  
    - **Expressions of Love:** Shows affection through gentle, intimate touches and feels comfortable in the man’s presence.
    `;
    const systemPromptContentMale = `
    **Male Character:**  
    - **Personality:** Flirty, witty, and engaging.
    - **Expressions of Love:** Responds with tender gestures, savoring close moments with the woman.  
      `; 
    if (isRoleOne.current === true) {
      systemPromptContent += systemPromptContentFemale;
    } else {
      systemPromptContent += systemPromptContentMale;
    }
      // systemPrompt = [{ role: 'system', content: systemPromptContent} as ChatCompletionMessageParam];
      
    const systemPrompt = [{ role: 'system', content: systemPromptContent} as ChatCompletionMessageParam];
    chatThread.current = [... systemPrompt, ... chatThread.current];
    console.log("Run Engine check 1: Start");
    if (isRunning.current) {
      return;
    }
    isRunning.current = true;
    let engine: webllm.MLCEngineInterface | null = null;
    console.log("Run Engine check 2: ready to initialize");
    if (engineRef.current === null) {
    // if (1 === 1) {
      engine = await initializeWebLLMEngine(modelName, modelLib, modelUrl, 0.9, 0.5);
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
        let shortConversation;
        // First round, it will only have systemPrompt, senario prompt, so we don't need to change the conversation length
        // From the second round, we will only keep systemPrompt and the last two messages
        const memoryLength = 1;
        // plus 2 is for the systemPrompt and the current instruct prompt
        if (chatThread.current.length > memoryLength+2) {
          shortConversation = [... systemPrompt, ... chatThread.current.slice(-(memoryLength+2-1))];
        } else {
          shortConversation = [... chatThread.current];
        }
        const newRoleSetting = ['system', "user", "assistant", "user"];
        // reset "role" in shortConversation by newRoleSetting
        // currentNewRoleSetting is first get the first n. Then, based on the length of shortConversation, get role from the right side of newRoleSetting
        const currentNewRoleSetting = [
          newRoleSetting[0],
          ...newRoleSetting.slice(-(shortConversation.length - 1))
        ];
        console.log("currentNewRoleSetting:");
        console.log(currentNewRoleSetting);
        shortConversation.forEach((message, index) => {
          message.role = currentNewRoleSetting[index] as "user" | "assistant" | "system" | "tool";
        });
        console.log("Run Engine check 6: chatThread ready to run");
        console.log("shortConversation:");
        console.log(shortConversation);
        const reply0 = await engine.chat.completions.create({
          // messages: chatThread.current,
          messages: shortConversation,
          stream: true,
          stream_options: { include_usage: true },
        });
        const assistantMessage: ChatCompletionMessageParam = { role: 'assistant', content: 'Generating...' };
        appendMessage(assistantMessage);
        // console.log("Run Engine check 7: Completions created");
        // console.log("chatThread.current:");
        // console.log(chatThread.current);
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
            let finalMessage = await engine.getMessage();
            const femalePrifx = "Female Character: ";
            const malePrifx = "Male Character: ";
            if (isRoleOne.current === true){
              if (!finalMessage.trim ().startsWith(femalePrifx)) {
                finalMessage = femalePrifx + finalMessage;
              }

            } else {
              if (!finalMessage.trim ().startsWith(malePrifx)) {
                finalMessage = malePrifx + finalMessage;
              }
            }
            if (usage) {
              onFinishGenerating(finalMessage, usage);
              chatThread.current = [...chatThread.current, { role: 'assistant', content: finalMessage }];
            }
            // console.log("Run Engine check before 8: ChatThread display");
            // console.log(chatThread.current);
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
    isRunning.current = false;
  }
  }

  // const modelUrl =  "https://huggingface.co/oopus/RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC";
  // const modelLibName = "RedPajama-INCITE-Chat-3B-v1-q4f16_1-webgpu.wasm";
  // const modelUrl = "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC";
  // const modelLibName = "Llama-3_1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm";
  const modelUrl = "https://huggingface.co/oopus/L3.1-Niitorm-8B-DPO-t0.0001-MLC";
  const modelLibName = "L3.1-Niitorm-8B-DPO-t0.0001-q4f32_1-webgpu.wasm";
  const selectedModel = modelUrl.split("/").pop() || "";
  // for oopus's model
  const modelLib = modelUrl + "/resolve/main/" + modelLibName;
  // for web-llm model
  // const modelLib = "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/" + modelLibName;

  const scenario = `
    Start an conversation inspired by a narrative from a **female** perspective.
  `;

  const femalePrompt = `
    Continoue the conversation in character as a **female** persona with the specified personality traits. Using her unique tone, expressions, and perspective. Gradually incorporate personal anecdotes, questions, or thoughts that deepen emotional intimacy. Keep the **conversation short**.
  `;
  const malePrompt = `
    Continoue the conversation in character as a **male** persona with the specified personality traits. Using his unique tone, expressions, and perspective. Gradually incorporate personal anecdotes, questions, or thoughts that deepen emotional intimacy. Keep the **conversation short**.
  `;

  const boosterMale = `
    Create a single-sentence dialogue without repeating to propose your relationship or body interaction to the next level as a **male** persona with the specified personality traits. Using his unique tone, expressions, and perspective. Gradually incorporate personal anecdotes, questions, or thoughts that deepen emotional intimacy.
  `

  const boosterFemale = `
    Create a single-sentence dialogue without repeating to propose your relationship or body interaction to the next level as a **female** persona with the specified personality traits. Using her unique tone, expressions, and perspective. Gradually incorporate personal anecdotes, questions, or thoughts that deepen emotional intimacy.
  `;


  // const testPromptList = [scenario, malePrompt, 
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt,
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt, 
  //   femalePrompt, malePrompt];

  const testPromptList = [scenario, boosterMale, 
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale,
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale, 
    boosterFemale, boosterMale];

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