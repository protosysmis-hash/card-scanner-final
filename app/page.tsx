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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
            <h1 className="text-5xl font-black text-slate-950 tracking-tighter drop-shadow-sm">
              CardToConnect <span className="text-blue-600">Pro</span>
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Business card se digital connect tak</p>
        </header>
        
        <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-white/50">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Upload Business Card</label>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageChange} 
              className="w-full text-sm text-slate-500 file:mr-4 file:py-4 file:px-8 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer" 
            />
          </div>

          {image && (
             <div className="w-full h-64 mb-8 rounded-[2rem] bg-slate-900 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center p-1">
                <img src={image} alt="Preview" className="max-h-full w-auto object-contain" />
             </div>
          )}

          <button 
            onClick={processCard} 
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-5 rounded-[1.5rem] shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Scan & Extract Data'}
          </button>
        </div>

        {cardData && (
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mt-8 space-y-8 animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-extrabold text-slate-950">Extracted Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Name", value: cardData.name },
                { label: "Job Title", value: cardData.jobTitle },
                { label: "Company", value: cardData.company },
                { label: "Email", value: cardData.email },
                { label: "Phone", value: cardData.phone },
                { label: "Website", value: cardData.website }
              ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <p className="font-semibold text-slate-800 mt-1">{item.value || "Not found"}</p>
                  </div>
              ))}
              <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                  <p className="font-semibold text-slate-800 mt-1">{cardData.address || "Not found"}</p>
              </div>
            </div>
            
            <div className="bg-blue-600 p-6 rounded-[2rem] shadow-lg">
              <h3 className="font-bold text-white mb-3 text-lg">Quick Actions:</h3>
              <p className="text-blue-100 text-sm italic mb-6 bg-blue-700/50 p-4 rounded-xl">"{cardData.whatsappDraft}"</p>
              
              <div className="flex gap-3">
                <button onClick={sendWhatsApp} disabled={!cardData.phone} className="flex-1 bg-green-500 text-white font-bold py-4 rounded-xl text-sm hover:bg-green-600 disabled:opacity-40 transition">WhatsApp</button>
                <button onClick={sendEmail} disabled={!cardData.email} className="flex-1 bg-rose-500 text-white font-bold py-4 rounded-xl text-sm hover:bg-rose-600 disabled:opacity-40 transition">Email</button>
                <button onClick={openLinkedIn} className="flex-1 bg-white text-blue-700 font-bold py-4 rounded-xl text-sm hover:bg-slate-100 transition">LinkedIn</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}