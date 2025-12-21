'use client';

import React, { useState, useRef } from 'react';

const TierSections: React.FC = () => {
  const [activePopup, setActivePopup] = useState<'insider' | 'future' | 'share' | 'reserve' | null>(null);
  const [copied, setCopied] = useState(false);
  const [insiderEmail, setInsiderEmail] = useState('');
  const [futureEmail, setFutureEmail] = useState('');
  const [isLoadingInsider, setIsLoadingInsider] = useState(false);
  const [isLoadingFuture, setIsLoadingFuture] = useState(false);
  const futureInsiderRef = useRef<HTMLDivElement>(null);

  // SVG Path constants for masking (Material Symbols)
  const lockPath = "M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z";
  // Updated icon for Future Insider
  const envelopePath = "M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z";
  // Updated icon for Decision Makers (Briefcase)
  const groupPath = "M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm240-600h160v-80H400v80Zm400 360H600v80H360v-80H160v160h640v-160Zm-360 0h80v-80h-80v80Zm-280-80h200v-80h240v80h200v-200H160v200Zm320 40Z";

  // Icons for Popup
  const checkCirclePath = "m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z";
  const bookmarkPath = "M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z";

  const renderIcon = (path: string, size = 48) => {
    const svgUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960'%3E%3Cpath fill='black' d='${path}'/%3E%3C/svg%3E`;
    return (
      <div 
        className="moving-gradient" 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          WebkitMaskImage: `url("${svgUrl}")`,
          maskImage: `url("${svgUrl}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    );
  };

  const handleInsiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!insiderEmail || !insiderEmail.trim()) {
      return;
    }

    setIsLoadingInsider(true);

    try {
      // Step 1: Check if email exists
      const checkResponse = await fetch('/api/landing/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: insiderEmail })
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        console.error('Email check failed:', checkData.error);
        setIsLoadingInsider(false);
        return;
      }

      const emailExists = checkData.exists;

      // Step 2: Trigger appropriate webhook
      const webhookResponse = await fetch('/api/landing/submit-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: insiderEmail, 
          exists: emailExists,
          source: 'insider-access'
        })
      });

      if (!webhookResponse.ok) {
        console.error('Webhook trigger failed');
      }

      // Step 3: Show appropriate popup
      if (emailExists) {
        // Email exists - show "You're on the list" popup
        setActivePopup('insider');
      } else {
        // Email doesn't exist - show "Reserve your spot" message and scroll
        setActivePopup('reserve');
      }

    } catch (error) {
      console.error('Error submitting insider email:', error);
    } finally {
      setIsLoadingInsider(false);
    }
  };

  const handleFutureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!futureEmail || !futureEmail.trim()) {
      return;
    }

    setIsLoadingFuture(true);

    try {
      // Step 1: Check if email exists
      const checkResponse = await fetch('/api/landing/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: futureEmail })
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        console.error('Email check failed:', checkData.error);
        setIsLoadingFuture(false);
        return;
      }

      const emailExists = checkData.exists;

      // Step 2: Trigger appropriate webhook
      const webhookResponse = await fetch('/api/landing/submit-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: futureEmail, 
          exists: emailExists,
          source: 'future-insider'
        })
      });

      if (!webhookResponse.ok) {
        console.error('Webhook trigger failed');
      }

      // Step 3: Show appropriate popup
      setActivePopup(emailExists ? 'insider' : 'future');

    } catch (error) {
      console.error('Error submitting future email:', error);
    } finally {
      setIsLoadingFuture(false);
    }
  };

  const handleScrollToFuture = () => {
    setActivePopup(null);
    setTimeout(() => {
      futureInsiderRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
  };

  const handleShareClick = () => {
    setActivePopup('share');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://heyprodata.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Shared Glow Element
  const GlowBlob = () => (
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[324px] h-[324px] rounded-full pointer-events-none blur-[75.65px] z-0"
      style={{ 
        background: 'linear-gradient(61.39deg, #FA6E80 19.93%, #6A89BE 45.14%, #31A7AC 82.95%), #D9D9D9' 
      }}
    />
  );

  return (
    <section className="w-full relative">
      {/* Insider Access Section - Dark Theme */}
      <div className="bg-black text-white py-32 px-6 flex flex-col items-center text-center relative overflow-hidden">
        <GlowBlob />
        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Lock Icon with Moving Gradient */}
          <div className="mb-10 p-6 rounded-full border border-gray-800 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            {renderIcon(lockPath, 48)}
          </div>

          <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-wide mb-3">Insider Access</h3>
          <p className="moving-gradient-text font-bold text-xl mb-12">For founding members.</p>
          
          <div className="w-full max-w-2xl">
            <p className="text-gray-400 text-lg mb-12 leading-relaxed max-w-lg mx-auto">
              Enter your email address and you'll receive an activation link when we're ready to roll.
            </p>
            
            <form onSubmit={handleInsiderSubmit} className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <input 
                type="email" 
                required
                value={insiderEmail}
                onChange={(e) => setInsiderEmail(e.target.value)}
                placeholder="Enter registered email address" 
                className="w-full sm:w-80 px-6 py-4 rounded-xl bg-[#111111] border border-gray-800 text-white focus:outline-none focus:border-gray-600 transition-colors"
                disabled={isLoadingInsider}
              />
              <button 
                type="submit" 
                disabled={isLoadingInsider}
                className="w-full sm:w-auto bg-[#FF7A8B] text-white font-bold px-10 py-4 rounded-xl hover:bg-[#ff6b7e] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingInsider ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Activate Access'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Future Insider Section */}
      <div ref={futureInsiderRef} className="bg-white py-32 px-6 flex flex-col items-center text-center relative overflow-hidden">
        <GlowBlob />
        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Envelope Icon with Moving Gradient */}
          <div className="mb-8 w-20 h-20 rounded-full border border-yellow-200 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            {renderIcon(envelopePath, 32)}
          </div>

          <h3 className="text-4xl font-bold text-[#0F172A] uppercase mb-2">Future Insider</h3>
          <p className="moving-gradient-text font-bold text-xl mb-12">Reserve your spot.</p>
          
          <div className="w-full max-w-2xl">
            <p className="text-gray-500 text-lg mb-10">Register your email to receive your invite.</p>
            
            <form onSubmit={handleFutureSubmit} className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-md mx-auto">
              <input 
                type="email" 
                required
                value={futureEmail}
                onChange={(e) => setFutureEmail(e.target.value)}
                placeholder="Enter your email" 
                className="w-full px-5 py-3.5 rounded-lg border border-gray-100 bg-[#F9FAFB] text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-200"
                disabled={isLoadingFuture}
              />
              <button 
                type="submit" 
                disabled={isLoadingFuture}
                className="w-full sm:w-auto bg-[#39A7A7] text-white font-bold px-8 py-3.5 rounded-lg hover:bg-[#2d8e8e] transition-colors whitespace-nowrap text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingFuture ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Reserving...
                  </>
                ) : (
                  'Reserve My Spot'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Decision Makers Section */}
      <div className="bg-black text-white py-32 px-6 flex flex-col items-center text-center relative overflow-hidden">
        <GlowBlob />
        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Group Icon with Moving Gradient */}
          <div className="mb-10 w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            {renderIcon(groupPath, 32)}
          </div>

          <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-wide mb-3">Decision Makers</h3>
          <p className="moving-gradient-text font-bold text-xl mb-10">Brands, agencies and production professionals.</p>
          
          <div className="w-full max-w-2xl">
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">
              Email your project brief or requirements to get connected.
            </p>
            <a 
              href="mailto:team@heyprodata.com" 
              className="text-[#FF7A8B] text-2xl font-medium hover:underline transition-all"
            >
              team@heyprodata.com
            </a>
          </div>
        </div>
      </div>

      {/* Popups */}
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setActivePopup(null)} />
          
          {activePopup === 'share' ? (
            /* Share Popup */
            <div className="relative w-full max-w-[716px] isolate">
              {/* Share Blob */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[324px] h-[324px] rounded-full -z-10 blur-[75.65px]"
                style={{ background: 'linear-gradient(61.39deg, #FA6E80 19.93%, #6A89BE 45.14%, #31A7AC 82.95%), #D9D9D9' }} 
              />
              
              <div className="bg-[#F8F8F8] rounded-[25px] px-[30px] py-[40px] md:px-[50px] md:py-[50px] flex flex-col items-center text-center shadow-[4px_4px_21px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200">
                
                <h3 className="text-2xl font-bold uppercase tracking-wide mb-3 flex items-center justify-center gap-2 text-black">
                  SHARE <span className="tracking-tight"><span className="text-[#FF7A8B]">HEY</span>PRO<span className="text-[#45B1A8]">DATA</span></span>
                </h3>
                
                <p className="text-black font-medium text-lg mb-10 max-w-md leading-snug">
                  Share this link with professionals working in production
                </p>
                
                <div className="w-full flex flex-col sm:flex-row gap-4 items-stretch justify-center max-w-[600px]">
                  <div className="flex-grow bg-white border border-transparent rounded-xl px-6 py-4 text-gray-800 font-medium flex items-center shadow-sm">
                    https://heyprodata.com
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className={`min-w-[140px] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-md ${copied ? 'bg-[#45B1A8]' : 'bg-[#FF7A8B] hover:opacity-90'}`}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          ) : activePopup === 'reserve' ? (
            /* Reserve Your Spot Popup - For non-existing emails in Insider Access */
            <div className="relative w-full max-w-[620px] isolate">
              {/* Background Blob/Ellipse */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[474px] sm:h-[474px] rounded-full -z-10 blur-[80px] sm:blur-[110px]"
                   style={{ background: 'linear-gradient(61.39deg, #FA6E80 19.93%, #6A89BE 45.14%, #31A7AC 82.95%), #D9D9D9' }} 
              />
              
              {/* Card Content */}
              <div className="bg-[#F8F8F8] rounded-[25px] p-8 sm:px-[50px] sm:py-[30px] flex flex-col items-center text-center gap-8 shadow-[4px_4px_21px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200">
                 <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] mt-4">
                    {/* Info Icon with Orange Color */}
                    <svg viewBox="0 -960 960 960" className="w-full h-full" fill="#FF7A8B">
                      <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                    </svg>
                 </div>
                 
                 <div className="space-y-3">
                   <h4 className="text-3xl font-bold text-gray-900">Reserve your spot</h4>
                   <p className="text-gray-600 font-medium leading-relaxed max-w-[400px]">
                     I can't find that email. Want to try another one, or jump in and reserve your spot?
                   </p>
                 </div>

                 <div className="flex flex-col w-full max-w-[280px] gap-3 mb-2">
                   <button 
                     onClick={handleScrollToFuture}
                     className="w-full bg-[#39A7A7] text-white font-bold py-3.5 rounded-xl hover:bg-[#2d8e8e] transition-opacity"
                   >
                     Reserve My Spot
                   </button>
                   <button 
                     onClick={() => setActivePopup(null)}
                     className="w-full py-2 text-gray-600 font-bold text-sm hover:underline"
                   >
                     Close
                   </button>
                 </div>
              </div>
            </div>
          ) : (
            /* Success Popup (Insider / Future) */
            <div className="relative w-full max-w-[620px] isolate">
              {/* Background Blob/Ellipse */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[474px] sm:h-[474px] rounded-full -z-10 blur-[80px] sm:blur-[110px]"
                   style={{ background: 'linear-gradient(61.39deg, #FA6E80 19.93%, #6A89BE 45.14%, #31A7AC 82.95%), #D9D9D9' }} 
              />
              
              {/* Card Content */}
              <div className="bg-[#F8F8F8] rounded-[25px] p-8 sm:px-[50px] sm:py-[30px] flex flex-col items-center text-center gap-8 shadow-[4px_4px_21px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200">
                 <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] mt-4">
                    {/* Icons with Gold Color #C5A059 */}
                    <svg viewBox="0 -960 960 960" className="w-full h-full" fill="#C5A059">
                      <path d={activePopup === 'insider' ? checkCirclePath : bookmarkPath} />
                    </svg>
                 </div>
                 
                 <div className="space-y-3">
                   <h4 className="text-3xl font-bold text-gray-900">
                     {activePopup === 'insider' ? "You're on the list" : "Spot Reserved"}
                   </h4>
                   <p className="text-gray-600 font-medium leading-relaxed max-w-[400px]">
                     {activePopup === 'insider' 
                       ? "Thanks for confirming your email. We'll be in touch with your activation link as soon as Insider Access opens."
                       : "You're in line. We'll notify you when it's time to create your profile and join HeyProData."
                     }
                   </p>
                 </div>

                 <div className="flex flex-col w-full max-w-[280px] gap-3 mb-2">
                   <button 
                     onClick={() => setActivePopup(null)}
                     className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:opacity-80 transition-opacity"
                   >
                     Done
                   </button>
                   <button 
                     onClick={handleShareClick}
                     className="w-full py-2 flex items-center justify-center gap-2 text-[#45B1A8] font-bold text-sm hover:underline"
                   >
                     Share HeyProData
                   </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TierSections;