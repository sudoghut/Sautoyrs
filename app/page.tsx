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

function setLabel(id: string, text: string) {
  const label = document.getElementById(id);
  if (label == null) {
    throw Error("Cannot find label " + id);
  }
  label.innerText = text;
}
const [isPlaying, setIsPlaying] = useState(false);
const [pace, setPace] = useState(1);

const scrollRef = useRef<HTMLDivElement | null>(null);

interface Message {
  id: number;
  role: string;
  content: string;
  timestamp: string;
}

export default function Home() {
  let isRunning = useRef(false);
  let chatThread = useRef<Message[]>([]);
  let engineRef = useRef<webllm.MLCEngineInterface | null>(null);
  const initializeWebLLMEngine = async (selectedModel: string, modelLib: string, modelUrl: string, llmTemp: number, llmTopP: number): Promise<webllm.MLCEngineInterface | null> => {
    if (isRunning.current) {
      return null;
    }
    isRunning.current = true;
    const initProgressCallback = (report: webllm.InitProgressReport) => {
      setLabel("init-label", report.text);
    };
    // const selectedModel = "magnum-v4-9b-q4f16_1-MLC";
    const appConfig: webllm.AppConfig = {
      model_list: [
        {
          model: modelUrl,
          // model: "https://huggingface.co/oopus/magnum-v4-12b-MLC",
          model_id: selectedModel,
          model_lib: modelLib,
            // "https://huggingface.co/oopus/magnum-v4-12b-MLC/resolve/main/magnum-v4-12b-q4f16_1-webgpu.wasm",
        },
      ],
    };
    const engine: webllm.MLCEngineInterface = await webllm.CreateMLCEngine(
      selectedModel,
      { appConfig: appConfig, initProgressCallback: initProgressCallback,
        logLevel: "INFO",
      },
      // {
      //   context_window_size: 2048,
      //   // sliding_window_size: 1024,
      //   // attention_sink_size: 4,
      // },

    );
    return engine;
  }

  async function runLLMEngine (modelName: string, modelLib: string, modelUrl: string) {
    if (isRunning.current) {
      return;
    }
    isRunning.current = true;
    let engine: webllm.MLCEngineInterface | null = null;
    if (engineRef.current === null) {
      const engine = await initializeWebLLMEngine(modelName, modelLib, modelUrl, 0.5, 0.9);
      if (engine !== null) {
        engineRef.current = engine;
      }
    }
    if (engine ! == null) {
      const reply0 = await engine!.chat.completions.create({
        messages: [{ role: "user", content: "List three US states." }],
        stream: true,
        stream_options: { include_usage: true },
    });
    // 记得一轮运行完成之后 isRunning.current = false;
    for await (const chunk of reply0) {
      console.log("1-5 Chunk...");
      try {
        const curDelta = chunk.choices[0]?.delta.content;
        console.log(curDelta);
      } catch (e) {
        // console.log(e);
      }
    }
  }
  }


  chatThread.current = [
    { id: 1, role: 'Character 1', content: 'Hi there! How are you today?', timestamp: '0:00' },
    { id: 2, role: 'Character 2', content: 'I\'m doing great! Just enjoying this lovely weather.', timestamp: '0:05' }
  ]

  const selectedModel = "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC";
  const modelUrl=  "https://huggingface.co/oopus/RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC"
  const modelLib = "https://huggingface.co/oopus/magnum-v4-12b-MLC/resolve/main/RedPajama-INCITE-Chat-3B-v1-q4f16_1-webgpu.wasm"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatThread]);

  const addMessage = () => {
    if (isPlaying) {
      const newMessage: Message = {
        id: chatThread.current.length + 1,
        role: chatThread.current.length % 2 === 0 ? 'Character 1' : 'Character 2',
        content: 'This is a simulated response. In a real implementation, this would come from an LLM API.',
        timestamp: `${Math.floor(chatThread.current.length / 2)}:${chatThread.current.length * 5 % 60}`
      };
      chatThread.current = [...chatThread.current, newMessage];
    }
  };

  const togglePlayStop = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        addMessage();
      }
    }, 3000 / pace);
    return () => clearInterval(interval);
  }, [isPlaying, pace, chatThread.current]);

  return (
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
  <div className="max-w-6xl mx-auto bg-gray-900 bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
    {/* Chat Display */}
    <div className="mb-8 bg-gray-800 rounded-lg p-4 shadow-inner border border-purple-500/20">
      <div
        ref={scrollRef}
        className="h-[50vh] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-700 overflow-x-hidden"
      >
        {chatThread.current.map((message) => (
          <div key={message.id} className="transform transition-all duration-300 hover:scale-[1.02]">
            <div
              className={`p-4 rounded-lg ${
                message.role === 'Character 1'
                  ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-l-4 border-blue-500'
                  : 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-l-4 border-green-500'
              }`}
            >
              <div
                className={`font-bold mb-2 ${
                  message.role === 'Character 1' ? 'text-blue-400' : 'text-green-400'
                }`}
              >
                {message.role}
              </div>
              <div className="text-gray-100">
                {message.content}
                <span className="text-xs text-gray-400 ml-2">{message.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Gaming Controller */}
    <div className="flex flex-col items-center space-y-6">
      {/* Play/Stop Controls */}
      <div className="flex space-x-6">
      <button
        onClick={togglePlayStop}
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