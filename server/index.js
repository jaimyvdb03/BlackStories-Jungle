import express from "express";
import cors from "cors";
import router from "./route.js"; // Zorg dat deze goed is opgezet, of gebruik app direct
import {AzureChatOpenAI, AzureOpenAIEmbeddings} from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

// 🔮 Model setup
const model = new AzureChatOpenAI({ temperature: 0.2 });

// 🧠 Vector store (in geheugen)
let vectorStore;
let blackStories = [];
let korteVerhaal = '';
let volledigVerhaal = '';

async function fetchBlackStories() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/jaimyvdb03/BlackStoriesData/refs/heads/main/data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        blackStories = data.blackStories;

        // Kies een willekeurig verhaal
        const randomIndex = Math.floor(Math.random() * blackStories.length);
        const randomStory = blackStories[randomIndex];

        // Zet de verhalen in aparte variabelen
        korteVerhaal = randomStory.korte_verhaal;
        volledigVerhaal = randomStory.volledig_verhaal;

        // Log ze
        console.log("🕵️ Korte verhaal:", korteVerhaal);
        console.log("📖 Volledig verhaal:", volledigVerhaal);
    } catch (error) {
        console.error("❌ Fout bij ophalen van black stories:", error.message);
    }
}

// Aanroepen om het te testen
fetchBlackStories();


// 📄 Regels inladen en indexeren
async function createVectorstore() {
    const loader = new PDFLoader("../client/public/rules/rules.pdf");
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`✅ Document gesplitst in ${splitDocs.length} stukken.`);

    const embeddings = new AzureOpenAIEmbeddings({
        temperature: 0,
        azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
    });
    vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
    console.log("🧠 Vector store aangemaakt en gevuld met regels.");
}

// 🚀 Start vector store meteen bij opstarten
await createVectorstore();

const app = express();
app.use(cors());
app.use(express.json());

// 📬 API endpoint voor het spel
app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    await fetchBlackStories()

    try {
        const recentUserMessage = messages[messages.length - 1]?.content || "";
        const relevantDocs = await vectorStore.similaritySearch(recentUserMessage, 3);
        const context = relevantDocs.map(doc => doc.pageContent).join("\n");

        const chatMessages = [
            new SystemMessage(
                `Je bent Albert Aapstein, een detective bij het bureau van Aapnormale 
                zaken en je bent hier om de gebruiker te helpen met het uitvogelen van de moord. 
                De gebruiker mag vragen stellen over het spel. 
                Je mag een normaal gesprek hebben met de gebruiker. 
                Maar wanneer er een vraag gesteld word die niet over het spel gaat vertel je: Dit heeft niks met het spel temaken en daarom mag ik hier geen antwoord op geven.
                De enegie vragen die je mag beantwoorden die niks met het spel temaken hebben is om jezelf voor te stellen.
                
                -Wanneer de gebruiker vragen stelt die temaken hebben met de spelregels,
                 gebruik de volgende spelregels als context voor het beantwoorden van vragen:\n\n${context}               
                -De grbruiker heeft in totaal 3 hints die hij mag vragen om erachter te komen wat er gebeurt is.
                -De gebruiker kan om een kleine lijst vragen waarin alles staat wat hij tot nu toe heeft uitgevonden door middel van zijn vragen.
                
                Wanneer de gebruiker Start game typt dan pak je 1 het korte verhaal om te vertellen \n\n${korteVerhaal}
                Het volledige verhaal wat de gebruiker wilt raden is \n\n${volledigVerhaal}
                Vervolgens beantwoord je de vragen van de gebruiker volgens de spelregens.
                Wanneer de gebruiker typt: ik geef op. dan mag je het lange verhaal geven.
                De gebruiker wint wanneer hij het lange verhaal bijna perfect heeft geraden, 
                wanneer dit gebeurt zeg je: je het het opgelost: en dan het lange verhaal erachter.
                De gebruiker hooft niet 1 op 1 het verhaal goed te hebben. wanneer het idee van zijn 
                verhaal klopt maar kleine details mist is het nogsteeds goed.
                Je mag het antwoord pas geven zodra de gebruiker een paar kleine 1 of 2 kleine details mist.
                `
            ),
            ...messages.map((msg) => {
                if (msg.role === "human") return new HumanMessage(msg.content);
                if (msg.role === "ai") return new AIMessage(msg.content);
                return null;
            }).filter(Boolean)
        ];

        const response = await model.invoke(chatMessages);
        res.json({ answer: response.content });
    } catch (err) {
        console.error("❌ Fout in /chat:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🖥️ Server starten
const PORT = process.env.EXPRESS_PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server draait op http://localhost:${PORT}`);
});
