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
        // Yahan maine error detail dikhane ka code update kiya hai
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8 text-black">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">CardToConnect Clone (100% FREE)</h1>
      
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload or Take Photo of Card</label>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleImageChange} 
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
          />
        </div>

        {image && <img src={image} alt="Preview" className="w-full h-48 object-contain mb-4 rounded-lg border" />}

        <button 
          onClick={processCard} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Scan & Extract Card'}
        </button>
      </div>

      {cardData && (
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-gray-200 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Extracted Contact Intel</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {cardData.name}</p>
            <p><strong>Job Title:</strong> {cardData.jobTitle}</p>
            <p><strong>Company:</strong> {cardData.company}</p>
            <p><strong>Email:</strong> {cardData.email}</p>
            <p><strong>Phone:</strong> {cardData.phone}</p>
            <p>
              <strong>LinkedIn:</strong>{' '}
              {cardData.linkedinUrl ? (
                <a href={cardData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                  {cardData.linkedinUrl}
                </a>
              ) : (
                <span className="text-gray-500 italic">Not on card (Ready to Search)</span>
              )}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-700 mb-2">AI Generated WhatsApp Follow-up:</h3>
            <p className="bg-gray-50 p-3 rounded text-sm text-gray-600 italic mb-4">"{cardData.whatsappDraft}"</p>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={sendWhatsApp}
                disabled={!cardData.phone}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-2 rounded-lg text-xs transition flex items-center justify-center gap-1 disabled:bg-gray-300"
              >
                💬 WhatsApp
              </button>
              
              <button
                onClick={sendEmail}
                disabled={!cardData.email}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-2 rounded-lg text-xs transition flex items-center justify-center gap-1 disabled:bg-gray-300"
              >
                ✉️ Email
              </button>

              <button
                onClick={openLinkedIn}
                className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-2 rounded-lg text-xs transition flex items-center justify-center gap-1"
              >
                🔗 LinkedIn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}