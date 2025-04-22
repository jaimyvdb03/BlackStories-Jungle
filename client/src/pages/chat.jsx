import React, { useState, useEffect, useRef } from 'react';

export default function ChatPage() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);

    const chatContainerRef = useRef(null); // Reference to the chat container for auto-scrolling

    const askQuestion = async () => {
        if (!question.trim()) return;

        const updatedHistory = [
            ...chatHistory,
            { role: "human", content: question }
        ];

        setLoading(true);
        setError(null);
        setAnswer(null);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ messages: updatedHistory })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();

            let words = data.answer.split(" ");
            let current = "";

            setChatHistory([
                ...updatedHistory,
                { role: "ai", content: "" } // tijdelijke lege response
            ]);

            let i = 0;

            const interval = setInterval(() => {
                if (i >= words.length) {
                    clearInterval(interval);
                    return;
                }

                current += words[i] + " ";

                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = {
                        role: "ai",
                        content: current.trim()
                    };
                    return newHistory;
                });

                i++;
            }, 100); // snelheid aanpassen: 50–150ms is meestal fijn

            setQuestion('');
        } catch (err) {
            setError(`Er is een fout opgetreden: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        askQuestion();
    };

    // Scroll to the bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col font-jungle">
            {/* Achtergrondafbeelding */}
            <img
                src="/image/Background.jpg"
                alt="jungle"
                className="absolute top-0 left-0 w-full h-full object-cover z-0"
            />

            {/* Titel bovenaan */}
            <header className="relative z-10 bg-[#1e2d1e]/90 backdrop-blur-xs p-6 border-b border-[#3f5b3f] shadow-lg">
                <h1 className="text-3xl font-extrabold text-yellow-200 text-center font-jungle">
                    🐵 Welkom bij Albert Aapstein 🌴
                </h1>

                <p className="text-center text-green-200 italic">
                    "Stel je vraag, mensenvriend, ik ben wijs en bananenrijk."
                </p>
            </header>

            {/* Chat-venster */}
            <main className="relative z-10 flex-grow overflow-y-auto p-6 pt-4 pb-32 mb-20">
                <div className="w-full max-w-2xl mx-auto bg-[#1e2d1e]/90 backdrop-blur-md p-6 rounded-2xl border border-[#3f5b3f] shadow-xl space-y-4">
                    {error && (
                        <p className="text-red-300 font-bold text-center">{error}</p>
                    )}

                    <div
                        ref={chatContainerRef}
                        className="max-h-[60vh] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-900"
                    >

                    {chatHistory.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg text-sm font-serif whitespace-pre-wrap shadow-inner ${
                                    msg.role === 'human'
                                        ? 'bg-[#d2b48c]/80 text-[#3e2f1c] font-jungle'
                                        : 'bg-[#a3c9a8]/80 text-[#1f3324] font-jungle'
                                }`}
                            >
                                <strong>
                                    {msg.role === 'human' ? '🧑 Jij' : '🐵 Albert Aapstein'}:
                                </strong>{' '}
                                {msg.content}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Input onderaan de pagina */}
            <form
                onSubmit={handleSubmit}
                className="fixed bottom-0 left-0 w-full bg-[#1e2d1e]/95 backdrop-blur-md px-6 py-4 border-t border-[#3f5b3f] z-20"
            >
                <div className="max-w-2xl mx-auto flex gap-4">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="🦜 Wat wil je aan Albert vragen?"
                        className="flex-grow p-4 bg-[#2d402d] text-green-100 border border-green-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className={`p-4 rounded-xl font-bold text-lg transition ${
                            loading
                                ? 'bg-gray-600 text-gray-200 cursor-wait'
                                : 'bg-yellow-300 hover:bg-yellow-400 text-black'
                        }`}
                    >
                        {loading ? '🕯️...' : '💬'}
                    </button>
                </div>
            </form>
        </div>
    );
}
