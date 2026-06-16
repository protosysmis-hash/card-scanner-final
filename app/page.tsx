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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-8 text-center tracking-tight">
          CardToConnect <span className="text-blue-600">Pro</span>
        </h1>
        
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-100">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Upload Business Card</label>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageChange} 
              className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer" 
            />
          </div>

          {/* FIXED: Image display set to object-contain so it doesn't crop */}
          {image && <img src={image} alt="Preview" className="w-full h-56 object-contain bg-slate-100 mb-6 rounded-2xl shadow-inner border" />}

          <button 
            onClick={processCard} 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Scan & Extract Data'}
          </button>
        </div>

        {cardData && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-100 mt-8 space-y-6 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-4">Extracted Contact Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p><strong>Name:</strong><br/><span className="text-slate-600">{cardData.name}</span></p>
              <p><strong>Job Title:</strong><br/><span className="text-slate-600">{cardData.jobTitle}</span></p>
              <p><strong>Company:</strong><br/><span className="text-slate-600">{cardData.company}</span></p>
              <p><strong>Email:</strong><br/><span className="text-slate-600">{cardData.email}</span></p>
              <p><strong>Phone:</strong><br/><span className="text-slate-600">{cardData.phone}</span></p>
              <p><strong>Website:</strong><br/><span className="text-slate-600">{cardData.website}</span></p>
              <p className="md:col-span-2"><strong>Address:</strong><br/><span className="text-slate-600">{cardData.address}</span></p>
            </div>
            
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">WhatsApp Follow-up:</h3>
              <p className="text-blue-800 text-sm italic mb-4">"{cardData.whatsappDraft}"</p>
              
              <div className="flex gap-3">
                <button onClick={sendWhatsApp} disabled={!cardData.phone} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-green-700 disabled:opacity-50">WhatsApp</button>
                <button onClick={sendEmail} disabled={!cardData.email} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl text-sm hover:bg-red-600 disabled:opacity-50">Email</button>
                <button onClick={openLinkedIn} className="flex-1 bg-blue-700 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-800">LinkedIn</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}