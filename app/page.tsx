'use client';
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<any>(null);

  // --- MOBILE IMAGE COMPRESSION LOGIC ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const compressedDataUrl = await compressImage(file);
        setImage(compressedDataUrl);
      } catch (error) {
        console.error("Compression failed:", error);
        alert("Image process karne mein error aaya!");
      } finally {
        setLoading(false);
      }
    }
  };

  // --- NEW INTEGRATED SCAN LOGIC ---
  const handleScan = async (base64Image: string) => {
    try {
      const response = await fetch('/api/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();
      
      if (response.ok && data.result) {
        console.log("Scanned Data:", data.result);
        setCardData(data.result);
      } else {
        console.error("Scanner Error:", data.error);
        alert(`Scanner Error: ${data.error || "Unknown Error"}\nDetails: ${data.details || "No details provided"}`);
      }
    } catch (err: any) {
      console.error("Frontend Fetch Error:", err);
      alert("Frontend Fetch Error: " + err.message);
    }
  };

  const processCard = async () => {
    if (!image) {
      alert("Please upload an image!");
      return;
    }
    setLoading(true);
    await handleScan(image);
    setLoading(false);
  };

  // --- WHATSAPP LOGIC ---
  const sendWhatsApp = () => {
    if (!cardData?.phone) {
      alert("Phone number nahi mila!");
      return;
    }
    let phone = cardData.phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = "91" + phone;
    }
    const message = cardData.whatsappDraft || "Hi, it was great connecting with you!";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const sendEmail = () => {
    if (!cardData?.email) return;
    const subject = encodeURIComponent(`Nice meeting you! - Follow up`);
    const body = encodeURIComponent(`Hi ${cardData.name || ''},\n\nIt was great connecting with you.`);
    window.location.href = `mailto:${cardData.email}?subject=${subject}&body=${body}`;
  };

  const openLinkedIn = () => {
    if (!cardData) return;
    if (cardData.linkedinUrl && cardData.linkedinUrl.startsWith('http')) {
      window.open(cardData.linkedinUrl, '_blank');
    } else {
      const name = cardData.name || '';
      const company = cardData.company || '';
      const searchQuery = encodeURIComponent(`site:linkedin.com/in/ "${name}" ${company}`);
      window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 md:p-8 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center pt-8">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
              CardToConnect <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Pro</span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium tracking-wide">Business card se digital connect tak</p>
        </header>
        
        <div className="bg-[#111112] p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 hover:border-gray-700 transition-colors duration-500">
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Upload Business Card</label>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageChange} 
              className="w-full text-sm text-gray-400 file:mr-4 file:py-4 file:px-8 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition cursor-pointer outline-none" 
            />
          </div>

          {image && (
             <div className="w-full h-64 mb-8 rounded-[2rem] bg-black border border-gray-800 shadow-inner overflow-hidden flex items-center justify-center p-2 relative group">
                <img src={image} alt="Preview" className="max-h-full w-auto object-contain rounded-xl" />
             </div>
          )}

          <button 
            onClick={processCard} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-[1.5rem] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:bg-gray-800 disabled:text-gray-500"
          >
            {loading ? 'AI Scanning Processing...' : 'Scan & Extract Data'}
          </button>
        </div>

        {cardData && (
          <div className="bg-[#111112] p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 mt-8 space-y-8 animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
               Extracted Info <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Name", value: cardData.name },
                { label: "Job Title", value: cardData.jobTitle },
                { label: "Company", value: cardData.company },
                { label: "Email", value: cardData.email },
                { label: "Phone", value: cardData.phone },
                { label: "Website", value: cardData.website }
              ].map((item, idx) => (
                  <div key={idx} className="bg-[#161618] p-5 rounded-2xl border border-gray-800/60 hover:border-blue-500/30 transition-colors">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                      <p className="font-semibold text-gray-200 mt-1">{item.value || "Not found"}</p>
                  </div>
              ))}
              <div className="md:col-span-2 bg-[#161618] p-5 rounded-2xl border border-gray-800/60 hover:border-blue-500/30 transition-colors">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Address</p>
                  <p className="font-semibold text-gray-200 mt-1">{cardData.address || "Not found"}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 p-6 rounded-[2rem] border border-blue-500/20 backdrop-blur-md">
              <h3 className="font-bold text-blue-400 mb-3 text-lg">Quick Actions:</h3>
              <p className="text-gray-300 text-sm italic mb-6 bg-black/40 p-4 rounded-xl border border-blue-500/10">"{cardData.whatsappDraft}"</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={sendWhatsApp} disabled={!cardData.phone} className="flex-1 bg-[#1A1A1D] border border-green-500/30 text-green-400 font-bold py-4 rounded-xl text-sm hover:bg-green-500 hover:text-white disabled:opacity-40 transition-all duration-300">WhatsApp</button>
                <button onClick={sendEmail} disabled={!cardData.email} className="flex-1 bg-[#1A1A1D] border border-rose-500/30 text-rose-400 font-bold py-4 rounded-xl text-sm hover:bg-rose-500 hover:text-white disabled:opacity-40 transition-all duration-300">Email</button>
                <button onClick={openLinkedIn} className="flex-1 bg-[#1A1A1D] border border-blue-500/30 text-blue-400 font-bold py-4 rounded-xl text-sm hover:bg-blue-600 hover:text-white transition-all duration-300">LinkedIn</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}