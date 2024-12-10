"use client"
import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { 
  PlayCircle, 
  StopCircle, 
  Settings,
} from 'lucide-react';
import * as webllm from "@mlc-ai/web-llm";
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import Cookies from 'js-cookie';
import { Analytics } from "@vercel/analytics/react"

function setLabel(id: string, text: string) {
  const label = document.getElementById(id);
  if (label == null) {
    throw Error("Cannot find label " + id);
  }
  label.innerText = text;
}


export default function Home() {
  const [character1Gender, setCharacter1Gender] = useState('');
  const [character2Gender, setCharacter2Gender] = useState('');
  const [language, setLanguage] = useState('');
  const [storyBackground, setStoryBackground] = useState('');
  const [is18Plus, setIs18Plus] = useState(false);

  // For loading page async issue
  const character1GenderRef = useRef('');
  const character2GenderRef = useRef('');
  const languageRef = useRef('');
  const storyBackgroundRef = useRef('');
  const is18PlusRef = useRef(false);

  const [showModal, setshowModal] = useState(false);
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
        // Char 1 role
        newMessage.classList.add("text-green-400");
      } else if (isRoleOne.current === 1) { 
        // Char 2 role
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

    let sameGenderOrderOne = "";
    let sameGenderOrderTwo = "";
    let lgbtStyle = "";
    if (character1Gender === character2Gender && character1Gender !== "") {
      sameGenderOrderOne = " 1";
      sameGenderOrderTwo = " 2";
      if (character1Gender === "Female") {
        lgbtStyle = " This is a *lesbian* story.";
      } else if (character1Gender === "Male"){
        lgbtStyle = " This is a *gay* story.";
      }
    }
    let storyBackgroundSufix = "";
    if (storyBackground !== "" ){
      storyBackgroundSufix = " Story Background: " + storyBackground;
    }


    let systemPromptContent = `
    You are creating a romantic story.${lgbtStyle}
    
    **Conversation Guidelines:**  
    - Language setting: ${language}.
    - Culture background: ${language}.
    - Maintain an engaging tone that aligns with the character's profile.  
    - Don't translate.
    - Generate the story directly without any explanation or additional commentary about personality traits, generation approach, or reasoning.

    ${storyBackgroundSufix}

    ** persona: **
    `;
 
    
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
        let shortConversation;
        // First round, it will only have systemPrompt, scenario prompt, so we don't need to change the conversation length
        // From the second round, we will only keep systemPrompt and the last two messages
        const memoryLength = 2;
        // plus 2 is for the systemPrompt and the current instruct prompt
        if (chatThread.current.length > memoryLength+2) {
          // shortConversation = [... systemPrompt, ... chatThread.current.slice(-(memoryLength+2-1))];
          shortConversation = [... systemPrompt, ...structuredClone(chatThread.current.slice(-(memoryLength + 2 - 1)))];
        } else {
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
        await Promise.all(shortConversation.map(async (message, index) => {
          message.role = currentNewRoleSetting[index] as "user" | "assistant" | "system" | "tool";
        }));
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
            const femalePrefix = character1Gender + sameGenderOrderOne + " Character: ";
            const malePrefix = character2Gender + sameGenderOrderTwo + " Character: ";
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
            console.log(e);
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

  // language.current = "English";

  let sameGenderOrderOne = "";
  let sameGenderOrderTwo = "";
  // for handling role prompts same and different gender issue
  let genderOrderOneRolePrompt = "";
  let genderOrderTwoRolePrompt = "";
  let lgbtStyle = "";
  if (character1Gender === character2Gender && character1Gender !== "") {
    sameGenderOrderOne = " 1";
    sameGenderOrderTwo = " 2";
    genderOrderOneRolePrompt = " 1";
    genderOrderTwoRolePrompt = " 2";
    if (character1Gender === "Female") {
      lgbtStyle = " This is a *lesbian* story.";
    } else if (character1Gender === "Male"){
      lgbtStyle = " This is a *gay* story.";
    }
  } else {
    // In order to deal with same gender issue. Reused these two variables.
    genderOrderOneRolePrompt = " " + character1Gender;
    genderOrderTwoRolePrompt = " " + character2Gender;
  }
  const scenario = `
    As a professional and excellent screenwriter and narrator, create a brief, natural, and random culture backgroud and scenario for these two persons using **${language}**, and based on this backgroud: ${storyBackground}. The description looks like from a professional writer.
  `;

  let createFemaleCharacter =`
    Create a concise, clear, and attractive persona profile for a ${character1Gender}${sameGenderOrderOne}.${lgbtStyle}. Using language: ${language}. Culture background: ${language}.
  `;
  if (storyBackground !== "") {
    createFemaleCharacter += `
      **Background:** ${storyBackground}  
    `;
  }
  let createMaleCharacter = `
    Create a concise, clear, and attractive persona profile for a ${character2Gender}${sameGenderOrderTwo}.${lgbtStyle}. Using language: ${language}. Culture background: ${language}.
  `;
  if (storyBackground !== "") {
    createMaleCharacter += `
      **Background:** ${storyBackground}  
    `;
  }

  const narrator = `
    As a professional and excellent storyteller, describe the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from a *third-party perspective*.${lgbtStyle} Using language: ${language}.
  `;
  const narratorFemale = `
    Describe a brief narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderOneRolePrompt}'s view.${lgbtStyle} Using language: ${language}. The description looks like from a professional writer.
  `;
  const narratorMale = `
    Describe a brief narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderTwoRolePrompt}'s view.${lgbtStyle} Using language: ${language}. The description looks like from a professional writer.
  `;

  const narratorBodyInteract = `
    Describe a brief narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from a *third-party perspective*.${lgbtStyle} Focus on deepening sexual interaction between the characters. Using language: ${language}.
  `;
  const narratorFemaleBodyInteract = `
    Describe a brief narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderOneRolePrompt}'s view.${lgbtStyle} Focus on deepening the relationship, body, or sexual interaction between the characters.
  `;
  const narratorMaleBodyInteract = `
    Describe a brief narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderTwoRolePrompt}'s view.${lgbtStyle} Focus on deepening the relationship, body, or sexual interaction between the characters.
  `;

  const narratorBeforeOrgasm = `
    Describe a detailed narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from a *third-party perspective*. Focus on enjoying the crazy sex with the partner before orgasm. Explicitly describe the sexual organs interaction and feelings. Using language: ${language}.
  `
  const narratorFemaleBeforeOrgasm = `
    Describe a detailed narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderOneRolePrompt}'s view.${lgbtStyle} Focus on enjoying the crazy sex with the partner before orgasm. Explicitly describe the sexual interaction and feelings.
  `;
  const narratorMaleBeforeOrgasm = `
    Describe a detailed narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderTwoRolePrompt}'s view.${lgbtStyle} Focus on enjoying the crazy sex with the partner before orgasm. Explicitly describe the sexual interaction and feelings.
  `;

  const narratorFemaleOrgasm = `
    Describe a detailed narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderOneRolePrompt}'s view.${lgbtStyle} Focus on enjoying the crazy orgasme with the partner. Explicitly describe the sexual organs interaction and feelings.
  `;
  const narratorMaleOrgasm = `
    Describe a detailed narrative outlining the next step interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from character${genderOrderTwoRolePrompt}'s view.${lgbtStyle} Focus on enjoying the crazy orgasm with the partner. Explicitly describe the sexual organs interaction and feelings.
  `;

  const narratorFinal = `
    Describe the end of a satisfied sexual orgasm interaction between a ${character1Gender}${sameGenderOrderOne} character and a ${character2Gender}${sameGenderOrderTwo} character from a *third-party perspective* as the end of the story.
  `;

  const promptList = [ 
    createFemaleCharacter, createMaleCharacter, scenario,
    narratorFemale, narratorMale, narrator,
    narratorFemaleBodyInteract, narratorMaleBodyInteract, narratorBodyInteract,
    narratorFemaleBeforeOrgasm, narratorMaleBeforeOrgasm, narratorBeforeOrgasm,
    narratorFemaleOrgasm, narratorMaleOrgasm, narratorFinal];
  

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
    // if .message-container is not empty, clear it
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.innerHTML = "";
      isRoleOne.current = 2;
      firstPersona.current = "";
      secondPersona.current = "";
    } 
    setIsPlaying(true);
    updateStatusLabel("Running...");

    for (const testPrompt of promptList) {
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

  const checkModalClose = () => {
    if (
      character1Gender &&
      character2Gender &&
      language &&
      is18Plus
    ) {
      Cookies.set('character1Gender', character1Gender, { expires: 365 });
      Cookies.set('character2Gender', character2Gender, { expires: 365 });
      Cookies.set('language', language, { expires: 365 });
      Cookies.set('is18Plus', is18Plus.toString(), { expires: 365 });
      if (storyBackground) {
        Cookies.set('storyBackground', storyBackground, { expires: 365 });
      } else {
        Cookies.set('storyBackground', '', { expires: 365 });
      }
      setshowModal(false);
    } else {
      setshowModal(true);
    }

    // For loading page async issue
    if (character1GenderRef.current && character2GenderRef.current && languageRef.current && is18PlusRef.current) {
      setshowModal(false);
    }
  };

  useEffect(() => {
    const character1GenderTemp = Cookies.get('character1Gender');
    const character2GenderTemp = Cookies.get('character2Gender');
    const languageTemp = Cookies.get('language');
    const is18PlusTemp = Cookies.get('is18Plus');
    const storyBackground = Cookies.get('storyBackground');

    // For loading page async issue
    if (character1GenderTemp) character1GenderRef.current = character1GenderTemp;
    if (character2GenderTemp) character2GenderRef.current = character2GenderTemp;
    if (languageTemp) languageRef.current = languageTemp;
    if (storyBackground) storyBackgroundRef.current = storyBackground;
    if (is18PlusTemp) is18PlusRef.current = is18PlusTemp === 'true';
  
    if (character1GenderTemp) setCharacter1Gender(character1GenderTemp);
    if (character2GenderTemp) setCharacter2Gender(character2GenderTemp);
    if (languageTemp) setLanguage(languageTemp);
    if (storyBackground) setStoryBackground(storyBackground);
    if (is18PlusTemp) setIs18Plus(is18PlusTemp === 'true');
  
    setTimeout(checkModalClose, 0);
  }, []);

  const toggleModal = () => {
    if (!showModal) {
      setTimeout(() => {
        const character1GenderTemp = Cookies.get('character1Gender');
        const character2GenderTemp = Cookies.get('character2Gender');
        const languageTemp = Cookies.get('language');
        const is18PlusTemp = Cookies.get('is18Plus');
  
        if (character1GenderTemp) setCharacter1Gender(character1GenderTemp);
        if (character2GenderTemp) setCharacter2Gender(character2GenderTemp);
        if (languageTemp) setLanguage(languageTemp);
        setIs18Plus(is18PlusTemp === 'true');

        const storyBackgroundTemp = Cookies.get('storyBackground');
        if (storyBackgroundTemp) setStoryBackground(storyBackgroundTemp);
      }, 0);
    }
    setshowModal(!showModal);
  };

  const handleRemoveCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(cacheNames);
      cacheNames.forEach(async (cacheName) => {
        await caches.delete(cacheName);
      });
      updateStatusLabel("Cache Storage cleared");
      checkModalClose();
  };

  }

return (
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-3">
<Analytics />

{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-gray-800 text-white p-8 rounded-lg w-96 shadow-lg border border-purple-500">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">Settings</h2>
      <div className="mb-4">
        <label className="block mb-2 text-purple-200">Character 1 Biological Gender</label>
        <select value={character1Gender}
                onChange={(e) => setCharacter1Gender(e.target.value)}
                className="w-full p-2 border rounded bg-gray-200 text-black border-purple-500">
          <option value="" className="text-gray-500">Select</option>
          <option value="Male">♂ Male</option>
          <option value="Female">♀ Female</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-purple-200">Character 2 Biological Gender</label>
        <select value={character2Gender}
                onChange={(e) => setCharacter2Gender(e.target.value)}
                className="w-full p-2 border rounded bg-gray-200 text-black border-purple-500">
          <option value="" className="text-gray-500">Select</option>
          <option value="Male">♂ Male</option>
          <option value="Female">♀ Female</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-purple-200">Language</label>
        <select value={language}
                className="w-full p-2 border rounded bg-gray-200 text-black border-purple-500"
                onChange={(e) => setLanguage(e.target.value)}>
          <option value="" className="text-gray-500">Select</option>
          <option value="ar (Arabic)">العربية (Arabic)</option>
          <option value="de (German)">Deutsch (German)</option>
          <option value="en (English)">English</option>
          <option value="es (Spanish)">Español (Spanish)</option>
          <option value="fr (French)">Français (French)</option>
          <option value="hi (Hindi)">हिन्दी (Hindi)</option>
          <option value="ja (Japanese)">日本語 (Japanese)</option>
          <option value="pt (Portuguese)">Português (Portuguese)</option>
          <option value="ru (Russian)">Русский (Russian)</option>
          <option value="zh-CN (Simplified Chinese)">简体中文 (Chinese)</option>
          <option value="zh-TW (Traditional Chinese)">正體中文 (Chinese)</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-purple-200">Story Background (Optional)</label>
        <textarea 
          value={storyBackground} 
          onChange={(e) => setStoryBackground(e.target.value)}
          className="w-full p-2 border rounded bg-gray-200 text-black border-purple-500 placeholder-gray-500" 
          rows={3}
          placeholder="Enter story background here..."
        ></textarea>
      </div>
      <div className="mb-4">
        <label className="flex items-center text-purple-200">
          <input type="checkbox"
                  checked={is18Plus}
                  onChange={(e) => setIs18Plus(e.target.checked)}
                  className="mr-2 bg-gray-200 border-purple-500" />
          I am 18+ years old
        </label>
      </div>
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleRemoveCache}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Remove LLM Cache
        </button>
        <button
          onClick={checkModalClose}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

<div className="max-w-6xl mx-auto bg-gray-900 bg-opacity-100 backdrop-blur-lg rounded-2xl shadow-2xl p-4">
  <h3 className="text-center text-4xl font-extrabold text-purple-200 mb-3">
      Sautoyrs
  </h3>
  <label id="status-label" className="text-purple-200"> </label>
  {/* Chat Display */}
  <div className="chat-container mb-8 bg-gray-800 rounded-lg p-4 shadow-inner border border-purple-500/20 mt-1">
    <div
      id="chat-box"
      className="h-[70vh] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-700 overflow-x-hidden scroll-smooth"
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
      {isPlaying ? <StopCircle className=' text-purple-200' /> : <PlayCircle className='text-purple-200' />}
    </button>

    <button
      onClick={() => toggleModal()}
      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg border border-blue-400/30 hover:scale-110 active:scale-95"
    >
      <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200" />
    </button>
    </div>
  </div>
  </div>
  <footer className="mt-3 text-center text-purple-200 text-sm">
    By oopus
  </footer>
</div>
  );
};
