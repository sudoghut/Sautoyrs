"use client"
import React, { useState, useEffect, use } from 'react';
import { useRef } from 'react';
import { 
  PlayCircle, 
  StopCircle, 
  Infinity,
  Undo,
  FastForward,
  Rewind,
  Settings,
  ChartNoAxesColumnIcon
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
  const language = useRef("");
  const firstPersona = useRef("");
  const secondPersona = useRef("");
  const stopTrigger = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isRunning = useRef(false);
  // The initial role as narrator won't trigger this role, as the first loop will push the role to the next one, which is female.
  const isRoleOne = useRef(2);
  const chatThread = useRef<ChatCompletionMessageParam[]>([]);
  const engineRef = useRef<webllm.MLCEngineInterface | null>(null);
  const initializeWebLLMEngine = async (selectedModel: string, modelLib: string, modelUrl: string, llmTemp: number, llmTopP: number): Promise<webllm.MLCEngineInterface | null> => {
    console.log("Initialize Engine check 1: Start");
    console.log("chatThread.current:");
    console.log(chatThread.current);
    console.log(isRunning.current)
    console.log("Initialize Engine check 2: ready to initialize");
    console.log("chatThread.current:");
    console.log(chatThread.current);
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
        sliding_window_size: 1500,
        attention_sink_size: 0,
      },

    );
    console.log("Initialize Engine check 3: Engine initialized");
    console.log("chatThread.current:");
    console.log(chatThread.current);
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

  let lastMessageType: 'user' | 'assistant' | null = 'user';

  async function appendMessage(message: ChatCompletionMessageParam) {
      const chatBox = document.getElementById("chat-box");
      const container = document.createElement("div");
      container.classList.add("message-container");
  
      const currentMessageType: 'user' | 'assistant' | null = 
        lastMessageType === 'user' || lastMessageType === 'assistant'
        ? lastMessageType
        : null;
      if (currentMessageType === 'user'){
        container.classList.add('user');
      } else if (currentMessageType === 'assistant'){
        container.classList.add('assistant');
      }
      // console.log("currentMessageType:");
      // console.log(currentMessageType);
      // console.log("lastMessageType:");
      // console.log(lastMessageType);
      if (isRoleOne.current === 0) { 
        container.classList.add(
          "bg-gradient-to-r",
          "from-green-500/10",
          "to-green-600/10",
          "border-l-4",
          "border-green-500",
          "p-4");
        } else if (isRoleOne.current === 1) {
        container.classList.add(
          "bg-gradient-to-r",
          "from-blue-500/10",
          "to-blue-600/10",
          "border-l-4",
          "border-blue-500",
          "p-4");
        } else if (isRoleOne.current === 2) {
        container.classList.add(
          "bg-gradient-to-r",
          "from-gray-500/10",
          "to-gray-600/10",
          "border-l-4",
          "border-gray-500",
          "p-4");
        };

  
      const newMessage = document.createElement("div");
      newMessage.classList.add("message");
      newMessage.textContent = typeof message.content === 'string' ? message.content : '';
      if (isRoleOne.current === 0) { 
        // Female role
        newMessage.classList.add("text-green-400");
      } else if (isRoleOne.current === 1) { 
        // Male role
        newMessage.classList.add("text-blue-400");
      } else if (isRoleOne.current === 2) { 
        // Narrator role
        newMessage.classList.add("text-gray-400");
      }    

      container.appendChild(newMessage);
      if (chatBox) {
          chatBox.appendChild(container);
          scrollToBottom();
      }
  
      // Update the last message type
      lastMessageType = currentMessageType;
      // switch  currentMessageType
      if (currentMessageType === 'user') {
        lastMessageType = 'assistant';
      } else if (currentMessageType === 'assistant') {
        lastMessageType = 'user';
      } 
  }
  async function updateChatThreadFromDom(): Promise<ChatCompletionMessageParam[]> {
    const chatBox = document.getElementById("chat-box");
    let tempChatThread: ChatCompletionMessageParam[] = [];
    if (chatBox) {
      const messageContainers = chatBox.querySelectorAll(".message-container");
      tempChatThread = await Promise.all(
          Array.from(messageContainers).map(async (container) => {
            const role = container.classList.contains("assistant") ? "assistant" :
                          container.classList.contains("user") ? "user" : "unknown";
            const messageDom = container.querySelector(".message");
            const content = messageDom ? messageDom.textContent : "";
            return { role, content } as ChatCompletionMessageParam;
          })
      );
    }
    // console.log("tempChatThread:");
    // console.log(tempChatThread);
    return tempChatThread;
}


  async function runLLMEngine (modelName: string, modelLib: string, modelUrl: string,
    updateLastMessage: (content: string) => void,
    onFinishGenerating: (finalMessage: string, usage: { prompt_tokens: number; completion_tokens: number; extra: { prefill_tokens_per_s: number; decode_tokens_per_s: number; } })
    => void,
    currentPrompt: string,
    ) {
    let systemPromptContent = `
    You are creating a romantic story.
    
    **Conversation Guidelines:**  
    - Language setting: ${language.current}.
    - Culture background: ${language.current}.
    - Maintain an engaging tone that aligns with the character's profile.  
    - Don't translate.
    - Generate the story directly without any explanation or additional commentary about personality traits, generation approach, or reasoning.

    ** persona: **
    `;
    // const systemPromptContentFemale = `   
    // **Female Character:**  
    // - **Personality:** Curious and shy with strangers but flirty and bubbly with friends.  
    // - **Expressions of Love:** Shows affection through gentle, intimate touches and feels comfortable in the man’s presence.
    // `;
    // const systemPromptContentMale = `
    // **Male Character:**  
    // - **Personality:** Flirty, witty, and engaging.
    // - **Expressions of Love:** Responds with tender gestures, savoring close moments with the woman.  
    // `; 
    const systemNarrator = `
    Act as a narrator guiding the story's progression, focusing on deepening the relationship or body interaction between the female and male characters. Use a third-person narrative style to describe actions, emotions, and events, avoiding direct dialogue or conversation.
    - Output Language:  ${language.current}. 
    `

    
    if (isRoleOne.current === 0) {
      systemPromptContent += firstPersona.current;
    } else if (isRoleOne.current === 1) {
      systemPromptContent += secondPersona.current;
    } else if (isRoleOne.current === 2) {
      systemPromptContent = systemPromptContent.replace("** persona: **", "");
    }
    chatThread.current = [];
    const systemPrompt = [{ role: 'system', content: systemPromptContent} as ChatCompletionMessageParam];
    chatThread.current = [... systemPrompt];
    if (isRunning.current) {
      return;
    }
    isRunning.current = true;
    let engine: webllm.MLCEngineInterface | null = null;
    console.log("Run Engine check 2: ready to initialize");
    console.log("chatThread.current:");
    console.log(chatThread.current);
    if (engineRef.current === null) {
    // if (1 === 1) {
      console.log("Before Run Engine check 3: Engine initialized - unchecked");
      engine = await initializeWebLLMEngine(modelName, modelLib, modelUrl, 0.8, 0.5);
      console.log("Run Engine check 3: Engine initialized - unchecked");
      console.log("chatThread.current:");
      console.log(chatThread.current);
      if (engine !== null) {
        console.log("Run Engine check 4: Engine initialized - checked");
        engineRef.current = engine;
      }else{
        console.log("Run Engine check 4: Engine not initialized");
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
          // console.log("Before Run Engine check 5.1 chatThread.current:");
          // console.log(chatThread.current);
          const tempChatThread = await updateChatThreadFromDom();
          // assign tempChatThread to chatThread.current
          chatThread.current = tempChatThread;
          console.log("Run Engine check 5.1: Chatbox create");
          console.log("chatThread.current:");
          console.log(chatThread.current);
          const newMessage: ChatCompletionMessageParam = { role: 'user', content: currentPrompt };
          chatThread.current.push(newMessage);
          chatThread.current = [... systemPrompt, ... chatThread.current];
          // Hide in instruction
          // appendMessage(newMessage);
        }else{
          console.log("Run Engine check 5.1: Chatbox not created");
        }
        let usage;
        // //test from here
        let shortConversation;
        // First round, it will only have systemPrompt, senario prompt, so we don't need to change the conversation length
        // From the second round, we will only keep systemPrompt and the last two messages
        const memoryLength = 2;
        // plus 2 is for the systemPrompt and the current instruct prompt
        if (chatThread.current.length > memoryLength+2) {
          // shortConversation = [... systemPrompt, ... chatThread.current.slice(-(memoryLength+2-1))];
          shortConversation = [... systemPrompt, ...structuredClone(chatThread.current.slice(-(memoryLength + 2 - 1)))];
        } else {
          // shortConversation = [... chatThread.current];
          shortConversation = [... structuredClone(chatThread.current)];
        }
        // const newRoleSetting = ['system', "user", "assistant", "user"];
        const newRoleSetting = ['system', "assistant", "user", "assistant", "user"];
        // reset "role" in shortConversation by newRoleSetting
        // currentNewRoleSetting is first get the first n. Then, based on the length of shortConversation, get role from the right side of newRoleSetting
        const currentNewRoleSetting = [
          newRoleSetting[0],
          ...newRoleSetting.slice(-(shortConversation.length - 1))
        ];
        console.log("currentNewRoleSetting:");
        console.log(currentNewRoleSetting);
        // shortConversation.forEach((message, index) => {
        //   message.role = currentNewRoleSetting[index] as "user" | "assistant" | "system" | "tool";
        // });
        await Promise.all(shortConversation.map(async (message, index) => {
          message.role = currentNewRoleSetting[index] as "user" | "assistant" | "system" | "tool";
        }));
        console.log("Run Engine check 6: chatThread ready to run");
        console.log("shortConversation:");
        console.log(shortConversation);
        // // test ends here
        const reply0 = await engine.chat.completions.create({
          // messages: chatThread.current,
          messages: shortConversation,
          stream: true,
          stream_options: { include_usage: true },
        });
        const assistantMessage: ChatCompletionMessageParam = { role: 'assistant', content: 'Generating...' };
        await appendMessage(assistantMessage);
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
            const femalePrefix = "Female Character: ";
            const malePrefix = "Male Character: ";
            const narratorPrefix = "Narrator: ";
            if (isRoleOne.current === 0) { 
              if (!finalMessage.trim().startsWith(femalePrefix)) {
                finalMessage = femalePrefix + finalMessage;
              }
            } else if (isRoleOne.current === 1) { 
              if (!finalMessage.trim().startsWith(malePrefix)) {
                finalMessage = malePrefix + finalMessage;
              }
            } else if (isRoleOne.current === 2) { 
              if (!finalMessage.trim().startsWith(narratorPrefix)) {
                finalMessage = narratorPrefix + finalMessage;
              }
            }
            if (usage) {
              // Generation finished
              onFinishGenerating(finalMessage, usage);
              // chatThread.current = [...chatThread.current, { role: 'assistant', content: finalMessage }];
              if (firstPersona.current === "" && secondPersona.current === "") {
                firstPersona.current = finalMessage;
              } else if (firstPersona.current !== "" && secondPersona.current === "") {
                secondPersona.current = finalMessage;
              }
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
  } else
    {
      console.log("Run Engine check 5: Engine not ready to run");
    }
  }

  // const modelUrl =  "https://huggingface.co/oopus/RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC";
  // const modelLibName = "RedPajama-INCITE-Chat-3B-v1-q4f16_1-webgpu.wasm";
  // const modelUrl = "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC";
  // const modelLibName = "Llama-3_1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm";
  // const modelUrl = "https://huggingface.co/oopus/L3.1-Niitorm-8B-DPO-t0.0001-MLC";
  // const modelLibName = "L3.1-Niitorm-8B-DPO-t0.0001-q4f32_1-webgpu.wasm";
  const modelUrl = "https://huggingface.co/oopus/Gemma-2-Ataraxy-9B-MLC";
  const modelLibName = "Gemma-2-Ataraxy-9B-q4f32_1-webgpu.wasm";
  const selectedModel = modelUrl.split("/").pop() || "";
  // for oopus's model
  const modelLib = modelUrl + "/resolve/main/" + modelLibName;
  // for web-llm model
  // const modelLib = "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/" + modelLibName;

  language.current = "简体中文";
  // language.current = "English";
  const scenario = `
    As a narrator, create a brief, natural, and random culture backgroud and scenario for a couple using **${language.current}**.
  `;

  const femalePrompt = `
    Continoue the conversation in character as a **female** persona with the specified personality traits. Using her unique tone, expressions, and perspective. Gradually incorporate personal anecdotes, questions, or thoughts that deepen emotional intimacy. Keep the **conversation short**.
  `;
  const malePrompt = `
    Continoue the conversation in character as a **male** persona with the specified personality traits. Using his unique tone, expressions, and perspective. Gradually incorporate personal anecdotes, questions, or thoughts that deepen emotional intimacy. Keep the **conversation short**.
  `;

  const boosterMale = `
    Create a nature reaction using **${language.current}** for the next step to propose your relationship or body interaction to the next level as a **male**.
  `
  const boosterFemale = `
    Create a nature reaction using **${language.current}** for the next step to propose your relationship or body interaction to the next level as a **female**.
  `;
  const createFemaleCharacter = `
    Create a concise, clear, and attractive persona profile for a female.
  `;
  const createMaleCharacter = `
    Create a concise, clear, and attractive persona profile for a male.
  `;
  const narrator = `
    Describe a brief narrative outlining the next step in the interaction between a female character and a male character. Focus on deepening sexual interaction between the characters.
  `;
  const narratorFemale = `
    Describe a brief narrative outlining the next step in the interaction between a female character and a male character from a **female*'s view. Focus on deepening the relationship, body, or sexual interaction between the characters.
  `;
  const narratormale = `
    Describe a brief narrative outlining the next step in the interaction between a female character and a male character from a *male*'s view. Focus on deepening the relationship, body, or sexual interaction between the characters.
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

  // const testPromptList = [ 
  //   createFemaleCharacter, createMaleCharacter, scenario,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale, narrator,
  //   boosterFemale, boosterMale];

    const testPromptList = [ 
      createFemaleCharacter, createMaleCharacter, scenario,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale, narrator,
      narratorFemale, narratormale];
  

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
      // Loop through the roles among 0 1 2:
      // If isRoleOne.current is 0, it becomes 1.
      // If isRoleOne.current is 1, it becomes 2.
      // If isRoleOne.current is 2, it wraps back to 0.
      isRoleOne.current = (isRoleOne.current + 1) % 3;
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