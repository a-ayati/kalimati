import React, { useState } from 'react';
import { useKalimati } from '../context/KalimatiContext';
import { Mail, Send, CheckCircle, MessageSquare, Heart } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { author } = useKalimati();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-8 text-right text-xs sm:text-sm">
      
      <div className="border-b border-white/10 pb-6 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">التواصل المباشر</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-amiri text-white pt-2 pb-1 leading-normal tracking-wide">
          تَوَاصَلْ مَعَ خَلْوَة
        </h1>
        <p className="text-xs sm:text-sm text-stone-400">
          تسعدنا رسائلك، انطباعاتك حول الخواطر، وملاحظاتك لتطوير المنصة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Contact info column */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#141518] border border-white/10 space-y-3">
            <h3 className="font-bold text-white text-sm">البريد الإلكتروني المباشر</h3>
            <p className="text-xs text-stone-400">للمراسلات الأدبية والاستفسارات الرسمية:</p>
            <a
              href={`mailto:${author.socials.email || 'abdelouahedayati@gmail.com'}`}
              className="text-amber-400 hover:underline block font-mono text-xs break-all"
            >
              {author.socials.email || 'abdelouahedayati@gmail.com'}
            </a>
          </div>

          <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/25 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>رسالة من الكاتب:</span>
            </div>
            <p className="text-stone-300 text-xs font-serif leading-relaxed">
              «كل كلمة وصلت إلى قلبك وأراحت صدرك هي ثمرة هذا الجهد. شكرًا لوجودك وقراءتك الصادقة.»
            </p>
          </div>
        </div>

        {/* Message Form */}
        <div className="md:col-span-2">
          <div className="p-6 rounded-3xl bg-[#141518] border border-white/10 space-y-4">
            {sent ? (
              <div className="text-center py-10 space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">وصلت رسالتك، شكرًا لطيب تواصلك!</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  نقدّر كل كلمة وانطباع تشاركه معنا، وسنقوم بالرد عليك في أقرب وقت.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl text-xs bg-white/10 text-stone-200 hover:bg-white/20"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-stone-300 font-medium mb-1 text-xs">الاسم الكريم:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="اسمك أو كيف تحب أن نخاطبك"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1 text-xs">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="بريدك للرد عليك"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1 text-xs">رسالتك أو خاطرك:</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="اكتب ما يدور في خاطرك بكل أريحية..."
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200 text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الرسالة</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
